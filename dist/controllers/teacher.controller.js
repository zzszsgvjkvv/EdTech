"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvailability = void 0;
const updateAvailability = async (req, res) => {
    // Access the authenticated user attached by middleware
    const teacherId = req.user?._id;
    res.status(200).json({
        message: `Availability updated successfully for teacher ID: ${teacherId}`,
        schedule: req.body.schedule
    });
};
exports.updateAvailability = updateAvailability;
//# sourceMappingURL=teacher.controller.js.map