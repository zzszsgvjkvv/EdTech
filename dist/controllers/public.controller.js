"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicInfo = void 0;
const getPublicInfo = (req, res) => {
    res.status(200).json({
        appName: 'TALIS - Language Learning Platform',
        supportedLanguages: ['Spanish', 'French', 'German', 'English'],
        status: 'Operational'
    });
};
exports.getPublicInfo = getPublicInfo;
//# sourceMappingURL=public.controller.js.map