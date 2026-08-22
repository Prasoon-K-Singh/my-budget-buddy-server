import Account from "../models/account.model.js";

export async function accAdd(req, res) {
  try {
    const userId = req.user.id;
    const { accName, accBalance, isActive, accId } = req.body;
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
      isActive: true,
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: "Account already exists with same name",
      });
    }

    if (accId) {
      const account = await Account.findOneAndUpdate(
        { _id: accId, userId },
        { name: accName.trim() },
        { returnDocument: "after" },
      );

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Account Updated successfully",
      });
    } else {
      await Account.create({
        userId,
        name: accName.trim(),
        balance: accBalance,
        isActive: accActiveStatus,
      });

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
      });
    }
  } catch (error) {
    console.error("Account configuration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create/update account",
    });
  }
}

export async function accDelete(req, res) {
  try {
    const userId = req.user.id;
    const accId = req.params._id;

    if (!accId) {
      return res.status(400).json({
        success: false,
        message: "Account id is required",
      });
    }

    const account = await Account.findOneAndUpdate(
      {
        _id: accId,
        userId,
        isActive: true,
      },
      { isActive: false },
      { returnDocument: "after" },
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted permanently",
    });
  } catch (error) {
    console.log("Account deletion error: ", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
}
