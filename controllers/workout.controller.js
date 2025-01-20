import Workout from "../models/workout.model.js";

const createdWorkout = async (req, res) => {
    try {
        const {title, scheduledDate, scheduledTime, exercises} = req.body;
        if (!title || !scheduledDate || !scheduledTime || !exercises) {
            return res.status(400).json({message: "All fields are required"});
        };

        if (!Array.isArray(exercises) || exercises.length === 0) {
            return res.status(400).json({message: "Exercise must be a non-empty array"});
        };

        if (isNaN(new Date(scheduledDate).getTime())) {
            return res.status(400).json({message: "Invalid scheduled date format"});
        };

        if (!/^\d{2}:\d{2}$/.test(scheduledTime)) {
            return res.status(400).json({message: "Invalid scheduled time format. Use HH:MM format."});
        };

        const workout = new Workout({
            user: req.user._id,
            title,
            scheduledDate,
            scheduledTime,
            exercises
        });

        await workout.save();
        res.status(201).json({
            message: "Workout created successfully",
            data: workout,
        });
    } catch (error) {
        console.error("Error creating workout", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {createdWorkout};