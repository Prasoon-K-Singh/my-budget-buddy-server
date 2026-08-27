import { Router } from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import * as tranController from "../controllers/transaction.controller.js";

const transacRouters = Router();

transacRouters.post("/add", userAuth, tranController.transacAdd);

transacRouters.get("/list", userAuth, tranController.transacList);

transacRouters.post("/delete/:_id", userAuth, tranController.transacDel);

transacRouters.post("/edit/:_id", userAuth, tranController.transacEdit);

export default transacRouters;
