import gulp from "gulp";
import env from "../env.cjs";

import "./clean.js";
import "./compress.js";
import "./entry-html.js";
import "./gen-icons-json.js";
import "./rspack.js";
import "./translations.js";

gulp.task(
  "develop-lcn",
  gulp.series(
    async () => {
      process.env.NODE_ENV = "development";
    },
    "clean-lcn",
    "gen-icons-json",
    "build-translations",
    "build-locale-data",
    "gen-index-lcn-dev",
    "rspack-watch-lcn",
  ),
);

gulp.task(
  "build-lcn",
  gulp.series(
    async () => {
      process.env.NODE_ENV = "production";
    },
    "clean-lcn",
    "ensure-lcn-build-dir",
    "gen-icons-json",
    "build-translations",
    "build-locale-data",
    "rspack-prod-lcn",
    "gen-index-lcn-prod",
    ...// Don't compress running tests
    (env.isTestBuild() ? [] : ["compress-lcn"]),
  ),
);
