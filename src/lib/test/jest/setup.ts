import type { Browser } from "webextension-polyfill";

globalThis.chrome = { runtime: { id: "jest-test" } } as Browser;
