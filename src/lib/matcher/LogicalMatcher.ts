import { assert } from "@bouncer/utils";
import type { FrameType, IMatcher, MatcherData } from "./types";
import { deserializeMatcher, serializeMatcher } from ".";

export class OrMatcher implements IMatcher {

  constructor(
    private readonly matchers: IMatcher[],
  ) { }

  static fromObject(obj: OrMatcherData): OrMatcher {
    assert(obj.type === "Or", `cannot make Or from data with type ${obj.type}`);
    return new OrMatcher(
      obj.data.map(deserializeMatcher),
    )
  }

  matches(url: URL, type: FrameType): boolean {
    return this.matchers.some(m => m.matches(url, type));
  }

  toObject(): OrMatcherData {
    return {
      type: "Or",
      data: this.matchers.map(serializeMatcher)
    }
  }
}

export type OrMatcherData = {
  type: "Or",
  data: MatcherData[],
}


export class AndMatcher implements IMatcher {

  constructor(
    private readonly matchers: IMatcher[],
  ) { }

  static fromObject(obj: AndMatcherData): AndMatcher {
    assert(obj.type === "And", `cannot make And from data with type ${obj.type}`);
    return new AndMatcher(
      obj.data.map(deserializeMatcher),
    )
  }

  matches(url: URL, type: FrameType) {
    return this.matchers.every(m => m.matches(url, type));
  }

  toObject(): AndMatcherData {
    return {
      type: "And",
      data: this.matchers.map(serializeMatcher)
    }
  }
}

export type AndMatcherData = {
  type: "And",
  data: MatcherData[],
}


export class NotMatcher implements IMatcher {

  constructor(
    private readonly matcher: IMatcher,
  ) { }

  static fromObject(obj: NotMatcherData): NotMatcher {
    assert(obj.type === "Not", `cannot make Not from data with type ${obj.type}`);
    return new NotMatcher(
      deserializeMatcher(obj.data),
    )
  }

  matches(url: URL, type: FrameType): boolean {
    return !this.matcher.matches(url, type);
  }

  toObject(): NotMatcherData {
    return {
      type: "Not",
      data: serializeMatcher(this.matcher),
    }
  }
}

export type NotMatcherData = {
  type: "Not",
  data: MatcherData,
}