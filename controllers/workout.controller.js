import Workout from "../models/workout.model.js";
import mongoose from "mongoose";

const createdWorkout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {title, scheduledDate, scheduledTime, exercises} = req.body;
        if (!title || !scheduledDate || !scheduledTime || !exercises) {
            return res.status(400).json({message: "All fields are required"});
        };

        if (typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).json({message: "Title must be a non-empty string"});
        }

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
            user: userId,
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

const getWorkouts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {status, startDate, endDate} = req.query;
        const filter = {user: userId};

        // Validasi status
        const validStatus = ['pending', 'in-progress', 'completed', 'cancelled'];
        if (status && !validStatus.includes(status.toLowerCase())) {
            return res.status(400).json({message: "Invalid status. Status must be one of 'pending', 'in-progress', 'completed', or 'cancelled'"});
        };
        if (status) filter.status = status;

        // Validasi tanggal
        if (startDate || endDate) {
            if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
                return res.status(400).json({message: "Invalid date format"});
            };

            if (startDate && endDate) {
                filter.scheduledDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            };
        };

        const workout = await Workout.find(filter).sort({
            scheduledDate: 1,
            scheduledTime: 1
        });
        // Periksa apakah data ditemukan
        if (!workout || workout.length === 0) {
            return res.status(404).json({message: "No workouts found"});
        };
        res.status(200).json({data: workout});
    } catch (error) {
        console.error("Error getting workouts", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const addComments = async (req, res) => {
    try {
        const userId = req.user.userId;
        const workoutId = req.params.id;
        const {text} = req.body;

        if (!mongoose.Types.ObjectId.isValid(workoutId)) {
            return res.status(400).json({message: "Invalid workout ID"})
        }

        if (!text || typeof text !== "string" || text.trim().length === 0) {
            return res.status(400).json({message: "Comment text is required and must be a non-empty string"});
        }

        if (text.trim().length > 500) {
            return res.status(400).json({message: "Comment text cannot exceed 500 characters"});
        }

        const workout = await Workout.findOne({
            _id: workoutId,
            user: userId,
        });

        if (!workout) {
            return res.status(404).json({message: "Workout not found"});
        };

        workout.comments.push({text});
        await workout.save();
        res.status(200).json({
            message: "Comment added successfully",
            data: workout.comments
    });
    } catch (error) {
        console.error("Error adding comments", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const deleteComments = async (req, res) => {
    try {
        const userId = req.user.userId;
        const workoutId = req.params.id;
        const commentId = req.params.commentId;

        if (!mongoose.Types.ObjectId.isValid(workoutId)) {
            return res.status(400).json({message: "Invalid workout ID"});
        };

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({message: "Invalid comment ID"});
        };

        const workout = await Workout.findOne({
            _id: workoutId,
            user: userId,
        });
        if (!workout) {
            return res.status(404).josn({message: "Workout not found"});
        };

        const commentIndex = workout.comments.findIndex((comment) => comment._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).json({message: "Comment not found"});
        };

        workout.comments.splice(commentIndex, 1);
        await workout.save();
        res.status(200).json({
            message: "Comment deleted successfully",
            data: workout.comments,
        });
    } catch (error) {
        console.error("Error deleting comments", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const updateComments = async (req, res) => {
    try {
        const userId = req.user.userId;
        const workoutId = req.params.id;
        const commentId = req.params.commentId;
        const {text} = req.body;

        if (!mongoose.Types.ObjectId.isValid(workoutId)) {
            return res.status(400).json({message: "Invalid workout ID"});
        };

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({message: "Invalid comment ID"});
        };

        if (!text || typeof text !== "string" || text.trim().length === 0) {
            return res.status(400).json({message: "Comment text is required and must be a non-empty string"});
        }

        if (text.trim().length > 500) {
            return res.status(400).json({message: "Comment text cannot exceed 500 characters"});
        }

        const workout = await Workout.findOne({
            _id: workoutId,
            user: userId,
        });
        if (!workout) {
            return res.status(404).json({message: "Workout not found"});
        }

        const commentIndex = workout.comments.findIndex((comment) => comment._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).json({message: "Comment not found"});
        };

        workout.comments[commentIndex].text = text;
        await workout.save();
        res.status(200).json({
            message: "Comment updated successfully",
            data: workout.comments[commentIndex],
        });
    } catch (error) {
        console.error("Error updating comments", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const updateWorkout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const workoutId = req.params.id;
        const {title, scheduledDate, scheduledTime, exercises} = req.body;

        if (!mongoose.Types.ObjectId.isValid(workoutId)) {
            return res.status(400).json({message: "Invalid workout ID"});
        };

        const workout = await Workout.findOne({
            _id: workoutId,
            user: userId,
        });
        if (!workout) {
            return res.status(404).json({message: "Workout not found"});
        };

        if (title) {
            if (typeof title !== "string" || title.trim().length === 0) {
                return res.status(400).json({message: "Title must be a non-empty string"});
            }
            workout.title = title;
        }

        if (scheduledDate) {
            if (isNaN(new Date(scheduledDate).getTime())) {
                return res.status(400).json({message: "Invalid scheduled date format"});
            }
            workout.scheduledDate = scheduledDate;
        }

        if (scheduledTime) {
            if (!/^\d{2}:\d{2}$/.test(scheduledTime)) {
                return res.status(400).json({message: "Invalid scheduled time format. Use HH:MM format."});
            };
            workout.scheduledTime = scheduledTime;
        }

        if (exercises) {
            if (!Array.isArray(exercises) || exercises.length === 0) {
                return res.status(400).json({message: "Exercise must be a non-empty array"});
            };
            workout.exercises = exercises;
        }

        await workout.save();
        res.status(200).json({
            message: "Workout updated successfully",
            data: workout,
        });
    } catch (error) {
        console.error("Error updating workout", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {createdWorkout, getWorkouts, addComments, deleteComments, updateComments, updateWorkout};