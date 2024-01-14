import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import type { HaSelect } from "@ha/components/ha-select";
import "@ha/components/ha-radio";
import "@ha/components/ha-formfield";
import "@ha/components/ha-textfield";
import { css, html, LitElement, CSSResultGroup, PropertyValues, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import type { HaRadio } from "@ha/components/ha-radio";
import type { HaSwitch } from "@ha/components/ha-switch";
import type { HaTextField } from "@ha/components/ha-textfield";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
import type { HomeAssistant, ValueChangedEvent } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import type { LCN, LightConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

interface ConfigItemCollection {
  name: string;
  value: ConfigItem[];
  id: string;
}

@customElement("lcn-config-light-element")
export class LCNConfigLightElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public domainData: LightConfig = {
    output: "OUTPUT1",
    dimmable: false,
    transition: 0,
  };

  @state() private _portType!: ConfigItemCollection;

  @state() private _port!: ConfigItem;

  @query("#port-select") private _portSelect;

  private _invalid = false;

  private get _outputPorts(): ConfigItem[] {
    const output: string = this.lcn.localize("output");
    return [
      { name: output + " 1", value: "OUTPUT1" },
      { name: output + " 2", value: "OUTPUT2" },
      { name: output + " 3", value: "OUTPUT3" },
      { name: output + " 4", value: "OUTPUT4" },
    ];
  }

  private get _relayPorts(): ConfigItem[] {
    const relay: string = this.lcn.localize("relay");
    return [
      { name: relay + " 1", value: "RELAY1" },
      { name: relay + " 2", value: "RELAY2" },
      { name: relay + " 3", value: "RELAY3" },
      { name: relay + " 4", value: "RELAY4" },
      { name: relay + " 5", value: "RELAY5" },
      { name: relay + " 6", value: "RELAY6" },
      { name: relay + " 7", value: "RELAY7" },
      { name: relay + " 8", value: "RELAY8" },
    ];
  }

  private get _portTypes(): ConfigItemCollection[] {
    return [
      { name: this.lcn.localize("output"), value: this._outputPorts, id: "output" },
      { name: this.lcn.localize("relay"), value: this._relayPorts, id: "relay" },
    ];
  }

  protected async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this._portType = this._portTypes[0];
    this._port = this._portType.value[0];
  }

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    this._invalid = !this._validateTransition(this.domainData.transition);
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
    if (!(this._portType || this._port)) {
      return nothing;
    }
    return html`
      <div id="port-type">${this.lcn.localize("port-type")}</div>

      <ha-formfield label=${this.lcn.localize("output")}>
        <ha-radio
          name="port"
          value="output"
          .checked=${this._portType.id === "output"}
          @change=${this._portTypeChanged}
        ></ha-radio>
      </ha-formfield>

      <ha-formfield label=${this.lcn.localize("relay")}>
        <ha-radio
          name="port"
          value="relay"
          .checked=${this._portType.id === "relay"}
          @change=${this._portTypeChanged}
        ></ha-radio>
      </ha-formfield>

      <ha-select
        id="port-select"
        .label=${this.lcn.localize("port")}
        .value=${this._port.value}
        fixedMenuPosition
        @selected=${this._portChanged}
        @closed=${stopPropagation}
      >
        ${this._portType.value.map(
          (port) => html` <ha-list-item .value=${port.value}> ${port.name} </ha-list-item> `,
        )}
      </ha-select>

      ${this.renderOutputFeatures()}
    `;
  }

  private renderOutputFeatures() {
    switch (this._portType.id) {
      case "output":
        return html`
          <div id="dimmable">
            <label>${this.lcn.localize("dashboard-entities-dialog-light-dimmable")}:</label>

            <ha-switch
              .checked=${this.domainData.dimmable}
              @change=${this._dimmableChanged}
            ></ha-switch>
          </div>

          <ha-textfield
            id="transition"
            .label=${this.lcn.localize("dashboard-entities-dialog-light-transition")}
            type="number"
            .value=${this.domainData.transition.toString()}
            min="0"
            max="486"
            required
            autoValidate
            @input=${this._transitionChanged}
            .validityTransform=${this._validityTransformTransition}
            .validationMessage=${this.lcn.localize(
              "dashboard-entities-dialog-light-transition-error",
            )}
          ></ha-textfield>
        `;
      case "relay":
        return nothing;
      default:
        return nothing;
    }
  }

  private _portTypeChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaRadio;

    this._portType = this._portTypes.find((portType) => portType.id === target.value)!;
    this._port = this._portType.value[0];
    this._portSelect.select(-1); // need to change index, so ha-select gets updated
  }

  private _portChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaSelect;
    if (target.index === -1) return;

    this._port = this._portType.value.find((portType) => portType.value === target.value)!;
    this.domainData.output = this._port.value;
  }

  private _dimmableChanged(ev: ValueChangedEvent<boolean>): void {
    this.domainData.dimmable = (ev.target as HaSwitch).checked;
  }

  private _transitionChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaTextField;
    this.domainData.transition = +target.value;
    this.requestUpdate();
  }

  private _validateTransition(transition: number): boolean {
    return transition >= 0 && transition <= 486;
  }

  private get _validityTransformTransition() {
    return (value: string) => ({ valid: this._validateTransition(+value) });
  }

  static get styles(): CSSResultGroup[] {
    return [
      haStyleDialog,
      css`
        #port-type {
          margin-top: 16px;
        }
        ha-select,
        ha-textfield {
          display: block;
          margin-bottom: 8px;
        }
        #dimmable {
          margin-top: 16px;
        }
        #transition {
          margin-top: 16px;
        }
      `,
    ];
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "lcn-config-light-element": LCNConfigLightElement;
  }
}
