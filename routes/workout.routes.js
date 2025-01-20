import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addComments, createdWorkout, deleteComments, getWorkouts, updateComments, updateWorkout } from "../controllers/workout.controller.js";

const workoutRoute = express.Router();

workoutRoute.post("/", authMiddleware, createdWorkout);
workoutRoute.get("/", authMiddleware, getWorkouts);
workoutRoute.put("/:id", authMiddleware, updateWorkout);
workoutRoute.post("/:id/comments", authMiddleware, addComments)
workoutRoute.delete('/:id/comments/:commentId', authMiddleware, deleteComments);
workoutRoute.put("/:id/comments/:commentId", authMiddleware, updateComments);

export default workoutRoute;