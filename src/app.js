import express from "express";
import cookieParser from "cookie-parser";
import userRouters from "./routes/user.route.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/user", userRouters);

export default app;
