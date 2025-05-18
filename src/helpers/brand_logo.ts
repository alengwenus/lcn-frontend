import type { HaTabsSubpageDataTable } from "@ha/layouts/hass-tabs-subpage-data-table";
import { brandsUrl } from "@ha/util/brands-url";
import { VERSION } from "version";

export async function renderBrandLogo(hassTabsSubpageDataTable: HaTabsSubpageDataTable) {
  const brandHTML = `<img
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
      <simple-tooltip
        animation-delay="0"
        offset="0"
        for=${"brand-logo"}>
        LCN Frontend Panel<br/>Version: ${VERSION}
      </simple-tooltip>
      `;

  const toolbarContent = hassTabsSubpageDataTable
    .shadowRoot!.querySelector("hass-tabs-subpage")!
    .shadowRoot!.querySelector(".toolbar-content")!;

  const tabbar = toolbarContent.querySelector("#tabbar");

  if (!toolbarContent?.querySelector("#brand-logo"))
    tabbar?.insertAdjacentHTML("beforebegin", brandHTML);
}
