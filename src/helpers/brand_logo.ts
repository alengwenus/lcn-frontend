import type { HaTabsSubpageDataTable } from "@ha/layouts/hass-tabs-subpage-data-table";
import { brandsUrl } from "@ha/util/brands-url";

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
      />`;

  const toolbar_content = hassTabsSubpageDataTable
    .shadowRoot!.querySelector("hass-tabs-subpage")!
    .shadowRoot!.querySelector(".toolbar-content")!;

  const tabbar = toolbar_content.querySelector("#tabbar");

  if (!toolbar_content?.querySelector("#brand-logo"))
    tabbar?.insertAdjacentHTML("beforebegin", brandHTML);
}
