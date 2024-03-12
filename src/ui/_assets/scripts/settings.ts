import { type PolicyData } from "@bouncer/policy";
import { BrowserClientMessenger, ClientMessageType, ControllerMessageType } from "@bouncer/message";

const messenger = BrowserClientMessenger;

const policiesEditor = document.getElementById("policies-editor")!;

messenger.addReceiver(message => {
  switch(message.type) {
    case ControllerMessageType.POLICIES_GET:
      refreshPolicyDisplay(message.policies);
      break;
    default:
      break;
  }
})

function refreshPolicyDisplay(policies: { id: string, policy: PolicyData }[]) {
  policiesEditor.replaceChildren();
  if (policies.length === 0) {
    policiesEditor.innerHTML = "<p><i>No policies to display.</i></p>";
  }
  for (const { id, policy } of policies) {
    policiesEditor?.appendChild(createPolicyEditor(id, policy));
  }
}

function createPolicyEditor(id: string, policy: PolicyData) {
  const title = document.createElement("h3");
  title.innerText = policy.data.name;
  const subtitle = document.createElement("p");
  subtitle.innerText = id;
  subtitle.style.fontSize = '0.8rem';

  const textarea = document.createElement("textarea");
  const policyString = JSON.stringify(policy, null, 2);
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
  deleteButton.addEventListener("click", (e) => {
    e.preventDefault();
    console.error("delete not handled");
  });

  const resetButton = document.createElement("button");
  resetButton.innerText = "Reset";
  resetButton.addEventListener("click", (e) => {
    e.preventDefault();
    const policyString = JSON.stringify(policy, null, 2);
    textarea.value = policyString;
    const lines = policyString.split("\n").length;
    textarea.rows = Math.max(10, lines);
  });

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.innerText = "Update";
  submitButton.addEventListener("click", e => {
    e.preventDefault();
    console.error("update not handled");
  });

  const clearPageButton = document.createElement("button");
  clearPageButton.innerText = "Clear Page";
  clearPageButton.addEventListener("click", e => {
    e.preventDefault();
    console.error("reset page not handled");
  });

  const form = document.createElement("form");
  form.id = `policy-editor-${id}`;
  form.name = `policyEditor${id}`;
  form.classList.add("policy-editor");

  form.appendChild(title);
  form.appendChild(subtitle);
  form.appendChild(textarea);
  form.appendChild(deleteButton);
  form.appendChild(resetButton);
  form.appendChild(submitButton);
  form.appendChild(clearPageButton);

  return form;
}

messenger.send({ type: ClientMessageType.POLICIES_GET });