import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { userAuth } from "../middlewares/auth.middleware.js";

const userRouters = Router();

userRouters.get("/get-me", userAuth, userController.getMe);

userRouters.get("/info", userAuth, userController.userInfo);

userRouters.post("/update", userAuth, userController.userUpdate);

userRouters.post(
  "/passwordUpdate",
  userAuth,
  userController.changeUserPassword,
);

export default userRouters;
