# Overview

The LCN frontend panel is a simple but functional user interface to configure Home Asistant's LCN integration.

The LCN integration has been an integral part of Home Assistant since version 0.85 which was released in 2019 and has been constantly expanded and improved since then.

Due to the diverse configuration options of the LCN modules and the lack of reading out the modules automatically, it was previously only possible to configure the integration by editing the `configuration.yaml`.

The LCN frontend panel allows the configuration to be carried out completely via the UI and integrates seamlessly into the Home Assistant interface. The configuration will be stored in the Home Assistant database. A Home Assistant backup/restore will also store/restore the complete LCN configuration.

The main functions are:

- Add modules and groups
- Scan the LCN bus for modules automatically
- Add entities and map module peripheries to them

# How to use

The frontend panel is automatically accessible from Home Assistant once the LCN integration has been set up.
To set up a new LCN integration follow [the official Home Assistant documentation.](https://www.home-assistant.io/integrations/lcn/)

## Accessing the LCN frontend

Once a new LCN integration is added, the frontend panel can be accessed by clicking on the "_Configure_" button next to the corresponding LCN integration entry.

![Integration onfiguration](./assets/lcn_integration_configuration.png?raw=true)

This will open the "LCN Configuration Dashboard".

![LCN Configuration Dashboard](./assets/lcn_dashboard.png?raw=true)

The dashboard gives you an overview about the configured LCN devices (modules or groups) along with their name, ID and the segment ID. The dashboard tries to derive the name from the LCN modules. If a module reports no name or in case of groups, a standard name is given.

## Configuring devices

Modules and groups can be added and deleted from the dashboard. Once added, they are known to Home Assistant as devices and can be used to trigger [specific actions](https://www.home-assistant.io/integrations/lcn/#actions) in scripts or automations. Refer to the [Performing actions](https://www.home-assistant.io/docs/scripts/perform-actions/) page for examples on how to use them.

### Scan modules

Clicking on the "_Scan modules_" button will trigger a search for LCN modules on the bus. Each module is polled for its name and serial number. As soon as no more responses are received from the modules, they are displayed in the device list.

Scanning modules might take up several seconds. The popped up dialog is automatically closed as soon as the process is complete.

### Add devices

If the scanning for modules fails for some reason or a module is currently not available on the bus, it might be added manually. Groups can also be created manually.

To manually create a module or group, click on the "_Create module/group_" button which will bring up the following dialog.

![Create module/group dialog](./assets/lcn_create_device.png?raw=true)

Select if you want to manually add a module or groupp and enter the desired `segment id` and module/group `id`. Once done click on "_Create_" to add the corresponding device.

### Delete devices

Just click on the trash can for the device which shall be deleted. The device will be removed from the device list as well as from Home Assistant. Note, that also all entities belonging to the device will be deleted!

## Configuring entities

To access the entities for a specific device (module/group), click on the list entry for the corrsponding device. This opens a view which lists all entities for the selected device.

![Create module/group dialog](./assets/lcn_entities.png?raw=true)

### Add entities

To add a new entity, click on the "_Create entity_" button which will bring up the following dialog.

![Create module/group dialog](./assets/lcn_create_entity.png?raw=true)

Select the domain (platform) for which you want to add an entity and enter a name. The name may be changed later on in the Home Assistant entity dialogs as with any other entity.

Depending on the selected domain the dialog shows the available options. Enter the desired information and click "_Create_". The entity will be added to the entity list and to Home Assistant.

### Delete entities

Just click on the trash can for the entity which should be deleted. The entity will be removed from the entity list as well as from Home Assistant.
