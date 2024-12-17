/* eslint-disable */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __VUE_PROD_DEVTOOLS__: true,
  },
  mode: "development",
  plugins: [vue()],
  preview: {
    port: 8989,
  },
  server: {
    port: 8989,
    historyApiFallback: true,
    hmr: true,
    watch: {
      paths: ["../server/src"],
    },
    https: {
      key: fs.readFileSync("../server/certs/mykey.key"),
      cert: fs.readFileSync("../server/certs/mycert.crt"),
    },
  },
});
