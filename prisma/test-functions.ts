import { evaluateCurrentDisciplineBadge } from '../src/helpers/badges-helpers/badges-evaluator-discipline-current';
import { evaluateDistanceBadge } from '../src/helpers/badges-helpers/badges-evaluator-distance';
import { evaluateCurrentDistanceBadge } from '../src/helpers/badges-helpers/badges-evaluator-distance-current';
import { evaluateCurrentMissionBadge } from '../src/helpers/badges-helpers/badges-evaluator-missions-current';
import { evaluateCurrentRankingBadge } from '../src/helpers/badges-helpers/badges-evaluator-ranking-current';
import { evaluateCurrentTimeBadge } from '../src/helpers/badges-helpers/badges-evaluator-time-current';
import prisma from '../src/helpers/prisma-client';

const testEvaluateDistanceBadge = async () => {
  const user = await prisma.user.findFirst({
    where: { id: '659df9aa5dcfb2ca3084cce3' },
  });

  const badge = await prisma.badge.findFirst({
    where: { id: '6642aad71033e9cefb14f5e1' },
  });

  console.log(badge, '-----------');
  const mission = await prisma.mission.findFirst({
    where: { id: '65de88cf556bf2719602dfdb' },
  });

  console.log(user?.email);

  // const result = await evaluateCurrentTimeBadge(user!, badge!);
  // await evaluateDistanceBadge(user!, badge!);
  // const result = await evaluateCurrentRankingBadge(user!);
  const result = await evaluateCurrentMissionBadge(user!, mission!);
  // await evaluateMissionBadge(user!, mission!);
  // const result = await evaluateCurrentMissionBadge(user!);

  console.log(result);
};

testEvaluateDistanceBadge();

//Should run: npx ts-node prisma/test-functions.ts
