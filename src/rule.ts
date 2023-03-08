import { assert } from "./assert";
import { deserializeLimit, ILimit, serializeLimit } from "./limit";
import { IPage, PageAccess } from "./page";
import { deserializeSchedule, ISchedule, serializeSchedule } from "./schedule";


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
   * @param time the current time
   * @param page page to be blocked
   * @returns amount of viewtime until the page is blocked
   */
  remainingViewtime(time: Date, page: IPage): number;

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

  private readonly schedule: ISchedule;
  private readonly limit: ILimit;

  /**
   * @param schedule the schedule during which the limit applies
   * @param limit the limit to apply
   */
  constructor(schedule: ISchedule, limit: ILimit) {
    this.schedule = schedule;
    this.limit = limit;
  }

  /**
   * Convert an object to this type of rule.
   * 
   * @param data object data representing rule
   * @returns rule
   */
  static fromObject(data: any): ScheduledLimit {
    assert(data.type === "ScheduleLimit", `cannot make ScheduleLimit from data with type ${data.type}`);
    return new ScheduledLimit(
      deserializeSchedule(data.schedule),
      deserializeLimit(data.limit)
    );
  }

  applyTo(time: Date, page: IPage): void {
    if (this.schedule.contains(time)) {
      const pageAccess = page.checkAccess(time);
      const action = this.limit.action(time, page);
      if (action.action === "BLOCK" && pageAccess === PageAccess.ALLOWED) {
        page.block(time);
      } else if (action.action === "UNBLOCK" && pageAccess === PageAccess.BLOCKED) {
        page.unblock(time);
      }
    } else if (page.checkAccess(time) === PageAccess.BLOCKED) {
      page.unblock(time);
    }
  }
  
  remainingViewtime(time: Date, page: IPage): number {
    return this.limit.remainingViewtime(time, page);
  }
  
  toObject(): any {
    return {
      type: this.type,
      schedule: serializeSchedule(this.schedule),
      limit: serializeLimit(this.limit)
    };
  }
}

