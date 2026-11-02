"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes")); // <-- Don't forget to mount your post routes!
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Routes
app.use('/notification', notification_routes_1.default);
app.use('/api/public', public_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/teacher', teacher_routes_1.default);
app.use('/api/student', student_routes_1.default);
app.use('/api/posts', post_routes_1.default); // <-- Added Class Feed Post routes
exports.default = app;
//# sourceMappingURL=app.js.map