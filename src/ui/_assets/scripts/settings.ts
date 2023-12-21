import { BrowserStorage } from "@bouncer/storage";
import { type IBouncerData, StoredBouncerData } from "@bouncer/data";
import { BasicPolicy, deserializePolicy, type IPolicy } from "@bouncer/policy";
import browser from "webextension-polyfill";
import { ScheduledLimit } from "@bouncer/enforcer";
import { ExactHostnameMatcher } from "@bouncer/matcher";
import { AlwaysBlock, ViewtimeCooldownLimit } from "@bouncer/limit";
import { AlwaysSchedule, MinuteSchedule } from "@bouncer/schedule";
import { BasicPage } from "@bouncer/page";

const bouncerData: IBouncerData = new StoredBouncerData(new BrowserStorage());

const policiesEditor = document.getElementById("policies-editor")!;

policiesEditor.addEventListener("click", event => {
  event.preventDefault();
  
  // bouncerData.addPolicy(policy)
  //   // TODO: formalize the policy refresh message to background script
  //   .then(() => browser.runtime.sendMessage({ type: "REFRESH", time: new Date() }))
  //   .then(() => refreshPolicyDisplay());
});

function refreshPolicyDisplay() {
  bouncerData.getGuards()
    .then(guards => {
      policiesEditor.replaceChildren();
      if (guards.length === 0) {
        policiesEditor.innerHTML = "<p><i>No policies to display.</i></p>";
      }
      for (const guard of guards) {
        const id = guard.id;
        const policyString = JSON.stringify(guard.policy.toObject(), null, 2);

        const policyEditorTemplate = `<h3>${guard.policy.name}</h3>
        <pre><code>${policyString}</code></pre>`;
        const policyElement = document.createElement("div");
        policyElement.innerHTML = policyEditorTemplate;
        policiesEditor?.appendChild(policyElement);
      }
    });
}

async function seedPolicies() {
  const existingPolicies = await bouncerData.getGuards();

  if (existingPolicies.length > 0) {
    return;
  }

  const policies: IPolicy[] = [
    new BasicPolicy(
      "Block HackerNews",
      new ExactHostnameMatcher("news.ycombinator.com"),
      new ScheduledLimit(
        new AlwaysSchedule(),
        new AlwaysBlock(),
      ),
    ),
    new BasicPolicy(
      "Limit Noah Pauls",
      new ExactHostnameMatcher("www.noahpauls.com"),
      new ScheduledLimit(
        new MinuteSchedule(45, 15),
        new ViewtimeCooldownLimit(10000, 15000),
      ),
    ),
  ];

  for (const policy of policies) {
    await bouncerData.addPolicy(policy);
  }

  browser.runtime.sendMessage({ type: "REFRESH", time: new Date() });
}

seedPolicies().then(() => refreshPolicyDisplay());
