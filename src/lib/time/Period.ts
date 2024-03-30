import { MS } from "./constants";
import type { IPeriod, PeriodType } from "./types";

export function Period(type: PeriodType) {
  switch (type) {
    case "week": return WeekPeriod;
    case "day": return DayPeriod;
    case "hour": return HourPeriod;
    case "minute": return MinutePeriod;
  }
};

const WeekPeriod: IPeriod = {
  type: "week",
  ms: MS.WEEK,
  start: (time: Date) => {
    const adjust = new Date(time.getTime());
    const dayDiff = time.getDate() - time.getDay();
    adjust.setDate(dayDiff);
    adjust.setHours(0, 0, 0, 0);
    return adjust;
  }
}

const DayPeriod: IPeriod = {
  type: "day",
  ms: MS.DAY,
  start: (time: Date) => {
    const adjust = new Date(time.getTime());
    adjust.setHours(0, 0, 0, 0);
    return adjust;
  }
}

const HourPeriod: IPeriod = {
  type: "hour",
  ms: MS.HOUR,
  start: (time: Date) => {
    const adjust = new Date(time.getTime());
    adjust.setMinutes(0, 0, 0);
    return adjust;
  }
}

const MinutePeriod:IPeriod = {
  type: "minute",
  ms: MS.MINUTE,
  start: (time: Date) => {
    const adjust = new Date(time.getTime());
    adjust.setSeconds(0, 0);
    return adjust;
  }
}
