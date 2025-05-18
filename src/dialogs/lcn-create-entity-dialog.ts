import { consume } from "@lit-labs/context";
import { deviceConfigsContext } from "components/context";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import { fireEvent } from "@ha/common/dom/fire_event";
import type { HaSelect } from "@ha/components/ha-select";
import type { CSSResultGroup } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { createCloseHeading } from "@ha/components/ha-dialog";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
import { haStyleDialog } from "@ha/resources/styles";
import type { HomeAssistant } from "@ha/types";
import type { LCN, LcnDeviceConfig, LcnEntityConfig } from "types/lcn";
import { addressToString, stringToAddress, addressToHumanString } from "helpers/address_conversion";
import "./lcn-config-binary-sensor";
import "./lcn-config-climate";
import "./lcn-config-cover";
import "./lcn-config-light";
import "./lcn-config-scene";
import "./lcn-config-sensor";
import "./lcn-config-switch";
import type { HaTextField } from "@ha/components/ha-textfield";
import { showAlertDialog } from "@ha/dialogs/generic/show-dialog-box";
import type { LcnEntityDialogParams } from "./show-dialog-create-entity";

interface DomainItem {
  name: string;
  domain: string;
}

@customElement("lcn-create-entity-dialog")
export class CreateEntityDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @state() private _params?: LcnEntityDialogParams;

  @state() private _name = "";

  @state() public domain = "binary_sensor";

  @state() private _invalid = true;

  @state() private _deviceConfig?: LcnDeviceConfig;

  @state()
  @consume({ context: deviceConfigsContext, subscribe: true })
  deviceConfigs!: LcnDeviceConfig[];

  private get _domains(): DomainItem[] {
    return [
      { name: this.lcn.localize("binary-sensor"), domain: "binary_sensor" },
      { name: this.lcn.localize("climate"), domain: "climate" },
      { name: this.lcn.localize("cover"), domain: "cover" },
      { name: this.lcn.localize("light"), domain: "light" },
      { name: this.lcn.localize("scene"), domain: "scene" },
      { name: this.lcn.localize("sensor"), domain: "sensor" },
      { name: this.lcn.localize("switch"), domain: "switch" },
    ];
  }

  public async showDialog(params: LcnEntityDialogParams): Promise<void> {
    this._params = params;
    this.lcn = params.lcn;
    this._name = "";
    this._invalid = true;
    this._deviceConfig = params.deviceConfig;

    if (!this._deviceConfig) this._deviceConfig = this.deviceConfigs[0];

    await this.updateComplete;
  }

  protected render() {
    if (!this._params || !this.lcn || !this._deviceConfig) {
      return nothing;
    }
    return html`
      <ha-dialog
        open
        scrimClickAction
        escapeKeyAction
        .heading=${createCloseHeading(
          this.hass,
          this.lcn.localize("dashboard-entities-dialog-create-title"),
        ) as unknown as string}
        @closed=${this._closeDialog}
      >
        <ha-select
          id="device-select"
          .label=${this.lcn.localize("device")}
          .value=${this._deviceConfig ? addressToString(this._deviceConfig.address) : undefined}
          fixedMenuPosition
          @selected=${this._deviceChanged}
          @closed=${stopPropagation}
        >
          ${this.deviceConfigs.map(
            (deviceConfig) => html`
              <ha-list-item .value=${addressToString(deviceConfig.address)}>
                <div class="primary">${deviceConfig.name}</div>
                <div class="secondary">(${addressToHumanString(deviceConfig.address)})</div>
              </ha-list-item>
            `,
          )}
        </ha-select>

        <ha-select
          id="domain-select"
          .label=${this.lcn.localize("domain")}
          .value=${this.domain}
          fixedMenuPosition
          @selected=${this._domainChanged}
          @closed=${stopPropagation}
        >
          ${this._domains.map(
            (domain) => html`
              <ha-list-item .value=${domain.domain}> ${domain.name} </ha-list-item>
            `,
          )}
        </ha-select>
        <ha-textfield
          id="name-input"
          label=${this.lcn.localize("name")}
          type="string"
          @input=${this._nameChanged}
        ></ha-textfield>

        ${this._renderDomain(this.domain)}

        <div class="buttons">
          <mwc-button
            slot="secondaryAction"
            @click=${this._closeDialog}
            .label=${this.lcn.localize("dismiss")}
          ></mwc-button>
          <mwc-button
            slot="primaryAction"
            .disabled=${this._invalid}
            @click=${this._create}
            .label=${this.lcn.localize("create")}
          ></mwc-button>
        </div>
      </ha-dialog>
    `;
  }

  private _renderDomain(domain: string) {
    if (!(this._params && this._deviceConfig)) {
      return nothing;
    }
    switch (domain) {
      case "binary_sensor":
        return html`<lcn-config-binary-sensor-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
        ></lcn-config-binary-sensor-element>`;
      case "climate":
        return html`<lcn-config-climate-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .softwareSerial=${this._deviceConfig.software_serial}
          @validity-changed=${this._validityChanged}
        ></lcn-config-climate-element>`;
      case "cover":
        return html`<lcn-config-cover-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
        ></lcn-config-cover-element>`;
      case "light":
        return html`<lcn-config-light-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          @validity-changed=${this._validityChanged}
        ></lcn-config-light-element>`;
      case "scene":
        return html`<lcn-config-scene-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          @validity-changed=${this._validityChanged}
        ></lcn-config-scene-element>`;
      case "sensor":
        return html`<lcn-config-sensor-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .softwareSerial=${this._deviceConfig.software_serial}
        ></lcn-config-sensor-element>`;
      case "switch":
        return html`<lcn-config-switch-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
        ></lcn-config-switch-element>`;
      default:
        return nothing;
    }
  }

  private _deviceChanged(ev: CustomEvent): void {
    const target = ev.target as HaTextField;
    const address = stringToAddress(target.value);
    this._deviceConfig = this.deviceConfigs.find(
      (deviceConfig) =>
        deviceConfig.address[0] === address[0] &&
        deviceConfig.address[1] === address[1] &&
        deviceConfig.address[2] === address[2],
    );
  }

  private _nameChanged(ev: CustomEvent): void {
    const target = ev.target as HaTextField;
    this._name = target.value;
    this._validityChanged(
      new CustomEvent("validity-changed", {
        detail: !this._name,
      }),
    );
  }

  private _validityChanged(ev: CustomEvent): void {
    this._invalid = ev.detail;
  }

  private async _create(): Promise<void> {
    const domainElement = this.shadowRoot?.querySelector<any>("#domain");

    const values: Partial<LcnEntityConfig> = {
      name: this._name ? this._name : this.domain,
      address: this._deviceConfig!.address,
      domain: this.domain,
      domain_data: domainElement.domainData,
    };

    if (!(await this._params!.createEntity(values))) {
      await showAlertDialog(this, {
        title: this.lcn.localize("dashboard-entities-dialog-add-alert-title"),
        text: `${this.lcn.localize("dashboard-entities-dialog-add-alert-text")}
              ${this.lcn.localize("dashboard-entities-dialog-add-alert-hint")}`,
      });
      return;
    }

    this._closeDialog();
  }

  private _closeDialog(): void {
    this._params = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  private _domainChanged(ev: CustomEvent) {
    const target = ev.target as HaSelect;
    this.domain = target.value;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      css`
        ha-dialog {
          --mdc-dialog-max-width: 500px;
          --dialog-z-index: 10;
        }
        ha-select,
        ha-textfield {
          display: block;
          margin-bottom: 8px;
        }
        #name-input {
          margin-bottom: 25px;
        }
        .buttons {
          display: flex;
          justify-content: space-between;
          padding: 8px;
        }
        .secondary {
          color: var(--secondary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-create-entity-dialog": CreateEntityDialog;
  }
}
