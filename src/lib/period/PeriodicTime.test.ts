import { describe, expect, test } from "@jest/globals";
import { PeriodicTime } from "./PeriodicTime";
import { MS } from "@bouncer/time";

describe("PeriodicTime parsing", () => {
  test("minute time", () => {
    const time = PeriodicTime.fromString("37");

    expect(time.period).toEqual("minute");
    expect(time.offset()).toEqual(MS.SECOND * 37);
  })

  test("hour time", () => {
    const time = PeriodicTime.fromString("10:00");

    expect(time.period).toEqual("hour");
    expect(time.offset()).toEqual(MS.MINUTE * 10);
  })

  test("day time", () => {
    const time = PeriodicTime.fromString("20:10:00");

    expect(time.period).toEqual("day");
    expect(time.offset()).toEqual((MS.HOUR * 20) + (MS.MINUTE * 10));
  })
})