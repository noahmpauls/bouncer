import { assert } from "@bouncer/utils";
import type { FrameType, IMatcher } from "./types";

/**
 * Matches all frames of a particular type.
 */
export class FrameTypeMatcher implements IMatcher {
  
  /**
   * @param type type of frame to match
   */
  constructor(
    private readonly type: FrameType
  ) { }

  /**
   * Convert an object to this type of matcher.
   * 
   * @param obj object data representing matcher
   * @returns matcher
   */
  static fromObject(obj: LevelMatcherData): FrameTypeMatcher {
    assert(obj.type === "FrameType", `cannot make FrameType from data with type ${obj.type}`);
    return new FrameTypeMatcher(obj.data.type);
  }

  matches(url: URL, type: FrameType): boolean {
    return this.type === type;
  }
  
  toObject(): LevelMatcherData {
    return {
      type: "FrameType",
      data: {
        type: this.type,
      }
    }
  }
}

export type LevelMatcherData = {
  type: "FrameType",
  data: {
    type: FrameType,
  }
}