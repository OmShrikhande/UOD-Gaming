import Game from "../Models/game.model.js";
import User from "../Models/auth.model.js";

// Add a new Game
export const addTodo = async (req, res) => {
    try {
        const { title } = req.body;
        const userId = req.user._id;

        if (!title || !description) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newTodo = await Todo.create({
            user: userId,
            title,
            description,
        });

        res.status(201).json({
            success: true,
            message: "Todo added successfully",
            todo: newTodo,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// Get all todos for a user
export const getTodos = async (req, res) => {
    try {
        const userId = req.user._id;
        const todos = await Todo.find({ user: userId });

        res.status(200).json({
            success: true,
            todos,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// Update a todo
export const updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, completed } = req.body;
        const userId = req.user._id;

        const todo = await Todo.findOne({ _id: id, user: userId });

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: "Todo not found",
            });
        }

        todo.title = title || todo.title;
        todo.description = description || todo.description;
        todo.completed = completed !== undefined ? completed : todo.completed;

        await todo.save();

        res.status(200).json({
            success: true,
            message: "Todo updated successfully",
            todo,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// Delete a todo
export const deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const todo = await Todo.findOneAndDelete({ _id: id, user: userId });

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: "Todo not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Todo deleted successfully",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
