import fs from 'fs';
import path from 'path';

// Read HTML template file
export const getRecoveryEmailTemplate = (
  resetToken: string,
  firstName: string,
  lastName: string
) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      '../../templates/password_reset_template.html'
    );
    let template = fs.readFileSync(templatePath, 'utf8');
    template = template.replace('{{resetToken}}', resetToken);
    template = template.replace('{{firstName}}', firstName);
    template = template.replace('{{lastName}}', lastName);
    return template;
  } catch (error) {
    throw error;
  }
};
