import "@ha/components/ha-icon-button";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import memoizeOne from "memoize-one";
import { mdiDelete } from "@mdi/js";
import { computeRTLDirection } from "@ha/common/util/compute_rtl";
import type { HomeAssistant } from "@ha/types";
import { LCN, LcnEntityConfig, deleteEntity, LcnDeviceConfig } from "types/lcn";
import {
  DataTableColumnContainer,
  DataTableRowData,
} from "@ha/components/data-table/ha-data-table";

export type EntityRowData = LcnEntityConfig & {
  delete: LcnEntityConfig;
};

@customElement("lcn-entities-data-table")
export class LCNEntitiesDataTable extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public narrow!: boolean;

  @property({ attribute: false }) public device!: LcnDeviceConfig;

  @property({ attribute: false }) public entities: LcnEntityConfig[] = [];

  private _entities = memoizeOne((entities: LcnEntityConfig[]) => {
    const entityRowData: EntityRowData[] = entities.map((entity) => ({
      ...entity,
      delete: entity,
    }));
    return entityRowData;
  });

  private _columns = memoizeOne(
    (narrow: boolean): DataTableColumnContainer =>
      narrow
        ? {
            name: {
              title: this.lcn.localize("name"),
              sortable: true,
              direction: "asc",
            },
            delete: {
              title: "",
              sortable: false,
              minWidth: "80px",
              template: (entity: LcnEntityConfig) => {
                const handler = (ev) => this._onEntityDelete(ev, entity);
                return html`
                  <ha-icon-button
                    title=${this.lcn.localize("dashboard-entities-table-delete")}
                    .path=${mdiDelete}
                    @click=${handler}
                  ></ha-icon-button>
                `;
              },
            },
          }
        : {
            name: {
              title: this.lcn.localize("name"),
              sortable: true,
              direction: "asc",
              minWidth: "35%",
            },
            domain: {
              title: this.lcn.localize("domain"),
              sortable: true,
              minWidth: "25%",
            },
            resource: {
              title: this.lcn.localize("resource"),
              sortable: true,
              minWidth: "25%",
            },
            delete: {
              title: "",
              sortable: false,
              minWidth: "80px",
              template: (entity: LcnEntityConfig) => {
                const handler = (ev) => this._onEntityDelete(ev, entity);
                return html`
                  <ha-icon-button
                    title=${this.lcn.localize("dashboard-entities-table-delete")}
                    .path=${mdiDelete}
                    @click=${handler}
                  ></ha-icon-button>
                `;
              },
            },
          },
  );

  protected render() {
    return html`
      <ha-data-table
        .hass=${this.hass}
        .columns=${this._columns(this.narrow)}
        .data=${this._entities(this.entities) as DataTableRowData[]}
        .noDataText=${this.lcn.localize("dashboard-entities-table-no-data")}
        .dir=${computeRTLDirection(this.hass)}
        auto-height
        clickable
      ></ha-data-table>
    `;
  }

  private async _onEntityDelete(ev, entity: LcnEntityConfig) {
    ev.stopPropagation();
    await deleteEntity(this.hass, this.lcn.config_entry, entity);
    this.dispatchEvent(
      new CustomEvent("lcn-configuration-changed", {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-entities-data-table": LCNEntitiesDataTable;
  }
}
