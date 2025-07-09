import express from "express";
import {
  loginUser,
  isLogin,
  getAllUsers
} from "../Controllers/auth.controller.js";
import { isAuthenticated } from "../Middlewares/auth.middleware.js";


const router = express.Router();

router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.route("/login").post(loginUser);
router.route("/isLogin").get(isAuthenticated, isLogin);
router.route("/getAllUsers").get(getAllUsers);
 
export default router;

