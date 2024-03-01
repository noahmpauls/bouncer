import browser from "webextension-polyfill";
import { Frame } from "@bouncer/frame";

const frame = Frame.fromBrowser();
frame.start();
