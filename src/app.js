import express from "express";
import cookieParser from "cookie-parser";
import userRouters from "./routes/user.route.js";
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

app.use("/api/user", userRouters);

export default app;
