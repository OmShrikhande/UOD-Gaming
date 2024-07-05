import express from "express";
import {
    addTodo,
    getTodos,
    updateTodo,
    deleteTodo
} from "../Controllers/todo.controller.js";
import { isAuthenticated } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.route("/addTodo").post(isAuthenticated, addTodo)
router.route("/getTodo").get(isAuthenticated, getTodos);
router.route("/update/:id").put(isAuthenticated, updateTodo)
router.route("/delete/:id").delete(isAuthenticated, deleteTodo);

export default router;
