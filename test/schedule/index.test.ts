import { describe, test, expect } from "@jest/globals";
import { AlwaysSchedule, deserializeSchedule, serializeSchedule } from "@bouncer/schedule";


describe("schedule ser/de", () => {
  test.each([
    { name: "AlwaysSchedule", schedule: new AlwaysSchedule() },
  ])("ser/de $name does not mutate", ({name, schedule}) => {
    const expected = schedule.toObject();
    const deserialized = deserializeSchedule(expected);
    const actual = serializeSchedule(deserialized);
    expect(actual).toStrictEqual(expected);
  })
})