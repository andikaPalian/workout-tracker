import express from "express";
import { changeEmail, changePassword, getUserProfile, loginUser, registerUser, updateUserProfile } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const userRoute = express.Router();

userRoute.post("/register", registerUser);
userRoute.post("/login", loginUser);
userRoute.get("/profile", authMiddleware, getUserProfile);
userRoute.put("/update-profile", authMiddleware, updateUserProfile);
userRoute.put("/email", authMiddleware, changeEmail);
userRoute.put("/password", authMiddleware, changePassword);

export default userRoute;