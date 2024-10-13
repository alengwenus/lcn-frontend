export function updateDeviceConfigs(node: HTMLElement | Window) {
  node.dispatchEvent(
    new CustomEvent("lcn-update-device-configs", {
      bubbles: true,
      composed: true,
    }),
  );
}

export function updateEntityConfigs(node: HTMLElement | Window) {
  node.dispatchEvent(
    new CustomEvent("lcn-update-entity-configs", {
      bubbles: true,
      composed: true,
    }),
  );
}
