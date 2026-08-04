import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      firstname: { type: String, required: true },
      lastname: { type: String, required: true },
    },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    password: { type: String, required: true },
    dob: { type: Number },
    occupation: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    profileImg: { type: String },
    profileImgPublicId: { type: String },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("users", userSchema);

export default userModel;
