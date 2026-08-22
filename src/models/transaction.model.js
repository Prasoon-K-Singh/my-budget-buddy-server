import mongoose from "mongoose";
import { PAYMENT_METHOD, PAYMENT_TYPE } from "../config/const.js";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      index: true,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
      required: true,
    },
    transactionNo: {
      type: Number,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: PAYMENT_TYPE,
        message: "{VALUE} is not a valid payment type",
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    merchantName: {
      type: String,
      required: true,
      trim: true,
    },
    transactionDate: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => {
          return value <= Date.now();
        },
        message: "Future dates are not allowed",
      },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: {
        values: PAYMENT_METHOD,
        message: "{VALUE} is not a valid payment method",
      },
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
