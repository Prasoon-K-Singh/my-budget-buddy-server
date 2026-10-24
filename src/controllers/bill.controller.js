import mongoose from "mongoose";
import Bill from "../models/bill.model.js";
import { getNextDueDate } from "../services/bill.service.js";

export async function createBill(req, res) {
  try {
    const { name, amount, type, frequency, nextDueDate } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    if (!["bill", "subscription"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill type",
      });
    }

    if (
      !["monthly", "quarterly", "half-yearly", "yearly"].includes(frequency)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid frequency",
      });
    }

    if (!nextDueDate || Number.isNaN(Number(nextDueDate))) {
      return res.status(400).json({
        success: false,
        message: "Next due date is required",
      });
    }

    const payment = await Bill.create({
      userId: req.user.id,
      name: name.trim(),
      amount: Number(amount),
      type,
      frequency,
      nextDueDate: Number(nextDueDate),
    });

    return res.status(201).json({
      success: true,
      message: "Bill added successfully",
      data: payment,
    });
  } catch (error) {
    console.error("createBill:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add bill",
    });
  }
}
export async function getBills(req, res) {
  try {
    const { type } = req.query;

    const filter = {
      userId: req.user.id,
    };

    if (type) {
      if (!["bill", "subscription"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid bill type",
        });
      }
      filter.type = type;
    }

    const payments = await Bill.find(filter).sort({ nextDueDate: 1 }).lean();

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("getRecurringBills:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bills",
    });
  }
}
export async function getBillById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill id",
      });
    }

    const payment = await Bill.findOne({
      _id: id,
      userId: req.user.id,
    }).lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("getBillById:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bill",
    });
  }
}
export async function updateBill(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill id",
      });
    }

    const { name, amount, type, frequency, nextDueDate } = req.body;

    const payment = await Bill.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "bill not found",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      payment.name = name.trim();
    }

    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than 0",
        });
      }

      payment.amount = Number(amount);
    }

    if (type !== undefined) {
      if (!["bill", "subscription"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid bill type",
        });
      }

      payment.type = type;
    }

    if (frequency !== undefined) {
      if (
        !["monthly", "quarterly", "half-yearly", "yearly"].includes(frequency)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid frequency",
        });
      }

      payment.frequency = frequency;
    }

    if (nextDueDate !== undefined) {
      if (!nextDueDate || Number.isNaN(Number(nextDueDate))) {
        return res.status(400).json({
          success: false,
          message: "Invalid next due date",
        });
      }

      payment.nextDueDate = Number(nextDueDate);
    }

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Bill updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("updateBill:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update bill",
    });
  }
}
export async function deleteBill(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill id",
      });
    }

    const payment = await Bill.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "bill not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    console.error("deleteBill:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete bill",
    });
  }
}
export async function markBillPaid(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill id",
      });
    }

    const payment = await Bill.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "bill not found",
      });
    }

    payment.nextDueDate = getNextDueDate(
      payment.nextDueDate,
      payment.frequency,
    );

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Bill marked as paid",
      data: payment,
    });
  } catch (error) {
    console.error("markBillPaid:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark bill as paid",
    });
  }
}
