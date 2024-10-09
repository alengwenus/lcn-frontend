import { haStyle } from "@ha/resources/styles";
import "@material/mwc-button";
import "@ha/components/ha-clickable-list-item";
import "@ha/components/ha-fab";
import "@ha/components/ha-button-menu";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-list-item";
import "@ha/components/ha-select";
import "@ha/components/ha-md-button-menu";
import "@ha/layouts/hass-tabs-subpage-data-table";
import { storage } from "@ha/common/decorators/storage";
import { css, html, LitElement, PropertyValues, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators";
import { mdiPlus, mdiDelete, mdiDotsVertical, mdiMenuDown } from "@mdi/js";
import type { HomeAssistant, Route } from "@ha/types";
import { showAlertDialog, showConfirmationDialog } from "@ha/dialogs/generic/show-dialog-box";
import "@ha/layouts/hass-tabs-subpage";
import type { PageNavigation } from "@ha/layouts/hass-tabs-subpage";
import "@ha/panels/config/ha-config-section";
import "@ha/layouts/hass-loading-screen";
import "@ha/components/ha-card";
import "@ha/components/ha-svg-icon";
import memoizeOne from "memoize-one";
import { LCN, fetchDevices, scanDevices, deleteDevice, addDevice, LcnDeviceConfig, LcnAddress } from "types/lcn";
import { address_to_string, string_to_address } from "helpers/address_conversion";
import { ConfigEntry } from "@ha/data/config_entries";
import type {
  DataTableColumnContainer,
  SelectionChangedEvent,
  SortingChangedEvent,
} from "@ha/components/data-table/ha-data-table";
import { navigate } from "@ha/common/navigate";
import type { HASSDomEvent } from "@ha/common/dom/fire_event";
import { ProgressDialog } from "./dialogs/progress-dialog";
import {
  loadLCNCreateDeviceDialog,
  showLCNCreateDeviceDialog,
} from "./dialogs/show-dialog-create-device";
import { loadProgressDialog, showProgressDialog } from "./dialogs/show-dialog-progress";
import "./lcn-devices-data-table";
import "@ha/panels/config/integrations/ha-integration-overflow-menu";

interface DeviceRowData extends LcnDeviceConfig {
  segment_id: number;
  address_id: number;
  type: string;
  delete: LcnDeviceConfig;
};


@customElement("lcn-config-dashboard")
export class LCNConfigDashboard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Array, reflect: false }) public tabs: PageNavigation[] = [];

  @state() private deviceConfigs: LcnDeviceConfig[] = [];

  @state() private _selected: string[] = [];

  @storage({
    storage: "sessionStorage",
    key: "lcn-devices-table-search",
    state: true,
    subscribe: false,
  })
  private _filter: string = "";

  @storage({
    storage: "sessionStorage",
    key: "lcn-devices-table-sort",
    state: false,
    subscribe: false,
  })
  private _activeSorting?: SortingChangedEvent;

  @storage({
    key: "lcn-devices-table-column-order",
    state: false,
    subscribe: false,
  })
  private _activeColumnOrder?: string[];

  @storage({
    key: "lcn-devices-table-hidden-columns",
    state: false,
    subscribe: false,
  })
  private _activeHiddenColumns?: string[];

  private _devices = memoizeOne((devices: LcnDeviceConfig[]) => {
    const deviceRowData: DeviceRowData[] = devices.map((device) => ({
      ...device,
      unique_id: address_to_string(device.address),
      segment_id: device.address[0],
      address_id: device.address[1],
      type: device.address[2] ? this.lcn.localize("group") : this.lcn.localize("module"),
      delete: device,
    }));
    return deviceRowData;
  });

  private _columns = memoizeOne(
    (): DataTableColumnContainer<DeviceRowData> => ({
      name: {
        main: true,
        title: this.lcn.localize("name"),
        sortable: true,
        filterable: true,
        direction: "asc",
        flex: 2,
      },
      segment_id: {
        title: this.lcn.localize("segment"),
        sortable: true,
        filterable: true,
      },
      address_id: {
        title: this.lcn.localize("id"),
        sortable: true,
        filterable: true,
      },
      type: {
        title: this.lcn.localize("type"),
        sortable: true,
        filterable: true,
      },
      delete: {
        title: this.lcn.localize("delete"),
        sortable: false,
        showNarrow: true,
        minWidth: "80px",
        template: (device: LcnDeviceConfig) => {
          const handler = (ev) => this._onDeviceDelete(ev, device);
          return html`
            <ha-icon-button
              .label=${this.lcn.localize("dashboard-devices-table-delete")}
              .path=${mdiDelete}
              @click=${handler}
            ></ha-icon-button>
          `;
        },
      },
    })
  );

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
      <hass-tabs-subpage-data-table
        .hass=${this.hass}
        .narrow=${this.narrow}
        .back-path="/config/integrations/integration/lcn"
        .route=${this.route}
        .tabs=${this.tabs}
        .columns=${this._columns()}
        .data=${this._devices(this.deviceConfigs)}
        selectable
        .selected=${this._selected.length}
        .initialSorting=${this._activeSorting}
        .columnOrder=${this._activeColumnOrder}
        .hiddenColumns=${this._activeHiddenColumns}
        @columns-changed=${this._handleColumnsChanged}
        @sorting-changed=${this._handleSortingChanged}
        @selection-changed=${this._handleSelectionChanged}
        clickable
        .filter=${this._filter}
        @search-changed=${this._handleSearchChange}
        @row-click=${this._rowClicked}
        id="unique_id"
        .hasfab
        class=${this.narrow ? "narrow" : ""}
      >
        <ha-integration-overflow-menu
          .hass=${this.hass}
          slot="toolbar-icon"
        ></ha-integration-overflow-menu>

        <ha-md-button-menu has-overflow slot="selection-bar">
          ${html`
            <ha-icon-button
              .path=${mdiDotsVertical}
              .label="more"
              slot="trigger"
            ></ha-icon-button>
          `}

          <ha-md-menu-item>
            <ha-svg-icon slot="start" .path=${mdiDelete}></ha-svg-icon>
            <div slot="headline">
              Remove devices
            </div>
          </ha-md-menu-item>

        </ha-md-button-menu>

        <ha-fab
          slot="fab"
          .label=${this.lcn.localize("dashboard-devices-add")}
          extended
          @click=${this._addDevice}
        >
          <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
        </ha-fab>
      </hass-tabs-subpage-data-table>
    `;
  }

  private _dispatchConfigurationChangedEvent() {
    this.dispatchEvent(
      new CustomEvent("lcn-config-changed", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _rowClicked(ev: CustomEvent) {
    this.lcn.address = string_to_address(ev.detail.id);
    navigate("/lcn/entities");
  }

  private async _fetchDevices(config_entry: ConfigEntry) {
    this.deviceConfigs = await fetchDevices(this.hass!, config_entry);
  }

  private async _scanDevices() {
    const dialog: () => ProgressDialog | undefined = showProgressDialog(this, {
      title: this.lcn.localize("dashboard-dialog-scan-devices-title"),
      text: this.lcn.localize("dashboard-dialog-scan-devices-text"),
    });

    this.deviceConfigs = await scanDevices(this.hass!, this.lcn.config_entry);
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

  private _onDeviceDelete(ev, device: LcnDeviceConfig) {
    ev.stopPropagation();
    this._deleteDevice(device.address);
  }

  private async _deleteDevice(address: LcnAddress) {
    const device_to_delete = this.deviceConfigs.find(
      (device) =>
        device.address[0] === address[0] &&
        device.address[1] === address[1] &&
        device.address[2] === address[2],
    )!;

    if (
      !(await showConfirmationDialog(this, {
        title: `
          ${
            device_to_delete.address[2]
              ? this.lcn.localize("dashboard-devices-dialog-delete-group-title")
              : this.lcn.localize("dashboard-devices-dialog-delete-module-title")
          }`,
        text: html`${this.lcn.localize("dashboard-devices-dialog-delete-text")}
          ${device_to_delete.name ? `'${device_to_delete.name}'` : ""}
          (${device_to_delete.address[2]
            ? this.lcn.localize("group")
            : this.lcn.localize("module")}:
          ${this.lcn.localize("segment")} ${device_to_delete.address[0]}, ${this.lcn.localize("id")}
          ${device_to_delete.address[1]})
          <br />
          ${this.lcn.localize("dashboard-devices-dialog-delete-warning")}`,
      }))
    ) {
      return;
    }

    await deleteDevice(this.hass, this.lcn.config_entry, device_to_delete);
    this._dispatchConfigurationChangedEvent();
  }

  private _handleSortingChanged(ev: CustomEvent) {
    this._activeSorting = ev.detail;
  }

  private _handleSearchChange(ev: CustomEvent) {
    this._filter = ev.detail.value;
  }

  private _handleColumnsChanged(ev: CustomEvent) {
    this._activeColumnOrder = ev.detail.columnOrder;
    this._activeHiddenColumns = ev.detail.hiddenColumns;
  }

  private _handleSelectionChanged(ev: HASSDomEvent<SelectionChangedEvent>): void {
    this._selected = ev.detail.value;
  }

  static get styles(): CSSResultGroup[] {
    return [
      haStyle,
      css`
        hass-tabs-subpage-data-table {
          --data-table-row-height: 60px;
        }
        hass-tabs-subpage-data-table.narrow {
          --data-table-row-height: 72px;
        }

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
