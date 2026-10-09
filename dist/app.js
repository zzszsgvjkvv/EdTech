"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Route Registrations
app.use('/api/public', public_routes_1.default); // Unprotected
app.use('/api/auth', auth_routes_1.default); // Login / Register
app.use('/api/teacher', teacher_routes_1.default); // Authenticated + Authorized ('teacher')
app.use('/api/student', student_routes_1.default);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/talis-db';
mongoose_1.default.connect(MONGO_URI)
    .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
    .catch((err) => console.error('Database connection failed:', err));
//# sourceMappingURL=app.js.map