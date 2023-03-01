// Note: nothing about this is useful or good, and trying to deal with all this
// crap makes me hate web development with a burning passion.

import { describe, expect, test, jest, afterEach } from "@jest/globals";
import { IStorage } from "../src/storage";
import { BrowserStorage } from "../src/browserStorage";

jest.mock("webextension-polyfill", () => ({
  storage: {
    local: {
      get: jest.fn(async () => Promise.resolve({ test: [] }))
    }
  }
}));

describe("example test using mock of browser polyfill", () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  })
  
  test("get", async () => {
    const storage: IStorage = new BrowserStorage();
    expect(await storage.get("test", [])).toEqual([]);
  });
});
