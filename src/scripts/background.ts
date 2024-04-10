import { browser } from "@bouncer/browser";
import { Worker } from "@bouncer/worker";

const worker = Worker.browser();

browser.tabs.onActivated.addListener(worker.events.handleActivated);
browser.tabs.onRemoved.addListener(worker.events.handleRemoved);
browser.webNavigation.onCommitted.addListener(worker.events.handleCommitted);
browser.webNavigation.onHistoryStateUpdated.addListener(worker.events.handleHistoryStateUpdated);
browser.runtime.onMessage.addListener(worker.events.handleMessage);

worker.start();
