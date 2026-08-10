import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    user: {
      id: user._id,
      name: {
        firstname: user.name.firstname,
        lastname: user.name.lastname,
      },
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
}

export async function userInfo(req, res) {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      dob: user.dob,
      occupation: user.occupation,
      gender: user.gender,
      profileImg: user.profileImg,
      currency: user.currency,
    },
  });
}

export async function userUpdate(req, res) {
  const id = req?.user?.id || "";
  const { name, username, email, dob, occupation, gender, currency } = req.body;

  const update = {};
  if (name?.firstname !== undefined) {
    update["name.firstname"] = name.firstname.trim();
  }
  if (name?.lastname !== undefined) {
    update["name.lastname"] = name.lastname.trim();
  }
  if (username !== undefined) update.username = username;
  if (email !== undefined) update.email = email;
  if (dob !== undefined) update.dob = dob;
  if (occupation !== undefined) update.occupation = occupation;
  if (gender !== undefined) update.gender = gender;
  if (currency !== undefined) update.currency = currency;

  const user = await User.findByIdAndUpdate(
    id,
    { $set: update },
    { returnDocument: "after" },
  );

  res.status(200).json({
    success: true,
    message: "User Updated Successfully",
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      dob: user.dob,
      occupation: user.occupation,
      gender: user.gender,
      profileImg: user.profileImg,
      currency: user.currency,
    },
  });
}

export async function changeUserPassword(req, res) {
  try {
    const id = req?.user?.id || "";
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      user.password,
    );

    if (!isOldPasswordCorrect) {
      return res.status(400).json({
        success: false,
        code: "INVALID_CURRENT_PASSWORD",
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        code: "PASSWORD_REUSE",
        message: "New password must be different from the current password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(
      id,
      {
        password: hashedPassword,
      },
      { returnDocument: "after" },
    );

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.log("err: ", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function uploadProfileImg(req, res) {
  try {
    const id = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.profileImgPublicId) {
      await cloudinary.uploader.destroy(user.profileImgPublicId);
    }

    user.profileImg = req.file.path;
    user.profileImgPublicId = req.file.filename;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
    });
  } catch (err) {
    console.log("err: ", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
