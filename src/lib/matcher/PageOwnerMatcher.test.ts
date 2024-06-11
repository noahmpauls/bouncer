import { describe, expect, test } from "@jest/globals";
import { PageOwnerMatcher, type PageOwnerMatcherData } from "./PageOwnerMatcher";

describe("PageOwnerMatcher", () => {
  test("fromObject rejects invalid", () => {
    const obj = {
      "type": "PageOwner",
      "data": {
        "owner": "WEB",
      }
    } as PageOwnerMatcherData;

    expect(() => {
      const matcher = PageOwnerMatcher.fromObject(obj);
    }).toThrow();
  })
})