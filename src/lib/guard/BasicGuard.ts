import { type IPage, type PageData, deserializePage, serializePage } from "@bouncer/page";
import { type IPolicy, type PolicyData, deserializePolicy, serializePolicy } from "@bouncer/policy";
import { assert } from "@bouncer/utils";
import type { IGuard } from "./types";

export class BasicGuard implements IGuard {
  readonly id: string;
  readonly policy: IPolicy;
  readonly page: IPage;

  constructor(
    id: string,
    policy: IPolicy,
    page: IPage,
  ) {
    this.id = id;
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
      deserializePolicy(obj.data.policy),
      deserializePage(obj.data.page)
    );
  }

  toObject(): BasicGuardData {
    return {
      type: "BasicGuard",
      data: {
        id: this.id,
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
    policy: PolicyData
    page: PageData,
  }
}
