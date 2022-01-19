const { build } = require("esbuild")

const cwd = process.cwd()
const dist = `${cwd}/dist`
const src = `${cwd}/src`

const {
  dependencies = {},
  peerDependencies = {},
} = require(`${cwd}/package.json`)

const config = {
  entryPoints: [`${src}/index.ts`],
  bundle: true,
  minify: true,
  external: Object.keys(dependencies).concat(Object.keys(peerDependencies)),
}

build({
  ...config,
  format: "cjs",
  outfile: `${dist}/index.cjs.js`,
})

build({
  ...config,
  outfile: `${dist}/index.esm.js`,
  format: "esm",
})
