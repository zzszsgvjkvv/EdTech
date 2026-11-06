import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { TutorProfile } from '../models/tutor-profile.model';
import { AvailabilitySlot } from '../models/availability-slot.model';
import { Appointment, IAppointment } from '../models/appointment.model';

// 1. Complete / Update Tutor Profile
export const upsertTutorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { bio, languages, hourlyRate, currency } = req.body;

    const profile = await TutorProfile.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) }, // Fixed TypeScript userId query typing
      { bio, languages, hourlyRate, currency },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Tutor profile updated successfully', data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating profile' });
  }
};

// 2. Specify Available Time Slots

export const createMultiRangeAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const tutorId = req.user?._id;
    const { date, timeRanges, slotDurationMinutes = 60 } = req.body;
    // date: "2026-11-07"
    // timeRanges: [{ startTime: "10:00", endTime: "11:00" }, { startTime: "14:00", endTime: "17:00" }, ...]

    if (!date || !timeRanges || !Array.isArray(timeRanges) || timeRanges.length === 0) {
      res.status(400).json({ success: false, message: 'Date and an array of timeRanges are required.' });
      return;
    }

    const createdSlots = [];

    for (const range of timeRanges) {
      const { startTime, endTime } = range ;
      if (!startTime || !endTime) continue;

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const rangeStart = new Date(date);
      rangeStart.setHours(startHour, startMinute, 0, 0);

      const rangeEnd = new Date(date);
      rangeEnd.setHours(endHour, endMinute, 0, 0);

      if (rangeStart >= rangeEnd) continue;

      let currentStart = new Date(rangeStart);

      // Slice each specific range into bookable session blocks
      while (currentStart < rangeEnd) {
        const currentEnd = new Date(currentStart);
        currentEnd.setMinutes(currentEnd.getMinutes() + slotDurationMinutes);

        if (currentEnd <= rangeEnd) {
          try {
            const slot = await AvailabilitySlot.create({
              tutorId: new Types.ObjectId(tutorId),
              startTime: new Date(currentStart),
              endTime: new Date(currentEnd),
              isBooked: false,
            });
            createdSlots.push(slot);
          } catch (err) {
            // Skips duplicates gracefully if a slot already exists
          }
        }
        currentStart = new Date(currentEnd);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdSlots.length} availability slots across the specified ranges.`,
      data: createdSlots,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating multi-range availability' });
  }
};

// 3. View All Appointments (with status filter)
export const getTeacherAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const tutorId = req.user?._id;
    const { status } = req.query;

    const filter: any = { tutorId: new Types.ObjectId(tutorId) };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('studentId', 'name email')
      .populate('slotId')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching appointments' });
  }
};

// 4. Approve or Reject Appointment (with Apology Note)
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const tutorId = req.user?._id;
    const appointmentId = req.params.id as string; // Safely cast route parameter
    const { status, teacherNote } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected', 'completed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status update.' });
      return;
    }

    // Explicitly type the query result document to include Mongoose document methods & properties
    const appointment = await Appointment.findOne({
      _id: new Types.ObjectId(appointmentId),
      tutorId: new Types.ObjectId(tutorId),
    });

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment ticket not found.' });
      return;
    }

    appointment.status = status;
    if (teacherNote) appointment.teacherNote = teacherNote.trim();
    await appointment.save();

    // If rejected, release the availability slot back to unbooked
    if (status === 'rejected') {
      await AvailabilitySlot.findByIdAndUpdate(appointment.slotId, { isBooked: false });
    }

    res.status(200).json({ success: true, message: `Appointment ${status} successfully`, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating appointment' });
  }
};

// 5. Access Chat / Session via Ticket ID
export const getTeacherAppointmentChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const tutorId = req.user?._id;
    const appointmentId = req.params.id as string; // Safely cast route parameter

    // Use explicit lean typing to prevent property-access errors on lean documents
    const appointment = await Appointment.findOne({
      _id: new Types.ObjectId(appointmentId),
      tutorId: new Types.ObjectId(tutorId),
      status: 'approved',
    })
      .populate('studentId', 'name email')
      .lean<IAppointment & { studentId: any }>();

    if (!appointment) {
      res.status(403).json({ success: false, message: 'Access denied. Appointment must be approved.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ticketId: appointment._id,
        partner: appointment.studentId,
        targetLanguage: appointment.targetLanguage,
        topicNote: appointment.topicNote,
        roomCredentials: `talis_session_${appointment._id}`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error loading chat credentials' });
  }
};