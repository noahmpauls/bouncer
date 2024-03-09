import { BrowserStorage } from "@bouncer/storage";
import { StoredBouncerData } from "@bouncer/data";
import { deserializePolicy } from "@bouncer/policy";
import { type IGuard } from "@bouncer/guard";
import { CachedBouncerContext, type IBouncerContext } from "@bouncer/context";
import { PageActionType } from "@bouncer/page";

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

refreshPolicyDisplay();