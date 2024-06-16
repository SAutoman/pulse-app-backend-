import prisma from "../src/helpers/prisma-client";

import { Parser } from 'json2csv';
import fs from 'fs';


async function exportData() {
  const data = await prisma.user.findMany();
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(data);
  fs.writeFileSync('/prisma/export-users.csv', csv);
}

exportData()
  .catch(e => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  });

  //Should run: npx ts-node prisma/export-to-csv.ts
