import { AlwaysBlock, ViewtimeCooldownLimit, WindowCooldownLimit, deserializeLimit, serializeLimit } from "@bouncer/limit";
import { describe, expect, test } from "@jest/globals";


describe("limit ser/de", () => {
  test.each([
    { name: "AlwaysBlock", limit: new AlwaysBlock() },
    { name: "ViewtimeCooldownLimit", limit: new ViewtimeCooldownLimit(1000, 1000) },
    { name: "WindowCooldownLimit", limit: new WindowCooldownLimit(1000, 1000) },
  ])("ser/de $name does not mutate", ({name, limit}) => {
    const expected = limit.toObject();
    const deserialized = deserializeLimit(expected);
    const actual = serializeLimit(deserialized);
    expect(actual).toStrictEqual(expected);
  })
})
