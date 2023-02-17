// Note: nothing about this is useful or good, and trying to deal with all this
// crap makes me hate web development with a burning passion.

declare global {
  var chrome: any;
}
globalThis.chrome = { runtime: { id: "jest-test" } };

import { describe, expect, test, jest, afterEach } from "@jest/globals";
import { getStorage } from "../src/storage";

jest.mock("webextension-polyfill", () => ({
  storage: {
    local: {
      get: jest.fn(async () => Promise.resolve({ test: [] }))
    }
  }
}));

describe("storage wrappers", () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  })
  
  test("getStorage", async () => {
    expect(await getStorage("test", [])).toEqual([]);
  });

});
