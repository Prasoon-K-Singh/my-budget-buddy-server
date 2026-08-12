import express from "express";
import cookieParser from "cookie-parser";
import authRouters from "./routes/auth.route.js";
import userRouters from "./routes/user.route.js";
import transacRoute from "./routes/transaction.route.js";
import accRouters from "./routes/account.route.js";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/auth", authRouters);
app.use("/api/user", userRouters);
app.use("/api/tran", transacRoute);
app.use("/api/acc", accRouters);

export default app;
