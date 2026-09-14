import { Router } from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import * as catController from "../controllers/dashboard.controller.js";

const catRouters = Router();

catRouters.get(
  "/dashboardOverview",
  userAuth,
  catController.getDashboardOverview,
);

export default catRouters;
