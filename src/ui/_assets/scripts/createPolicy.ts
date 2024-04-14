import { BrowserClientMessenger, ClientMessageType } from "@bouncer/message";
import { deserializePolicy } from "@bouncer/policy";

const messenger = BrowserClientMessenger;

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

const policyCreator = document.getElementById("policy-creator") as HTMLFormElement;

const textarea = policyCreator.querySelector("textarea") as HTMLTextAreaElement;
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
    messenger.send({
      type: ClientMessageType.POLICY_CREATE,
      policy: newPolicy.toObject(),
    })
    textarea.value = "";
  } catch {
    console.error("could not deserialize input");
  }
});
