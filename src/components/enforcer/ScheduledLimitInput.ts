import type { ScheduledLimitData } from "@bouncer/enforcer/ScheduledLimit";
import type { IEnforcerInput } from "./EnforcerInput";
import { ScheduleInput } from "components/schedule/ScheduleInput";
import { LimitInput } from "components/limit/LimitInput";

const template = document.createElement("template");
template.id = "scheduled-limit-input-template";
template.innerHTML = `<schedule-input id="schedule"></schedule-input>
<limit-input id="limit"></limit-input>`;

export class ScheduledLimitInput extends HTMLElement implements IEnforcerInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
  }
  
  get value(): ScheduledLimitData {
    const scheduleInput = this.shadow.getElementById("schedule") as ScheduleInput;
    const limitInput = this.shadow.getElementById("limit") as LimitInput;
    return {
      type: "ScheduledLimit",
      data: {
        schedule: scheduleInput.value,
        limit: limitInput.value,
      }
    }
  }
}


declare global {
  interface Window {
    ScheduledLimitInput: typeof ScheduledLimitInput
  }
  interface HTMLElementTagNameMap {
    'scheduled-limit-input': ScheduledLimitInput
  }
}

if (!window.customElements.get('scheduled-limit-input')) {
  window.ScheduledLimitInput = ScheduledLimitInput;
  window.customElements.define('scheduled-limit-input', ScheduledLimitInput);
}
