import prisma from './prisma-client';

const userEmailExists = async (email: string) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (existingUser) {
    throw new Error(`The email ${email} already exists in the Database.`);
  }

  return true;
};

//Exports
export { userEmailExists };
