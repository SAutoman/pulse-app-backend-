import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';
import { getPeriodRange } from '../helpers/dates-helper';

// C - Create a Club (ADMIN Only)
const createClub = async (req: Request, res: Response, next: NextFunction) => {
  const {
    name,
    image_url,
    banner_url,
    sport_type_id = '6625bdbfba5a2e6c4f223745', //Default
  } = req.body; // Add more fields as necessary

  try {
    const club = await prisma.club.create({
      data: {
        name,
        image_url,
        banner_url,
        sport_type_id,
      },
      include: { sport_type: true },
    });
    res.status(201).json({ club });
  } catch (error) {
    next(error);
  }
};

// R - Read all clubs
const getAllClubs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clubs = await prisma.club.findMany({ include: { sport_type: true } });
    return res.status(200).json({ clubs });
  } catch (error) {
    next(error);
  }
};

// R - Read a Single Club by ID
const getClubById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        sport_type: true,
      },
    });

    if (club) {
      res.status(200).json({ club });
    } else {
      res.status(404).json({ msg: 'Club not found' });
    }
  } catch (error) {
    next(error);
  }
};

//R - Get Club Details
// R - Get Club Details
const getClubDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const clubWithMembers = await prisma.club.findUnique({
      where: { id },
      include: {
        sport_type: true,
        user_clubs: {
          include: {
            user: {
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
            }, // This includes the user data in the response
          },
        },
      },
    });

    if (clubWithMembers) {
      // Transform the structure to match your expected format, if necessary
      const members = clubWithMembers.user_clubs.map((uc) => uc.user);
      return res.status(200).json({ club: clubWithMembers, members });
    } else {
      return res.status(404).json({ msg: 'Club not found' });
    }
  } catch (error) {
    next(error);
  }
};

// U - Update a Club
const updateClub = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, image_url } = req.body;

  try {
    const club = await prisma.club.update({
      where: { id },
      data: {
        name,
        image_url,
      },
      include: {
        sport_type: true,
      },
    });

    res.status(200).json({ club });
  } catch (error) {
    next(error);
  }
};

//D - Delete a Club
const deleteClub = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const deletedClub = await prisma.club.delete({
      where: { id },
    });

    res.status(200).json({ deletedClub }); // No content to send back
  } catch (error) {
    next(error);
  }
};

// R - Get Club Members Points by Period
// New endpoint to get club members and their points based on the selected period
const getClubMembersPointsByPeriod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: clubId } = req.params;
  const { period } = req.query;

  try {
    const { start, end } = getPeriodRange(period as string);

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        sport_type: true,
      },
    });

    if (!club) {
      return res.status(404).json({ msg: 'Club not found' });
    }

    console.log(start.toISO());
    console.log(end.toISO());

    const members = await prisma.userClub.findMany({
      where: { club_id: clubId },
      include: {
        user: {
          include: {
            sport_type: true,
            activities: {
              where: {
                start_date_epoch_ms: {
                  gte: start.toMillis().toString(),
                  lte: end.toMillis().toString(),
                },
                is_valid: true,
              },
            },
            current_league: {
              include: { category: true },
            },
            user_badges: {
              include: { badge: true },
            },
          },
        },
      },
    });

    const membersPoints = members.map((member) => {
      const totalPoints = member.user.activities.reduce(
        (acc, activity) => acc + activity.calculated_points,
        0
      );
      return {
        user: member.user,
        totalPoints,
      };
    });

    res
      .status(200)
      .json({
        club,
        members: membersPoints,
        startDate: start.toISODate(),
        endDate: end.toISODate(),
      });
  } catch (error) {
    next(error);
  }
};
//Exports
export {
  createClub,
  getAllClubs,
  getClubById,
  updateClub,
  deleteClub,
  getClubDetails,
  getClubMembersPointsByPeriod,
};
