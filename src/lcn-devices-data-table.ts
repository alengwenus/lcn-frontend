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
import {
  LCN,
  LcnDeviceConfig,
  deleteDevice,
  LcnAddress,
} from "types/lcn";
import "@ha/components/ha-icon-button";
import { loadLCNCreateDeviceDialog } from "./dialogs/show-dialog-create-device";

export type DeviceRowData = LcnDeviceConfig & {
  segment_id: number;
  address_id: number;
  is_group: boolean;
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
      is_group: device.address[2],
      delete: device,
    }));
    return deviceRowData;
  });

  private _columns = memoizeOne(
    (narrow: boolean): DataTableColumnContainer =>
      narrow
        ? {
            name: {
              title: "Name",
              sortable: true,
              direction: "asc",
              grows: true,
            },
          }
        : {
            name: {
              title: "Name",
              sortable: true,
              direction: "asc",
              grows: true,
            },
            segment_id: {
              title: "Segment",
              sortable: true,
              width: "90px",
            },
            address_id: {
              title: "ID",
              sortable: true,
              width: "90px",
            },
            is_group: {
              title: "Group",
              sortable: true,
              width: "90px",
            },
            delete: {
              title: "",
              sortable: false,
              width: "60px",
              template: (device: LcnDeviceConfig) => {
                const handler = (ev) => this._onDeviceDelete(ev, device);
                return html`
                  <ha-icon-button
                    title="Delete LCN device"
                    .path=${mdiDelete}
                    @click=${handler}
                  ></ha-icon-button>
                `;
              },
            },
          }
  );

  protected firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    loadLCNCreateDeviceDialog();
  }

  protected render(): TemplateResult {
    const handler = (ev) => {
      this.lcn.address = ev.detail.id;
      this._openDevice();
    };
    return html`
      <ha-data-table
        .hass=${this.hass}
        .columns=${this._columns(this.narrow)}
        .data=${this._devices(this.devices)}
        .id=${"address"}
        auto-height
        .dir=${computeRTLDirection(this.hass)}
        .noDataText=${"No devices configured."}
        @row-click=${handler}
      ></ha-data-table>
    `;
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
      })
    );
  }

  private _openDevice() {
    // convert address tuple into string (e.g. m000007) for use in url
    // const addressString = createAddressString(address);
    // navigate(`/lcn/entities/${this.lcn.host.id}/${addressString}`);
    navigate(`/lcn/entities`);
  }

  private async _deleteDevice(address: LcnAddress) {
    const device_to_delete = this.devices.find(
      (device) =>
        device.address[0] === address[0] &&
        device.address[1] === address[1] &&
        device.address[2] === address[2]
    )!;

    if (
      !(await showConfirmationDialog(this, {
        title: `Delete
          ${device_to_delete.address[2] ? "group" : "module"}`,
        text: html` You are about to remove
          ${device_to_delete.address[2] ? "group" : "module"}
          ${device_to_delete.address[1]} in segment
          ${device_to_delete.address[0]}
          ${device_to_delete.name ? `('${device_to_delete.name}')` : ""}.<br />
          Removing a device will also delete all associated entities!`,
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
