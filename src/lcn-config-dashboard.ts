import "@material/mwc-button";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import "@ha/components/ha-fab"
import {
  css,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
  CSSResult,
} from "lit";
import { customElement, property } from "lit/decorators";
import { mdiPlus } from "@mdi/js";
import { HomeAssistant, Route } from "@ha/types";
import { showAlertDialog } from "@ha/dialogs/generic/show-dialog-box";
import "@ha/layouts/hass-tabs-subpage";
import type { PageNavigation } from "@ha/layouts/hass-tabs-subpage";
import "@ha/panels/config/ha-config-section";
import "@ha/layouts/hass-loading-screen";
import "@ha/components/ha-card";
import "@ha/components/ha-svg-icon";
import { haStyle } from "@ha/resources/styles";
import { ProgressDialog } from "./dialogs/progress-dialog";
import {
  loadLCNCreateDeviceDialog,
  showLCNCreateDeviceDialog,
} from "./dialogs/show-dialog-create-device";
import {
  loadProgressDialog,
  showProgressDialog,
} from "./dialogs/show-dialog-progress";
import "./lcn-devices-data-table";
import {
  LCN,
  fetchHosts,
  fetchDevices,
  scanDevices,
  addDevice,
  LcnHost,
  LcnDeviceConfig,
} from "types/lcn";

@customElement("lcn-config-dashboard")
export class LCNConfigDashboard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @property({ type: Array, reflect: false }) public tabs: PageNavigation[] = [];

  @property() private _hosts: LcnHost[] = [];

  @property() private _deviceConfigs: LcnDeviceConfig[] = [];

  protected async firstUpdated(
    changedProperties: PropertyValues
  ): Promise<void> {
    super.firstUpdated(changedProperties);
    await this._fetchHosts();
    loadProgressDialog();
    loadLCNCreateDeviceDialog();

    this.addEventListener("lcn-config-changed", async () => {
      this._fetchDevices(this.lcn.host);
    });
  }

  protected render(): TemplateResult {
    if (!(this.hass && this.lcn)) {
      return html` <hass-loading-screen></hass-loading-screen> `;
    }
    return html`
      <hass-tabs-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        back-path="/lcn"
        .route=${this.route}
        .tabs=${this.tabs}
      >
        <ha-config-section
          .narrow=${this.narrow}>
          <span slot="header">
            ${this.lcn.localize("dashboard-devices-title")}
          </span>

          <span slot="introduction">
            ${this.lcn.localize("dashboard-devices-introduction")}
          </span>

          <div id="box">
            <div id="hosts-dropdown">
              <paper-dropdown-menu
                label=${this.lcn.localize("dashboard-devices-hosts")}
                @selected-item-changed=${this._hostChanged}
              >
                <paper-listbox
                  slot="dropdown-content"
                  selected=${this._hosts.findIndex(
                    (host) => host.id === this.lcn.host.id
                  )}
                >
                  ${this._hosts.map(
                    (host) => html`
                      <paper-item .itemValue=${host}>${host.name}</paper-item>
                    `
                  )}
                </paper-listbox>
              </paper-dropdown-menu>
            </div>

            <div id="scan-devices">
              <mwc-button
                raised
                @click=${this._scanDevices}
              >
                ${this.lcn.localize("dashboard-devices-scan")}
              </mwc-button>
            </div>
          </div>

          <ha-card
            header="${this.lcn.localize("dashboard-devices-for-host")}: ${this.lcn.host.name}">
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

  private _hostChanged(ev: CustomEvent) {
    if (!ev.detail.value) {
      return;
    }
    this.lcn.host = ev.detail.value.itemValue;
    this._fetchDevices(this.lcn.host);
  }

  private async _fetchHosts() {
    this._hosts = await fetchHosts(this.hass!);
  }

  private async _fetchDevices(host: LcnHost) {
    this._deviceConfigs = await fetchDevices(this.hass!, host.id);
  }

  private async _scanDevices() {
    const dialog: () => ProgressDialog | undefined = showProgressDialog(this, {
      title: this.lcn.localize("dashboard-dialog-scan-devices-title"),
      text: this.lcn.localize("dashboard-dialog-scan-devices-text")
    });

    this._deviceConfigs = await scanDevices(this.hass!, this.lcn.host.id);
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

    if (!await addDevice(this.hass, this.lcn.host.id, deviceParams)) {
      dialog()!.closeDialog();
      await showAlertDialog(this, {
        title: this.lcn.localize("dashboard-devices-dialog-add-alert-title"),
        text: html`${this.lcn.localize("dashboard-devices-dialog-add-alert-text")}
              (${deviceParams.address![2]
                ? this.lcn.localize("group")
                : this.lcn.localize("module")}:
              ${this.lcn.localize("segment")} ${deviceParams.address![0]},
              ${this.lcn.localize("id")} ${deviceParams.address![1]})
              <br />
              ${this.lcn.localize("dashboard-devices-dialog-add-alert-hint")}`,
      });
      return;
    }
    dialog()!.closeDialog();
    this._fetchDevices(this.lcn.host);
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        #box {
          display: flex;
          justify-content: space-between;
        }
        #hosts-dropdown {
          width: 40%;
          display: inline-block;
        }
        #scan-devices {
          display: inline-block;
          margin-top: 20px;
          justify-content: center;
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
