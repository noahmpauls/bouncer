import { describe, expect, test } from "@jest/globals";
import { QueryParamsMatcher } from "./QueryParamsMatcher";
import { FrameContext, PageOwner, type BrowseLocation } from "@bouncer/events";

const makeLocation = (url: string): BrowseLocation => ({
  url: new URL(`https://${url}`),
  context: FrameContext.ROOT,
  owner: PageOwner.WEB,
});

describe("QueryParamsMatcher", () => {
  test("google search", () => {
    const matcher = new QueryParamsMatcher({ q: ["news"]});
    const location = makeLocation("www.google.com?q=news");
    const expected = true;

    expect(matcher.matches(location)).toEqual(expected);
  })
})