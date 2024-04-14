import type { BrowseLocation } from "@bouncer/events";
import { assert } from "@bouncer/utils";
import { deserializeMatcher, serializeMatcher } from ".";
import type { FrameType, IMatcher, MatcherData } from "./types";

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

  matches(location: BrowseLocation): boolean {
    return this.matchers.some(m => m.matches(location));
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

  matches(location: BrowseLocation) {
    return this.matchers.every(m => m.matches(location));
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

  matches(location: BrowseLocation): boolean {
    return !this.matcher.matches(location);
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