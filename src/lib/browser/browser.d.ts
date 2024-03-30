import type { Browser } from "webextension-polyfill";

declare global {
  var chrome: Browser;
}
