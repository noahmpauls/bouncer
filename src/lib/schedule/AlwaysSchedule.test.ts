import { describe, expect, test } from "@jest/globals";
import { AlwaysSchedule } from "@bouncer/schedule";


describe("AlwaysSchedule contains", () => {

  // TODO: switch this to property-based testing
  test.each([
    { date: new Date(0, 0, 1), contains: true },
    { date: new Date(2023, 0, 15), contains: true },
    { date: new Date(3545, 7, 11), contains: true },
  ])("always contains date", ({date, contains}) => {
    const schedule = new AlwaysSchedule();
    const actual = schedule.contains(date);
    expect(actual).toBe(contains);
  });
});


describe("AlwaysSchedule from/toObject", () => {
  test("from/toObject does not mutate", () => {
    const expected = new AlwaysSchedule().toObject();
    const actual = AlwaysSchedule.fromObject(expected).toObject();
    expect(actual).toStrictEqual(actual);
  });
});