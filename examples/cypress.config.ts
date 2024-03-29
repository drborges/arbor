import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "cypress"
import { defineConfig as defineViteConfig } from "vite"

export default defineConfig({
  component: {
    viewportWidth: 800,
    viewportHeight: 900,
    video: false,
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: defineViteConfig({
        plugins: [react({ tsDecorators: true })],
      }),
    },
  },
})
