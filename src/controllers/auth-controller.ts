import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../helpers/prisma-client';
import { generateJWT } from '../helpers/generate-jwt';
import { ICustomRequest } from '../types/custom-types';
import { DateTime } from 'luxon';
import nodemailer from 'nodemailer';
import { generateUniqueToken } from '../helpers/revover-password/pasword-reset-generate-token';
import { getRecoveryEmailTemplate } from '../helpers/revover-password/handle-email-template';
import { time } from 'console';
import { type } from 'os';
import { Prisma } from '@prisma/client';

//Create an user (Sign Up)
const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { first_name, last_name, email, password, country, timezone } =
    req.body;

  //Encrypt password
  const salt = bcrypt.genSaltSync();
  const securePassword = bcrypt.hashSync(password, salt);

  console.log(securePassword);
  //Created at date (is in UTC by default)
  const currentDate = new Date();

  // Find the default ranking league (the latest league in the latest category)
  
  const defaultLeague = await prisma.rankingLeague.findFirst({
    where: {
    },
    orderBy: [
      { category: { order: 'desc' } }, // Descending order to get the latest category
      { level: 'desc' }, // Descending order to get the highest level in that category
    ],
    include: { category: true },
  });

 
  if (!defaultLeague || !defaultLeague.category) {
    throw new Error('Category field is required but is null.');
  }
  
  // Proceed with your code handling when the category field is valid

  if (!defaultLeague) {
    throw new Error('No ranking leagues available to assign to the new user.');
  }
  

  try {
    //Create new user

    
    await prisma.user.create({
      data: {
        created_at: currentDate.toISOString(),
        first_name,
        last_name,
        email,
        password: securePassword,
        country,
        timezone,
        image_url:
          'https://graph.facebook.com/10154870954828379/picture?height=256&width=256',
        sport_type_id: '6625cf4ecc02e95521774a3f',
        league_id: defaultLeague.id,
      },
      include: {
        sport_type: true,
        user_clubs: {
          include: {
            club: {
              include: {
                sport_type: true,
              },
            },
          },
        },
        current_league: {
          include: { category: true },
        },
        user_badges: {
          include: { badge: true },
        },
      },
    });


    //Generate access token
    // const token = await generateJWT(newUser.id);

    // return res.status(200).json({
    //   status: true,
    //   user: newUser,
    //   token,
    // });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;


  console.log(password);
  try {
    //Check if email exists
    const userFound = await prisma.user.findFirst({
      where: {
        email: email,
      },
      include: {
        sport_type: true,
        user_clubs: {
          include: {
            club: {
              include: {
                sport_type: true,
              },
            },
          },
        },
        current_league: {
          include: { category: true },
        },
        user_badges: {
          include: { badge: true },
        },
      },
    });

    if (!userFound) {
      return res.status(400).json({
        status: false,
        error: `User with email ${email} does not exist.`,
      });
    }

    //Valdiate password
    const passwordOK = bcrypt.compareSync(password, userFound.password);
    if (!passwordOK) {
      return res.status(400).json({
        status: false,
        error: `Email and password do not match.`,
      });
    }

    //Generate JWT
    const token = await generateJWT(userFound.id);

    return res.status(200).json({
      status: true,
      user: userFound,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const validateLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as ICustomRequest).authenticatedUser;
  const token = req.header('x-token');

  const { app_version, device } = req.query;

  const updateData: {
    latest_login: string;
    app_version?: string;
    device?: string;
  } = {
    latest_login: DateTime.utc().toISO()!,
  };

  if (app_version) {
    updateData.app_version = app_version.toString();
  }

  if (device) {
    updateData.device = device.toString();
  }

  try {
    // Update user and create login event in parallel
    const [updatedUser] = await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: {
          sport_type: true,
          user_clubs: {
            include: {
              club: {
                include: {
                  sport_type: true,
                },
              },
            },
          },
          current_league: {
            include: { category: true },
          },
          user_badges: {
            include: { badge: true },
          },
        },
      }),
      prisma.appEvent.create({
        data: {
          user_id: user.id,
          type: 'APP_OPEN',
          timestamp: new Date(),
          metadata: {},
        },
      }),
    ]);

    return res.status(200).json({
      status: true,
      user: updatedUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password endpoint
const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const resetToken = await generateUniqueToken();
    const resetTokenExpires = DateTime.utc().plus({ hours: 1 }).toISO(); // Token valid for 1 hour
    
        
    console.log(typeof user.id, user.id, '- user.id type and value');
    console.log(typeof resetToken, resetToken, '- resetToken type and value');
    console.log(typeof resetTokenExpires, resetTokenExpires, '- resetTokenExpires type and value');

    
  try
  {
    await prisma.user.update({
        
    where: { id: user.id },
        
    data: {
          
      reset_token: resetToken,   
      reset_token_expires: resetTokenExpires,
      },
    });
      
      console.log('User reset token updated successfully'
    );
    } catch(error) {
      
    console.error('An error occurred while updating the user reset token:', error);
  }





    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NM_EMAIL,
        pass: process.env.NM_PASSW,
      },
    });

    const mailOptions = {
      from: 'sebasariasdev@gmail.com',
      to: email,
      subject: 'T-Mate Password Reset',
      html: getRecoveryEmailTemplate(
        resetToken,
        user.first_name,
        user.last_name
      ),
    };

    await transporter.sendMail(mailOptions);

    res.json({ msg: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
};

// Reset Password endpoint
const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, token, newPassword } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        reset_token: token,
        reset_token_expires: {
          gte: DateTime.utc().toISO()!,
        },
      },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or expired token' });
    }

    const salt = bcrypt.genSaltSync();
    const securePassword = bcrypt.hashSync(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: securePassword,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    return res.json({ msg: 'Password has been reset' });
  } catch (error) {
    next(error);
    res.status(500).send('Server error');
  }
};
//Exports
export { createUser, loginUser, validateLogin, forgotPassword, resetPassword };
