import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import "@polymer/paper-input/paper-input";
import {
  css,
  html,
  LitElement,
  TemplateResult,
  CSSResult,
  PropertyValues,
} from "lit";
import { customElement, property } from "lit/decorators";
import { HaSwitch } from "@ha/components/ha-switch";
import { HomeAssistant } from "@ha/types";
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

  @property() public softwareSerial = -1;

  @property() public domainData: ClimateConfig = {
    source: "VAR1",
    setpoint: "R1VARSETPOINT",
    max_temp: 35,
    min_temp: 7,
    lockable: false,
    unit_of_measurement: "°C",
  };

  private _invalid = false;

  private get _is2012() {
    return this.softwareSerial >= 0x160000;
  };

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
};


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
  };


  private _varUnits: ConfigItem[] = [
    { name: "Celsius", value: "°C" },
    { name: "Fahrenheit", value: "°F" },
  ];

  private get _sources(): ConfigItem[] {
    return this._is2012 ? this._variablesNew : this._variablesOld;
  }

  private get _setpoints(): ConfigItem[] {
    return this._is2012
      ? this._varSetpoints.concat(this._variablesNew)
      : this._varSetpoints;
  }

  protected async firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    this.domainData.source = this._sources[0].value;
    this.domainData.setpoint = this._setpoints[0].value;
  }

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    this._invalid =
      this._validateMinTemp(this.domainData.min_temp) ||
      this._validateMaxTemp(this.domainData.max_temp);
  }

  protected update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    this.dispatchEvent(
      new CustomEvent("validity-changed", {
        detail: this._invalid,
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render(): TemplateResult {
    return html`
      <form>
        <paper-dropdown-menu
          label=${this.lcn.localize("source")}
          .value=${this._sources[0].name}
        >
          <paper-listbox
            id="sources-listbox"
            slot="dropdown-content"
            @selected-changed=${this._sourceChanged}
          >
            ${this._sources.map(
              (source) => html`
                <paper-item .itemValue=${source.value}
                  >${source.name}</paper-item
                >
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>

        <paper-dropdown-menu
          label=${this.lcn.localize("setpoint")}
          .value=${this._setpoints[0].name}
        >
          <paper-listbox
            id="setpoints-listbox"
            slot="dropdown-content"
            @selected-changed=${this._setpointChanged}
          >
            ${this._setpoints.map(
              (setpoint) => html`
                <paper-item .itemValue=${setpoint.value}
                  >${setpoint.name}</paper-item
                >
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>

        <div id="lockable">
          <label>${this.lcn.localize("dashboard-entities-dialog-climate-lockable")}:</label>
          <ha-switch
            .checked=${this.domainData.lockable}
            @change=${this._lockableChanged}
          ></ha-switch>
        </div>

        <paper-input
          label=${this.lcn.localize("dashboard-entities-dialog-climate-max-temperature")}
          type="number"
          value="7"
          @value-changed=${this._minTempChanged}
          .invalid=${this._validateMinTemp(this.domainData.min_temp)}
          error-message=${this.lcn.localize("dashboard-entities-dialog-climate-max-temperature-error")}
        ></paper-input>

        <paper-input
          label=${this.lcn.localize("dashboard-entities-dialog-climate-max-temperature")}
          type="number"
          value="35"
          @value-changed=${this._maxTempChanged}
          .invalid=${this._validateMaxTemp(this.domainData.max_temp)}
          error-message=${this.lcn.localize("dashboard-entities-dialog-climate-max-temperature-error")}
        ></paper-input>

        <paper-dropdown-menu
          label=${this.lcn.localize("dashboard-entities-dialog-unit-of-measurement")}
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

  private _sourceChanged(ev: CustomEvent): void {
    const source = this._sources[ev.detail.value];
    this.domainData.source = source.value;
  }

  private _setpointChanged(ev: CustomEvent): void {
    const setpoint = this._setpoints[ev.detail.value];
    this.domainData.setpoint = setpoint.value;
  }

  private _minTempChanged(ev: CustomEvent): void {
    this.domainData.min_temp = +ev.detail.value;
    this.requestUpdate();
  }

  private _maxTempChanged(ev: CustomEvent): void {
    this.domainData.max_temp = +ev.detail.value;
    this.requestUpdate();
  }

  private _lockableChanged(ev: CustomEvent): void {
    this.domainData.lockable = (ev.target as HaSwitch).checked;
  }

  private _unitChanged(ev: CustomEvent): void {
    const unit = this._varUnits[ev.detail.value];
    this.domainData.unit_of_measurement = unit.value;
  }

  private _validateMaxTemp(max_temp: number): boolean {
    return max_temp <= this.domainData.min_temp;
  }

  private _validateMinTemp(_min_temp: number): boolean {
    return false;
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        #sources-listbox {
          width: 120px;
        }
        #setpoints-listbox {
          width: 120px;
        }
        #units-listbox {
          width: 120px;
        }
        #lockable {
          margin-top: 10px;
        }
        ha-switch {
          margin-left: 25px;
        }
      `,
    ];
  }
}
