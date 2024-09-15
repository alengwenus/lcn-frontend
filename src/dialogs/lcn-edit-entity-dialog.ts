import "@ha/components/ha-icon-button";
import "@ha/components/ha-list-item"
import "@ha/components/ha-select"
import "@ha/components/ha-textfield";
import { fireEvent } from "@ha/common/dom/fire_event";
import { css, html, LitElement, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, query } from "lit/decorators";
import { createCloseHeading } from "@ha/components/ha-dialog";
import { haStyleDialog } from "@ha/resources/styles";
import { HomeAssistant } from "@ha/types";
import { LcnEntityDialogParams } from "./show-dialog-edit-entity";
import { LCN, LcnEntityConfig } from "types/lcn";
import "./lcn-config-binary-sensor";
import "./lcn-config-climate";
import "./lcn-config-cover";
import "./lcn-config-light";
import "./lcn-config-scene";
import "./lcn-config-sensor";
import "./lcn-config-switch";
import { showAlertDialog } from "@ha/dialogs/generic/show-dialog-box";

interface DomainItem {
  name: string;
  domain: string;
}

@customElement("lcn-edit-entity-dialog")
export class EditEntityDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() private _params?: LcnEntityDialogParams;

  @property() private _invalid = false;

  @query("#domain") private _domainElement;

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
  };

  public async showDialog(params: LcnEntityDialogParams): Promise<void> {
    this._params = params;
    this.lcn = params.lcn;
    await this.updateComplete;
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <ha-dialog
        open
        scrimClickAction
        escapeKeyAction
        .heading=${createCloseHeading(
          this.hass,
          this.lcn.localize("dashboard-entities-dialog-edit-title")
          )}
        @closed=${this._closeDialog}
      >
        <ha-select
          id="domain-select"
          .label=${this.lcn.localize("domain")}
          .value=${this._params.entity.domain}
          fixedMenuPosition
          .disabled=${true}
          @closed=${(ev: CustomEvent) => ev.stopPropagation()}
        >
          ${this._domains.map(
            (domain) => html`
              <ha-list-item .value=${domain.domain}>
                ${domain.name}
              </ha-list-item>
            `
          )}
        </ha-select>

        <ha-textfield
          id="name-input"
          .label=${this.lcn.localize("name")}
          .value=${this._params.entity.name}
          .disabled=${true}
        ></ha-textfield>

        ${this.renderDomain(this._params.entity.domain)}

        <div class="buttons">
          <mwc-button
            slot="secondaryAction"
            @click=${this._closeDialog}
            .label=${this.lcn.localize("dismiss")}
          ></mwc-button>
          <mwc-button
            slot="primaryAction"
            .disabled=${this._invalid}
            @click=${this._update}
            .label=${this.lcn.localize("update")}
          ></mwc-button>
        </div>
      </ha-dialog>
    `;
  }

  private renderDomain(domain: string): TemplateResult {
    switch (domain) {
      case "binary_sensor":
        return html`<lcn-config-binary-sensor-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .domainData =${this._params!.entity.domain_data}
        ></lcn-config-binary-sensor-element>`;
      case "climate":
        return html`<lcn-config-climate-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .domainData =${this._params!.entity.domain_data}
          .softwareSerial=${this._params?.device.software_serial}
          @validity-changed=${this._validityChanged}
        ></lcn-config-climate-element>`;
      case "cover":
        return html`<lcn-config-cover-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .domainData =${this._params!.entity.domain_data}
          .softwareSerial=${this._params?.device.software_serial}
        ></lcn-config-cover-element>`;
      case "light":
        return html`<lcn-config-light-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .domainData =${this._params!.entity.domain_data}
          @validity-changed=${this._validityChanged}
        ></lcn-config-light-element>`;
      case "scene":
        return html`<lcn-config-scene-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .domainData =${this._params!.entity.domain_data}
          @validity-changed=${this._validityChanged}
        ></lcn-config-scene-element>`;
      case "sensor":
        return html`<lcn-config-sensor-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .domainData =${this._params!.entity.domain_data}
          .softwareSerial=${this._params?.device.software_serial}
        ></lcn-config-sensor-element>`;
      case "switch":
        return html`<lcn-config-switch-element
          id="domain"
          .hass=${this.hass}
          .lcn=${this.lcn}
          .domainData =${this._params!.entity.domain_data}
        ></lcn-config-switch-element>`;
      default:
        return html``;
    }
  }

  private _validityChanged(ev: CustomEvent): void {
    this._invalid = ev.detail;
  }

  private async _update(): Promise<void> {
    const values: Partial<LcnEntityConfig> = {
      name: this._params!.entity.name,
      address: this._params!.device.address,
      domain: this._params!.entity.domain,
      domain_data: this._domainElement.domainData,
    };


    if (!await this._params!.editEntity(values)) {
      await showAlertDialog(this, {
        title: this.lcn.localize("dashboard-entities-dialog-add-alert-title"),
        text: `${this.lcn.localize("dashboard-entities-dialog-add-alert-text")}
              ${this.lcn.localize("dashboard-entities-dialog-add-alert-hint")}`,
      });
      return;
    };

    this._closeDialog();
  }

  private _closeDialog(): void {
    this._params = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
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
    "lcn-edit-entity-dialog": EditEntityDialog;
  }
}
