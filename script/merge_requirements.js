import fs from "fs";

const rawPackageCore = fs.readFileSync("./homeassistant-frontend/package.json");
const rawPackageLcn = fs.readFileSync("./package.json");

const packageCore = JSON.parse(rawPackageCore);
const packageLcn = JSON.parse(rawPackageLcn);

const _replaceYarnPath = (path) => path.replace(/\.yarn\//g, "homeassistant-frontend/.yarn/");

const subdir_dependencies = Object.fromEntries(
  Object.entries(packageCore.dependencies).map(([key, value]) => [key, _replaceYarnPath(value)]),
);

const subdir_dev_dependencies = Object.fromEntries(
  Object.entries(packageCore.devDependencies).map(([key, value]) => [key, _replaceYarnPath(value)]),
);

const subdir_resolutions = Object.fromEntries(
  Object.entries(packageCore.resolutions).map(([key, value]) => [key, _replaceYarnPath(value)]),
);

fs.writeFileSync(
  "./package.json",
  JSON.stringify(
    {
      ...packageLcn,
      dependencies: { ...subdir_dependencies, ...packageLcn.dependenciesOverride },
      devDependencies: {
        ...subdir_dev_dependencies,
        ...packageLcn.devDependenciesOverride,
      },
      resolutions: { ...subdir_resolutions, ...packageLcn.resolutionsOverride },
      packageManager: packageCore.packageManager,
    },
    null,
    2
  )
);

const yarnRcCore = fs.readFileSync("./homeassistant-frontend/.yarnrc.yml", "utf8");
const yarnRcLcn = yarnRcCore.replace(/\.yarn\//g, "homeassistant-frontend/.yarn/");
fs.writeFileSync("./.yarnrc.yml", yarnRcLcn);
