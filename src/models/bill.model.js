import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: ["bill", "subscription"],
      required: true,
    },

    frequency: {
      type: String,
      enum: ["monthly", "half-yearly", "quarterly", "yearly"],
      required: true,
    },

    nextDueDate: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
