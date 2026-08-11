import { Router } from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import * as tranController from "../controllers/transaction.controller.js";

const transacRouters = Router();

transacRouters.post("/add", userAuth, tranController.trnsacAdd);

export default transacRouters;
