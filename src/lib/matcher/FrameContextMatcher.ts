import type { BrowseLocation, FrameContext } from "@bouncer/events";
import { assert } from "@bouncer/utils";
import type { IMatcher } from "./types";

/**
 * Matches all frames of a particular type.
 */
export class FrameContextMatcher implements IMatcher {
  
  /**
   * @param type type of frame to match
   */
  constructor(
    private readonly type: FrameContext
  ) { }

  /**
   * Convert an object to this type of matcher.
   * 
   * @param obj object data representing matcher
   * @returns matcher
   */
  static fromObject(obj: FrameContextMatcherData): FrameContextMatcher {
    assert(obj.type === "FrameContext", `cannot make FrameContext from data with type ${obj.type}`);
    return new FrameContextMatcher(obj.data.type);
  }

  matches(location: BrowseLocation): boolean {
    return this.type === location.context;
  }
  
  toObject(): FrameContextMatcherData {
    return {
      type: "FrameContext",
      data: {
        type: this.type,
      }
    }
  }
}

export type FrameContextMatcherData = {
  type: "FrameContext",
  data: {
    type: FrameContext,
  }
}