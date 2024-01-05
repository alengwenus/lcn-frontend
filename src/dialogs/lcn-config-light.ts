import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-input/paper-input";
import "@polymer/paper-listbox/paper-listbox";
import "@ha/components/ha-radio";
import "@ha/components/ha-formfield";
import "@ha/components/ha-textfield"
import {
  css,
  html,
  LitElement,
  TemplateResult,
  CSSResult,
  PropertyValues,
} from "lit";
import { customElement, property, query } from "lit/decorators";
import type { HaRadio } from "@ha/components/ha-radio";
import { HaSwitch } from "@ha/components/ha-switch";
import { HaTextField } from "@ha/components/ha-textfield";
import { HomeAssistant, ValueChangedEvent } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import { LCN, LightConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

interface Ports {
  output: ConfigItem[];
  relay: ConfigItem[];
}

@customElement("lcn-config-light-element")
export class LCNConfigLightElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() public domainData: LightConfig = {
    output: "OUTPUT1",
    dimmable: false,
    transition: 0,
  };

  @property() private _portType = "output";

  @query("#ports-listbox") private _portsListBox;

  private _invalid = false;

  private get _outputPorts(): ConfigItem[] {
    const output: string = this.lcn.localize("output");
    return [
      { name: output + " 1", value: "OUTPUT1" },
      { name: output + " 2", value: "OUTPUT2" },
      { name: output + " 3", value: "OUTPUT3" },
      { name: output + " 4", value: "OUTPUT4" },
    ];
  };

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
  };

  private get _ports(): Ports {
    return {
      output: this._outputPorts,
      relay: this._relayPorts,
    };
  };

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
      })
    );
  }

  protected render(): TemplateResult {
    return html`
      <div id="port-type">
        ${this.lcn.localize("port-type")}:
      </div>

      <div class="type">
        <ha-formfield label=${this.lcn.localize("output")}>
          <ha-radio
            name="port"
            value="output"
            .checked=${this._portType === "output"}
            @change=${this._portTypeChanged}
          ></ha-radio>
        </ha-formfield>

        <ha-formfield label=${this.lcn.localize("relay")}>
          <ha-radio
            name="port"
            value="relay"
            .checked=${this._portType === "relay"}
            @change=${this._portTypeChanged}
          ></ha-radio>
        </ha-formfield>
      </div>

      <div class="port">
        <paper-dropdown-menu
          label=${this.lcn.localize("port")}
          .value=${this._ports[this._portType][0].name}
        >
          <paper-listbox
            id="ports-listbox"
            slot="dropdown-content"
            @selected-item-changed=${this._portChanged}
          >
            ${this._ports[this._portType].map(
              (port) => html`
                <paper-item .itemValue=${port.value}>${port.name}</paper-item>
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>
      </div>

      ${this.renderOutputFeatures()}
    `;
  }

  private renderOutputFeatures() {
    switch (this._portType) {
      case "output":
        return html`
          <div id="dimmable">
            <label>${this.lcn.localize("dashboard-entities-dialog-light-dimmable")}:</label>

            <ha-switch
              .checked=${this.domainData.dimmable}
              @change=${this._dimmableChanged}
            ></ha-switch>
          </div>

          <div class="transition">
            <ha-textfield
              .label=${this.lcn.localize("dashboard-entities-dialog-light-transition")}
              type="number"
              .value=${this.domainData.transition}
              min="0"
              max="486"
              required
              autoValidate
              @input=${this._transitionChanged}
              .validityTransform=${(value: string) => ({ valid: this._validateTransition(+value) }) }
              .validationMessage=${this.lcn.localize("dashboard-entities-dialog-light-transition-error")}
            ></ha-textfield>
          </div>
        `;
      case "relay":
        return html``;
      default:
        return html``;
    }
  }

  private _portTypeChanged(ev: ValueChangedEvent<string>): void {
    this._portType = (ev.target as HaRadio).value;
    this._portsListBox.selectIndex(0);

    const port = this._ports[this._portType][this._portsListBox.selected];
    this.domainData.output = port.value;
  }

  private _portChanged(ev: ValueChangedEvent<string>): void {
    if (!ev.detail.value) {
      return;
    }
    const port = this._ports[this._portType][this._portsListBox.selected];
    this.domainData.output = port.value;
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
    return (transition >= 0 && transition <= 486);
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        #port-type {
          margin-top: 16px;
        }
        #dimmable {
          margin-top: 16px;
        }
        .port > * {
          display: block;
          margin-top: 16px;
        }
        .transition > * {
          display: block;
          margin-top: 16px;
        }
      `,
    ];
  }
}
