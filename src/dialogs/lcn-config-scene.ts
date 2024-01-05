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
import "@ha/components/ha-switch";
import { HomeAssistant } from "@ha/types";
import { haStyleDialog } from "@ha/resources/styles";
import "@ha/components/ha-checkbox";
import "@ha/components/ha-formfield";
import { LCN, SceneConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: number | string;
}

@customElement("lcn-config-scene-element")
export class LCNConfigSceneElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() public domainData: SceneConfig = {
    register: 0,
    scene: 0,
    outputs: [],
    transition: 0,
  };

  private _invalid = false;

  private get _registers(): ConfigItem[] {
    const register: string = this.lcn.localize("register");
    return [
      { name: register + " 0", value: 0 },
      { name: register + " 1", value: 1 },
      { name: register + " 2", value: 2 },
      { name: register + " 3", value: 3 },
      { name: register + " 4", value: 4 },
      { name: register + " 5", value: 5 },
      { name: register + " 6", value: 6 },
      { name: register + " 7", value: 7 },
      { name: register + " 8", value: 8 },
      { name: register + " 9", value: 9 },
    ];
  };

  private get _scenes(): ConfigItem[] {
    const scene: string = this.lcn.localize("scene");
    return [
      { name: scene + " 1", value: 0 },
      { name: scene + " 2", value: 1 },
      { name: scene + " 3", value: 2 },
      { name: scene + " 4", value: 3 },
      { name: scene + " 5", value: 4 },
      { name: scene + " 6", value: 5 },
      { name: scene + " 7", value: 6 },
      { name: scene + " 8", value: 7 },
      { name: scene + " 9", value: 8 },
      { name: scene + " 10", value: 9 },
    ];
  };

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

  public willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    this._invalid = this._validateTransition(this.domainData.transition);
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
          label=${this.lcn.localize("register")}
          .value=${this._registers[0].name}
        >
          <paper-listbox
            id="registerss-listbox"
            slot="dropdown-content"
            @selected-changed=${this._registerChanged}
          >
            ${this._registers.map(
              (register) => html`
                <paper-item .itemValue=${register.value}
                  >${register.name}</paper-item
                >
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>

        <paper-dropdown-menu
          label=${this.lcn.localize("scene")}
          .value=${this._scenes[0].name}
        >
          <paper-listbox
            id="scenes-listbox"
            slot="dropdown-content"
            @selected-changed=${this._sceneChanged}
          >
            ${this._scenes.map(
              (scene) => html`
                <paper-item .itemValue=${scene.value}>${scene.name}</paper-item>
              `
            )}
          </paper-listbox>
        </paper-dropdown-menu>

        <div id="output-ports">
          <label>${this.lcn.localize("outputs")}:</label><br />
          ${this._outputPorts.map(
            (port) => html`
              <ha-formfield label=${port.name}>
                <ha-checkbox
                  .value=${port.value}
                  @change=${this._portCheckedChanged}
                ></ha-checkbox>
              </ha-formfield>
            `
          )}
        </div>

        <div id="relay-ports">
          <label>${this.lcn.localize("relays")}:</label><br />
          ${this._relayPorts.map(
            (port) => html`
              <ha-formfield label=${port.name}>
                <ha-checkbox
                  .value=${port.value}
                  @change=${this._portCheckedChanged}
                ></ha-checkbox>
              </ha-formfield>
            `
          )}
        </div>

        <paper-input
          label=${this.lcn.localize("dashboard-entities-dialog-scene-transition")}
          type="number"
          value="0"
          min="0"
          max="486"
          @value-changed=${this._transitionChanged}
          .invalid=${this._validateTransition(this.domainData.transition)}
          .disabled=${this._transitionDisabled}
          error-message=${this.lcn.localize("dashboard-entities-dialog-scene-transition-error")}
        ></paper-input>
      </form>
    `;
  }

  private _registerChanged(ev: CustomEvent): void {
    const register = this._registers[ev.detail.value];
    this.domainData.register = +register.value;
  }

  private _sceneChanged(ev: CustomEvent): void {
    const scene = this._scenes[ev.detail.value];
    this.domainData.scene = +scene.value;
  }

  private _portCheckedChanged(ev: CustomEvent | any): void {
    if (ev.target.checked) {
      this.domainData.outputs.push(ev.target.value);
    } else {
      this.domainData.outputs = this.domainData.outputs.filter(
        (port) => ev.target.value !== port
      );
    }
    this.requestUpdate();
  }

  private _transitionChanged(ev: CustomEvent): void {
    this.domainData.transition = +ev.detail.value;
    this.requestUpdate();
  }

  private _validateTransition(transition: number): boolean {
    return !(transition >= 0 && transition <= 486);
  }

  private get _transitionDisabled(): boolean {
    const outputPortValues = this._outputPorts.map((port) => port.value);
    return (
      this.domainData.outputs.filter((output) =>
        outputPortValues.includes(output)
      ).length === 0
    );
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        #registers-listbox {
          width: 120px;
        }
        #scenes-listbox {
          width: 120px;
        }
        #output-ports {
          margin-top: 10px;
        }
        #relay-ports {
          margin-top: 10px;
        }
      `,
    ];
  }
}
