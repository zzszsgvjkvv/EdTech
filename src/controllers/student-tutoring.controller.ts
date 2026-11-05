import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { TutorProfile } from '../models/tutor-profile.model';
import { AvailabilitySlot } from '../models/availability-slot.model';
import { Appointment, IAppointment } from '../models/appointment.model';

// 1. Browse Tutors & Check Availability with Filters
export const browseTutors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { language, minRating } = req.query;

    const filter: any = {};
    if (language) filter.languages = { $in: [language] };
    if (minRating) filter.rating = { $gte: parseFloat(minRating as string) };

    const tutors = await TutorProfile.find(filter)
      .populate('userId', 'name email')
      .lean();

    res.status(200).json({ success: true, data: tutors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error browsing tutors' });
  }
};

export const getTutorAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    // Explicitly cast req.params.tutorId to string to avoid string[] | undefined errors
    const tutorId = req.params.tutorId as string;

    const slots = await AvailabilitySlot.find({
      tutorId: new Types.ObjectId(tutorId),
      isBooked: false,
      startTime: { $gt: new Date() }, // Only future slots
    }).sort({ startTime: 1 }).lean();

    res.status(200).json({ success: true, data: slots });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching availability' });
  }
};

// 2. Book an Appointment (Create Ticket)
export const bookAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { tutorId, slotId, targetLanguage, topicNote } = req.body;

    if (!tutorId || !slotId || !targetLanguage || !topicNote) {
      res.status(400).json({ success: false, message: 'All booking fields are required.' });
      return;
    }

    // Atomic check and lock on availability slot
    const slot = await AvailabilitySlot.findOneAndUpdate(
      { _id: slotId, tutorId, isBooked: false },
      { isBooked: true },
      { new: true }
    );

    if (!slot) {
      res.status(400).json({ success: false, message: 'Selected time slot is no longer available.' });
      return;
    }

    const appointment = await Appointment.create({
      studentId: new Types.ObjectId(studentId),
      tutorId: new Types.ObjectId(tutorId),
      slotId: new Types.ObjectId(slotId),
      targetLanguage,
      topicNote,
      status: 'pending',
      paymentStatus: 'not_required', // Future payment hook
    });

    res.status(201).json({ success: true, message: 'Appointment ticket created successfully', data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error booking appointment' });
  }
};

// 3. View All Student Appointments
export const getStudentAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { status } = req.query;

    const filter: any = { studentId: new Types.ObjectId(studentId) };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('tutorId', 'name email')
      .populate('slotId')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching appointments' });
  }
};

// 4. Access Chat via Ticket ID
export const getStudentAppointmentChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const appointmentId = req.params.id as string; // Safely cast to string

    // Use explicit lean typing to prevent property-access errors on lean documents
    const appointment = await Appointment.findOne({
      _id: new Types.ObjectId(appointmentId),
      studentId: new Types.ObjectId(studentId),
      status: 'approved',
    })
      .populate('tutorId', 'name email')
      .lean<IAppointment & { tutorId: any }>();

    if (!appointment) {
      res.status(403).json({ success: false, message: 'Access denied. Appointment must be approved by the tutor.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ticketId: appointment._id,
        partner: appointment.tutorId,
        targetLanguage: appointment.targetLanguage,
        topicNote: appointment.topicNote,
        teacherNote: appointment.teacherNote,
        roomCredentials: `talis_session_${appointment._id}`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error loading chat credentials' });
  }
};