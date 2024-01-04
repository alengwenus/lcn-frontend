import "@ha/components/ha-icon-button";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import memoizeOne from "memoize-one";
import { mdiDelete } from "@mdi/js";
import { computeRTLDirection } from "@ha/common/util/compute_rtl";
import { HomeAssistant } from "@ha/types";
import {
  LCN,
  LcnEntityConfig,
  deleteEntity,
  LcnDeviceConfig,
  LcnAddress,
} from "types/lcn";
import { DataTableColumnContainer } from "@ha/components/data-table/ha-data-table";

export type EntityRowData = LcnEntityConfig & {
  delete: LcnEntityConfig;
};

@customElement("lcn-entities-data-table")
export class LCNEntitiesDataTable extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property() public narrow!: boolean;

  @property() public device!: LcnDeviceConfig;

  @property() public entities: LcnEntityConfig[] = [];

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
              width: "35%",
            },
            domain: {
              title: "Domain",
              sortable: true,
              grows: false,
              width: "25%",
            },
            resource: {
              title: "Resource",
              sortable: true,
              grows: false,
              width: "25%",
            },
            delete: {
              title: "",
              sortable: false,
              width: "80px",
              template: (entity: LcnEntityConfig) => {
                const handler = (ev) => this._onEntityDelete(ev, entity);
                return html`
                  <ha-icon-button
                    title="Delete LCN entity"
                    .path=${mdiDelete}
                    @click=${handler}
                  ></ha-icon-button>
                `;
              },
            },
          }
  );

  protected render() {
    return html`
      <ha-data-table
        .hass=${this.hass}
        .columns=${this._columns(this.narrow)}
        .data=${this._entities(this.entities)}
        .id=${"unique_id"}
        .noDataText=${"No entities configured."}
        .dir=${computeRTLDirection(this.hass)}
        auto-height
        clickable
      ></ha-data-table>
    `;
  }

  private _onEntityDelete(ev, entity: LcnEntityConfig) {
    ev.stopPropagation();
    this._deleteEntity(entity.address, entity.domain, entity.resource);
  }

  private async _deleteEntity(
    address: LcnAddress,
    domain: string,
    resource: string
  ) {
    const entity_to_delete = this.entities.find(
      (entity) =>
        entity.address[0] === address[0] &&
        entity.address[1] === address[1] &&
        entity.address[2] === address[2] &&
        entity.domain === domain &&
        entity.resource === resource
    )!;

    await deleteEntity(this.hass, this.lcn.host.id, entity_to_delete);

    this.dispatchEvent(
      new CustomEvent("lcn-configuration-changed", {
        bubbles: true,
        composed: true,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-entities-data-table": LCNEntitiesDataTable;
  }
}
