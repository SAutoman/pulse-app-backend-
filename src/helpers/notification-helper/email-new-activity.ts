import { Activity, User } from '@prisma/client';
import { NextFunction } from 'express';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const sendEmailNewActivity = (
  activity: Activity,
  user: User,
  next: NextFunction
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NM_EMAIL,
        pass: process.env.NM_PASSW,
      },
    });

    var validation_message = !activity.is_valid
      ? `Unfortunately, your activity is not valid (${activity.invalid_messsage})`
      : '';

    const mailOptions = {
      from: 'sebasariasdev@gmail.com',
      to: user.email,
      subject: 'T-Mate App | New activity registered 🎉',
      html: getActivityEmailTemplate(
        activity.name,
        activity.calculated_points,
        validation_message,
        user.first_name,
        user.last_name
      ),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('HUBO ERROR EN NODEMAILER');
        next(error);
      } else {
        console.log(`Email was sent to ${user.email}`);
      }
    });
  } catch (error) {
    throw error;
  }
};



// Read HTML template file
const getActivityEmailTemplate = (
  activityName: string,
  calculatedPoints: number,
  validationMessage: string | null,
  firstName: string,
  lastName: string
) => {
  console.log(__dirname);

  const templatePath = path.resolve(
    __dirname,
    '../../templates/newActivityRegistered.html'
  );

  // Print the resolved path for debugging
  console.log('Resolved template path:', templatePath);

  let template = fs.readFileSync(templatePath, 'utf8');
  template = template.replace('{{activityName}}', activityName);
  template = template.replace(
    '{{calculatedPoints}}',
    calculatedPoints.toString()
  );
  template = template.replace('{{firstName}}', firstName);
  template = template.replace('{{lastName}}', lastName);

  if (validationMessage) {
    template = template.replace('{{#if validationMessage}}', '');
    template = template.replace('{{/if}}', '');
    template = template.replace('{{validationMessage}}', validationMessage);
  } else {
    template = template.replace(
      /{{#if validationMessage}}[\s\S]*?{{\/if}}/g,
      ''
    );
  }

  return template;
};

const getActivityTextTemplate = (
  activityName: string,
  calculatedPoints: number,
  validationMessage: string,
  firstName: string,
  lastName: string
) => {
  let template = `Hello ${firstName} ${lastName},

A new activity has been registered with the following details:

Activity Name: ${activityName}
Calculated Points: ${calculatedPoints}

${validationMessage ? validationMessage : ''}

Best regards,
T-Mate App Team`;

  return template;
};
export { sendEmailNewActivity };