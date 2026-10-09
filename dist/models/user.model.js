"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.AllowedLanguages = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
var AllowedLanguages;
(function (AllowedLanguages) {
    AllowedLanguages["ENGLISH"] = "en";
    AllowedLanguages["FRENCH"] = "fr";
    AllowedLanguages["SPANISH"] = "es";
    AllowedLanguages["ARABIC"] = "ar";
    AllowedLanguages["GERMAN"] = "de";
})(AllowedLanguages || (exports.AllowedLanguages = AllowedLanguages = {}));
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student'
    },
    nativeLanguage: { type: String },
    targetLanguage: {
        type: String,
        enum: Object.values(AllowedLanguages)
    }
}, { timestamps: true });
// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password'))
        return;
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
});
// Instance method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user.model.js.map