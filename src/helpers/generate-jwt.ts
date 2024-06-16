import jwt from 'jsonwebtoken';
import { DEBUG_MODE } from '../main';

const generateJWT = (uid: string) => {
  return new Promise<string>((resolve, rejects) => {
    const payload = { uid };
    const secretKey: string = process.env.SECRET_JWT_KEY!;

    jwt.sign(
      payload,
      secretKey,
      {
        expiresIn: '300d',
      },
      (err, token) => {
        if (err) {
          DEBUG_MODE && console.log(err);
          rejects('JWT was not generated');
        } else {
          resolve(token as string);
        }
      }
    );
  });
};

//Exports
export { generateJWT };
