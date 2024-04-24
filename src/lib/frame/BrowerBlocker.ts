import { browser } from "@bouncer/browser";
import type { IBlocker } from "./types";

export const BrowserBlocker: IBlocker = {
  block: () => {
    const queryParams = new URLSearchParams();
    const url = location.toString();
    if (url !== "") {
      queryParams.append("url", url);
    }
    const title = document.title;
    if (title !== "") {
      queryParams.append("title", title);
    }
    const queryString = queryParams.size > 0 ? `?${queryParams.toString()}` : "";
    location.replace(browser.runtime.getURL(`dist/ui/blocked/index.html${queryString}`));
  }
}