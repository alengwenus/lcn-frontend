import "@ha/components/ha-icon-button";
import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import { fireEvent } from "@ha/common/dom/fire_event";
import type { HaSelect } from "@ha/components/ha-select";
import { css, html, LitElement, CSSResultGroup, nothing } from "lit";
import { customElement, property, query } from "lit/decorators";
import { createCloseHeading } from "@ha/components/ha-dialog";
import { stopPropagation } from "@ha/common/dom/stop_propagation";
import { haStyleDialog } from "@ha/resources/styles";
import type { HomeAssistant } from "@ha/types";
import type { LCN, LcnEntityConfig } from "types/lcn";
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

  @property() private _params?: LcnEntityDialogParams;

  @property() private _name = "";

  @property() public domain = "binary_sensor";

  @property() private _invalid = false;

  @query("#name-input") private _nameInput!: HaTextField;

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
    await this.updateComplete;
  }

  protected render() {
    if (!this._params) {
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
        )}
        @closed=${this._closeDialog}
      >
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
          placeholder=${this.domain}
          type="string"
          maxLength="20"
          @change=${this._nameChanged}
        ></ha-textfield>

        ${this.renderDomain(this.domain)}

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

  private renderDomain(domain: string) {
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
          .softwareSerial=${this._params?.device.software_serial}
          @validity-changed=${this._validityChanged}
        ></lcn-config-climate-element>`;
      case "cover":
        return html`<lcn-config-cover-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .softwareSerial=${this._params?.device.software_serial}
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
          .softwareSerial=${this._params?.device.software_serial}
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

  private _nameChanged(ev: CustomEvent): void {
    const target = ev.target as HaTextField;
    this._name = target.value;
  }

  private _validityChanged(ev: CustomEvent): void {
    this._invalid = ev.detail;
  }

  private async _create(): Promise<void> {
    const domainElement = this.shadowRoot?.querySelector<any>("#domain");

    const values: Partial<LcnEntityConfig> = {
      name: this._name ? this._name : this.domain,
      address: this._params!.device.address,
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
    this._nameInput.value = "";
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
        .buttons {
          display: flex;
          justify-content: space-between;
          padding: 8px;
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
