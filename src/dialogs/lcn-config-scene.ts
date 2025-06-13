import "@ha/components/ha-md-select";
import "@ha/components/ha-md-select-option";
import type { HaMdSelect } from "@ha/components/ha-md-select";
import "@ha/components/ha-textfield";
import type { HaTextField } from "@ha/components/ha-textfield";
import "@ha/components/ha-checkbox";
import "@ha/components/ha-formfield";
import type { CSSResultGroup, PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import type { HomeAssistant, ValueChangedEvent } from "@ha/types";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
import { haStyleDialog } from "@ha/resources/styles";
import type { LCN, SceneConfig } from "types/lcn";

interface ConfigItem {
  name: string;
  value: string;
}

@customElement("lcn-config-scene-element")
export class LCNConfigSceneElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public domainData: SceneConfig = {
    register: 0,
    scene: 0,
    outputs: [],
    transition: 0,
  };

  @state() private _register!: ConfigItem;

  @state() private _scene!: ConfigItem;

  private _invalid = false;

  private get _registers(): ConfigItem[] {
    const register: string = this.lcn.localize("register");
    return [
      { name: register + " 0", value: "0" },
      { name: register + " 1", value: "1" },
      { name: register + " 2", value: "2" },
      { name: register + " 3", value: "3" },
      { name: register + " 4", value: "4" },
      { name: register + " 5", value: "5" },
      { name: register + " 6", value: "6" },
      { name: register + " 7", value: "7" },
      { name: register + " 8", value: "8" },
      { name: register + " 9", value: "9" },
    ];
  }

  private get _scenes(): ConfigItem[] {
    const scene: string = this.lcn.localize("scene");
    return [
      { name: scene + " 1", value: "0" },
      { name: scene + " 2", value: "1" },
      { name: scene + " 3", value: "2" },
      { name: scene + " 4", value: "3" },
      { name: scene + " 5", value: "4" },
      { name: scene + " 6", value: "5" },
      { name: scene + " 7", value: "6" },
      { name: scene + " 8", value: "7" },
      { name: scene + " 9", value: "8" },
      { name: scene + " 10", value: "9" },
    ];
  }

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

  public connectedCallback(): void {
    super.connectedCallback();
    this._register = this._registers[0];
    this._scene = this._scenes[0];
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
    if (!(this._register || this._scene)) {
      return nothing;
    }
    return html`
      <div class="registers">
        <ha-md-select
          id="register-select"
          .label=${this.lcn.localize("register")}
          .value=${this._register.value}
          @change=${this._registerChanged}
          @closed=${stopPropagation}
        >
          ${this._registers.map(
            (register) => html`
              <ha-md-select-option .value=${register.value}> ${register.name} </ha-md-select-option>
            `,
          )}
        </ha-md-select>

        <ha-md-select
          id="scene-select"
          .label=${this.lcn.localize("scene")}
          .value=${this._scene.value}
          @change=${this._sceneChanged}
          @closed=${stopPropagation}
        >
          ${this._scenes.map(
            (scene) => html`
              <ha-md-select-option .value=${scene.value}> ${scene.name} </ha-md-select-option>
            `,
          )}
        </ha-md-select>
      </div>

      <div class="ports">
        <label>${this.lcn.localize("outputs")}:</label><br />
        ${this._outputPorts.map(
          (port) => html`
            <ha-formfield label=${port.name}>
              <ha-checkbox .value=${port.value} @change=${this._portCheckedChanged}></ha-checkbox>
            </ha-formfield>
          `,
        )}
      </div>

      <div class="ports">
        <label>${this.lcn.localize("relays")}:</label><br />
        ${this._relayPorts.map(
          (port) => html`
            <ha-formfield label=${port.name}>
              <ha-checkbox .value=${port.value} @change=${this._portCheckedChanged}></ha-checkbox>
            </ha-formfield>
          `,
        )}
      </div>

      <ha-textfield
        .label=${this.lcn.localize("dashboard-entities-dialog-scene-transition")}
        type="number"
        suffix="s"
        .value=${this.domainData.transition.toString()}
        min="0"
        max="486"
        required
        autoValidate
        @input=${this._transitionChanged}
        .validityTransform=${this._validityTransformTransition}
        .disabled=${this._transitionDisabled}
        .validationMessage=${this.lcn.localize("dashboard-entities-dialog-scene-transition-error")}
      ></ha-textfield>
    `;
  }

  private _registerChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaMdSelect;
    if (target.selectedIndex === -1) return;

    this._register = this._registers.find((register) => register.value === target.value)!;
    this.domainData.register = +this._register.value;
  }

  private _sceneChanged(ev: ValueChangedEvent<string>): void {
    const target = ev.target as HaMdSelect;
    if (target.selectedIndex === -1) return;

    this._scene = this._scenes.find((scene) => scene.value === target.value)!;
    this.domainData.scene = +this._scene.value;
  }

  private _portCheckedChanged(ev: ValueChangedEvent<string> | any): void {
    if (ev.target.checked) {
      this.domainData.outputs.push(ev.target.value);
    } else {
      this.domainData.outputs = this.domainData.outputs.filter((port) => ev.target.value !== port);
    }
    this.requestUpdate();
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

  private get _transitionDisabled(): boolean {
    const outputPortValues = this._outputPorts.map((port) => port.value);
    return (
      this.domainData.outputs.filter((output) => outputPortValues.includes(output)).length === 0
    );
  }

  static get styles(): CSSResultGroup[] {
    return [
      haStyleDialog,
      css`
        .registers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 4px;
        }
        ha-md-select,
        ha-textfield {
          display: block;
          margin-bottom: 8px;
        }
        .ports {
          margin-top: 10px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-config-scene-element": LCNConfigSceneElement;
  }
}
