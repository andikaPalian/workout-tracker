import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getWorkoutReport } from "../controllers/reports.controller.js";

const reportRoute = express.Router();

reportRoute.get("/", authMiddleware, getWorkoutReport);

export default reportRoute;