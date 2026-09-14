import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import {
  calculatePercentageChange,
  getPercentWithDirection,
} from "./utils.service.js";

export async function getDashboardTransactions(userId) {
  const filter = {
    userId,
    isActive: true,
  };
  const lastFiveTranList = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .select("type amount description merchantName transactionDate")
    .limit(5)
    .lean();

  return lastFiveTranList;
}

export async function getDashboardExpenses(userId) {
  try {
    const now = new Date();

    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();

    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    ).getTime();

    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    ).getTime();

    const [monthlyData] = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          isActive: true,
          transactionDate: {
            $gte: previousMonthStart,
            $lt: currentMonthEnd,
          },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $cond: [
                { $gte: ["$transactionDate", currentMonthStart] },
                "current",
                "previous",
              ],
            },
            type: "$type",
          },
          total: {
            $sum: "$amount",
          },
        },
      },
      {
        $group: {
          _id: null,

          currentMonthCredit: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$_id.month", "current"] },
                    { $eq: ["$_id.type", "credit"] },
                  ],
                },
                "$total",
                0,
              ],
            },
          },

          currentMonthDebit: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$_id.month", "current"] },
                    { $eq: ["$_id.type", "debit"] },
                  ],
                },
                "$total",
                0,
              ],
            },
          },

          previousMonthCredit: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$_id.month", "previous"] },
                    { $eq: ["$_id.type", "credit"] },
                  ],
                },
                "$total",
                0,
              ],
            },
          },

          previousMonthDebit: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$_id.month", "previous"] },
                    { $eq: ["$_id.type", "debit"] },
                  ],
                },
                "$total",
                0,
              ],
            },
          },
        },
      },
    ]);

    const currentMonthCredit = monthlyData?.currentMonthCredit || 0;
    const currentMonthDebit = monthlyData?.currentMonthDebit || 0;
    const previousMonthCredit = monthlyData?.previousMonthCredit || 0;
    const previousMonthDebit = monthlyData?.previousMonthDebit || 0;

    const creditChange = calculatePercentageChange(
      currentMonthCredit,
      previousMonthCredit,
    );

    const debitChange = calculatePercentageChange(
      currentMonthDebit,
      previousMonthDebit,
    );

    return {
      currentMonth: {
        credit: currentMonthCredit,
        debit: currentMonthDebit,
      },

      creditChange: getPercentWithDirection(creditChange),

      debitChange: getPercentWithDirection(debitChange),
    };
  } catch (error) {
    console.error("Error fetching dashboard expenses:", error);
    throw error;
  }
}
