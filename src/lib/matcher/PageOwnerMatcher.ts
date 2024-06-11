import { parsePageOwner, type BrowseLocation, type PageOwner } from "@bouncer/events";
import { assert } from "@bouncer/utils";
import type { IMatcher } from ".";

/**
 * Matches all locations with a particular owner.
 */
export class PageOwnerMatcher implements IMatcher {
  /**
   * @param owner required page owner
   */
  constructor(
    private readonly owner: PageOwner,
  ) { }

  /**
   * Convert an object to this type of matcher.
   * 
   * @param obj object data representing matcher
   * @returns matcher
   */
  static fromObject(obj: PageOwnerMatcherData): PageOwnerMatcher {
    assert(obj.type === "PageOwner", `cannot make PageOwner from data with type ${obj.type}`);
    return new PageOwnerMatcher(parsePageOwner(obj.data.owner));
  }

  matches = (location: BrowseLocation): boolean => {
    return location.owner === this.owner;
  }

  toObject = (): PageOwnerMatcherData => {
    return {
      type: "PageOwner",
      data: {
        owner: this.owner,
      }
    }
  }
}

export type PageOwnerMatcherData = {
  type: "PageOwner",
  data: {
    owner: string,
  },
}