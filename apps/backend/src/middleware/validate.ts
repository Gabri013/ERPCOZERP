import { validationResult } from 'express-validator';

export const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map((e: any) => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};