import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ICustomRequest } from '../types/custom-types';
import prisma from '../helpers/prisma-client';

const validateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('x-token');

  //Validate token authenticated
  if (!token) {
    return res.status(401).json({
      status: false,
      msg: 'There is no authenticated token in the request',
    });
  }

  try {
    const secretKey = process.env.SECRET_JWT_KEY!;
    const { uid } = jwt.verify(token, secretKey) as JwtPayload;

    //Look for authenticated user
    const authenticatedUser = await prisma.user.findFirst({
      where: { id: uid },
    });
    if (!authenticatedUser) {
      return res.status(401).json({
        status: false,
        msg: 'Invalid Token - User not found',
      });
    }
    if (authenticatedUser.is_active === false) {
      return res.status(401).json({
        status: false,
        msg: 'Invalid Token - User deleted',
      });
    }

    (req as ICustomRequest).authenticatedUser = authenticatedUser;

    next();
  } catch (error) {
    // DEBUG_MODE console.log(error);
    res.status(401).json({
      msg: 'Invalid Token',
    });
  }
};

//Exports
export { validateJWT };
