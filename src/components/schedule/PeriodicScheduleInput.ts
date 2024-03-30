import type { PeriodicScheduleData } from "@bouncer/schedule/PeriodicSchedule";
import type { IScheduleInput } from "./ScheduleInput";
import { PeriodIntervalInput } from "./PeriodIntervalInput";
import { PeriodicTime } from "@bouncer/time";

const template = document.createElement("template");
template.id = "periodic-schedule-input-template";
template.innerHTML = `<p>Periodic Schedule:</p>
<label for="period-select">Period:</label>
<select id="period-select" name="period-select">
  <option value="minute">Minute</option>
  <option value="hour">Hour</option>
  <option value="day">Day</option>
  <option value="week">Week</option>
</select>
<div>
  <div id="intervals">
    <period-interval-input></period-interval-input>
  </div>
  <button id="add-interval">Add</button>
</div>`;


export class PeriodicScheduleInput extends HTMLElement implements IScheduleInput {
  private readonly shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  
  connectedCallback() {
    this.shadow.appendChild(template.content.cloneNode(true));

    const addInterval = this.shadow.getElementById("add-interval") as HTMLButtonElement;
    addInterval.addEventListener("click", () => {
      const intervals = this.shadow.getElementById("intervals");
      const newInterval = document.createElement("period-interval-input");
      intervals?.appendChild(newInterval);
    });
    
    const intervals = this.shadow.getElementById("intervals");
    intervals?.addEventListener("period-interval-remove", (e: Event) => {
      console.log("remove!");
      intervals.removeChild(e.target as Node);
    })
  }

  get value(): PeriodicScheduleData {
    const intervalInputs = this.shadow.getElementById("intervals");
    const intervals = [];
    for (const intervalInput of intervalInputs?.children ?? []) {
      const interval = (intervalInput as PeriodIntervalInput).value;
      intervals.push(interval);
    }
    return {
      type: "PeriodicSchedule",
      data: {
        intervals: intervals
          .map(({ start, end }) => ({
            start: PeriodicTime.fromString(start).toObject(),
            end: PeriodicTime.fromString(end).toObject(),
          })),
      }
    }
  }
}


declare global {
  interface Window {
    PeriodicScheduleInput: typeof PeriodicScheduleInput
  }
  interface HTMLElementTagNameMap {
    'periodic-schedule-input': PeriodicScheduleInput
  }
}

if (!window.customElements.get('periodic-schedule-input')) {
  window.PeriodicScheduleInput = PeriodicScheduleInput;
  window.customElements.define('periodic-schedule-input', PeriodicScheduleInput);
}
