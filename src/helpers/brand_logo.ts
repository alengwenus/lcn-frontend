import "@ha/components/ha-tooltip";
import type { HaTabsSubpageDataTable } from "@ha/layouts/hass-tabs-subpage-data-table";
import { brandsUrl } from "@ha/util/brands-url";
import type { HomeAssistant } from "@ha/types";
import { VERSION } from "version";

async function lcnBrandsUrl(hass: HomeAssistant): Promise<string> {
  const response = await fetch(
    brandsUrl({
      domain: "lcn",
      type: "icon",
    }),
    {
      headers: {
        Authorization: `Bearer ${hass.auth.data.access_token}`,
      },
    },
  );
  if (!response.ok) return "";

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  return objectUrl;
}

export async function renderBrandLogo(hassTabsSubpageDataTable: HaTabsSubpageDataTable) {
  const hass = hassTabsSubpageDataTable.hass;
  const toolbarContent = hassTabsSubpageDataTable?.shadowRoot
    ?.querySelector("hass-tabs-subpage")
    ?.shadowRoot?.querySelector(".toolbar-content");

  if (!toolbarContent) return;

  const tabbar = toolbarContent?.querySelector("#tabbar");

  if (!tabbar) return;

  const brandUrl = await lcnBrandsUrl(hass);

  const brandHTML = `<img
        id="brand-logo"
        alt=""
        height="48"
        style="cursor: pointer;"
        src=${brandUrl}
        title="LCN Frontend Panel\nVersion: ${VERSION}"
      />`;

  if (!toolbarContent?.querySelector("#brand-logo"))
    tabbar?.insertAdjacentHTML("beforebegin", brandHTML);
}
