"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
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
        const user = await user_model_1.User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.login = login;
//# sourceMappingURL=auth.controller.js.map