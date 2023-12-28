import "../../../../../components/ha-icon-button";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import memoizeOne from "memoize-one";
import { mdiDelete } from "@mdi/js";
import { HomeAssistant } from "@ha/types";
import {
  LcnEntityConfig,
  deleteEntity,
  LcnDeviceConfig,
  LcnHost,
  LcnAddress,
} from "types/lcn";
import { DataTableColumnContainer } from "@ha/components/data-table/ha-data-table";

export type EntityRowData = LcnEntityConfig;

@customElement("lcn-entities-data-table")
export class LCNEntitiesDataTable extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  @property() public host!: LcnHost;

  @property() public device!: LcnDeviceConfig;

  @property() public entities: LcnEntityConfig[] = [];

  private _entities = memoizeOne((entities: LcnEntityConfig[]) => {
    let entityRowData: EntityRowData[] = entities;

    entityRowData = entities.map((entity) => ({
      ...entity,
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
            },
            domain: {
              title: "Domain",
              sortable: true,
              direction: "asc",
              grows: true,
            },
            resource: {
              title: "Resource",
              sortable: true,
              direction: "asc",
              grows: true,
            },
            address: {
              title: "",
              sortable: false,
              width: "60px",
              template: (address, entity) => {
                const handler = (ev) =>
                  this._onEntityDelete(ev, address, entity);
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
        .columns=${this._columns(this.narrow)}
        .data=${this._entities(this.entities)}
        .id=${"unique_id"}
        auto-height
      ></ha-data-table>
    `;
  }

  private _onEntityDelete(ev, address, entity) {
    ev.stopPropagation();
    this._deleteEntity(address, entity.domain, entity.resource);
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

    await deleteEntity(this.hass, this.host.id, entity_to_delete);

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
