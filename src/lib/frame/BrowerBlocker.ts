import { browser } from "@bouncer/browser";
import type { IBlocker } from "./types";

export const BrowserBlocker: IBlocker = {
  block: () => {
    const url = location.toString();
    const title = document.title;
    location.replace(browser.runtime.getURL(`dist/ui/blocked/index.html?url=${url}&title=${title}`));
  }
}