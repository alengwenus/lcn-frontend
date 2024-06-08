import { haStyle } from "@ha/resources/styles";
import "@material/mwc-button";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@ha/components/ha-fab";
import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import { css, html, LitElement, PropertyValues, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators";
import { mdiPlus } from "@mdi/js";
import type { HomeAssistant, Route } from "@ha/types";
import { showAlertDialog } from "@ha/dialogs/generic/show-dialog-box";
import "@ha/layouts/hass-tabs-subpage";
import type { PageNavigation } from "@ha/layouts/hass-tabs-subpage";
import "@ha/panels/config/ha-config-section";
import "@ha/layouts/hass-loading-screen";
import "@ha/components/ha-card";
import "@ha/components/ha-svg-icon";
import { LCN, fetchDevices, scanDevices, addDevice, LcnDeviceConfig } from "types/lcn";
import { ConfigEntry } from "@ha/data/config_entries";
import { ProgressDialog } from "./dialogs/progress-dialog";
import {
  loadLCNCreateDeviceDialog,
  showLCNCreateDeviceDialog,
} from "./dialogs/show-dialog-create-device";
import { loadProgressDialog, showProgressDialog } from "./dialogs/show-dialog-progress";
import "./lcn-devices-data-table";

@customElement("lcn-config-dashboard")
export class LCNConfigDashboard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Array, reflect: false }) public tabs: PageNavigation[] = [];

  @state() private _deviceConfigs: LcnDeviceConfig[] = [];

  protected async firstUpdated(changedProperties: PropertyValues): Promise<void> {
    super.firstUpdated(changedProperties);
    loadProgressDialog();
    loadLCNCreateDeviceDialog();
    this.addEventListener("lcn-config-changed", async () => {
      this._fetchDevices(this.lcn.config_entry);
    });
    await this._fetchDevices(this.lcn.config_entry);
  }

  protected render(): TemplateResult {
    if (!(this.hass && this.lcn)) {
      return html` <hass-loading-screen></hass-loading-screen> `;
    }
    return html`
      <hass-tabs-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${this.tabs}
      >
        <span slot="header"> ${this.lcn.localize("dashboard-devices-title")} </span>
        <ha-config-section .narrow=${this.narrow}>
          <span slot="introduction"> ${this.renderIntro()} </span>

          <div id="box">
            <mwc-button id="scan_devices" raised @click=${this._scanDevices}>
              ${this.lcn.localize("dashboard-devices-scan")}
            </mwc-button>
          </div>

          <ha-card
            header="${this.lcn.localize("dashboard-devices-for-host")}: ${this.lcn.config_entry
              .title}"
          >
            <lcn-devices-data-table
              .hass=${this.hass}
              .lcn=${this.lcn}
              .devices=${this._deviceConfigs}
              .narrow=${this.narrow}
            ></lcn-devices-data-table>
          </ha-card>
        </ha-config-section>
        <ha-fab
          slot="fab"
          @click=${this._addDevice}
          .label=${this.lcn.localize("dashboard-devices-add")}
          extended
        >
          <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
        </ha-fab>
      </hass-tabs-subpage>
    `;
  }

  private renderIntro(): TemplateResult {
    return html`
      <h2>${this.lcn.localize("dashboard-devices-introduction")}</h2>
      ${this.lcn.localize("dashboard-devices-introduction-help-1")} <br />
      <details>
        <summary>${this.lcn.localize("more-help")}</summary>
        <ul>
          <li>${this.lcn.localize("dashboard-devices-introduction-help-2")}</li>
          <li>${this.lcn.localize("dashboard-devices-introduction-help-3")}</li>
          <li>${this.lcn.localize("dashboard-devices-introduction-help-4")}</li>
          <li>${this.lcn.localize("dashboard-devices-introduction-help-5")}</li>
        </ul>
      </details>
    `;
  }

  private async _fetchDevices(config_entry: ConfigEntry) {
    this._deviceConfigs = await fetchDevices(this.hass!, config_entry);
  }

  private async _scanDevices() {
    const dialog: () => ProgressDialog | undefined = showProgressDialog(this, {
      title: this.lcn.localize("dashboard-dialog-scan-devices-title"),
      text: this.lcn.localize("dashboard-dialog-scan-devices-text"),
    });

    this._deviceConfigs = await scanDevices(this.hass!, this.lcn.config_entry);
    await dialog()!.closeDialog();
  }

  private _addDevice() {
    showLCNCreateDeviceDialog(this, {
      lcn: this.lcn,
      createDevice: (deviceParams) => this._createDevice(deviceParams),
    });
  }

  private async _createDevice(deviceParams: Partial<LcnDeviceConfig>) {
    const dialog: () => ProgressDialog | undefined = showProgressDialog(this, {
      title: this.lcn.localize("dashboard-devices-dialog-request-info-title"),
      text: html`
        ${this.lcn.localize("dashboard-devices-dialog-request-info-text")}
        <br />
        ${this.lcn.localize("dashboard-devices-dialog-request-info-hint")}
      `,
    });

    if (!(await addDevice(this.hass, this.lcn.config_entry, deviceParams))) {
      dialog()!.closeDialog();
      await showAlertDialog(this, {
        title: this.lcn.localize("dashboard-devices-dialog-add-alert-title"),
        text: html`${this.lcn.localize("dashboard-devices-dialog-add-alert-text")}
          (${deviceParams.address![2] ? this.lcn.localize("group") : this.lcn.localize("module")}:
          ${this.lcn.localize("segment")} ${deviceParams.address![0]}, ${this.lcn.localize("id")}
          ${deviceParams.address![1]})
          <br />
          ${this.lcn.localize("dashboard-devices-dialog-add-alert-hint")}`,
      });
      return;
    }
    dialog()!.closeDialog();
    this._fetchDevices(this.lcn.config_entry);
  }

  static get styles(): CSSResultGroup[] {
    return [
      haStyle,
      css`
        #box {
          display: flex;
          justify-content: space-between;
        }
        #scan-devices {
          display: inline-block;
          margin-top: 20px;
          justify-content: center;
        }
        summary:hover {
          text-decoration: underline;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-config-dashboard": LCNConfigDashboard;
  }
}
