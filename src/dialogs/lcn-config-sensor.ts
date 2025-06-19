import "@ha/components/ha-md-select";
import "@ha/components/ha-md-select-option";
import type { HaMdSelect } from "@ha/components/ha-md-select";
import type { CSSResultGroup, PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import type { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
import type { LCN, SensorConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

interface ConfigItemCollection {
  name: string;
  value: ConfigItem[];
  id: string;
}

@customElement("lcn-config-sensor-element")
export class LCNConfigSensorElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false, type: Number }) public softwareSerial = -1;

  @property({ attribute: false }) public domainData: SensorConfig = {
    source: "VAR1",
    unit_of_measurement: "NATIVE",
  };

  @state() private _sourceType!: ConfigItemCollection;

  @state() private _source!: ConfigItem;

  @state() private _unit!: ConfigItem;

  @query("#source-select") private _sourceSelect!: HaMdSelect;

  private get _is2013() {
    return this.softwareSerial >= 0x170206;
  }

  private _variablesOld: ConfigItem[] = [
    { name: "TVar", value: "TVAR" },
    { name: "R1Var", value: "R1VAR" },
    { name: "R2Var", value: "R2VAR" },
  ];

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

  private get _setpoints(): ConfigItem[] {
    const setpoint: string = this.lcn.localize("setpoint");
    return [
      { name: setpoint + " 1", value: "R1VARSETPOINT" },
      { name: setpoint + " 2", value: "R2VARSETPOINT" },
    ];
  }

  private get _thresholdsOld(): ConfigItem[] {
    const threshold: string = this.lcn.localize("threshold");
    return [
      { name: threshold + " 1", value: "THRS1" },
      { name: threshold + " 2", value: "THRS2" },
      { name: threshold + " 3", value: "THRS3" },
      { name: threshold + " 4", value: "THRS4" },
      { name: threshold + " 5", value: "THRS5" },
    ];
  }

  private get _thresholdsNew(): ConfigItem[] {
    const threshold: string = this.lcn.localize("threshold");
    return [
      { name: threshold + " 1-1", value: "THRS1" },
      { name: threshold + " 1-2", value: "THRS2" },
      { name: threshold + " 1-3", value: "THRS3" },
      { name: threshold + " 1-4", value: "THRS4" },
      { name: threshold + " 2-1", value: "THRS2_1" },
      { name: threshold + " 2-2", value: "THRS2_2" },
      { name: threshold + " 2-3", value: "THRS2_3" },
      { name: threshold + " 2-4", value: "THRS2_4" },
      { name: threshold + " 3-1", value: "THRS3_1" },
      { name: threshold + " 3-2", value: "THRS3_2" },
      { name: threshold + " 3-3", value: "THRS3_3" },
      { name: threshold + " 3-4", value: "THRS3_4" },
      { name: threshold + " 4-1", value: "THRS4_1" },
      { name: threshold + " 4-2", value: "THRS4_2" },
      { name: threshold + " 4-3", value: "THRS4_3" },
      { name: threshold + " 4-4", value: "THRS4_4" },
    ];
  }

  private get _s0Inputs(): ConfigItem[] {
    const s0input: string = this.lcn.localize("s0input");
    return [
      { name: s0input + " 1", value: "S0INPUT1" },
      { name: s0input + " 2", value: "S0INPUT2" },
      { name: s0input + " 3", value: "S0INPUT3" },
      { name: s0input + " 4", value: "S0INPUT4" },
    ];
  }

  private get _ledPorts(): ConfigItem[] {
    const led: string = this.lcn.localize("led");
    return [
      { name: led + " 1", value: "LED1" },
      { name: led + " 2", value: "LED2" },
      { name: led + " 3", value: "LED3" },
      { name: led + " 4", value: "LED4" },
      { name: led + " 5", value: "LED5" },
      { name: led + " 6", value: "LED6" },
      { name: led + " 7", value: "LED7" },
      { name: led + " 8", value: "LED8" },
      { name: led + " 9", value: "LED9" },
      { name: led + " 10", value: "LED10" },
      { name: led + " 11", value: "LED11" },
      { name: led + " 12", value: "LED12" },
    ];
  }

  private get _logicOpPorts(): ConfigItem[] {
    const logic: string = this.lcn.localize("logic");
    return [
      { name: logic + " 1", value: "LOGICOP1" },
      { name: logic + " 2", value: "LOGICOP2" },
      { name: logic + " 3", value: "LOGICOP3" },
      { name: logic + " 4", value: "LOGICOP4" },
    ];
  }

  private get _sourceTypes(): ConfigItemCollection[] {
    return [
      {
        name: this.lcn.localize("variables"),
        value: this._is2013 ? this._variablesNew : this._variablesOld,
        id: "variables",
      },
      {
        name: this.lcn.localize("setpoints"),
        value: this._setpoints,
        id: "setpoints",
      },
      {
        name: this.lcn.localize("thresholds"),
        value: this._is2013 ? this._thresholdsNew : this._thresholdsOld,
        id: "thresholds",
      },
      { name: this.lcn.localize("s0inputs"), value: this._s0Inputs, id: "s0inputs" },
      { name: this.lcn.localize("leds"), value: this._ledPorts, id: "ledports" },
      { name: this.lcn.localize("logics"), value: this._logicOpPorts, id: "logicopports" },
    ];
  }

  private get _varUnits(): ConfigItem[] {
    return [
      { name: this.lcn.localize("unit-lcn-native"), value: "NATIVE" },
      { name: "Celsius", value: "°C" },
      { name: "Fahrenheit", value: "°F" },
      { name: "Kelvin", value: "K" },
      { name: "Lux (T-Port)", value: "LUX_T" },
      { name: "Lux (I-Port)", value: "LUX_I" },
      { name: this.lcn.localize("unit-humidity") + " (%)", value: "PERCENT" },
      { name: "CO2 (‰)", value: "PPM" },
      { name: this.lcn.localize("unit-wind") + " (m/s)", value: "METERPERSECOND" },
      { name: this.lcn.localize("unit-volts"), value: "VOLT" },
      { name: this.lcn.localize("unit-milliamperes"), value: "AMPERE" },
      { name: this.lcn.localize("unit-angle") + " (°)", value: "DEGREE" },
    ];
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._sourceType = this._sourceTypes[0];
    this._source = this._sourceType.value[0];
    this._unit = this._varUnits[0];
  }

  protected async updated(changedProperties: PropertyValues) {
    if (changedProperties.has("_sourceType")) {
      this._sourceSelect.selectIndex(0);
    }
    super.updated(changedProperties);
  }

  protected render() {
    if (!(this._sourceType || this._source)) {
      return nothing;
    }
    return html`
      <div class="sources">
        <ha-md-select
          id="source-type-select"
          .label=${this.lcn.localize("source-type")}
          .value=${this._sourceType.id}
          @change=${this._sourceTypeChanged}
          @closed=${stopPropagation}
        >
          ${this._sourceTypes.map(
            (sourceType) => html`
              <ha-md-select-option .value=${sourceType.id}>
                ${sourceType.name}
              </ha-md-select-option>
            `,
          )}
        </ha-md-select>

        <ha-md-select
          id="source-select"
          .label=${this.lcn.localize("source")}
          .value=${this._source.value}
          @change=${this._sourceChanged}
          @closed=${stopPropagation}
        >
          ${this._sourceType.value.map(
            (source) => html`
              <ha-md-select-option .value=${source.value}> ${source.name} </ha-md-select-option>
            `,
          )}
        </ha-md-select>
      </div>

      <ha-md-select
        id="unit-select"
        .label=${this.lcn.localize("dashboard-entities-dialog-unit-of-measurement")}
        .value=${this._unit.value}
        @change=${this._unitChanged}
        @closed=${stopPropagation}
      >
        ${this._varUnits.map(
          (unit) => html`
            <ha-md-select-option .value=${unit.value}> ${unit.name} </ha-md-select-option>
          `,
        )}
      </ha-md-select>
    `;
  }

  private _sourceTypeChanged(ev: CustomEvent): void {
    const target = ev.target as HaMdSelect;
    if (target.selectedIndex === -1) return;

    this._sourceType = this._sourceTypes.find((sourceType) => sourceType.id === target.value)!;
    this._source = this._sourceType.value[0];
    this.domainData.source = this._source.value;
  }

  private _sourceChanged(ev: CustomEvent): void {
    const target = ev.target as HaMdSelect;
    if (target.selectedIndex === -1) return;

    this._source = this._sourceType.value.find((source) => source.value === target.value)!;
    this.domainData.source = this._source.value;
  }

  private _unitChanged(ev: CustomEvent): void {
    const target = ev.target as HaMdSelect;
    if (target.selectedIndex === -1) return;

    this._unit = this._varUnits.find((unit) => unit.value === target.value)!;
    this.domainData.unit_of_measurement = this._unit.value;
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
        ha-md-select {
          display: block;
          margin-bottom: 8px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-config-sensor-element": LCNConfigSensorElement;
  }
}
