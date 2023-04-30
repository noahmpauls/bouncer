import type { ScheduleData } from "@bouncer/schedule";
import { PeriodicScheduleInput } from "./PeriodicScheduleInput";

export interface IScheduleInput extends HTMLElement {
  value: ScheduleData;
}

const template = document.createElement("template");
template.id = "schedule-input-template";
template.innerHTML = `<label for="type">Schedule:</label>
<select name="type" id="type"></select>
<div id="schedule-input"></div>`;


const scheduleOptions = [
  {
    display: "Always",
    value: "always"
  },
  {
    display: "Periodic",
    value: "periodic",
  }
];

export class ScheduleInput extends HTMLElement implements IScheduleInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));
    const scheduleSelect = this.shadow.getElementById("type") as HTMLSelectElement;
    for (const scheduleOption of scheduleOptions) {
      const option = document.createElement("option");
      option.value = scheduleOption.value;
      option.innerText = scheduleOption.display;
      scheduleSelect.appendChild(option);
    }
    const scheduleInputContainer = this.shadow.getElementById("schedule-input") as HTMLDivElement;
    scheduleSelect.addEventListener("change", function() {
      scheduleInputContainer.innerHTML = "";
      let scheduleInput = null;
      switch (scheduleSelect.value) {
        case "always":
          break;
        case "periodic":
          scheduleInput = document.createElement("periodic-schedule-input");
          break;
      }
      if (scheduleInput !== null) {
        scheduleInput.id = "schedule";
        scheduleInputContainer.appendChild(scheduleInput);
      }
    });
  }
  
  get value(): ScheduleData {
    const scheduleSelect = this.shadow.getElementById("type") as HTMLSelectElement;
    if (scheduleSelect.value === "always") {
      return { type: "AlwaysSchedule" }
    } else {
      const scheduleInput = this.shadow.getElementById("schedule") as IScheduleInput;
      return scheduleInput.value;
    }
  }
}



declare global {
  interface Window {
    ScheduleInput: typeof ScheduleInput
  }
  interface HTMLElementTagNameMap {
    'schedule-input': ScheduleInput
  }
}

if (!window.customElements.get('schedule-input')) {
  window.ScheduleInput = ScheduleInput;
  window.customElements.define('schedule-input', ScheduleInput);
}
