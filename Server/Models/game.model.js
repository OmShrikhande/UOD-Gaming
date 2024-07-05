import mongoose from "mongoose";

const { Schema } = mongoose;

const gameSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    highscore: {
        type: Number,
        required: true,
        default: 0,  // Default highscore to 0
    },
    completed: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Game = mongoose.model("Game", gameSchema);

export default Game;
