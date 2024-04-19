import { type BrowseLocation, FrameContext, PageOwner } from "@bouncer/events";
import { describe, expect, test } from "@jest/globals";
import { PathPrefixMatcher } from "./PathPrefixMatcher";

const makeLocation = (path: string): BrowseLocation => ({
  url: new URL(`https://example.com${path}`),
  context: FrameContext.ROOT,
  owner: PageOwner.WEB,
});

describe("PathPrefixMatcher", () => {
  test("good exact match no trailing slash", () => {
    const matcher = new PathPrefixMatcher("/a", false);
    const location = makeLocation("/a");
    const expected = true;

    expect(matcher.matches(location)).toEqual(expected);
  })

  test("good exact match trailing slash", () => {
    const matcher = new PathPrefixMatcher("/a/b", false);
    const location = makeLocation("/a/b/");
    const expected = true;

    expect(matcher.matches(location)).toEqual(expected);
  })

  test("bad exact match wrong prefix", () => {
    const matcher = new PathPrefixMatcher("/a/b", false);
    const location = makeLocation("/a/c/");
    const expected = false;

    expect(matcher.matches(location)).toEqual(expected);
  })

  test("bad exact match prefix continued", () => {
    const matcher = new PathPrefixMatcher("/abc", false);
    const location = makeLocation("/abcd");
    const expected = false;

    expect(matcher.matches(location)).toEqual(expected);
  })

  test("bad exact match subpath present", () => {
    const matcher = new PathPrefixMatcher("/abc", false);
    const location = makeLocation("/abc/d");
    const expected = false;

    expect(matcher.matches(location)).toEqual(expected);
  })

  test("good subpath match exact match", () => {
    const matcher = new PathPrefixMatcher("/a/b", true);
    const location = makeLocation("/a/b");
    const expected = true;

    expect(matcher.matches(location)).toEqual(expected);
  })

  test("good subpath match trailing slash", () => {
    const matcher = new PathPrefixMatcher("/a/b/c/d/e", true);
    const location = makeLocation("/a/b/c/d/e/");
    const expected = true;

    expect(matcher.matches(location)).toEqual(expected);
  })

  test("good subpath match subpath present", () => {
    const matcher = new PathPrefixMatcher("/a", true);
    const location = makeLocation("/a/b/c/d/e/");
    const expected = true;

    expect(matcher.matches(location)).toEqual(expected);
  })

  test("bad subpath match bad prefix", () => {
    const matcher = new PathPrefixMatcher("/a", true);
    const location = makeLocation("/b/c/d/e/");
    const expected = false;

    expect(matcher.matches(location)).toEqual(expected);
  })

  test("bad subpath match prefix continued", () => {
    const matcher = new PathPrefixMatcher("/abc", true);
    const location = makeLocation("/abcd");
    const expected = false;

    expect(matcher.matches(location)).toEqual(expected);

  })
})