import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Types } from 'mongoose';
import { AIHttpError } from './ai.errors';

export type AuthenticatedRequest = Request & {
  authUser: NonNullable<Request['authUser']>;
};

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function getUserId(req: Request): Types.ObjectId {
  if (!req.user?._id || !Types.ObjectId.isValid(req.user?._id)) {
    throw new AIHttpError(401, 'Authenticated user is missing or invalid.');
  }
  return new Types.ObjectId(req.user?._id);
}

export function requireString(
  value: unknown,
  fieldName: string,
  minLength = 1,
  maxLength = 4000,
): string {
  if (typeof value !== 'string') {
    throw new AIHttpError(400, `${fieldName} must be a string.`);
  }
  const result = value.trim();
  if (result.length < minLength) {
    throw new AIHttpError(400, `${fieldName} is required.`);
  }
  if (result.length > maxLength) {
    throw new AIHttpError(400, `${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return result;
}

export function optionalString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requireString(value, fieldName, 1, maxLength);
}

export function requireObjectId(value: string, fieldName: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AIHttpError(400, `${fieldName} is invalid.`);
  }
  return new Types.ObjectId(value);
}

export function parsePagination(query: Request['query']): { page: number; limit: number; skip: number } {
  const rawPage = Number(query.page ?? 1);
  const rawLimit = Number(query.limit ?? 30);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1
    ? Math.min(Math.floor(rawLimit), 100)
    : 30;
  return { page, limit, skip: (page - 1) * limit };
}

export function aiErrorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AIHttpError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
    });
    return;
  }

  const mongoError = error as { code?: number; keyPattern?: Record<string, unknown>; name?: string };
  if (mongoError?.code === 11000) {
    res.status(409).json({ success: false, message: 'A record with these details already exists.' });
    return;
  }

  // Log the detail server-side, but never return provider keys or stack traces to a student.
  console.error('[Talis AI API]', error);
  res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
}
