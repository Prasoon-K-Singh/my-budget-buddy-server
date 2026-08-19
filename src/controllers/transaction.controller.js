import Account from "../models/account.model.js";

export async function transacAdd(req, res) {
  const id = req.user.id;
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

    const data = {};
    data.accList = accList;

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
