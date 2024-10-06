import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import type { HaSelect } from "@ha/components/ha-select";
import "@ha/components/ha-textfield";
import type { HaTextField } from "@ha/components/ha-textfield";
import "@ha/components/ha-switch";
import type { HaSwitch } from "@ha/components/ha-switch";
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
    unit_of_measurement: "°C",
  };

  @state() private _source!: ConfigItem;

  @state() private _setpoint!: ConfigItem;

  @state() private _unit!: ConfigItem;

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
  }

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    this._invalid =
      !this._validateMinTemp(this.domainData.min_temp) ||
      !this._validateMaxTemp(this.domainData.max_temp);
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
    if (!(this._source || this._setpoint || this._unit)) {
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

      <div class="lockable">
        <label>${this.lcn.localize("dashboard-entities-dialog-climate-lockable")}:</label>
        <ha-switch
          .checked=${this.domainData.lockable}
          @change=${this._lockableChanged}
        ></ha-switch>
      </div>

      <ha-textfield
        id="min-textfield"
        .label=${this.lcn.localize("dashboard-entities-dialog-climate-min-temperature")}
        type="number"
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
        id="max-textfield"
        .label=${this.lcn.localize("dashboard-entities-dialog-climate-max-temperature")}
        type="number"
        .value=${this.domainData.max_temp.toString()}
        required
        autoValidate
        @input=${this._maxTempChanged}
        .validityTransform=${this._validityTransformMaxTemp}
        .validationMessage=${this.lcn.localize(
          "dashboard-entities-dialog-climate-max-temperature-error",
        )}
      ></ha-textfield>

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
    const maxTextfield: HaTextField = this.shadowRoot!.querySelector("#max-textfield")!;
    maxTextfield.reportValidity();
    this.requestUpdate();
  }

  private _maxTempChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaTextField;
    this.domainData.max_temp = +target.value;
    const minTextfield: HaTextField = this.shadowRoot!.querySelector("#min-textfield")!;
    minTextfield.reportValidity();
    this.requestUpdate();
  }

  private _lockableChanged(ev: ValueChangedEvent<string>): void {
    this.domainData.lockable = (ev.target as HaSwitch).checked;
  }

  private _unitChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._unit = this._varUnits.find((unit) => unit.value === target.value)!;
    this.domainData.unit_of_measurement = this._unit.value;
  }

  private _validateMaxTemp(max_temp: number): boolean {
    return max_temp > this.domainData.min_temp;
  }

  private _validateMinTemp(min_temp: number): boolean {
    return min_temp < this.domainData.max_temp;
  }

  private get _validityTransformMaxTemp() {
    return (value: string) => ({ valid: this._validateMaxTemp(+value) });
  }

  private get _validityTransformMinTemp() {
    return (value: string) => ({ valid: this._validateMinTemp(+value) });
  }

  static get styles(): CSSResultGroup[] {
    return [
      haStyleDialog,
      css`
        .sources {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 4px;
        }
        ha-select,
        ha-textfield {
          display: block;
          margin-bottom: 8px;
        }
        .lockable {
          margin-top: 10px;
        }
        ha-switch {
          margin-left: 25px;
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
