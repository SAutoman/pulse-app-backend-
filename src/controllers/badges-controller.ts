import { NextFunction, Request, Response } from 'express';
import prisma from '../helpers/prisma-client';
import { evaluateCurrentDisciplineBadge } from '../../src/helpers/badges-helpers/badges-evaluator-discipline-current';
import { evaluateCurrentDistanceBadge } from '../../src/helpers/badges-helpers/badges-evaluator-distance-current';
import { evaluateCurrentMissionBadge } from '../../src/helpers/badges-helpers/badges-evaluator-missions-current';
import { evaluateCurrentRankingBadge } from '../../src/helpers/badges-helpers/badges-evaluator-ranking-current';
import { evaluateCurrentTimeBadge } from '../../src/helpers/badges-helpers/badges-evaluator-time-current';
// Create a Badge
export const createBadge = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    description,
    image_url,
    criteria,
    type,
    level,
    expires_at,
    visibility,
    points_value,
    tags,
    prerequisites,
    sport_types,
    available_from,
    available_until,
  } = req.body;
  try {
    const badge = await prisma.badge.create({
      data: {
        name,
        description,
        image_url,
        criteria: JSON.parse(criteria),
        type,
        level,
        expires_at,
        visibility,
        points_value,
        tags,
        created_at_epoch_ms: new Date().getTime().toString(),
        updated_at_epoch_ms: new Date().getTime().toString(),
        prerequisites: prerequisites, // assuming array of string IDs
        sport_types,
        available_from,
        available_until,
      },
    });
    res.status(201).json({ badge });
  } catch (error) {
    next(error);
  }
};

// Read all Badges
export const getAllBadges = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const badges = await prisma.badge.findMany({});
    
    res.status(200).json({ badges });
  } catch (error) {
    next(error);
  }
};

// Read a single Badge by ID
export const getBadgeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const badge = await prisma.badge.findUnique({
      where: { id },
    });
    badge
      ? res.status(200).json({ badge })
      : res.status(404).json({ message: 'Badge not found' });
  } catch (error) {
    next(error);
  }
};



// Update a Badge
export const updateBadge = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const {
    name,
    description,
    image_url,
    icon_url,
    criteria,
    type,
    level,
    expires_at,
    visibility,
    points_value,
    tags,
    prerequisites,
  } = req.body;

  // Prepare the data object for update, starting with mandatory fields
  const updateData: any = {
    name,
    description,
    type,
    visibility,
    updated_at_epoch_ms: new Date().getTime().toString(),
  };

  // Optionally include fields only if they are provided
  if (image_url) updateData.image_url = image_url;
  if (icon_url) updateData.icon_url = icon_url;
  if (level) updateData.level = level;
  if (expires_at) updateData.expires_at = expires_at;
  if (points_value) updateData.points_value = points_value;
  if (tags) updateData.tags = tags;
  if (prerequisites) updateData.prerequisites = prerequisites;

  // Handle the 'criteria' JSON parsing
  if (criteria) {
    try {
      updateData.criteria = JSON.parse(criteria);
    } catch (error) {
      console.error('Error parsing criteria JSON:', error);
      return res
        .status(400)
        .json({ message: "Invalid JSON format in 'criteria'." });
    }
  }

  try {
    const badgeFound = await prisma.badge.findFirst({ where: { id } });
    if (!badgeFound) {
      return res.status(400).json({ message: 'The badge does not exist.' });
    }
    const badge = await prisma.badge.update({
      where: { id },
      data: updateData,
    });
    res.status(200).json({ badge });
  } catch (error) {
    console.error('Failed to update badge:', error);
    next(error);
  }
};

// Delete a Badge
export const deleteBadge = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    await prisma.badge.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getBadgesByIds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { badgeIds } = req.body;
  try {
    const badges = await prisma.badge.findMany({
      where: {
        id: {
          in: badgeIds,
        },
      },
    });
    res.status(200).json(badges);
  } catch (error) {
    next(error);
  }
};

// Read badges by user ID
export const getBadgesByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { user_id: userId },
      include: {
        badge: true,
      },
    });
    if (!userBadges) {
      return res.status(404).json({ message: 'No badges found for this user' });
    }
    const badges = userBadges.map((userBadge) => userBadge.badge);
    res.status(200).json({ badges });
  } catch (error) {
    next(error);
  }
};

export const getEvaluateDisciplineBadge = async (  req: Request,res: Response,next: NextFunction) => {


  const { userId, badgeId } = req.body;
  console.log(req.body);
  try {
    const user = await prisma.user.findFirst({
      where: { id: userId },
    });
  
    const badge = await prisma.badge.findFirst({
      where: { id: badgeId },
    });
  
  
    // console.log(user?.email);
  
    console.log('11111111111111111');
    const result = await evaluateCurrentDisciplineBadge(user!, badge!);

    console.log(result);
    res.status(200).json({ result });
  } catch ( error ) {
     next(error);
  }
 
};


export const getEvaluateMissionBadge = async (  req: Request,res: Response,next: NextFunction) => {

  const { userId } = req.body;
  console.log(userId,'1111111111111111111');

  try {
    const user = await prisma.user.findFirst({
      where: { id: userId },
    });
  
    const mission = await prisma.mission.findFirst({
      where: { id: '65d25b79915fc145aa8b7ecc' },
    });
    const result = await evaluateCurrentMissionBadge(user!, mission!);
    res.status(200).json({ result });
  } catch ( error ) {
    next(error);
  }


};

export const getEvaluateRankingBadge = async (  req: Request,res: Response,next: NextFunction) => {

  const { userId } = req.body;
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  console.log(user?.email);
  const result = await evaluateCurrentRankingBadge(user!);
  res.status(200).json({ result });
};

export const getEvaluateDistanceBadge = async (  req: Request,res: Response,next: NextFunction) => {

  const { userId, badgeId } = req.body;

  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  const badge = await prisma.badge.findFirst({
    where: { id: badgeId },
  });
  const result = await evaluateCurrentDistanceBadge(user!, badge!);
  res.status(200).json({ result });
};

export const getEvaluateTimeBadge = async (  req: Request,res: Response,next: NextFunction) => {

  const { userId, badgeId } = req.body;
  console.log(userId,badgeId);
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  const badge = await prisma.badge.findFirst({
    where: { id: badgeId },
  });
  const result = await evaluateCurrentTimeBadge(user!, badge!);
  res.status(200).json({ result });
};