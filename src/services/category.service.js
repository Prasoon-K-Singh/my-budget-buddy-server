import mongoose from "mongoose";
import Category from "../models/category.model.js";

export async function getCategorySpending(userId, checkIncluded) {
  try {
    const now = new Date();
    let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    ).getTime();

    const match = {
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    };

    if (checkIncluded) {
      match.isIncluded = true;
    }

    const expenses = await Category.aggregate([
      {
        $match: match,
      },

      {
        $lookup: {
          from: "transactions",
          let: {
            categoryId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$categoryId", "$$categoryId"],
                    },
                    {
                      $eq: ["$userId", new mongoose.Types.ObjectId(userId)],
                    },
                  ],
                },

                type: "debit",

                transactionDate: {
                  $gte: startOfMonth,
                  $lt: startOfNextMonth,
                },
              },
            },

            {
              $group: {
                _id: null,
                expense: {
                  $sum: "$amount",
                },
              },
            },
          ],
          as: "transactions",
        },
      },

      {
        $addFields: {
          expense: {
            $ifNull: [
              {
                $arrayElemAt: ["$transactions.expense", 0],
              },
              0,
            ],
          },
        },
      },

      {
        $project: {
          _id: 0,

          categoryId: "$_id",

          categoryName: "$name",

          budget: 1,

          expense: 1,

          remaining: {
            $subtract: ["$budget", "$expense"],
          },

          expensePercentage: {
            $min: [
              100,
              {
                $round: [
                  {
                    $cond: [
                      { $gt: ["$budget", 0] },
                      {
                        $multiply: [
                          {
                            $divide: ["$expense", "$budget"],
                          },
                          100,
                        ],
                      },
                      0,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },

      {
        $sort: {
          expense: -1,
        },
      },
    ]);
    return expenses;
  } catch (error) {
    console.error("Error fetching category spending:", error);
    throw error;
  }
}
