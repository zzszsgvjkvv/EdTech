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
export const createRecurringAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const tutorId = req.user?._id;
    const { dayOfWeek, startHour, endHour, weeksAhead = 4 } = req.body;
    // dayOfWeek: 0 = Sunday, 6 = Saturday
    // startHour: 10 (10 AM), endHour: 22 (10 PM)
    // weeksAhead: How many future weeks to generate slots for (default 4)

    if (dayOfWeek === undefined || startHour === undefined || endHour === undefined) {
      res.status(400).json({ success: false, message: 'dayOfWeek, startHour, and endHour are required.' });
      return;
    }

    const createdSlots = [];
    const now = new Date();

    // Loop through upcoming weeks
    for (let w = 0; w < weeksAhead; w++) {
      const targetDate = new Date();
      // Find the next occurrence of dayOfWeek
      const currentDay = targetDate.getDay();
      const distance = (dayOfWeek + 7 - currentDay) % 7;
      targetDate.setDate(targetDate.getDate() + distance + (w * 7));

      // Generate hourly blocks between startHour and endHour
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = new Date(targetDate);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(targetDate);
        endTime.setHours(hour + 1, 0, 0, 0);

        // Only create future slots
        if (startTime > now) {
          try {
            const slot = await AvailabilitySlot.create({
              tutorId: new Types.ObjectId(tutorId),
              startTime,
              endTime,
              isBooked: false,
            });
            createdSlots.push(slot);
          } catch (err) {
            // Ignore duplicate/overlapping slot errors gracefully and continue loop
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdSlots.length} availability slots for the upcoming weeks.`,
      data: createdSlots,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating recurring slots' });
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