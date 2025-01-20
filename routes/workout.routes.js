import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createdWorkout } from "../controllers/workout.controller.js";

const workoutRoute = express.Router();

workoutRoute.post("/add-workout", authMiddleware, createdWorkout);

export default workoutRoute;