import browser from "webextension-polyfill";
import type { IBlocker } from "./types";

export const BrowserBlocker: IBlocker = {
  block: () => {
    // invalidate the bfcache for the page otherwise script state at block time
    // is preserved, so hitting back button doesn't trigger block
    // 
    // TODO: change Bouncer to not rely on bfcache invalidation via unload, as
    //  this is unreliable. Maybe restart content script on each pageshow?
    window.addEventListener("unload", () => { });
    location.assign(browser.runtime.getURL("dist/ui/blocked/index.html"));
    console.log(`${new Date().getTime()} BOUNCER: blocking page...`);
  }
}