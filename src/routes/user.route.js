import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { userAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const userRouters = Router();

userRouters.get("/get-me", userAuth, userController.getMe);

userRouters.get("/info", userAuth, userController.userInfo);

userRouters.post("/update", userAuth, userController.userUpdate);

userRouters.post(
  "/password-update",
  userAuth,
  userController.changeUserPassword,
);

userRouters.post(
  "/upload-profile",
  userAuth,
  upload.single("profile-img"),
  userController.uploadProfileImg,
);

export default userRouters;
