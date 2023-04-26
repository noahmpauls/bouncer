import { BrowserStorage } from "@bouncer/storage";
import { IBouncerData, StoredBouncerData } from "@bouncer/data";
import { AlwaysBlock, ViewtimeCooldownLimit, WindowCooldownLimit } from "@bouncer/limit";
import { ExactHostnameMatcher } from "@bouncer/matcher";
import { BasicPolicy, IPolicy, PolicyData } from "@bouncer/policy";
import { ScheduledLimit } from "@bouncer/enforcer";
import { AlwaysSchedule } from "@bouncer/schedule";
import { BasicPage } from "@bouncer/page";
import browser from "webextension-polyfill";
import { MinuteSchedule } from "@bouncer/schedule/MinuteSchedule";
import { WeekSchedule } from "@bouncer/schedule/WeekSchedule";

const policyForm: HTMLInputElement = document.getElementById("add-policy") as HTMLInputElement;
const nameInput: HTMLInputElement = document.getElementById("name") as HTMLInputElement;
const hostInput: HTMLInputElement = document.getElementById("host") as HTMLInputElement;
const durationInput: HTMLInputElement = document.getElementById("duration") as HTMLInputElement;
const cooldownInput: HTMLInputElement = document.getElementById("cooldown") as HTMLInputElement;

nameInput.value = "example";
hostInput.value = "www.example.com";
durationInput.value = "10000";
cooldownInput.value = "10000";

const startSecondInput: HTMLInputElement = document.getElementById("startSecond") as HTMLInputElement;
const endSecondInput: HTMLInputElement = document.getElementById("endSecond") as HTMLInputElement;

startSecondInput.value = "15";
endSecondInput.value = "45";


const bouncerData: IBouncerData = new StoredBouncerData(new BrowserStorage());

policyForm.addEventListener("submit", event => {
  event.preventDefault();
  
  const name = nameInput.value;
  const host = hostInput.value;
  const duration = Number(durationInput.value);
  const cooldown = Number(cooldownInput.value);
  const startSecond = Number(startSecondInput.value);
  const endSecond = Number(endSecondInput.value);

  nameInput.value = "";
  hostInput.value = "";
  durationInput.value = "";
  cooldownInput.value = "";
  startSecondInput.value = "";
  endSecondInput.value = "";
  
  const SECOND_MS = 1000;
  const MINUTE_MS = 60 * SECOND_MS;
  const HOUR_MS = 60 * MINUTE_MS;
  const DAY_MS = 24 * HOUR_MS;
  const testWeekSchedule = new WeekSchedule(
    [
      { start: (3 * DAY_MS), end: (4 * DAY_MS) },
      { start: (5 * DAY_MS), end: (6 * DAY_MS) },
    ]
  )

  const policy: IPolicy = new BasicPolicy(
    "",
    name,
    true,
    new ExactHostnameMatcher(host),
    new ScheduledLimit(
      // new MinuteSchedule(startSecond, endSecond),
      testWeekSchedule,
      new ViewtimeCooldownLimit(duration, cooldown)
    ),
    new BasicPage(),
  );
  bouncerData.addPolicy(policy)
    // TODO: formalize the policy refresh message to background script
    .then(() => browser.runtime.sendMessage({ type: "REFRESH", time: new Date() }))
    .then(() => refreshPolicyDisplay());
});

function refreshPolicyDisplay() {
  const policyDiv = document.getElementById("policies");

  bouncerData.getPolicies()
    .then(policies => {
      policyDiv?.replaceChildren();
      for (const policy of policies) {
        const policyElement = document.createElement("p");
        policyElement.innerText = `${policy.name}`;
        policyDiv?.appendChild(policyElement);
      }
    });
}

refreshPolicyDisplay();
