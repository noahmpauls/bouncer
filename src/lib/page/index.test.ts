import { BasicPage, type IPage, deserializePage, serializePage } from "@bouncer/page";
import { describe, expect, test } from "@jest/globals";


describe("page ser/de", () => {
  test.each<{ name: string, page: IPage}>([
    { name: "BasicPage", page: new BasicPage() },
  ])("ser/de $name does not mutate", ({name, page}) => {
    const expected = page.toObject();
    const deserialized = deserializePage(expected);
    const actual = serializePage(deserialized);
    expect(actual).toStrictEqual(expected);
  })
})

