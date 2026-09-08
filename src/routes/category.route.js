import { Router } from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import * as catController from "../controllers/category.controller.js";

const catRouters = Router();

catRouters.get("/getBudget", userAuth, catController.getBudget);

catRouters.post("/add", userAuth, catController.addCategory);

catRouters.post("/update/:id", userAuth, catController.updateCategory);

catRouters.get(
  "/currMonthExpenses",
  userAuth,
  catController.getCategoryExpenses,
);

export default catRouters;
