import { IPage } from "./page";


/**
 * Represents a suggested action to take on a page.
 */
export type LimitAction = 
{ action: "NONE" | "UNBLOCK" } | 
{
  action: "BLOCK",
  duration: number,
}


/**
 * Represents a suggested limit on browsing activity.
 */
export interface ILimit {
  /**
   * Type discriminator indicating the type of limit.
   */
  type: LimitType;

  /**
   * Recommend an action to take on a page at the given time.
   * 
   * @param time time to apply the limit at
   * @param page the page to apply the rule to
   * @returns the recommended action to take on the page
   */
  action(time: Date, page: IPage): LimitAction;


  /**
   * Get the amount of viewtime remaining until the next suggested 
   * viewtime-based block. Should return `Infinity` if the limit does not
   * recommend blocks based on viewtime.
   * 
   * @param page page to be blocked
   * @returns amount of viewtime until the page should be blocked
   */
  remainingViewtime(page: IPage): number;


  /**
   * Convert limit to an object representation. The representation must
   * include a field "type" that indicates the type of limit represented.
   * 
   * @returns object representing limit
   */
  toObject(): any;
}


/**
 * Deserialize a limit from an object.
 * 
 * @param data object data representing limit
 * @returns deserialized limit
 */
export function deserializeLimit(data: any): ILimit {
  switch (data.type as LimitType) {
    case "AlwaysBlock":
      return AlwaysBlock.fromObject(data);
    default:
      throw new Error(`invalid limit type ${data.type} cannot be deserialized`);
  }
}


/**
 * Serialize a limit to an object representation.
 * 
 * @param limit the limit to serialize
 * @returns serialized limit object
 */
export function serializeLimit(limit: ILimit): any {
  return limit.toObject();
}


/**
 * Discriminator type for each kind of limit.
 */
type LimitType =
  "AlwaysBlock";


/**
 * Represents a limit that always recommends blocking no matter what.
 */
export class AlwaysBlock implements ILimit {
  readonly type: LimitType = "AlwaysBlock";

  constructor() { }


  /**
   * Convert an object to this type of limit.
   * 
   * @param data object data representing limit
   * @returns limit
   */
  static fromObject(data: any): AlwaysBlock {
    throw new Error("Method not implemented.");
  }


  action(time: Date, page: IPage): LimitAction {
    return {
      action: "BLOCK",
      duration: Infinity
    };
  }

  
  remainingViewtime(page: IPage): number {
    return Infinity;
  }
  

  toObject(): any {
    throw new Error("Method not implemented.");
  }
}
