import mongoose from "mongoose";
import Account from "../models/account.model.js";
import Category from "../models/category.model.js";
import Transaction from "../models/transaction.model.js";
import {
  adjustAmount,
  calculateTotal,
  getNextTransactionNo,
} from "../services/transactions.service.js";
import { PAYMENT_METHOD, PAYMENT_TYPE } from "../config/const.js";

export async function transacAdd(req, res) {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.id;
    const {
      transDate,
      transAmount,
      transType,
      transAccount,
      transCategory,
      transMethod,
      transMerchant,
      transDesc,
      transNotes,
    } = req.body;

    if (
      transDate === undefined ||
      transDate === null ||
      transAmount === undefined ||
      !transType ||
      !transAccount ||
      !transCategory ||
      !transMethod ||
      !transMerchant ||
      !transDesc
    ) {
      return res.status(400).json({
        success: false,
        message: "Please Provide all the required information",
      });
    }
    if (
      typeof transDate !== "number" ||
      !Number.isFinite(transDate) ||
      Number.isNaN(new Date(transDate).getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction date",
      });
    }

    if (transDate > Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Transaction date cannot be in the future",
      });
    }

    if (
      typeof transAmount !== "number" ||
      !Number.isFinite(transAmount) ||
      transAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a greater than 0",
      });
    }

    if (!PAYMENT_TYPE.includes(transType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    if (!PAYMENT_METHOD.includes(transMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    await session.withTransaction(async () => {
      const account = await Account.findOne({
        _id: transAccount,
        userId,
        isActive: true,
      }).session(session);

      if (!account) {
        const error = new Error("Account does not exist");
        error.status = 404;
        throw error;
      }

      const category = await Category.findOne({
        _id: transCategory,
        userId,
        isActive: true,
      }).session(session);

      if (!category) {
        const error = new Error("Category does not exist");
        error.status = 404;
        throw error;
      }

      const newBal = adjustAmount(account.balance, transType, transAmount);

      account.balance = newBal;
      await account.save({ session });

      const transNo = await getNextTransactionNo(session);

      await Transaction.create(
        [
          {
            userId,
            transactionNo: transNo,
            transactionDate: transDate,
            amount: transAmount,
            type: transType,
            accountId: transAccount,
            categoryId: transCategory,
            paymentMethod: transMethod,
            merchantName: transMerchant.trim(),
            description: transDesc.trim(),
            notes: transNotes.trim(),
          },
        ],
        { session },
      );
    });

    const transacList = await Transaction.find({ userId }).sort({
      transactionDate: -1,
    });

    return res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      data: transacList,
    });
  } catch (err) {
    console.log("transaction err: ", err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Failed to Add transaction",
    });
  } finally {
    await session.endSession();
  }
}

export async function transacList(req, res) {
  try {
    const id = req.user.id;

    const accList = await Account.find(
      { userId: id, isActive: true },
      { _id: 1, name: 1, balance: 1, isActive: 1 },
    )
      .sort({ createdAt: 1 })
      .lean();

    const catList = await Category.find(
      { userId: id, isActive: true },
      { _id: 1, name: 1, isActive: 1 },
    )
      .sort({ createdAt: 1 })
      .lean();

    const transacList = await Transaction.find({ userId: id })
      .sort({ transactionDate: -1 })
      .populate("accountId", "name")
      .populate("categoryId", "name")
      .lean();

    const totalBalance = calculateTotal(accList, "balance");

    const totalExpense = calculateTotal(
      transacList,
      "amount",
      (transaction) => transaction.type === "debit",
    );

    const balList = { totalBalance, totalExpense };

    const data = { accList, catList, transacList, balList };

    return res.status(200).json({
      success: true,
      message: "Accounts fetched successfully",
      data,
    });
  } catch (err) {
    console.log("transacList err: ", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch list",
    });
  }
}
