import Account from "../models/account.model.js";

export async function accAdd(req, res) {
  try {
    const userId = req.user.id;
    const { accName, accBalance, isActive } = req.body;
    const accActiveStatus = isActive ?? true;

    if (!accName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Account name is required",
      });
    }

    if (accBalance === undefined || accBalance === null) {
      return res.status(400).json({
        success: false,
        message: "Account balance is required",
      });
    }

    if (typeof accBalance !== "number" || !Number.isFinite(accBalance)) {
      return res.status(400).json({
        success: false,
        message: "Account balance must be a valid number",
      });
    }

    if (accBalance < 0) {
      return res.status(400).json({
        success: false,
        message: "Account balance must be greater than or equal to 0",
      });
    }

    const existingAccount = await Account.findOne({
      userId,
      name: accName.trim(),
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: "Account already exists",
      });
    }

    const account = await Account.create({
      userId,
      name: accName.trim(),
      balance: accBalance,
      isActive: accActiveStatus,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      account,
    });
  } catch (error) {
    console.error("Account creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
}
