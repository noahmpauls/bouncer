import { ILimit } from "./limit";
import { IPage } from "./page";
import { ISchedule } from "./schedule";


/**
 * Represents a rule that limits allowed browsing behavior for a page.
 */
export interface IRule {
  /**
   * Type discriminator indicating the type of rule;
   */
  type: RuleType;

  /**
   * Apply a rule to a page, potentially mutating the page.
   * 
   * @param time time to apply the rule at
   * @param page the page to apply the rule to
   */
  applyTo(time: Date, page: IPage): void;

  /**
   * Get the amount of viewtime remaining until the next viewtime-based block.
   * 
   * @param page page to be blocked
   * @returns amount of viewtime until the page is blocked
   */
  remainingViewtime(page: IPage): number;

  /**
   * Convert rule to an object representation. The representation must
   * include a field "type" that indicates the type of rule represented.
   * 
   * @returns object representing rule
   */
  toObject(): any;
}


/**
 * Deserialize a rule from an object.
 * 
 * @param data object data representing rule
 * @returns deserialized rule
 */
export function deserializeRule(data: any): IRule {
  switch (data.type as RuleType) {
    case "ScheduleLimit":
      return ScheduledLimit.fromObject(data);
    default:
      throw new Error(`invalid rule type ${data.type} cannot be deserialized`);
  }
}


/**
 * Serialize a rule to an object representation.
 * 
 * @param rule the rule to serialize
 * @returns serialized rule object
 */
export function serializeRule(rule: IRule): any {
  return rule.toObject();
}


/**
 * Discriminator type for each kind of rule.
 */
type RuleType =
  "ScheduleLimit";


/**
 * Represents a browsing limit that applies on a schedule.
 * 
 * A `ScheduledLimit` has two main parts:
 * - `schedule`: determines when this rule applies. The conditions of the rule
 *   only apply when the current time is within the schedule; otherwise, the
 *   rule doesn't apply.
 * - `limit`: determines how the rule applies during the schedule.
 */
export class ScheduledLimit implements IRule {
  readonly type: RuleType = "ScheduleLimit";

  /**
   * @param schedule the schedule during which the limit applies
   * @param limit the limit to apply
   */
  constructor(schedule: ISchedule, limit: ILimit) {
    throw new Error("Method not implemented.");
  }


  /**
   * Convert an object to this type of rule.
   * 
   * @param data object data representing rule
   * @returns rule
   */
  static fromObject(data: any): ScheduledLimit {
    throw new Error("Method not implemented.");
  }


  applyTo(time: Date, page: IPage): void {
    throw new Error("Method not implemented.");
  }
  

  remainingViewtime(page: IPage): number {
    throw new Error("Method not implemented.");
  }

  
  toObject(): any {
    
  }
}
