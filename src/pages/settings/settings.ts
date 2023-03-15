import { BrowserStorage } from "../../browserStorage";
import { IBouncerData, StoredBouncerData } from "../../data";
import { AlwaysBlock, ViewtimeCooldownLimit } from "../../limit";
import { ExactHostnameMatcher } from "../../matcher";
import { BasicPolicy, IPolicy, PolicyData } from "../../policy";
import { ScheduledLimit } from "../../enforcer";
import { AlwaysSchedule } from "../../schedule";
import { BasicPage } from "../../page";

const policyForm: HTMLInputElement = document.getElementById("add-policy") as HTMLInputElement;
const nameInput: HTMLInputElement = document.getElementById("name") as HTMLInputElement;
const hostInput: HTMLInputElement = document.getElementById("host") as HTMLInputElement;
const durationInput: HTMLInputElement = document.getElementById("duration") as HTMLInputElement;
const cooldownInput: HTMLInputElement = document.getElementById("cooldown") as HTMLInputElement;

const bouncerData: IBouncerData = new StoredBouncerData(new BrowserStorage());

policyForm.addEventListener("submit", event => {
  event.preventDefault();
  
  const name = nameInput.value;
  const host = hostInput.value;
  const duration = Number(durationInput.value);
  const cooldown = Number(cooldownInput.value);

  hostInput.value = "";
  durationInput.value = "";
  const policy: IPolicy = new BasicPolicy(
    "",
    name,
    true,
    new ExactHostnameMatcher(host),
    new ScheduledLimit(
      new AlwaysSchedule(),
      new ViewtimeCooldownLimit(duration, cooldown)
    ),
    new BasicPage(),
  );
  bouncerData.addPolicy(policy)
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
