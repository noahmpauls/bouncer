import { BrowserStorage } from "@bouncer/storage";
import { type IBouncerData, StoredBouncerData } from "@bouncer/data";
import { BasicPolicy, deserializePolicy, type IPolicy } from "@bouncer/policy";
import browser from "webextension-polyfill";
import { ScheduledLimit } from "@bouncer/enforcer";
import { ExactHostnameMatcher } from "@bouncer/matcher";
import { AlwaysBlock, ViewtimeCooldownLimit, WindowCooldownLimit } from "@bouncer/limit";
import { AlwaysSchedule, MinuteSchedule, PeriodicSchedule } from "@bouncer/schedule";
import { BasicGuard, type IGuard } from "@bouncer/guard";
import { CachedBouncerContext, type IBouncerContext } from "@bouncer/context";
import { BasicPage, PageActionType } from "@bouncer/page";

const bouncerData: IBouncerContext = new CachedBouncerContext(new StoredBouncerData(new BrowserStorage()));

const policiesEditor = document.getElementById("policies-editor")!;

function refreshPolicyDisplay() {
  bouncerData.guards()
    .then(guards => {
      policiesEditor.replaceChildren();
      if (guards.length === 0) {
        policiesEditor.innerHTML = "<p><i>No policies to display.</i></p>";
      }
      for (const guard of guards) {
        policiesEditor?.appendChild(createPolicyEditor(guard));
      }
    });
}

function createPolicyEditor(guard: IGuard) {
  const title = document.createElement("h3");
  title.innerText = guard.policy.name;

  const textarea = document.createElement("textarea");
  const policyString = JSON.stringify(guard.policy.toObject(), null, 2);
  textarea.value = policyString;
  const lines = policyString.split("\n").length;
  textarea.rows = lines;
  textarea.cols = 80;
  textarea.addEventListener("input", e => {
    const lines = (e.target as HTMLTextAreaElement).value.split("\n").length;
    textarea.rows = Math.max(10, lines);
  })

  const deleteButton = document.createElement("button");
  deleteButton.innerText = "Delete";
  deleteButton.addEventListener("click", () => {
    bouncerData.guards()
      .then(guards => {
        const i = guards.indexOf(guard);
        guards.splice(i, 1);
        bouncerData.persist();
      }).then(() => {
        sendRefreshMessage();
        refreshPolicyDisplay();
      });
  });

  const resetButton = document.createElement("button");
  resetButton.innerText = "Reset";
  resetButton.addEventListener("click", () => {
    const policyString = JSON.stringify(guard.policy.toObject(), null, 2);
    textarea.value = policyString;
    const lines = policyString.split("\n").length;
    textarea.rows = Math.max(10, lines);
  });

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.innerText = "Update";
  submitButton.addEventListener("click", e => {
    e.preventDefault();
    try {
      const updatedPolicy = deserializePolicy(JSON.parse(textarea.value) as any);
      guard.policy = updatedPolicy;
      bouncerData.persist().then(() => {
        sendRefreshMessage();
        refreshPolicyDisplay();
      });
    } catch {
      console.error("could not deserialize input");
    }
  });

  const clearPageButton = document.createElement("button");
  clearPageButton.innerText = "Clear Page";
  clearPageButton.addEventListener("click", e => {
    const time = new Date();
    guard.page.recordAction(PageActionType.RESET_METRICS, time);
    guard.page.recordAction(PageActionType.UNBLOCK, time);
    bouncerData.persist().then(() => {
      sendRefreshMessage();
      refreshPolicyDisplay();
    });
  });

  const form = document.createElement("form");
  form.id = `policy-editor-${guard.id}`;
  form.name = `policyEditor${guard.id}`;
  form.classList.add("policy-editor");

  form.appendChild(title);
  form.appendChild(textarea);
  form.appendChild(deleteButton);
  form.appendChild(resetButton);
  form.appendChild(submitButton);
  form.appendChild(clearPageButton);

  return form;
}

async function seedPolicies() {
  const existingGuards = await bouncerData.guards();

  if (existingGuards.length > 0) {
    return;
  }

  const newGuards = [
    new BasicPolicy(
      "example.com viewtime block",
      true,
      new ExactHostnameMatcher("example.com"),
      new ScheduledLimit(
        new MinuteSchedule(30, 10),
        new ViewtimeCooldownLimit(10000, 15000),
      ),
    ),
    new BasicPolicy(
      "en.wikipedia.org window block",
      true,
      new ExactHostnameMatcher("en.wikipedia.org"),
      new ScheduledLimit(
        new MinuteSchedule(30, 10),
        new WindowCooldownLimit(10000, 15000),
      ),
    ),
    new BasicPolicy(
      "Block HackerNews always",
      true,
      new ExactHostnameMatcher("news.ycombinator.com"),
      new ScheduledLimit(
        new AlwaysSchedule(),
        new AlwaysBlock(),
      ),
    ),
    new BasicPolicy(
      "Limit CNBC during work hours",
      true,
      new ExactHostnameMatcher("www.cnbc.com"),
      new ScheduledLimit(
        new PeriodicSchedule(
          "day",
          [
            { start: 2.88e+7, end: 6.12e+7 }
          ]
        ),
        new AlwaysBlock(),
      ),
    ),
  ].map((policy, i) => new BasicGuard(`${i}`, policy, new BasicPage()));

  for (const guard of newGuards) {
    existingGuards.push(guard);
  }

  await bouncerData.persist();

  sendRefreshMessage();
}

function sendRefreshMessage() {
  browser.runtime.sendMessage({ type: "refresh", time: new Date() });
}

seedPolicies().then(() => refreshPolicyDisplay());
