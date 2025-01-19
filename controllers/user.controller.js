import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import User from "../models/user.model.js";

const registerUser = async (req, res) => {
    try {
        const {username, email, password, height, weight, goal, gender} = req.body;
        if (!username?.trim() || !email?.trim() || !password?.trim() || !height?.trim() || !weight?.trim() || !goal?.trim() || !gender?.trim()) {
            return res.status(400).json({message: "All fields are required"});
        };
        const validGender = ["male", "female"];
        if (!validGender.includes(gender.toLowerCase())) {
            return res.status(400).json({
                message: "Invalid gender value",
                validValues: validGender,
            });
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

export {registerUser, loginUser};