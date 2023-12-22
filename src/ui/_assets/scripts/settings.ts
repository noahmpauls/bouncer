import { BrowserStorage } from "@bouncer/storage";
import { type IBouncerData, StoredBouncerData } from "@bouncer/data";
import { BasicPolicy, deserializePolicy, type IPolicy } from "@bouncer/policy";
import browser from "webextension-polyfill";
import { ScheduledLimit } from "@bouncer/enforcer";
import { ExactHostnameMatcher } from "@bouncer/matcher";
import { AlwaysBlock, ViewtimeCooldownLimit } from "@bouncer/limit";
import { AlwaysSchedule, MinuteSchedule } from "@bouncer/schedule";
import { BasicGuard, type IGuard } from "@bouncer/guard";
import { CachedBouncerContext, type IBouncerContext } from "@bouncer/context";
import { BasicPage } from "@bouncer/page";

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
    textarea.rows = lines;
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
    textarea.rows = lines;
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

  const form = document.createElement("form");
  form.id = `policy-editor-${guard.id}`;
  form.name = `policyEditor${guard.id}`;
  form.classList.add("policy-editor");

  form.appendChild(title);
  form.appendChild(textarea);
  form.appendChild(deleteButton);
  form.appendChild(resetButton);
  form.appendChild(submitButton);

  return form;
}

async function seedPolicies() {
  const existingGuards = await bouncerData.guards();

  if (existingGuards.length > 0) {
    return;
  }

  existingGuards.push(new BasicGuard(
    "0",
    true,
    new BasicPolicy(
      "Block HackerNews",
      new ExactHostnameMatcher("news.ycombinator.com"),
      new ScheduledLimit(
        new AlwaysSchedule(),
        new AlwaysBlock(),
      ),
    ),
    new BasicPage()
  ));
  existingGuards.push(new BasicGuard(
    "1",
    true,    
    new BasicPolicy(
      "Limit Noah Pauls",
      new ExactHostnameMatcher("www.noahpauls.com"),
      new ScheduledLimit(
        new MinuteSchedule(45, 15),
        new ViewtimeCooldownLimit(10000, 15000),
      ),
    ),
    new BasicPage()
  ));

  await bouncerData.persist();

  sendRefreshMessage();
}

function sendRefreshMessage() {
  browser.runtime.sendMessage({ type: "REFRESH", time: new Date() });
}

seedPolicies().then(() => refreshPolicyDisplay());
