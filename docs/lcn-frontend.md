# Overview

The LCN frontend panel is a simple but functional user interface to configure Home Asistant's LCN integration.

The LCN integration has been an integral part of Home Assistant since version 0.85 which was released in 2019 and has been constantly expanded and improved since then.

Due to the diverse configuration options of the LCN modules and the lack of an option to read the modules out automatically, it was previously only possible to configure the integration by editing the `configuration.yaml`.

The LCN frontend panel allows the configuration to be carried out completely via the UI and integrates seamlessly into the Home Assistant interface.

The main functions are:

- Add modules and groups
- Scan the LCN bus for modules automatically
- Add entities and a map module peripheries to them

# How to use

The frontend panel is automatically accassible from Home Assistant once the LCN integration has been set up.
To set up a new LCN integration follow [the official Home Assistant documentation.](https://www.home-assistant.io/integrations/lcn/)

## Accessing the LCN frontend

Once a new LCN integration is added, the frontend panel can be accessed by clicking on "_Configure_" button next to the corresponding LCN integration entry.

![Integration onfiguration](./assets/lcn_integration_configuration.png?raw=true)

This will open the "LCN Configuration Dashboard".

![LCN Configuration Dashboard](./assets/lcn_dashboard.png?raw=true)

The dashboard gives you an overview about the configured LCN devices (modules or groups) along with their name, ID and the segment ID. The dashboard tries to derive the name from the LCN modules. If a module reports no name or in case of groups, a standard name is given.

## Configuring devices

Modules and groups can be added and deleted from the dashboard. Once added, they are known to Home Assistant as devices and can be used to trigger [specific actions](https://www.home-assistant.io/integrations/lcn/#actions) in scripts or automations. Refer to the [Performing actions](https://www.home-assistant.io/docs/scripts/perform-actions/) page for examples on how to use them.

### Scan devices

### Manually add devices

## Configuring entities

### Add entities
