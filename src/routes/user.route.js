import { Router } from "express";
import * as userController from "../controllers/user.controller.js";

const userRouters = Router();

userRouters.post("/register", userController.register);

userRouters.post("/login", userController.login);

export default userRouters;
