import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@polymer/paper-input/paper-input";
import "../../../../../../components/ha-icon-button";
import { css, html, LitElement, TemplateResult, CSSResult } from "lit";
import { customElement, property, query } from "lit/decorators";
import { haStyleDialog } from "@ha/resources/styles";
import { HomeAssistant } from "@ha/types";
import { LcnEntityDialogParams } from "./show-dialog-create-entity";
import { LcnEntityConfig } from "types/lcn";
import { fireEvent } from "@ha/common/dom/fire_event";
import { HaDialog } from "@ha/components/ha-dialog";
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

  @query("ha-dialog", true) private _dialog!: HaDialog;

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
    fireEvent(this._dialog as HTMLElement, "iron-resize");
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <ha-dialog open scrimClickAction heading="Create new entity">
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

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        app-toolbar {
          color: var(--primary-text-color);
          background-color: var(--secondary-background-color);
          margin: 0;
          padding: 0 16px;
        }

        app-toolbar [main-title] {
          /* Design guideline states 24px, changed to 16 to align with state info */
          margin-left: 16px;
          line-height: 1.3em;
          max-height: 2.6em;
          overflow: hidden;
          /* webkit and blink still support simple multiline text-overflow */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          text-overflow: ellipsis;
        }

        @media all and (min-width: 451px) and (min-height: 501px) {
          .main-title {
            pointer-events: auto;
            cursor: default;
          }
        }

        ha-dialog {
          width: 450px;
          max-height: none !important;
        }

        /* overrule the ha-style-dialog max-height on small screens */
        @media all and (max-width: 450px), all and (max-height: 500px) {
          app-toolbar {
            background-color: var(--app-header-background-color);
            color: var(--app-header-text-color, white);
          }
          ha-dialog {
            height: 100%;
            max-height: 100% !important;
            width: 100% !important;
            border-radius: 0px;
            position: fixed !important;
            margin: 0;
          }
          ha-dialog::before {
            content: "";
            position: fixed;
            z-index: -1;
            top: 0px;
            left: 0px;
            right: 0px;
            bottom: 0px;
            background-color: inherit;
          }
        }

        :host([rtl]) app-toolbar {
          direction: rtl;
          text-align: right;
        }
        :host {
          --paper-font-title_-_white-space: normal;
        }
      `,
      css`
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
