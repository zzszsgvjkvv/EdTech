"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const tutor_model_1 = require("../models/tutor.model");
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';
const register = async (req, res) => {
    try {
        const { name, email, password, role, nativeLanguage, targetLanguage } = req.body;
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }
        const user = await user_model_1.User.create({ name, email, password, role, nativeLanguage, targetLanguage });
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        // Find user by email
        const user = await user_model_1.User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // Compare password
        const isMatch = bcryptjs_1.default.compare(password, user.password ?? "");
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ _id: user._id,
            id: user._id,
            role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        // If user is a teacher, fetch their tutor profile & availability details
        let profileData = null;
        if (user.role === 'teacher') {
            console.log(`teacher ${user._id}`);
            profileData = await tutor_model_1.Tutor.findOne({ userId: user._id.toString() });
            console.log("teacher profile data:", profileData);
        }
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            // Include extended profile data if it exists
            profile: profileData || null,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server error during login' });
    }
};
exports.login = login;
//# sourceMappingURL=auth.controller.js.map