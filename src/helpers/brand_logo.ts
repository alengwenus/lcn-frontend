import "@ha/components/ha-tooltip";
import type { HaTabsSubpageDataTable } from "@ha/layouts/hass-tabs-subpage-data-table";
import { brandsUrl } from "@ha/util/brands-url";
import { VERSION } from "version";

export async function renderBrandLogo(hassTabsSubpageDataTable: HaTabsSubpageDataTable) {
  const toolbarContent = hassTabsSubpageDataTable?.shadowRoot
    ?.querySelector("hass-tabs-subpage")
    ?.shadowRoot?.querySelector(".toolbar-content");

  if (!toolbarContent) return;

  const tabbar = toolbarContent?.querySelector("#tabbar");

  if (!tabbar) return;

  if (!toolbarContent.querySelector("#brand-logo")) {
    const img = document.createElement("img");
    img.id = "brand-logo";
    img.alt = "";
    img.style.cursor = "pointer";
    img.height = 48;
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = brandsUrl({
      domain: "lcn",
      type: "icon",
    });

    img.title = `LCN Frontend Panel\nVersion: ${VERSION}`;

    tabbar?.before(img);
  }
}
