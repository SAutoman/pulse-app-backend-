import { DateTime } from 'luxon';

//Receives the Year and Week and returns the initial and end dates
const convertYearWeekToDates = (
  year: number,
  week: number,
  userTimezone: string
) => {
  var initialDate: string;
  var endDate: string;

  if (year === 1999 || week === 99 || week > 53) {
    initialDate = DateTime.fromMillis(0, { zone: 'UTC' }).toISO()!;
    endDate = DateTime.fromISO('3000-12-12T23:59Z').toISO()!;
  } else {
    const startOfWeek = DateTime.fromObject(
      {
        weekYear: year as number,
        weekNumber: week as number,
        weekday: 1,
      },
      { zone: userTimezone }
    );
    initialDate = startOfWeek.toISO()!;
    endDate = startOfWeek.endOf('week').toISO()!;
  }

  return { initialDate, endDate };
};

// Helper function to convert year and week to the start and end epoch milliseconds
const convertYearWeekToEpochRange = (
  year: number,
  week: number,
  timezone: string
): { startEpoch: number; endEpoch: number } => {
  // Calculate the first day of the week (Monday) for the given year and week
  const startDate = DateTime.fromObject(
    { weekYear: year, weekNumber: week, weekday: 1 },
    { zone: timezone }
  );
  // Calculate the last day of the week (Sunday) for the given year and week
  const endDate = startDate.plus({ days: 6, hours: 24 });

  console.log(
    `Start Date: ${startDate.toISO()}, Start Epoch: ${startDate.toMillis()}`
  );
  console.log(`End Date: ${endDate.toISO()}, End Epoch: ${endDate.toMillis()}`);

  return {
    startEpoch: startDate.toMillis(),
    endEpoch: endDate.toMillis(),
  };
};

// Helper function to get the start and end of the selected period
const getPeriodRange = (period: string) => {
  const now = DateTime.local();

  switch (period) {
    case 'week':
      return { start: now.startOf('week'), end: now.endOf('week') };
    case 'month':
      return { start: now.startOf('month'), end: now.endOf('month') };
    case 'quarter':
      return { start: now.startOf('quarter'), end: now.endOf('quarter') };
    case 'half':
      const isFirstHalf = now.month <= 6;
      const start = isFirstHalf
        ? DateTime.local(now.year, 1, 1)
        : DateTime.local(now.year, 7, 1);
      const end = isFirstHalf
        ? DateTime.local(now.year, 6, 30, 23, 59, 59)
        : DateTime.local(now.year, 12, 31, 23, 59, 59);
      return { start, end };
    case 'year':
      return { start: now.startOf('year'), end: now.endOf('year') };
    case 'previousWeek':
      const startOfPrevWeek = now.minus({ week: 1 }).startOf('week');
      const endOfPrevWeek = startOfPrevWeek.endOf('week');
      return { start: startOfPrevWeek, end: endOfPrevWeek };
    case 'previousMonth':
      const startOfPrevMonth = now.minus({ month: 1 }).startOf('month');
      const endOfPrevMonth = startOfPrevMonth.endOf('month');
      return { start: startOfPrevMonth, end: endOfPrevMonth };
    default:
      throw new Error('Invalid period');
  }
};

///Export
export { convertYearWeekToDates, convertYearWeekToEpochRange, getPeriodRange };
