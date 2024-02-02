import browser from "webextension-polyfill";
import { BrowserStorage } from "@bouncer/storage";
import { StoredBouncerData } from "@bouncer/data";
import { CachedBouncerContext, type IBouncerContext } from "@bouncer/context";
import { deserializePolicy } from "@bouncer/policy";
import { BasicGuard } from "@bouncer/guard";
import { BasicPage } from "@bouncer/page";

const bouncerData: IBouncerContext = new CachedBouncerContext(new StoredBouncerData(new BrowserStorage()));

const defaultPolicyValue = 
`{
  "type": "BasicPolicy",
  "data": {
    "name": "",
    "active": true,
    "matcher": {
      "type": "ExactHostname",
      "data": {
        "hostname": ""
      }
    },
    "enforcer": {
      "type": "ScheduledLimit",
      "data": {
        "schedule": {
          "type": ""
        },
        "limit": {
          "type": ""
        }
      }
    }
  }
}`;

const policyCreator = document.getElementById("policy-creator");

const textarea = policyCreator?.querySelector("textarea")!;
textarea.value = defaultPolicyValue;
textarea.rows = Math.max(10, defaultPolicyValue.split("\n").length);
textarea.addEventListener("input", e => {
  const lines = (e.target as HTMLTextAreaElement).value.split("\n").length;
  textarea.rows = Math.max(10, lines);
})

const submit = policyCreator?.querySelector("button");
submit?.addEventListener("click", e => {
  e.preventDefault();
  try {
    const newPolicy = deserializePolicy(JSON.parse(textarea.value) as any);
    bouncerData.guards()
      .then(guards => {
        guards.push(new BasicGuard(`${guards.length}`, newPolicy, new BasicPage()))
        bouncerData.persist();
      })
      .then(() => {
        sendRefreshMessage();
        textarea.value = "";
      });
  } catch {
    console.error("could not deserialize input");
  }
});

function sendRefreshMessage() {
  browser.runtime.sendMessage({ type: "refresh", time: new Date() });
}
