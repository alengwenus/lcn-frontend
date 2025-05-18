import "@ha/components/ha-tooltip";
import type { HaTabsSubpageDataTable } from "@ha/layouts/hass-tabs-subpage-data-table";
import { brandsUrl } from "@ha/util/brands-url";
import { VERSION } from "version";

export async function renderBrandLogo(hassTabsSubpageDataTable: HaTabsSubpageDataTable) {
  const brandHTML = `
    <ha-tooltip
      placement="bottom"
      distance=-5
    >
      <span slot="content">
        LCN Frontend Panel<br/>Version: ${VERSION}
      </span>
      <img
        id="brand-logo"
        alt=""
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        height=48,
        src=${brandsUrl({
          domain: "lcn",
          type: "icon",
        })}
      />
      </ha-tooltip>
  `;

  const toolbarContent = hassTabsSubpageDataTable
    .shadowRoot!.querySelector("hass-tabs-subpage")!
    .shadowRoot!.querySelector(".toolbar-content")!;

  const tabbar = toolbarContent.querySelector("#tabbar");

  if (!toolbarContent?.querySelector("#brand-logo"))
    tabbar?.insertAdjacentHTML("beforebegin", brandHTML);
}
