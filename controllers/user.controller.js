import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import User from "../models/user.model.js";

const registerUser = async (req, res) => {
    try {
        const {username, email, password, height, weight, goal, gender} = req.body;
        if (!username?.trim() || !email?.trim() || !password?.trim() || !height || !weight || !goal?.trim() || !gender?.trim()) {
            return res.status(400).json({message: "All fields are required"});
        };
        const validGender = ["male", "female"];
        if (!validGender.includes(gender.toLowerCase())) {
            return res.status(400).json({
                message: "Invalid gender value",
                validValues: validGender,
            });
        };
        if (height !== undefined) {
            if (typeof height !== "number" || isNaN(height) || height <= 0) {
                return res.status(400).json({message: "Invalid height value. Height must be a positive number."});
            };
        };
        if (weight !== undefined) {
            if (typeof weight !== "number" || isNaN(weight) || weight <= 0) {
                return res.status(400).json({message: "Invalid weight value. Weight must be a positive number."});
            };
        };
        
        // Cek user sudah ada atau belum
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });
        if (existingUser) {
            return res.status(400).json({message: "User already exists"});
        };

        // Validasi format email dan password
        if (!validator.isEmail(email)) {
            return res.json({message: "Please enter a valid email"});
        };
        const passwordReqex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordReqex.test(password)) {
            return res.json({message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"});
        };

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            height,
            weight,
            goal,
            gender,
        });
        await user.save();
        // Menghapus password dari response
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(201).json({
            message: "User created successfully",
            data: userResponse,
        });
    } catch (error) {
        console.error("Error registering user", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({message: "All fields are required"});
        };

        const user = await User.findOne({
            email: email.toLowerCase(),
        });
        if (!user) {
            return res.status(404).json({message: "User not found"});
        };

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({
                id: user._id
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            user.password = undefined;
            return res.status(200).json({
                message: "User logged in successfully",
                data: {
                    token,
                    user,
                },
            });
        } else {
            return res.status(401).json({message: "Invalid credentials"});
        };
    } catch (error) {
        console.error("Error logging in user", error);
        return res.status(500).jsoon({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {username, height, weight, goal} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: "User not found"})
        };

        const update = {}
        if (username !== undefined) {
            if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 30) {
                return res.status(400).json({message: "Invalid username. It must be a string between 3 and 30 characters."});
            };
            update.username = validator.escape(username.trim());
        };
        if (height !== undefined) {
            if (typeof height !== "number" || isNaN(height) || height <= 0) {
                return res.status(400).json({message: "Invalid height value. Height must be a positive number."});
            };
            update.height = height;
        };
        if (weight !== undefined) {
            if (typeof weight !== "number" || isNaN(weight) || weight <= 0) {
                return res.status(400).json({message: "Invalid weight value. Weight must be a positive number."});
            };
            update.weight = weight;
        };
        if (goal !== undefined) {
            if (typeof goal !== "string" || goal.trim().length === 0 || goal.trim().length > 30) {
                return res.status(400).json({message: "Invalid goal value. It must be a non-empty string with a maximum of 30 characters."});
            };
            update.goal = validator.escape(goal.trim());
        };

        // Cek apakah ada data yang di update atau tidak
        if (!Object.keys(update).length) {
            return res.status(400).json({message: "No data to update"});
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {$set: update},
            {new: true},
        ).select("-password");

        res.status(200).json({
            message: "User profile updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user profile", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const changeEmail = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {newEmail, password} = req.body;

        // Verifikasi format email
        if (!validator.isEmail(newEmail)) {
            return res.status(400).json({message: "PLease enter a valid email"});
        };

        const user = await User.findById(userId).select("-password");
        if(!user) {
            return res.status(404).json({message: "User not found"});
        };

        // Cek apakah email baru sama dengan email lama
        if (newEmail === user.email) {
            return res.status(400).json({message: "New email is the same as the current email"});
        };

        const emailExists = await User.findOne({email: newEmail});
        if (emailExists) {
            return res.status(400).json({message: "Email already in use"});
        };

        // Verifikasi panjang password
        if (password.length < 8) {
            return res.status(400).json({message: "Password must be at least 8 characters"});
        };

        // Verifikasi password sesuai dengan password saat ini
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({message: "Invalid password"});
        };

        user.email = newEmail;
        await user.save();
        res.status(200).json({
            message: "Email changed successfully",
            data: user,
        });
    } catch (error) {
        console.error("Error changing email", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {currentPassword, newPassword} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: "User not found"});
        };


        // Verifikasi password saat ini
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(400).json({message: "Current password is incorrect"});
        };

        // Validasi format password baru
        const passwordReqex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordReqex.test(newPassword)) {
            return res.status(400).json({message: "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character."});
        };
        // Cek apakah password baru sama dengan password saat ini
        const isMacth = await bcrypt.compare(newPassword, user.password);
        if (isMacth) {
            return res.status(400).json({message: "New password is the same as the current password"});
        };

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedNewPassword;
        await user.save();
        res.status(200).json({message: "Password changed successfully"});
    } catch (error) {
        console.error("Error changing password", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({message: "User not found"});
        };
        res.status(200).json(user);
    } catch (error) {
        console.error("Error getting ueer profile", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {registerUser, loginUser, updateUserProfile, changeEmail, changePassword, getUserProfile};