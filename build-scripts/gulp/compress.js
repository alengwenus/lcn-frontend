// Tasks to compress

import gulp from "gulp";
import zopfli from "gulp-zopfli-green";
import path from "path";
import paths from "../paths.cjs";

const zopfliOptions = { threshold: 150 };

const compressDist = (rootDir) =>
  gulp
    .src([`${rootDir}/**/*.{js,json,css,svg}`])
    .pipe(zopfli(zopfliOptions))
    .pipe(gulp.dest(rootDir));

gulp.task("compress-lcn", () => compressDist(paths.lcn_output_root));
