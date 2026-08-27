import mongoose from "mongoose";
import Account from "../models/account.model.js";
import Category from "../models/category.model.js";
import Transaction from "../models/transaction.model.js";
import {
  adjustAmount,
  adjustExistingTransAmount,
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
      typeof transMerchant !== "string" ||
      !transMerchant.trim()
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
            isActive: true,
          },
        ],
        { session },
      );
    });

    return res.status(201).json({
      success: true,
      message: "Transaction added successfully",
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

    const transacList = await Transaction.find({
      userId: id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate("accountId", "name")
      .populate("categoryId", "name")
      .lean();

    const totalBalance = calculateTotal(accList, "balance");

    const totalCredit = calculateTotal(
      transacList,
      "amount",
      (transaction) =>
        transaction.type === "credit" && transaction.isActive === true,
    );

    const totalDebit = calculateTotal(
      transacList,
      "amount",
      (transaction) =>
        transaction.type === "debit" && transaction.isActive === true,
    );

    const balList = { totalBalance, totalCredit, totalDebit };

    const data = { accList, catList, transacList, balList };

    return res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
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

export async function transacDel(req, res) {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const id = req.user.id;
    const tranId = req.params._id;
    if (!tranId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Transaction id is required",
      });
    }
    const delTrans = await Transaction.findOne({
      _id: tranId,
      userId: id,
      isActive: true,
    }).session(session);
    if (!delTrans) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }
    const findAcc = await Account.findOne({
      _id: delTrans.accountId,
      userId: id,
      isActive: true,
    }).session(session);
    if (findAcc) {
      // adject account balance
      const newBal = adjustExistingTransAmount(
        findAcc.balance,
        delTrans.type,
        delTrans.amount,
      );
      findAcc.balance = newBal;
      await findAcc.save({ session });
    }
    delTrans.isActive = false;
    await delTrans.save({ session });
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (err) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }
    console.log("transacDel err: ", err);
    return res.status(500).json({
      success: false,
      message: "Failed to Delete transaction",
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

export async function transacEdit(req, res) {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const id = req.user.id;
    const tranId = req.params._id;
    if (!tranId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Transaction id is required",
      });
    }
    const editTrans = await Transaction.findOne({
      _id: tranId,
      userId: id,
      isActive: true,
    }).session(session);
    if (!editTrans) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }
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
      typeof transMerchant !== "string" ||
      !transMerchant.trim()
    ) {
      await session.abortTransaction();
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
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid transaction date",
      });
    }
    if (transDate > Date.now()) {
      await session.abortTransaction();
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
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Amount must be a greater than 0",
      });
    }
    if (!PAYMENT_TYPE.includes(transType)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }
    if (!PAYMENT_METHOD.includes(transMethod)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }
    const account = await Account.findOne({
      _id: transAccount,
      userId: id,
      isActive: true,
    }).session(session);
    if (!account) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Account does not exist",
      });
    }
    const category = await Category.findOne({
      _id: transCategory,
      userId: id,
      isActive: true,
    }).session(session);
    if (!category) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Category does not exist",
      });
    }
    const findAcc = await Account.findOne({
      _id: editTrans.accountId,
      userId: id,
    }).session(session);
    if (!findAcc) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cannot update this transaction",
      });
    }
    // logic to update amount effectively
    if (String(editTrans.accountId) === String(transAccount)) {
      const revertedBalance = adjustExistingTransAmount(
        account.balance,
        editTrans.type,
        editTrans.amount,
      );
      account.balance = adjustAmount(revertedBalance, transType, transAmount);
      await account.save({ session });
    } else {
      // restore old account
      findAcc.balance = adjustExistingTransAmount(
        findAcc.balance,
        editTrans.type,
        editTrans.amount,
      );
      await findAcc.save({ session });
      // apply transaction to new account
      account.balance = adjustAmount(account.balance, transType, transAmount);
      await account.save({ session });
    }
    editTrans.transactionDate = transDate;
    editTrans.amount = transAmount;
    editTrans.type = transType;
    editTrans.accountId = transAccount;
    editTrans.categoryId = transCategory;
    editTrans.paymentMethod = transMethod;
    editTrans.merchantName = transMerchant?.trim() || "";
    editTrans.description = transDesc?.trim() || "";
    editTrans.notes = transNotes?.trim() || "";
    await editTrans.save({ session });
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
    });
  } catch (err) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }
    console.log("transacEdit err: ", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update transaction",
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
}
