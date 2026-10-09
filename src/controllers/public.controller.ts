import { Request, Response } from 'express';

export const getPublicInfo = (req: Request, res: Response): void => {
  res.status(200).json({
    appName: 'TALIS - Language Learning Platform',
    supportedLanguages: ['Spanish', 'French', 'German', 'English'],
    status: 'Operational'
  });
};