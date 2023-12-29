import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import { css, html, LitElement, TemplateResult, CSSResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import { SensorConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

interface ConfigItemCollection {
  name: string;
  value: ConfigItem[];
}

@customElement("lcn-config-sensor-element")
export class LCNConfigSensorElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public softwareSerial = -1;

  @property() public domainData: SensorConfig = {
    source: "VAR1",
    unit_of_measurement: "NATIVE",
  };

  @property() private _sourceType = 0;

  @query("#sources-listbox") private _sourcesListBox;

  private get _is2013() {
    return this.softwareSerial >= 0x170206;
  }

  private _variablesOld: ConfigItem[] = [
    { name: "TVar", value: "TVAR" },
    { name: "R1Var", value: "R1VAR" },
    { name: "R2Var", value: "R2VAR" },
  ];

  private _variablesNew: ConfigItem[] = [
    { name: "Variable 1", value: "VAR1" },
    { name: "Variable 2", value: "VAR2" },
    { name: "Variable 3", value: "VAR3" },
    { name: "Variable 4", value: "VAR4" },
    { name: "Variable 5", value: "VAR5" },
    { name: "Variable 6", value: "VAR6" },
    { name: "Variable 7", value: "VAR7" },
    { name: "Variable 8", value: "VAR8" },
    { name: "Variable 9", value: "VAR9" },
    { name: "Variable 10", value: "VAR10" },
    { name: "Variable 11", value: "VAR11" },
    { name: "Variable 12", value: "VAR12" },
  ];

  private _setpoints: ConfigItem[] = [
    { name: "Setpoint 1", value: "R1VARSETPOINT" },
    { name: "Setpoint 2", value: "R2VARSETPOINT" },
  ];

  private _thresholdsOld: ConfigItem[] = [
    { name: "Threshold 1", value: "THRS1" },
    { name: "Threshold 2", value: "THRS2" },
    { name: "Threshold 3", value: "THRS3" },
    { name: "Threshold 4", value: "THRS4" },
    { name: "Threshold 5", value: "THRS5" },
  ];

  private _thresholdsNew: ConfigItem[] = [
    { name: "Threshold 1-1", value: "THRS1" },
    { name: "Threshold 1-2", value: "THRS2" },
    { name: "Threshold 1-3", value: "THRS3" },
    { name: "Threshold 1-4", value: "THRS4" },
    { name: "Threshold 2-1", value: "THRS2_1" },
    { name: "Threshold 2-2", value: "THRS2_2" },
    { name: "Threshold 2-3", value: "THRS2_3" },
    { name: "Threshold 2-4", value: "THRS2_4" },
    { name: "Threshold 3-1", value: "THRS3_1" },
    { name: "Threshold 3-2", value: "THRS3_2" },
    { name: "Threshold 3-3", value: "THRS3_3" },
    { name: "Threshold 3-4", value: "THRS3_4" },
    { name: "Threshold 4-1", value: "THRS4_1" },
    { name: "Threshold 4-2", value: "THRS4_2" },
    { name: "Threshold 4-3", value: "THRS4_3" },
    { name: "Threshold 4-4", value: "THRS4_4" },
  ];

  private _s0Inputs: ConfigItem[] = [
    { name: "S0 Input 1", value: "S0INPUT1" },
    { name: "S0 Input 2", value: "S0INPUT2" },
    { name: "S0 Input 3", value: "S0INPUT3" },
    { name: "S0 Input 4", value: "S0INPUT4" },
  ];

  private _ledPorts: ConfigItem[] = [
    { name: "Led 1", value: "LED1" },
    { name: "Led 2", value: "LED2" },
    { name: "Led 3", value: "LED3" },
    { name: "Led 4", value: "LED4" },
    { name: "Led 5", value: "LED5" },
    { name: "Led 6", value: "LED6" },
    { name: "Led 7", value: "LED7" },
    { name: "Led 8", value: "LED8" },
    { name: "Led 9", value: "LED9" },
    { name: "Led 10", value: "LED10" },
    { name: "Led 11", value: "LED11" },
    { name: "Led 12", value: "LED12" },
  ];

  private _logicOpPorts: ConfigItem[] = [
    { name: "Logic 1", value: "LOGICOP1" },
    { name: "Logic 2", value: "LOGICOP2" },
    { name: "Logic 3", value: "LOGICOP3" },
    { name: "Logic 4", value: "LOGICOP4" },
  ];

  private get _sourceTypes(): ConfigItemCollection[] {
    return [
      {
        name: "Variables",
        value: this._is2013 ? this._variablesNew : this._variablesOld,
      },
      { name: "Setpoints", value: this._setpoints },
      {
        name: "Thresholds",
        value: this._is2013 ? this._thresholdsNew : this._thresholdsOld,
      },
      { name: "S0 Inputs", value: this._s0Inputs },
      { name: "Leds", value: this._ledPorts },
      { name: "Logics", value: this._logicOpPorts },
    ];
  }

  private _varUnits: ConfigItem[] = [
    { name: "LCN native", value: "NATIVE" },
    { name: "Celsius", value: "°C" },
    { name: "Fahrenheit", value: "°F" },
    { name: "Kelvin", value: "K" },
    { name: "Lux", value: "LUX_T" },
    { name: "Lux (I-Port)", value: "LUX_I" },
    { name: "Humidity (%)", value: "PERCENT" },
    { name: "CO2 (per mill)", value: "PPM" },
    { name: "Wind (m/s)", value: "METERPERSECOND" },
    { name: "Volts", value: "VOLT" },
    { name: "Milliampere", value: "AMPERE" },
    { name: "Degree (angle)", value: "DEGREE" },
  ];

  protected async firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    this.domainData.source = this._sourceTypes[0].value[0].value;
  }

  protected render(): TemplateResult {
    return html`
      <form>
        <paper-dropdown-menu
          label="Source type"
          .value=${this._sourceTypes[this._sourceType].name}
        >
          <paper-listbox
            id="sources-type-listbox"
            slot="dropdown-content"
            @selected-changed=${this._sourceTypeChanged}
          >
            ${this._sourceTypes.map(
              (sourceType) => html`
                <paper-item .itemValue=${sourceType.value}
                  >${sourceType.name}</paper-item
                >
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>

        <paper-dropdown-menu
          label="Source"
          .value=${this._sourceTypes[this._sourceType].value[0].name}
        >
          <paper-listbox
            id="sources-listbox"
            slot="dropdown-content"
            @selected-changed=${this._sourceChanged}
          >
            ${this._sourceTypes[this._sourceType].value.map(
              (source) => html`
                <paper-item .itemValue=${source.value}
                  >${source.name}</paper-item
                >
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>

        <paper-dropdown-menu
          label="Unit of measurement"
          .value=${this._varUnits[0].name}
        >
          <paper-listbox
            id="units-listbox"
            slot="dropdown-content"
            @selected-changed=${this._unitChanged}
          >
            ${this._varUnits.map(
              (unit) => html`
                <paper-item .itemValue=${unit.value}>${unit.name}</paper-item>
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>
      </form>
    `;
  }

  private _sourceTypeChanged(ev: CustomEvent): void {
    this._sourceType = ev.detail.value;
    this._sourcesListBox.selectIndex(0);
    const source =
      this._sourceTypes[this._sourceType].value[this._sourcesListBox.selected];
    this.domainData.source = source.value;
  }

  private _sourceChanged(ev: CustomEvent): void {
    const source = this._sourceTypes[this._sourceType].value[ev.detail.value];
    this.domainData.source = source.value;
  }

  private _unitChanged(ev: CustomEvent): void {
    const unit = this._varUnits[ev.detail.value];
    this.domainData.unit_of_measurement = unit.value;
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        #sources-type-listbox {
          width: 120px;
        }
        #sources-listbox {
          width: 120px;
        }
      `,
    ];
  }
}
