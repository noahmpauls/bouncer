import { BrowserStorage } from "../../browserStorage";
import { IBouncerData, StoredBouncerData } from "../../data";
import { AlwaysBlock, ViewtimeCooldownLimit } from "../../limit";
import { ExactHostnameMatcher } from "../../matcher";
import { BasicPolicy, IPolicy } from "../../policy";
import { ScheduledLimit } from "../../rule";
import { AlwaysSchedule } from "../../schedule";

const ruleForm: HTMLInputElement = document.getElementById("add-rule") as HTMLInputElement;
const hostInput: HTMLInputElement = document.getElementById("host") as HTMLInputElement;
const durationInput: HTMLInputElement = document.getElementById("duration") as HTMLInputElement;
const cooldownInput: HTMLInputElement = document.getElementById("cooldown") as HTMLInputElement;

const bouncerData: IBouncerData = new StoredBouncerData(new BrowserStorage());

ruleForm.addEventListener("submit", event => {
  event.preventDefault();
  
  const host = hostInput.value;
  const duration = Number(durationInput.value);
  const cooldown = Number(cooldownInput.value);

  hostInput.value = "";
  durationInput.value = "";
  const policy: IPolicy = new BasicPolicy(
    [new ExactHostnameMatcher(host)],
    new ScheduledLimit(
      new AlwaysSchedule(),
      new ViewtimeCooldownLimit(duration, cooldown)
    )
  );
  bouncerData.addPolicy(
    {
      active: true
    },
    policy
  ).then(() => refreshRuleDisplay());
});

function refreshRuleDisplay() {
  const rulesDiv = document.getElementById("rules");

  bouncerData.getPolicies()
    .then(policies => {
      rulesDiv?.replaceChildren();
      for (const policy of policies) {
        const ruleElement = document.createElement("p");
        ruleElement.innerText = `${policy.metadata.id}`;
        rulesDiv?.appendChild(ruleElement);
      }
    });
}
