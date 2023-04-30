import { BrowserStorage } from "@bouncer/storage";
import { type IBouncerData, StoredBouncerData } from "@bouncer/data";
import { deserializePolicy } from "@bouncer/policy";
import browser from "webextension-polyfill";

import { PolicyInput } from "components/policy/PolicyInput";


const bouncerData: IBouncerData = new StoredBouncerData(new BrowserStorage());

const policyInput = document.getElementById("policy") as PolicyInput;
const policySubmit = document.getElementById("policy-submit") as HTMLButtonElement;

policySubmit.addEventListener("click", event => {
  event.preventDefault();
  
  const policy = deserializePolicy(policyInput.value);
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
