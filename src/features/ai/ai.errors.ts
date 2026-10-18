export class AIHttpError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = 'AIHttpError';
    this.statusCode = statusCode;
    this.code = code||"";
  }
}
