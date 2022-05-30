const process = require("process")
const { build } = require("esbuild")

const cwd = process.cwd()
const dist = `${cwd}/dist`
const src = `${cwd}/src`
const isProduction = process.env.NODE_ENV === "production"

const {
  dependencies = {},
  peerDependencies = {},
} = require(`${cwd}/package.json`)

const entrypoints = (process.env.ENTRYPOINTS || "index.ts")
  .split(",")
  .map((fileName) => `${src}/${fileName}`)

const config = {
  entryPoints: entrypoints,
  bundle: true,
  minify: isProduction,
  outdir: dist,
  external: Object.keys(dependencies).concat(Object.keys(peerDependencies)),
  define: {
    "global.DEBUG": !isProduction,
  },
}

build({
  ...config,
  format: "cjs",
  outbase: src,
  entryNames: "[dir]/[name].cjs",
})

build({
  ...config,
  format: "esm",
  outbase: src,
  entryNames: "[dir]/[name].esm",
})

build({
  ...config,
  format: "esm",
  outbase: src,
  entryNames: "[dir]/[name].mjs",
})
