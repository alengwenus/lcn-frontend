import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@polymer/paper-input/paper-input";
import "@ha/components/ha-icon-button";
import { css, html, LitElement, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property } from "lit/decorators";
import { createCloseHeading } from "@ha/components/ha-dialog";
import { haStyleDialog } from "@ha/resources/styles";
import { HomeAssistant } from "@ha/types";
import { LcnEntityDialogParams } from "./show-dialog-create-entity";
import { LcnEntityConfig } from "types/lcn";
import "./lcn-config-binary-sensor";
import "./lcn-config-climate";
import "./lcn-config-cover";
import "./lcn-config-light";
import "./lcn-config-scene";
import "./lcn-config-sensor";
import "./lcn-config-switch";

@customElement("lcn-create-entity-dialog")
export class CreateEntityDialog extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() private _params?: LcnEntityDialogParams;

  @property() private _name = "";

  @property() public domain = "switch";

  @property() private _invalid = false;

  private _domains: string[] = [
    "binary_sensor",
    "climate",
    "cover",
    "light",
    "scene",
    "sensor",
    "switch",
  ];

  public async showDialog(params: LcnEntityDialogParams): Promise<void> {
    this._params = params;
    await this.updateComplete;
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <ha-dialog
        open
        .heading=${createCloseHeading(
          this.hass,
          "Create new entity"
        )}
        @closed=${this._closeDialog}
      >
        <div>
          <paper-dropdown-menu
            label="Domain"
            @selected-item-changed=${this._domain_changed}
          >
            <paper-listbox slot="dropdown-content" selected="0">
              ${this._domains.map(
                (domain) =>
                  html`<paper-item .itemValue=${domain}>${domain}</paper-item>`
              )}
            </paper-listbox>
          </paper-dropdown-menu>
          <paper-input
            label="Name"
            placeholder=${this.domain}
            max-length="20"
            @value-changed=${this._nameChanged}
          >
          </paper-input>
          ${this.renderDomain(this.domain)}
        </div>

        <div class="buttons">
          <mwc-button @click=${this._closeDialog}> Dismiss </mwc-button>
          <mwc-button .disabled=${this._invalid} @click=${this._create}>
            Create
          </mwc-button>
        </div>
      </ha-dialog>
    `;
  }

  private renderDomain(domain) {
    switch (domain) {
      case "binary_sensor":
        return html`<lcn-config-binary-sensor-element
          id="domain"
          .hass=${this.hass}
        ></lcn-config-binary-sensor-element>`;
      case "climate":
        return html`<lcn-config-climate-element
          id="domain"
          .hass=${this.hass}
          .softwareSerial=${this._params?.device.software_serial}
          @validity-changed=${this._validityChanged}
        ></lcn-config-climate-element>`;
      case "cover":
        return html`<lcn-config-cover-element
          id="domain"
          .hass=${this.hass}
          .softwareSerial=${this._params?.device.software_serial}
        ></lcn-config-cover-element>`;
      case "light":
        return html`<lcn-config-light-element
          id="domain"
          .hass=${this.hass}
          @validity-changed=${this._validityChanged}
        ></lcn-config-light-element>`;
      case "scene":
        return html`<lcn-config-scene-element
          id="domain"
          .hass=${this.hass}
          @validity-changed=${this._validityChanged}
        ></lcn-config-scene-element>`;
      case "sensor":
        return html`<lcn-config-sensor-element
          id="domain"
          .hass=${this.hass}
          .softwareSerial=${this._params?.device.software_serial}
        ></lcn-config-sensor-element>`;
      case "switch":
        return html`<lcn-config-switch-element
          id="domain"
          .hass=${this.hass}
        ></lcn-config-switch-element>`;
      default:
        return html``;
    }
  }

  private _nameChanged(ev: CustomEvent): void {
    this._name = ev.detail.value;
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
    await this._params!.createEntity(values);
    this._closeDialog();
  }

  private _closeDialog(): void {
    this._params = undefined;
  }

  private _domain_changed(ev: CustomEvent) {
    if (!ev.detail.value) {
      return;
    }
    this.domain = ev.detail.value.itemValue;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      css`
        .form {
          padding-bottom: 24px;
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
