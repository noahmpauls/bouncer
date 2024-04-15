import { describe, test, expect } from "@jest/globals";
import { DomainMatcher } from "./DomainMatcher";
import { FrameContext, type BrowseLocation, PageOwner } from "@bouncer/events";

const location = (url: string): BrowseLocation => ({
  url: new URL(`https://${url}`),
  context: FrameContext.ROOT,
  owner: PageOwner.WEB,
});

describe("DomainMatcher", () => {
  test("exact match 1", () => {
    const matcher = new DomainMatcher("np.com", { include: [] });
    const test = location("np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })
  
  test("exact match 2", () => {
    const matcher = new DomainMatcher("np.com", { include: [] });
    const test = location("rp.com");
    const expected = false;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("exact match 3", () => {
    const matcher = new DomainMatcher("np.com", { include: [] });
    const test = location("www.np.com");
    const expected = false;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("exact match 4", () => {
    const matcher = new DomainMatcher("www.np.com", { include: [] });
    const test = location("np.com");
    const expected = false;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("exact match 5", () => {
    const matcher = new DomainMatcher("www.np.com", { include: [] });
    const test = location("ww.np.com");
    const expected = false;

    expect(matcher.matches(test)).toEqual(expected);
  })


  test("all subdomains 1", () => {
    const matcher = new DomainMatcher("np.com", { exclude: [] });
    const test = location("np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("all subdomains 2", () => {
    const matcher = new DomainMatcher("np.com", { exclude: [] });
    const test = location("www.np.com");
    const expected = true;
    expect(matcher.matches(test)).toEqual(expected);
  })

  test("all subdomains 3", () => {
    const matcher = new DomainMatcher("www.np.com", { exclude: [] });
    const test = location("np.com");
    const expected = false;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("all subdomains 4", () => {
    const matcher = new DomainMatcher("np.com", { exclude: [] });
    const test = location("test.blog.web.np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })


  test("include subdomains 1", () => {
    const matcher = new DomainMatcher("np.com", { include: ["www"] });
    const test = location("np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("include subdomains 2", () => {
    const matcher = new DomainMatcher("np.com", { include: ["www"] });
    const test = location("www.np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("include subdomains 3", () => {
    const matcher = new DomainMatcher("np.com", { include: ["www"] });
    const test = location("test.www.np.com");
    const expected = false;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("include subdomains 4", () => {
    const matcher = new DomainMatcher("np.com", { include: ["www", "aaa", "qqq"] });
    const test = location("qqq.np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("include subdomains 5", () => {
    const matcher = new DomainMatcher("np.com", { include: ["aaa.bbb.ccc"] });
    const test = location("aaa.bbb.ccc.np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })


  test("exclude subdomains 1", () => {
    const matcher = new DomainMatcher("np.com", { exclude: ["www"] });
    const test = location("np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("exclude subdomains 2", () => {
    const matcher = new DomainMatcher("np.com", { exclude: ["www"] });
    const test = location("www.np.com");
    const expected = false;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("exclude subdomains 3", () => {
    const matcher = new DomainMatcher("np.com", { exclude: ["www"] });
    const test = location("test.www.np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("exclude subdomains 4", () => {
    const matcher = new DomainMatcher("np.com", { exclude: ["www", "aaa", "qqq"] });
    const test = location("qqq.np.com");
    const expected = false;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("exclude subdomains 5", () => {
    const matcher = new DomainMatcher("np.com", { exclude: ["www", "aaa", "qqq"] });
    const test = location("aa.np.com");
    const expected = true;

    expect(matcher.matches(test)).toEqual(expected);
  })

  test("exclude subdomains 6", () => {
    const matcher = new DomainMatcher("np.com", { exclude: ["aaa.bbb.ccc"] });
    const test = location("aaa.bbb.ccc.np.com");
    const expected = false;

    expect(matcher.matches(test)).toEqual(expected);
  })
})