import { BrowserStorage } from "../../browserStorage";
import { IBouncerData, StoredBouncerData } from "../../data";
import { AlwaysBlock, ViewtimeCooldownLimit } from "../../limit";
import { ExactHostnameMatcher } from "../../matcher";
import { BasicPolicy, IPolicy } from "../../policy";
import { ScheduledLimit } from "../../rule";
import { AlwaysSchedule } from "../../schedule";
import { BasicPage } from "../../page";

const ruleForm: HTMLInputElement = document.getElementById("add-rule") as HTMLInputElement;
const nameInput: HTMLInputElement = document.getElementById("name") as HTMLInputElement;
const hostInput: HTMLInputElement = document.getElementById("host") as HTMLInputElement;
const durationInput: HTMLInputElement = document.getElementById("duration") as HTMLInputElement;
const cooldownInput: HTMLInputElement = document.getElementById("cooldown") as HTMLInputElement;

const bouncerData: IBouncerData = new StoredBouncerData(new BrowserStorage());

ruleForm.addEventListener("submit", event => {
  event.preventDefault();
  
  const name = nameInput.value;
  const host = hostInput.value;
  const duration = Number(durationInput.value);
  const cooldown = Number(cooldownInput.value);

  hostInput.value = "";
  durationInput.value = "";
  const policy: any = {
    type: "BasicPolicy",
    name: name,
    active: true,
    matcher: new ExactHostnameMatcher(host),
    rule: new ScheduledLimit(
      new AlwaysSchedule(),
      new ViewtimeCooldownLimit(duration, cooldown)
    ),
    page: new BasicPage()
  };
  bouncerData.addPolicy(policy)
    .then(() => refreshRuleDisplay());
});

function refreshRuleDisplay() {
  const rulesDiv = document.getElementById("rules");

  bouncerData.getPolicies()
    .then(policies => {
      rulesDiv?.replaceChildren();
      for (const policy of policies) {
        const ruleElement = document.createElement("p");
        ruleElement.innerText = `${policy.name}`;
        rulesDiv?.appendChild(ruleElement);
      }
    });
}

refreshRuleDisplay();
