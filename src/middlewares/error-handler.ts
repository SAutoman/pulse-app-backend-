import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err.name);
  return res.status(500).json({
    error: 'An error occurred while processing your request.',
    errorName: err.name,
    message: err.message,
  });
};
//Export
export { errorHandler };
