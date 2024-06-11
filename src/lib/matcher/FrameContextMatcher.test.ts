import { describe, expect, test } from "@jest/globals";
import { FrameContextMatcher, type FrameContextMatcherData } from "./FrameContextMatcher";

describe("FrameContextMatcher", () => {
  test("fromObject reject invalid", () => {
    const obj = {
      "type": "FrameContext",
      "data": {
        "type": "ROOT"
      }
    } as FrameContextMatcherData;

    expect(() => {
      const matcher = FrameContextMatcher.fromObject(obj);
    }).toThrow();
  })
})