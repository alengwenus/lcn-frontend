# LCN Frontend

<a href="https://www.buymeacoffee.com/alengwenus" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/white_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

This repository contains the frontend files for the Home Assistant LCN configuration panel.

A detailed guide can be found in the [documentation](./docs/lcn-frontend.md).

Feel free to use the [issue tracker](https://github.com/alengwenus/lcn-frontend/issues) to report bugs, give feetback or share ideas for improvements.

If you want to participate in development (great!) head down to the [development](#development) section.

## Features

- Device Configuration
  ![Device Configuration](./screenshots/lcn_devices.png?raw=true)

  - Set up modules and groups for all your LCN integrations.
  - Search for modules and groups and have them added automatically.
  - Select a module or group to access the respective Entity Configuration panel.

- Entity Configuration
  ![Entity Configuration](./screenshots/lcn_create_entity.png?raw=true)
  - Set up Home Assistant entities for each module or group.
  - Create new entities that map the functions of your LCN modules and configure their parameters.
  - New entities are automatically added to your Home Assistant configuration and you can add them to your dashboards just like for any other integration.

## Development

### Setting up the development environment

- To display and test the frontend during development, you need to prepare a Home Assistant development environment. For this it is recommended to follow the instructions [here](https://developers.home-assistant.io/docs/development_environment/).

- You need to have `node.js` installed to build the frontend. Using [nvm](https://github.com/nvm-sh/nvm) is the preferred method of installing `node.js`. [Install nvm using the instructions provided here](https://github.com/nvm-sh/nvm#install--update-script). Install the correct `node.js` version by running the following command in the root directory of your checkout working tree.

```shell
$ nvm install
```

- The `lcn-frontend` uses [Yarn](https://classic.yarnpkg.com/en/) as a package manager for node modules. [Install yarn using the instructions here.](https://yarnpkg.com/getting-started/install).

- Next is to prepare the submodules and install all node packages.
  To do this, run the following commands

```shell
$ make bootstrap
$ yarn install
```

### Building the frontend

During development use the following command to build the frontend automatically whenever you make code changes:

```shell
$ make develop
```

A production build can be created by issuing:

```shell
$ make build
```

### Preparing the frontend

Next is to symlink the build directory `lcn_frontend` into the Home Assistant configuration directory:

```shell
$ ln -s <lcn-frontend-dir>/lcn_frontend <hass-dir>/config/deps/lib/python3.xx/site-packages/
```

- `<lcn-frontend-dir>` is the root working directory of the repository's checkout directory
- `<hass-dir>` is the root working directory of the `home-assistant-core` repository's checkout directory

The `<hass-dir>/config` directory is created when first starting Home Assistant. Usually you have to create the mentioned sub-paths by your own. Use the appropriate Home Assistant's Python version in the path.

Alternatively, if you are working with a venv install:

```shell
export PYTHONPATH=<lcn-frontend-dir>
```

### Starting Home Assistant

Start Home Assistant using:

```shell
$ hass -c config
```

### Code quality

You may use the following commands to ensure code quality:

- Code formatting: `yarn run format`
- Code linting: `yarn run lint`
- Type linting: `yarn run lint:types`
