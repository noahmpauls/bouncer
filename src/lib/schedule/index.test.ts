import { AlwaysSchedule, deserializeSchedule, serializeSchedule } from "@bouncer/schedule";
import { describe, expect, test } from "@jest/globals";


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