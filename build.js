#!/usr/bin/env node
import dedent from "dedent";
import ejs from "ejs";
import fs from "fs";
import glob from "glob";
import hljs from "highlight.js";
import mkdirp from "mkdirp";
import path from "path";
import postcss from "postcss";
import postcssImport from 'postcss-import';
import postcssInlineSvg from 'postcss-inline-svg';
import postcssCssVariables from 'postcss-css-variables';
import postcssCalc from 'postcss-calc';
import cssnano from 'cssnano';
import pack from "./package.json" with {type: "json"};

function buildCSS() {
  const input =
    `/*! 98.css v${pack.version} - ${pack.homepage} */\n` + fs.readFileSync("style.css");

  return postcss()
    .use(postcssImport)
    .use(postcssInlineSvg)
    .use(postcssCssVariables)
    .use(postcssCalc)
    .use(cssnano)
    .process(input, {
      from: "style.css",
      to: "dist/98.css",
      map: { inline: false },
    })
    .then((result) => {
      mkdirp.sync("dist");
      fs.writeFileSync("dist/98.css", result.css);
      fs.writeFileSync("dist/98.css.map", result.map.toString());
    });
}

function buildDocs() {
  let id = 0;
  function getNewId() {
    return ++id;
  }
  function getCurrentId() {
    return id;
  }

  const template = fs.readFileSync("docs/index.html.ejs", "utf-8");
  function example(code) {
    const magicBrackets = /\[\[(.*)\]\]/g;
    const dedented = dedent(code);
    const inline = dedented.replace(magicBrackets, "$1");
    const escaped = hljs.highlight(dedented.replace(magicBrackets, ""), {language: 'html'})
      .value;

    return `<div class="example">
      ${inline}
      <details>
        <summary>Show code</summary>
        <pre><code>${escaped}</code></pre>
      </details>
    </div>`;
  }

  glob("docs/*", (err, files) => {
    if (!err) {
      files.forEach((srcFile) =>
        fs.copyFileSync(srcFile, path.join("dist", path.basename(srcFile)))
      );
    } else throw "error globbing dist directory.";
  });
  mkdirp.sync("dist/fonts/converted");
  glob("fonts/converted/*", (err, files) => {
    if (!err) {
      files.forEach((srcFile) =>
        fs.copyFileSync(srcFile, path.join("dist/fonts/converted", path.basename(srcFile)))
      );
    } else throw "error globbing dist directory.";
  });
  fs.writeFileSync(
    path.join(import.meta.dirname, "/dist/index.html"),
    ejs.render(template, { getNewId, getCurrentId, example })
  );

  fs.writeFileSync(
    path.join(import.meta.dirname, "/dist/variables.css"),
    fs.readFileSync("./variables.css")
  );
}

function build() {
  buildCSS()
    .then(buildDocs)
    .catch((err) => console.log(err));
}

build();

export default build;