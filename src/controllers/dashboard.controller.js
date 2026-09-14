import Account from "../models/account.model.js";
import { getCategorySpending } from "../services/category.service.js";
import {
  getDashboardExpenses,
  getDashboardTransactions,
} from "../services/dashboard.service.js";
import { calculateTotal } from "../services/transactions.service.js";

export async function getDashboardOverview(req, res) {
  try {
    const userId = req.user.id;

    const expenses = await getCategorySpending(userId, false);

    const transList = await getDashboardTransactions(userId);

    const accList = await Account.find(
      { userId, isActive: true },
      { balance: 1 },
    );

    const overallSpending = await getDashboardExpenses(userId);

    const totalBalance = await calculateTotal(accList, "balance");

    overallSpending.totalBalance = totalBalance;

    overallSpending.mostUtilsCategory = expenses.reduce((max, item) =>
      item.expense > item.budget &&
      item.expensePercentage > max.expensePercentage
        ? item
        : max,
    );

    transactionDate: return res.status(200).json({
      success: true,
      data: expenses,
      spending: overallSpending,
      transaction: transList,
    });
  } catch (error) {
    console.error("getDashboardOverview:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get dashboard overview",
    });
  }
}
