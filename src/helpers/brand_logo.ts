import type { HaTabsSubpageDataTable } from "@ha/layouts/hass-tabs-subpage-data-table";
import { brandsUrl } from "@ha/util/brands-url";
import type { HomeAssistant } from "@ha/types";

export async function renderBrandLogo(
  hass: HomeAssistant,
  hassTabsSubpageDataTable: HaTabsSubpageDataTable,
) {
  const brandHTML = `<img
        id="brand-logo"
        alt=""
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        height=48,
        src=${brandsUrl({
          domain: "lcn",
          type: "icon",
          darkOptimized: hass.themes?.darkMode,
        })}
      />`;

  await hassTabsSubpageDataTable.shadowRoot;
  const subpage = await hassTabsSubpageDataTable.shadowRoot!.querySelector("hass-tabs-subpage");
  const toolbar_content = await subpage!.shadowRoot!.querySelector(".toolbar-content");
  const tabbar = await toolbar_content?.querySelector("#tabbar");

  if (!toolbar_content?.querySelector("#brand-logo"))
    tabbar?.insertAdjacentHTML("beforebegin", brandHTML);
}
