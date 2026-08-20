import { Router } from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import * as accController from "../controllers/account.controller.js";

const accRouters = Router();

accRouters.post("/add", userAuth, accController.accAdd);

accRouters.post("/delete/:_id", userAuth, accController.accDelete);

export default accRouters;
