import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

const validateFields = (req: Request, res: Response, next: NextFunction) => {
  //Check if params validator has errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ...errors });
  }
  next();
};

//exports
export { validateFields };
