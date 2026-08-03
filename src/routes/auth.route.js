import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouters = Router();

authRouters.post("/register", authController.register);

authRouters.post("/login", authController.login);

authRouters.get("/logout", authController.logout);

export default authRouters;
