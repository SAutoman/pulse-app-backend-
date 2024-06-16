import prisma from "../prisma-client";


// Function to generate a unique 6-digit token
export const generateUniqueToken = async (): Promise<string> => {
  let token: string;
  let tokenExists: boolean;

  do {
    token = Math.floor(100000 + Math.random() * 900000).toString();
    const userWithToken = await prisma.user.findFirst({
      where: { reset_token: token },
    });
    tokenExists = !!userWithToken;
  } while (tokenExists);

  return token;
};
