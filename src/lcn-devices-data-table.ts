import { LitElement, html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import memoizeOne from "memoize-one";
import { mdiDelete } from "@mdi/js";
import { computeRTLDirection } from "@ha/common/util/compute_rtl";
import "@ha/components/data-table/ha-data-table";
import type { DataTableColumnContainer } from "@ha/components/data-table/ha-data-table";
import type { HomeAssistant, Route } from "@ha/types";
import { showConfirmationDialog } from "@ha/dialogs/generic/show-dialog-box";
import { navigate } from "@ha/common/navigate";
import { LCN, LcnDeviceConfig, deleteDevice, LcnAddress } from "types/lcn";
import "@ha/components/ha-icon-button";
import { loadLCNCreateDeviceDialog } from "./dialogs/show-dialog-create-device";

export type DeviceRowData = LcnDeviceConfig & {
  segment_id: number;
  address_id: number;
  type: string;
  delete: LcnDeviceConfig;
};

@customElement("lcn-devices-data-table")
export class LCNDevicesDataTable extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @property() public devices: LcnDeviceConfig[] = [];

  private _devices = memoizeOne((devices: LcnDeviceConfig[]) => {
    const deviceRowData: DeviceRowData[] = devices.map((device) => ({
      ...device,
      segment_id: device.address[0],
      address_id: device.address[1],
      type: device.address[2] ? this.lcn.localize("group") : this.lcn.localize("module"),
      delete: device,
    }));
    return deviceRowData;
  });

  private _columns = memoizeOne(
    (narrow: boolean): DataTableColumnContainer =>
      narrow
        ? {
            name: {
              title: this.lcn.localize("name"),
              sortable: true,
              direction: "asc",
              grows: true,
            },
          }
        : {
            name: {
              title: this.lcn.localize("name"),
              sortable: true,
              direction: "asc",
              grows: true,
              width: "40%",
            },
            segment_id: {
              title: this.lcn.localize("segment"),
              sortable: true,
              grows: false,
              width: "15%",
            },
            address_id: {
              title: this.lcn.localize("id"),
              sortable: true,
              grows: false,
              width: "15%",
            },
            type: {
              title: this.lcn.localize("type"),
              sortable: true,
              grows: false,
              width: "15%",
            },
            delete: {
              title: "",
              sortable: false,
              width: "80px",
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
          },
  );

  protected firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    loadLCNCreateDeviceDialog();
  }

  protected render(): TemplateResult {
    return html`
      <ha-data-table
        .hass=${this.hass}
        .columns=${this._columns(this.narrow)}
        .data=${this._devices(this.devices)}
        .id=${"address"}
        .noDataText=${this.lcn.localize("dashboard-devices-table-no-data")}
        .dir=${computeRTLDirection(this.hass)}
        auto-height
        clickable
        @row-click=${this._rowClicked}
      ></ha-data-table>
    `;
  }

  private _rowClicked(ev: CustomEvent) {
    this.lcn.address = ev.detail.id;
    this._openDevice();
  }

  private _onDeviceDelete(ev, device: LcnDeviceConfig) {
    ev.stopPropagation();
    this._deleteDevice(device.address);
  }

  private _dispatchConfigurationChangedEvent() {
    this.dispatchEvent(
      new CustomEvent("lcn-config-changed", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _openDevice() {
    navigate("/lcn/entities");
  }

  private async _deleteDevice(address: LcnAddress) {
    const device_to_delete = this.devices.find(
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

    await deleteDevice(this.hass, this.lcn.host.id, device_to_delete);
    this._dispatchConfigurationChangedEvent();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-devices-data-table": LCNDevicesDataTable;
  }
}
