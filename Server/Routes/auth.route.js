import express from "express";
import {
  registerUser,
  loginUser,
  isLogin,
  getAllUsers
} from "../Controllers/auth.controller.js";
import { isAuthenticated } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/isLogin").get(isAuthenticated, isLogin);
router.route("/getAllUsers").get(getAllUsers);
 
export default router;
