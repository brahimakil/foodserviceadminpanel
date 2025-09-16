import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 3001,
    // Add history API fallback for client-side routing
    historyApiFallback: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add build configuration for proper routing
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Ensure proper handling of routes during development
  preview: {
    port: 3001,
    host: "::",
    // Enable history API fallback for preview mode too
    open: false,
  },
});


