import { BasicPage } from "@bouncer/page";
import type { BasicPolicyData } from "@bouncer/policy/BasicPolicy";
import { EnforcerInput } from "components/enforcer/EnforcerInput";
import { MatcherInput } from "components/matcher/MatcherInput";

const template = document.createElement("template");
template.id = "test-policy-template";
template.innerHTML = `<label for="name">Name:</label>
<input type="text" id="name" name="name" />
<matcher-input id="matcher"></matcher-input>
<enforcer-input id="enforcer"></enforcer-input>`


export class BasicPolicyInput extends HTMLElement {
  private readonly shadow: ShadowRoot;

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
    const nameInput = this.shadow.getElementById("name") as HTMLInputElement;
    const submit = this.shadow.querySelector("button");
    console.log(submit);
    submit?.addEventListener("click", function (e: Event) {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent("test-policy-add", {
        composed: true,
        bubbles: true,
      }))
    })
  }
  
  get value(): BasicPolicyData {
    const nameInput = this.shadow.getElementById("name") as HTMLInputElement;
    const matcherInput = this.shadow.getElementById("matcher") as MatcherInput;
    const enforcerInput = this.shadow.getElementById("enforcer") as EnforcerInput;
    return {
      type: "BasicPolicy",
      data: {
        name: nameInput.value,
        active: true,
        matcher: matcherInput.value,
        enforcer: enforcerInput.value,
      }
    }
  }
}

declare global {
  interface Window {
    BasicPolicyInput: typeof BasicPolicyInput
  }
  interface HTMLElementTagNameMap {
    'basic-policy-input': BasicPolicyInput
  }
}

if (!window.customElements.get('basic-policy-input')) {
  window.BasicPolicyInput = BasicPolicyInput;
  window.customElements.define('basic-policy-input', BasicPolicyInput);
}
