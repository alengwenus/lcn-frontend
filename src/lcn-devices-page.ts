import { isDevBuild } from "helpers/build-info";
import { consume } from "@lit-labs/context";
import { deviceConfigsContext } from "components/context";
import { haStyle } from "@ha/resources/styles";
import "@material/mwc-button";
import "@ha/components/ha-clickable-list-item";
import "@ha/components/ha-fab";
import "@ha/components/ha-button-menu";
import "@ha/components/ha-list-item";
import "@ha/components/ha-md-menu-item";
import "@ha/components/ha-help-tooltip";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-checkbox";
import "@ha/components/ha-formfield";
import "@ha/components/ha-tooltip";
import "@ha/layouts/hass-tabs-subpage-data-table";
import type { HaTabsSubpageDataTable } from "@ha/layouts/hass-tabs-subpage-data-table";
import { storage } from "@ha/common/decorators/storage";
import type { PropertyValues, CSSResultGroup } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state, queryAsync } from "lit/decorators";
import { mdiPlus, mdiDelete, mdiDotsVertical, mdiHexagon, mdiHexagonMultiple } from "@mdi/js";
import type { HomeAssistant, Route } from "@ha/types";
import { lcnMainTabs } from "lcn-router";
import { showAlertDialog, showConfirmationDialog } from "@ha/dialogs/generic/show-dialog-box";
import "@ha/components/ha-svg-icon";
import memoize from "memoize-one";
import type { LCN, LcnDeviceConfig } from "types/lcn";
import { scanDevices, deleteDevice, addDevice } from "types/lcn";
import { addressToString, stringToAddress } from "helpers/address_conversion";
import { importConfig, exportConfig } from "helpers/config-exchange";
import type {
  DataTableColumnContainer,
  SelectionChangedEvent,
  SortingChangedEvent,
} from "@ha/components/data-table/ha-data-table";
import { navigate } from "@ha/common/navigate";
import type { HASSDomEvent } from "@ha/common/dom/fire_event";
import { updateDeviceConfigs, updateEntityConfigs } from "components/events";
import { renderBrandLogo } from "helpers/brand_logo";
import type { LcnSerial } from "helpers/module_properties";
import { getHardwareType, parseSerialNumber } from "helpers/module_properties";
import type { ProgressDialog } from "./dialogs/progress-dialog";
import {
  loadLCNCreateDeviceDialog,
  showLCNCreateDeviceDialog,
} from "./dialogs/show-dialog-create-device";
import { loadProgressDialog, showProgressDialog } from "./dialogs/show-dialog-progress";

interface DeviceRowData extends LcnDeviceConfig {
  unique_id: string;
  address_id: number;
  segment_id: number;
  type: string;
}

@customElement("lcn-devices-page")
export class LCNConfigDashboard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @state()
  @consume({ context: deviceConfigsContext, subscribe: true })
  _deviceConfigs!: LcnDeviceConfig[];

  @state() private _selected: string[] = [];

  @storage({
    storage: "sessionStorage",
    key: "lcn-devices-table-search",
    state: true,
    subscribe: false,
  })
  private _filter = "";

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

  @queryAsync("hass-tabs-subpage-data-table")
  private _dataTable!: Promise<HaTabsSubpageDataTable>;

  private get _extDeviceConfigs(): DeviceRowData[] {
    const extDeviceConfigs = memoize((deviceConfigs: LcnDeviceConfig[] = this._deviceConfigs) =>
      deviceConfigs.map((deviceConfig) => ({
        ...deviceConfig,
        unique_id: addressToString(deviceConfig.address),
        address_id: deviceConfig.address[1],
        segment_id: deviceConfig.address[0],
        type: deviceConfig.address[2] ? this.lcn.localize("group") : this.lcn.localize("module"),
      })),
    );
    return extDeviceConfigs();
  }

  private _columns = memoize(
    (): DataTableColumnContainer<DeviceRowData> => ({
      icon: {
        title: "",
        label: "Icon",
        type: "icon",
        showNarrow: true,
        moveable: false,
        template: (entry) =>
          html` <ha-svg-icon
            .path=${entry.address[2] ? mdiHexagonMultiple : mdiHexagon}
          ></ha-svg-icon>`,
      },
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
      hardware_serial: {
        title: this.lcn.localize("hardware-serial"),
        sortable: true,
        filterable: true,
        defaultHidden: true,
        template: (entry) => this.renderHardwareSerial(entry.hardware_serial),
      },
      software_serial: {
        title: this.lcn.localize("software-serial"),
        sortable: true,
        filterable: true,
        defaultHidden: true,
        template: (entry) => this.renderSoftwareSerial(entry.software_serial),
      },
      hardware_type: {
        title: this.lcn.localize("hardware-type"),
        sortable: true,
        filterable: true,
        defaultHidden: true,
        template: (entry) => {
          const type = getHardwareType(entry.hardware_type);
          if (type) return type;
          return "-";
        },
      },
      delete: {
        title: this.lcn.localize("delete"),
        showNarrow: true,
        type: "icon-button",
        template: (entry) => {
          const handler = (_ev) => this._deleteDevices([entry]);
          return html`
            <ha-tooltip
              content=${this.lcn.localize("dashboard-devices-table-delete")}
              distance=-5
              placement="left"
            >
              <ha-icon-button
                id=${"delete-device-" + entry.unique_id}
                .path=${mdiDelete}
                @click=${handler}
              ></ha-icon-button>
            </ha-tooltip>
          `;
        },
      },
    }),
  );

  protected async firstUpdated(changedProperties: PropertyValues): Promise<void> {
    super.firstUpdated(changedProperties);
    loadProgressDialog();
    loadLCNCreateDeviceDialog();
  }

  protected async updated(changedProperties: PropertyValues): Promise<void> {
    super.updated(changedProperties);
    this._dataTable.then(renderBrandLogo);
  }

  protected renderSoftwareSerial(softwareSerial: number) {
    let serial: LcnSerial;
    try {
      serial = parseSerialNumber(softwareSerial);
    } catch {
      return html`-`;
    }

    return html`
      <ha-tooltip
        placement="bottom-start"
        content=${this.lcn.localize("firmware-date", {
          year: serial.year,
          month: serial.month,
          day: serial.day,
        })}
      >
        <span>${softwareSerial.toString(16).toUpperCase()}</span>
      </ha-tooltip>
    `;
  }

  protected renderHardwareSerial(hardwareSerial: number) {
    let serial: LcnSerial;
    try {
      serial = parseSerialNumber(hardwareSerial);
    } catch {
      return html`-`;
    }

    return html`
      <ha-tooltip placement="bottom-start">
        <span slot="content">
          ${this.lcn.localize("hardware-date", {
            year: serial.year,
            month: serial.month,
            day: serial.day,
          })}
          <br />
          ${this.lcn.localize("hardware-number", { serial: serial.serial })}
        </span>
        <span>${hardwareSerial.toString(16).toUpperCase()}</span>
      </ha-tooltip>
    `;
  }

  protected render() {
    if (!(this.hass && this.lcn && this._deviceConfigs)) {
      return nothing;
    }
    return html`
      <hass-tabs-subpage-data-table
        .hass=${this.hass}
        .narrow=${this.narrow}
        back-path="/config/integrations/integration/lcn"
        noDataText=${this.lcn.localize("dashboard-devices-no-data-text")}
        .route=${this.route}
        .tabs=${lcnMainTabs}
        .localizeFunc=${this.lcn.localize}
        .columns=${this._columns()}
        .data=${this._extDeviceConfigs}
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
        <ha-button-menu slot="toolbar-icon">
          <ha-icon-button .path=${mdiDotsVertical} .label="Actions" slot="trigger"></ha-icon-button>
          <ha-list-item @click=${this._scanDevices}>
            ${this.lcn.localize("dashboard-devices-scan")}
          </ha-list-item>

          ${isDevBuild()
            ? html` <li divider role="separator"></li>
                <ha-list-item @click=${this._importConfig}>
                  ${this.lcn.localize("import-config")}
                </ha-list-item>
                <ha-list-item @click=${this._exportConfig}>
                  ${this.lcn.localize("export-config")}
                </ha-list-item>`
            : nothing}
        </ha-button-menu>

        <div class="header-btns" slot="selection-bar">
          ${!this.narrow
            ? html`
                <mwc-button @click=${this._deleteSelected} class="warning">
                  ${this.lcn.localize("delete-selected")}
                </mwc-button>
              `
            : html`
                <ha-icon-button
                  class="warning"
                  id="remove-btn"
                  @click=${this._deleteSelected}
                  .path=${mdiDelete}
                  .label=${this.lcn.localize("delete-selected")}
                ></ha-icon-button>
                <ha-help-tooltip .label=${this.lcn.localize("delete-selected")} )}>
                </ha-help-tooltip>
              `}
        </div>

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

  private _getDeviceConfigByUniqueId(uniqueId: string): LcnDeviceConfig {
    const address = stringToAddress(uniqueId);
    const deviceConfig = this._deviceConfigs.find(
      (el) =>
        el.address[0] === address[0] &&
        el.address[1] === address[1] &&
        el.address[2] === address[2],
    );
    return deviceConfig!;
  }

  private _rowClicked(ev: CustomEvent) {
    const uniqueId: string = ev.detail.id;
    navigate(`/lcn/entities?address=${uniqueId}`, { replace: true });
  }

  private async _scanDevices() {
    const dialog: () => ProgressDialog | undefined = showProgressDialog(this, {
      title: this.lcn.localize("dashboard-dialog-scan-devices-title"),
      text: this.lcn.localize("dashboard-dialog-scan-devices-text"),
    });

    await scanDevices(this.hass!, this.lcn.config_entry);
    updateDeviceConfigs(this);
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
    updateDeviceConfigs(this);
    dialog()!.closeDialog();
  }

  private async _deleteSelected() {
    const devices = this._selected.map((uniqueId) => this._getDeviceConfigByUniqueId(uniqueId));
    await this._deleteDevices(devices);
    await this._clearSelection();
  }

  private async _deleteDevices(devices: LcnDeviceConfig[]) {
    if (
      devices.length > 0 &&
      !(await showConfirmationDialog(this, {
        title: this.lcn.localize("dashboard-devices-dialog-delete-devices-title"),
        text: html`
          ${this.lcn.localize("dashboard-devices-dialog-delete-text", {
            count: devices.length,
          })}
          <br />
          ${this.lcn.localize("dashboard-devices-dialog-delete-warning")}
        `,
      }))
    )
      return;

    for await (const device of devices) {
      await deleteDevice(this.hass, this.lcn.config_entry, device);
    }
    updateDeviceConfigs(this);
    updateEntityConfigs(this);
  }

  private async _importConfig() {
    await importConfig(this.hass, this.lcn);
    updateDeviceConfigs(this);
    updateEntityConfigs(this);
    window.location.reload();
  }

  private async _exportConfig() {
    exportConfig(this.hass, this.lcn);
  }

  private async _clearSelection() {
    (await this._dataTable).clearSelection();
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
        .form-label {
          font-size: 1rem;
          cursor: pointer;
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
