"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';
// 1. AUTHENTICATION GUARD (Checks if token exists & is valid)
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await user_model_1.User.findById(decoded.id);
        if (!user) {
            res.status(401).json({ message: 'Unauthorized: User no longer exists' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};
exports.authenticate = authenticate;
// 2. AUTHORIZATION GUARD (Checks if user has required role)
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ message: 'Forbidden: Insufficient permissions for this action' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map