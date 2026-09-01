import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
  base: "/wecdschemes",
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/wecdschemes/wecdschemes_backend": {
        target: "https://mahadevaaya.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
