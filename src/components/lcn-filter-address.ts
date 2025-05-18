import { mdiFilterVariantRemove } from "@mdi/js";
import type { CSSResultGroup } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import memoizeOne from "memoize-one";
import { fireEvent } from "@ha/common/dom/fire_event";
import type { HomeAssistant } from "@ha/types";
import { haStyleScrollbar } from "@ha/resources/styles";
import type { LCN, LcnAddress, LcnDeviceConfig } from "types/lcn";
import "@ha/components/ha-domain-icon";
import "@ha/components/search-input-outlined";
import "@ha/components/ha-expansion-panel";
import "@ha/components/ha-icon-button";
import "@ha/components/ha-icon";
import "@ha/components/ha-check-list-item";
import { addressToString, stringToAddress } from "helpers/address_conversion";
import { stringCompare } from "@ha/common/string/compare";

@customElement("lcn-filter-address")
export class HaFilterDomains extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lcn!: LCN;

  @property({ attribute: false }) public deviceConfigs!: LcnDeviceConfig[];

  @property({ attribute: false }) public value?: string[];

  @property({ type: Boolean }) public narrow = false;

  @property({ type: Boolean, reflect: true }) public expanded = false;

  @state() private _shouldRender = false;

  @state() private _filter?: string;

  protected render() {
    return html`
      <ha-expansion-panel
        leftChevron
        .expanded=${this.expanded}
        @expanded-will-change=${this._expandedWillChange}
        @expanded-changed=${this._expandedChanged}
      >
        <div slot="header" class="header">
          ${this.lcn.localize("devices")}/${this.lcn.localize("addresses")}
          ${this.value?.length
            ? html`<div class="badge">${this.value?.length}</div>
                <ha-icon-button
                  .path=${mdiFilterVariantRemove}
                  @click=${this._clearFilter}
                ></ha-icon-button>`
            : nothing}
        </div>
        ${this._shouldRender
          ? html`<search-input-outlined
                .hass=${this.hass}
                .filter=${this._filter}
                @value-changed=${this._handleSearchChange}
              ></search-input-outlined>

              <mwc-list class="ha-scrollbar" multi @click=${this._handleItemClick}>
                ${this._addresses(this.deviceConfigs, this._filter).map(
                  (address: string) =>
                    html`<ha-check-list-item
                      .value=${address}
                      .selected=${(this.value || []).includes(address)}
                    >
                      ${this._addressRepr(address)}
                    </ha-check-list-item>`,
                )}
              </mwc-list>`
          : nothing}
      </ha-expansion-panel>
    `;
  }

  private _addresses = memoizeOne((deviceConfigs, filter) => {
    const addresses = new Set<string>();
    deviceConfigs.forEach((deviceConfig) => {
      addresses.add(addressToString(deviceConfig.address));
    });
    return Array.from(addresses.values())
      .map((address: string) => ({
        address,
        name: this._addressRepr(address),
      }))
      .filter(
        (entry) =>
          !filter ||
          entry.address.toLowerCase().includes(filter) ||
          entry.name.toLowerCase().includes(filter),
      )
      .sort((a, b) => stringCompare(a.name, b.name, this.hass.locale.language))
      .map((entry) => entry.address);
  });

  private _addressRepr(address: string): string {
    const lcnAddress: LcnAddress = stringToAddress(address);
    const device = lcnAddress[2] ? this.lcn.localize("group") : this.lcn.localize("module");
    const segmentId = lcnAddress[0];
    const addressId = lcnAddress[1];
    const result = `${device} (${segmentId}, ${addressId})`;
    return result;
  }

  protected updated(changed) {
    if (changed.has("expanded") && this.expanded) {
      setTimeout(() => {
        if (!this.expanded) return;
        this.renderRoot.querySelector("mwc-list")!.style.height =
          `${this.clientHeight - 49 - 32}px`; // 32px is the height of the search input
      }, 300);
    }
  }

  private _expandedWillChange(ev) {
    this._shouldRender = ev.detail.expanded;
  }

  private _expandedChanged(ev) {
    this.expanded = ev.detail.expanded;
  }

  private _handleItemClick(ev) {
    const listItem = ev.target.closest("ha-check-list-item");
    const value = listItem?.value;
    if (!value) {
      return;
    }
    if (this.value?.includes(value)) {
      this.value = this.value?.filter((val) => val !== value);
    } else {
      this.value = [...(this.value || []), value];
    }

    listItem.selected = this.value.includes(value);

    fireEvent(this, "data-table-filter-changed", {
      value: this.value,
      items: undefined,
    });
  }

  private _clearFilter(ev) {
    ev.preventDefault();
    this.value = undefined;
    fireEvent(this, "data-table-filter-changed", {
      value: undefined,
      items: undefined,
    });
  }

  private _handleSearchChange(ev: CustomEvent) {
    this._filter = ev.detail.value.toLowerCase();
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleScrollbar,
      css`
        :host {
          border-bottom: 1px solid var(--divider-color);
        }
        :host([expanded]) {
          flex: 1;
          height: 0;
        }
        ha-expansion-panel {
          --ha-card-border-radius: 0;
          --expansion-panel-content-padding: 0;
        }
        .header {
          display: flex;
          align-items: center;
        }
        .header ha-icon-button {
          margin-inline-start: initial;
          margin-inline-end: 8px;
        }
        .badge {
          display: inline-block;
          margin-left: 8px;
          margin-inline-start: 8px;
          margin-inline-end: initial;
          min-width: 16px;
          box-sizing: border-box;
          border-radius: 50%;
          font-weight: 400;
          font-size: 11px;
          background-color: var(--primary-color);
          line-height: 16px;
          text-align: center;
          padding: 0px 2px;
          color: var(--text-primary-color);
        }
        search-input-outlined {
          display: block;
          padding: 0 8px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lcn-filter-address": HaFilterDomains;
  }
}
