import { Router } from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import * as billController from "../controllers/bill.controller.js";

const billRouters = Router();

billRouters.post("/create", userAuth, billController.createBill);

billRouters.get("/", userAuth, billController.getBills);

billRouters.get("/:id", userAuth, billController.getBillById);

billRouters.post("/update/:id", userAuth, billController.updateBill);

billRouters.post("/delete/:id", userAuth, billController.deleteBill);

billRouters.post("/mark-paid/:id", userAuth, billController.markBillPaid);

export default billRouters;
