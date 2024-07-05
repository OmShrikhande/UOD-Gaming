import Game from '../models/Game';
import User from '../models/User';

// Controller function to display highscore to the user
const displayHighscore = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID is stored in req.user

        // Verify if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const gameTitle = req.params.title; // Assuming game title is passed as a parameter

        // Check if the user has played the game at least once
        const game = await Game.findOne({ user: userId, title: gameTitle });
        if (!game) {
            return res.status(404).json({ message: "User has not played this game yet" });
        }

        // Fetch the highest score for the specified game title
        const highestScore = await Game.findOne({ title: gameTitle })
                                      .sort({ highscore: -1 })
                                      .select('highscore createdAt')
                                      .populate('user', 'username'); // Populate user details (username)

        if (!highestScore) {
            return res.status(404).json({ message: "Highscore not found for this game" });
        }

        res.json({
            username: highestScore.user.username,
            title: highestScore.title,
            highscore: highestScore.highscore,
            createdAt: highestScore.createdAt,
        });
    } catch (error) {
        console.error("Error fetching highscore:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export {displayHighscore };