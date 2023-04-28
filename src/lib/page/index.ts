import { BasicPage } from "./BasicPage";
import type { PageData, IPage } from "./types";


/**
 * Deserialize a page from an object.
 * 
 * @param obj object data representing page
 * @returns deserialized page
 */
export function deserializePage(obj: PageData): IPage {
  switch (obj.type) {
    case "BasicPage":
      return BasicPage.fromObject(obj);
    default:
      throw new Error(`invalid policy type ${obj.type} cannot be deserialized`)
  }
}


/**
 * Serialize a page to an object representation.
 * 
 * @param page the page to serialize
 * @returns serialized page object
 */
export function serializePage(page: IPage): PageData {
  return page.toObject();
}

export * from "./enums";
export * from "./types";
export { BasicPage } from "./BasicPage";
