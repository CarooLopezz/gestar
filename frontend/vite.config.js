import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Permite usar rutas relativas /api/... en desarrollo si se prefiere
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
