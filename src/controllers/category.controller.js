import mongoose from "mongoose";
import { STATUS, YES_NO_SELECT } from "../config/const.js";
import Category from "../models/category.model.js";
import Transaction from "../models/transaction.model.js";

export async function getBudget(req, res) {
  try {
    const userId = req.user.id;

    const categories = await Category.find({ userId })
      .sort({ isDefault: -1, name: 1 })
      .lean();

    const data = categories.map((category) => ({
      id: category._id,
      catName: category.name,
      catBudget: category.budget,
      catStatus: category.isActive ? "active" : "inactive",
      catIncluded: category.isIncluded ? "yes" : "no",
      isDefault: category.isDefault,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getBudget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get budget",
    });
  }
}
export async function addCategory(req, res) {
  try {
    const userId = req.user.id;

    const { catName, catBudget, catIncluded, catStatus } = req.body;

    if (!catName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (
      catBudget === undefined ||
      catBudget === null ||
      catBudget === "" ||
      Number(catBudget) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid budget amount is required",
      });
    }

    if (!YES_NO_SELECT.includes(catIncluded)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }

    if (!STATUS.includes(catStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Status type",
      });
    }

    if (catIncluded === "yes" && catStatus === "inactive") {
      return res.status(400).json({
        success: false,
        message: "Inactive category cannot be included in budget",
      });
    }

    const existingCategory = await Category.findOne({
      userId,
      name: catName.trim(),
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    await Category.create({
      userId,
      name: catName.trim(),
      budget: Number(catBudget),
      isIncluded: catIncluded === "yes",
      isActive: catStatus === "active",
      isDefault: false,
    });

    return res.status(201).json({
      success: true,
      message: "Category added successfully",
    });
  } catch (error) {
    console.error("addCategory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add category",
    });
  }
}
export async function updateCategory(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { catName, catBudget, catStatus, catIncluded } = req.body;

    const category = await Category.findOne({
      _id: id,
      userId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    if (category.isDefault && catStatus === "inactive") {
      return res.status(400).json({
        success: false,
        message: "Default category cannot be inactive",
      });
    }
    if (catName !== undefined) {
      if (!catName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      category.name = catName.trim();
    }

    if (catBudget !== undefined) {
      if (catBudget === "" || Number(catBudget) < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid budget amount",
        });
      }

      category.budget = Number(catBudget);
    }

    if (catIncluded !== undefined) {
      if (!YES_NO_SELECT.includes(catIncluded)) {
        return res.status(400).json({
          success: false,
          message: "Invalid included value",
        });
      }
      category.isIncluded = catIncluded === "yes";
    }

    if (catStatus !== undefined) {
      if (!STATUS.includes(catStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }
      category.isActive = catStatus === "active";
    }

    if (catIncluded === "yes" && catStatus === "inactive") {
      return res.status(400).json({
        success: false,
        message: "Inactive category cannot be included in budget",
      });
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("updateCategory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
}
export async function getCategoryExpenses(req, res) {
  try {
    const userId = req.user.id;

    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();

    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    ).getTime();

    const expenses = await Category.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          isActive: true,
          isIncluded: true,
        },
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

    const overall = {};
    overall.totalBudget = expenses.reduce((acc, curr) => acc + curr.budget, 0);
    overall.totalSpend = expenses.reduce((acc, curr) => acc + curr.expense, 0);
    overall.totalRemaining = expenses.reduce(
      (acc, curr) => acc + curr.remaining,
      0,
    );
    overall.totalExpensePercentage =
      overall.totalBudget > 0
        ? Math.round((overall.totalSpend / overall.totalBudget) * 100 * 100) /
          100
        : 0;

    return res.status(200).json({
      success: true,
      data: expenses,
      overall: overall,
    });
  } catch (error) {
    console.error("getCategoryExpenses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get category expenses",
    });
  }
}
