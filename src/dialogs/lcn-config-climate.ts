import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import type { HaSelect } from "@ha/components/ha-select";
import "@ha/components/ha-textfield";
import type { HaTextField } from "@ha/components/ha-textfield";
import "@ha/components/ha-switch";
import "@lrnwebcomponents/simple-tooltip/simple-tooltip";
import { css, html, LitElement, CSSResultGroup, PropertyValues, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HomeAssistant, ValueChangedEvent } from "@ha/types";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
import { haStyleDialog } from "@ha/resources/styles";
import { LCN, ClimateConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

@customElement("lcn-config-climate-element")
export class LCNConfigClimateElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false, type: Number }) public softwareSerial: number = -1;

  @property({ attribute: false }) public domainData: ClimateConfig = {
    source: "VAR1",
    setpoint: "R1VARSETPOINT",
    max_temp: 35,
    min_temp: 7,
    lockable: false,
    target_value_locked: -1,
    unit_of_measurement: "°C",
  };

  @state() private _source!: ConfigItem;

  @state() private _setpoint!: ConfigItem;

  @state() private _unit!: ConfigItem;

  @state() private _lockOption!: ConfigItem;

  @state() private _targetValueLocked: number = 0;

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
      { name: this.lcn.localize("dashboard-entities-dialog-climate-regulator-not-lockable"), value: "NOT_LOCKABLE" },
      { name: this.lcn.localize("dashboard-entities-dialog-climate-regulator-lockable"), value: "LOCKABLE" },
      { name: this.lcn.localize("dashboard-entities-dialog-climate-regulator-lockable-with-target-value"), value: "LOCKABLE_WITH_TARGET_VALUE" }
    ];
    if (this.softwareSerial < 0x120301)
      return regulatorLockOptions.slice(0, 2);
    return regulatorLockOptions;
  }

  private get _sources(): ConfigItem[] {
    return this._is2012 ? this._variablesNew : this._variablesOld;
  }

  private get _setpoints(): ConfigItem[] {
    return this._is2012 ? this._varSetpoints.concat(this._variablesNew) : this._varSetpoints;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._source = this._sources[0];
    this._setpoint = this._setpoints[0];
    this._unit = this._varUnits[0];
    this._lockOption = this._regulatorLockOptions[0];
  }

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    this._invalid =
      !this._validateMinTemp(this.domainData.min_temp) ||
      !this._validateMaxTemp(this.domainData.max_temp) ||
      !this._validateTargetValueLocked(this._targetValueLocked);
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
          fixedMenuPosition
          @selected=${this._sourceChanged}
          @closed=${stopPropagation}
        >
          ${this._sources.map(
            (source) => html`
              <ha-list-item .value=${source.value}> ${source.name} </ha-list-item>
            `,
          )}
        </ha-select>

        <ha-select
          id="setpoint-select"
          .label=${this.lcn.localize("setpoint")}
          .value=${this._setpoint.value}
          fixedMenuPosition
          @selected=${this._setpointChanged}
          @closed=${stopPropagation}
        >
          ${this._setpoints.map(
            (setpoint) => html`
              <ha-list-item .value=${setpoint.value}> ${setpoint.name} </ha-list-item>
            `,
          )}
        </ha-select>
      </div>

      <ha-select
        id="unit-select"
        .label=${this.lcn.localize("dashboard-entities-dialog-unit-of-measurement")}
        .value=${this._unit.value}
        fixedMenuPosition
        @selected=${this._unitChanged}
        @closed=${stopPropagation}
      >
        ${this._varUnits.map(
          (unit) => html` <ha-list-item .value=${unit.value}> ${unit.name} </ha-list-item> `,
        )}
      </ha-select>

      <div class="temperatures">
        <ha-textfield
          id="min-temperature"
          .label=${this.lcn.localize("dashboard-entities-dialog-climate-min-temperature")}
          type="number"
          .suffix=${this._unit.value}
          .value=${this.domainData.min_temp.toString()}
          required
          autoValidate
          @input=${this._minTempChanged}
          .validityTransform=${this._validityTransformMinTemp}
          .validationMessage=${this.lcn.localize(
            "dashboard-entities-dialog-climate-min-temperature-error",
          )}
        ></ha-textfield>

        <ha-textfield
          id="max-temperature"
          .label=${this.lcn.localize("dashboard-entities-dialog-climate-max-temperature")}
          type="number"
          .suffix=${this._unit.value}
          .value=${this.domainData.max_temp.toString()}
          required
          autoValidate
          @input=${this._maxTempChanged}
          .validityTransform=${this._validityTransformMaxTemp}
          .validationMessage=${this.lcn.localize(
            "dashboard-entities-dialog-climate-max-temperature-error",
          )}
        ></ha-textfield>
      </div>

      <div class="lock-options">
        <ha-select
          id="lock-options-select"
          .label=${this.lcn.localize("dashboard-entities-dialog-climate-regulator-lock")}
          .value=${this._lockOption.value}
          fixedMenuPosition
          @selected=${this._lockOptionChanged}
          @closed=${stopPropagation}
        >
          ${this._regulatorLockOptions.map(
            (lockOption) => html`
              <ha-list-item .value=${lockOption.value}> ${lockOption.name} </ha-list-item>
            `,
          )}
        </ha-select>

        <ha-textfield
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
          @input=${this._targetValueLockedChanged}
          .validityTransform=${this._validityTransformTargetValueLocked}
          .validationMessage=${this.lcn.localize("dashboard-entities-dialog-climate-target-value-error")}
        >
        </ha-textfield>
      </div>
    `;
  }

  private _sourceChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._source = this._sources.find((source) => source.value === target.value)!;
    this.domainData.source = this._source.value;
  }

  private _setpointChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._setpoint = this._setpoints.find((setpoint) => setpoint.value === target.value)!;
    this.domainData.setpoint = this._setpoint.value;
  }

  private _minTempChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaTextField;
    this.domainData.min_temp = +target.value;
    const maxTextfield: HaTextField = this.shadowRoot!.querySelector("#max-temperature")!;
    maxTextfield.reportValidity();
    this.requestUpdate();
  }

  private _maxTempChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaTextField;
    this.domainData.max_temp = +target.value;
    const minTextfield: HaTextField = this.shadowRoot!.querySelector("#min-temperature")!;
    minTextfield.reportValidity();
    this.requestUpdate();
  }

  private _unitChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._unit = this._varUnits.find((unit) => unit.value === target.value)!;
    this.domainData.unit_of_measurement = this._unit.value;
  }

  private _lockOptionChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaSelect;

    if (target.index === -1)
      this._lockOption = this._regulatorLockOptions[0];
    else
      this._lockOption = this._regulatorLockOptions.find((option) => option.value === target.value)!;

    switch (this._lockOption.value) {
      case "LOCKABLE":
        this.domainData.lockable = true;
        this.domainData.target_value_locked = -1;
        break;
      case "LOCKABLE_WITH_TARGET_VALUE":
        this.domainData.lockable = true;
        this.domainData.target_value_locked = this._targetValueLocked;
        break;
      default: // NOT_LOCKABLE
        this.domainData.lockable = false;
        this.domainData.target_value_locked = -1;
        break;
    }
  }

  private _targetValueLockedChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaTextField;
    this._targetValueLocked = +target.value;
    this.domainData.target_value_locked = +target.value;
  }

  private _validateMaxTemp(max_temp: number): boolean {
    return max_temp > this.domainData.min_temp;
  }

  private _validateMinTemp(min_temp: number): boolean {
    return min_temp < this.domainData.max_temp;
  }

  private _validateTargetValueLocked(target_value_locked: number): boolean {
    return (target_value_locked >= 0) && (target_value_locked <= 100);
  }

  private get _validityTransformMaxTemp() {
    return (value: string) => ({ valid: this._validateMaxTemp(+value) });
  }

  private get _validityTransformMinTemp() {
    return (value: string) => ({ valid: this._validateMinTemp(+value) });
  }

  private get _validityTransformTargetValueLocked() {
    return (value: string) => ({ valid: this._validateTargetValueLocked(+value) });
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
        ha-textfield {
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
