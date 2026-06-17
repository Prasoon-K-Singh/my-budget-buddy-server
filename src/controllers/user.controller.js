import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { config } from "../config/config.js";

export async function register(req, res) {
  const { name, username, email, password, role = "user" } = req.body;
  const firstname = name?.firstname?.trim() || "";
  const lastname = name?.lastname?.trim() || "";

  const isUserAlreadyRegister = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserAlreadyRegister) {
    return res.status(409).json({
      message: "username or email already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    name: {
      firstname,
      lastname,
    },
    username,
    email,
    password: hashedPassword,
    role,
  });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.JWT_SECRET,
  );

  res.cookie("token", token);

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      name: {
        firstname: user.name.firstname,
        lastname: user.name.lastname,
      },
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
}

export async function login(req, res) {
  const { email, username, password } = req.body;

  const user = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  const isPassValid = await bcrypt.compare(password, user.password);

  if (!isPassValid) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.JWT_SECRET,
  );

  res.cookie("token", token);

  res.status(200).json({
    message: "User logged in successfully",
    user: {
      id: user._id,
      name: {
        firstname: user.firstname,
        lastname: user.lastname,
      },
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
}
