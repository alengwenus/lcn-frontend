import "@ha/components/ha-select";
import "@ha/components/input/ha-input";
import type { HaInput } from "@ha/components/input/ha-input";
import "@ha/components/ha-switch";
import type { CSSResultGroup, PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HomeAssistant, ValueChangedEvent } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import type { LCN, ClimateConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

@customElement("lcn-config-climate-element")
export class LCNConfigClimateElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false, type: Number }) public softwareSerial = -1;

  @property({ attribute: false }) public domainData!: ClimateConfig;

  @state() private _source!: ConfigItem;

  @state() private _setpoint!: ConfigItem;

  @state() private _unit!: ConfigItem;

  @state() private _lockOption!: ConfigItem;

  @state() private _targetValueLocked = 0;

  @state() private _maxTempInvalid = false;

  @state() private _minTempInvalid = false;

  @state() private _targetValueLockedInvalid = false;

  private _invalid = false;

  private get _is2012() {
    return this.softwareSerial >= 0x160000;
  }

  private get _variablesNew(): ConfigItem[] {
    const variable: string = this.lcn.localize("variable");
    return [
      { name: variable + " 1", value: "VAR1" },
      { name: variable + " 2", value: "VAR2" },
      { name: variable + " 3", value: "VAR3" },
      { name: variable + " 4", value: "VAR4" },
      { name: variable + " 5", value: "VAR5" },
      { name: variable + " 6", value: "VAR6" },
      { name: variable + " 7", value: "VAR7" },
      { name: variable + " 8", value: "VAR8" },
      { name: variable + " 9", value: "VAR9" },
      { name: variable + " 10", value: "VAR10" },
      { name: variable + " 11", value: "VAR11" },
      { name: variable + " 12", value: "VAR12" },
    ];
  }

  private _variablesOld: ConfigItem[] = [
    { name: "TVar", value: "TVAR" },
    { name: "R1Var", value: "R1VAR" },
    { name: "R2Var", value: "R2VAR" },
  ];

  private get _varSetpoints(): ConfigItem[] {
    const setpoint: string = this.lcn.localize("setpoint");
    return [
      { name: setpoint + " 1", value: "R1VARSETPOINT" },
      { name: setpoint + " 2", value: "R2VARSETPOINT" },
    ];
  }

  private _varUnits: ConfigItem[] = [
    { name: "Celsius", value: "°C" },
    { name: "Fahrenheit", value: "°F" },
  ];

  private get _regulatorLockOptions(): ConfigItem[] {
    const regulatorLockOptions: ConfigItem[] = [
      {
        name: this.lcn.localize("dashboard-entities-dialog-climate-regulator-not-lockable"),
        value: "NOT_LOCKABLE",
      },
      {
        name: this.lcn.localize("dashboard-entities-dialog-climate-regulator-lockable"),
        value: "LOCKABLE",
      },
      {
        name: this.lcn.localize(
          "dashboard-entities-dialog-climate-regulator-lockable-with-target-value",
        ),
        value: "LOCKABLE_WITH_TARGET_VALUE",
      },
    ];
    if (this.softwareSerial < 0x120301) return regulatorLockOptions.slice(0, 2);
    return regulatorLockOptions;
  }

  private get _sources(): ConfigItem[] {
    return this._is2012 ? this._variablesNew : this._variablesOld;
  }

  private get _setpoints(): ConfigItem[] {
    return this._is2012 ? this._varSetpoints.concat(this._variablesNew) : this._varSetpoints;
  }

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    if (!this._source) {
      this._source = this._sources[0];
      this._setpoint = this._setpoints[0];
      this._unit = this._varUnits[0];
      this._lockOption = this._regulatorLockOptions[0];

      this.domainData = {
        source: this._source.value,
        setpoint: this._setpoint.value,
        max_temp: 35,
        min_temp: 7,
        lockable: false,
        target_value_locked: -1,
        unit_of_measurement: this._unit.value,
      };
    }

    this._invalid = this._minTempInvalid || this._maxTempInvalid || this._targetValueLockedInvalid;
  }

  protected update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    this.dispatchEvent(
      new CustomEvent("validity-changed", {
        detail: this._invalid,
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected render() {
    if (!(this._source && this._setpoint && this._unit && this._lockOption)) {
      return nothing;
    }
    return html`
      <div class="sources">
        <ha-select
          id="source-select"
          .label=${this.lcn.localize("source")}
          .value=${this._source.value}
          @selected=${this._sourceChanged}
          .options=${this._sources.map((source) => ({
            value: source.value,
            label: source.name,
          }))}
        ></ha-select>

        <ha-select
          id="setpoint-select"
          .label=${this.lcn.localize("setpoint")}
          .value=${this._setpoint.value}
          @selected=${this._setpointChanged}
          .options=${this._setpoints.map((setpoint) => ({
            value: setpoint.value,
            label: setpoint.name,
          }))}
        ></ha-select>
      </div>

      <ha-select
        id="unit-select"
        .label=${this.lcn.localize("dashboard-entities-dialog-unit-of-measurement")}
        .value=${this._unit.value}
        @selected=${this._unitChanged}
        .options=${this._varUnits.map((unit) => ({
          value: unit.value,
          label: unit.name,
        }))}
      ></ha-select>

      <div class="temperatures">
        <ha-input
          id="min-temperature"
          .label=${this.lcn.localize("dashboard-entities-dialog-climate-min-temperature")}
          type="number"
          .suffix=${this._unit.value}
          .value=${this.domainData.min_temp.toString()}
          required
          autoValidate
          .invalid=${this._minTempInvalid}
          .validationMessage=${this.lcn.localize(
            "dashboard-entities-dialog-climate-min-temperature-error",
          )}
          @input=${this._minTempChanged}
        ></ha-input>

        <ha-input
          id="max-temperature"
          .label=${this.lcn.localize("dashboard-entities-dialog-climate-max-temperature")}
          type="number"
          .suffix=${this._unit.value}
          .value=${this.domainData.max_temp.toString()}
          required
          autoValidate
          .invalid=${this._maxTempInvalid}
          .validationMessage=${this.lcn.localize(
            "dashboard-entities-dialog-climate-max-temperature-error",
          )}
          @input=${this._maxTempChanged}
        ></ha-input>
      </div>

      <div class="lock-options">
        <ha-select
          id="lock-options-select"
          .label=${this.lcn.localize("dashboard-entities-dialog-climate-regulator-lock")}
          .value=${this._lockOption.value}
          @selected=${this._lockOptionChanged}
          .options=${this._regulatorLockOptions.map((lockOption) => ({
            value: lockOption.value,
            label: lockOption.name,
          }))}
        ></ha-select>

        <ha-input
          id="target-value"
          .label=${this.lcn.localize("dashboard-entities-dialog-climate-target-value")}
          type="number"
          suffix="%"
          .value=${this._targetValueLocked.toString()}
          .disabled=${this._lockOption.value !== "LOCKABLE_WITH_TARGET_VALUE"}
          .helper=${this.lcn.localize("dashboard-entities-dialog-climate-target-value-helper")}
          .helperPersistent=${this._lockOption.value === "LOCKABLE_WITH_TARGET_VALUE"}
          required
          autoValidate
          .invalid=${this._targetValueLockedInvalid}
          .validationMessage=${this.lcn.localize(
            "dashboard-entities-dialog-climate-target-value-error",
          )}
          @input=${this._targetValueLockedChanged}
        >
        </ha-input>
      </div>
    `;
  }

  private _sourceChanged(ev: ValueChangedEvent<string>): void {
    this._source = this._sources.find((source) => source.value === ev.detail.value)!;
    this.domainData.source = this._source.value;
  }

  private _setpointChanged(ev: ValueChangedEvent<string>): void {
    this._setpoint = this._setpoints.find((setpoint) => setpoint.value === ev.detail.value)!;
    this.domainData.setpoint = this._setpoint.value;
  }

  private _minTempChanged(ev: ValueChangedEvent<string>): void {
    const input = ev.target as HaInput;
    if (!input.value) {
      this._minTempInvalid = true;
    } else {
      this.domainData.min_temp = +input.value;
      this._minTempInvalid = !this._validateMinTemp(this.domainData.min_temp);
    }
    input.reportValidity();
  }

  private _maxTempChanged(ev: ValueChangedEvent<string>): void {
    const input = ev.target as HaInput;
    if (!input.value) {
      this._maxTempInvalid = true;
    } else {
      this.domainData.max_temp = +input.value;
      this._maxTempInvalid = !this._validateMaxTemp(this.domainData.max_temp);
    }
    input.reportValidity();
  }

  private _unitChanged(ev: ValueChangedEvent<string>): void {
    this._unit = this._varUnits.find((unit) => unit.value === ev.detail.value)!;
    this.domainData.unit_of_measurement = this._unit.value;
  }

  private _lockOptionChanged(ev: ValueChangedEvent<string>): void {
    this._lockOption = this._regulatorLockOptions.find(
      (option) => option.value === ev.detail.value,
    )!;

    switch (this._lockOption.value) {
      case "LOCKABLE":
        this.domainData.lockable = true;
        this._targetValueLocked = 0;
        this.domainData.target_value_locked = -1;
        break;
      case "LOCKABLE_WITH_TARGET_VALUE":
        this.domainData.lockable = true;
        this._targetValueLocked = 0;
        this.domainData.target_value_locked = this._targetValueLocked;
        break;
      default: // NOT_LOCKABLE
        this.domainData.lockable = false;
        this._targetValueLocked = 0;
        this.domainData.target_value_locked = -1;
        break;
    }
  }

  private _targetValueLockedChanged(ev: ValueChangedEvent<string>): void {
    const input = ev.target as HaInput;
    if (!input.value) {
      this._targetValueLockedInvalid = true;
    } else {
      this._targetValueLocked = +input.value;
      this.domainData.target_value_locked = this._targetValueLocked;
      this._targetValueLockedInvalid = !this._validateTargetValueLocked(this._targetValueLocked);
    }
    input.reportValidity();
  }

  private _validateMaxTemp(maxTemp: number): boolean {
    return maxTemp > this.domainData.min_temp;
  }

  private _validateMinTemp(minTemp: number): boolean {
    return minTemp < this.domainData.max_temp;
  }

  private _validateTargetValueLocked(targetValueLocked: number): boolean {
    return targetValueLocked >= 0 && targetValueLocked <= 100;
  }

  static get styles(): CSSResultGroup[] {
    return [
      haStyleDialog,
      css`
        .sources,
        .temperatures,
        .lock-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 4px;
        }
        ha-select,
        ha-input {
          display: block;
          margin-bottom: 8px;
        }
      `,
    ];
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "lcn-config-climate-element": LCNConfigClimateElement;
  }
}
