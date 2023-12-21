import { serializePolicy, type IPolicy, type PolicyData, deserializePolicy } from "@bouncer/policy";
import type { IGuard } from "./types";
import { serializePage, type IPage, type PageData, deserializePage } from "@bouncer/page";
import { assert } from "@bouncer/utils";

export class BasicGuard implements IGuard {
  readonly id: string;
  active: boolean;
  readonly policy: IPolicy;
  readonly page: IPage;

  constructor(
    id: string,
    active: boolean,
    policy: IPolicy,
    page: IPage,
  ) {
    this.id = id;
    this.active = active;
    this.policy = policy;
    this.page = page;
  }

  /**
   * Convert an object to this kind of guard.
   * 
   * @param obj object data representing the guard
   * @returns policy
   */
  static fromObject(obj: BasicGuardData): BasicGuard {
    assert(obj.type === "BasicGuard", `cannot make BasicGuard from data with type ${obj.type}`);
    return new BasicGuard(
      obj.data.id,
      obj.data.active,
      deserializePolicy(obj.data.policy),
      deserializePage(obj.data.page)
    );
  }

  toObject(): BasicGuardData {
    return {
      type: "BasicGuard",
      data: {
        id: this.id,
        active: this.active,
        policy: serializePolicy(this.policy),
        page: serializePage(this.page),
      }
    }
  }
}

export type BasicGuardData = {
  type: "BasicGuard",
  data: {
    id: string,
    active: boolean,
    policy: PolicyData
    page: PageData,
  }
}
