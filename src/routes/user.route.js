import { Router } from "express";
import * as userController from "../controllers/user.controller.js";

const userRouters = Router();

userRouters.post("/register", userController.register);

userRouters.post("/login", userController.login);

userRouters.get("/get-me", userController.getMe);

userRouters.get("/logout", userController.logout);

export default userRouters;
