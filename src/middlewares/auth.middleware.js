import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

async function userAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.role !== "user" && decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have access!",
      });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.log("catch error", err);

    return res.status(401).json({ message: "Unauthorized" });
  }
}

export { userAuth };
