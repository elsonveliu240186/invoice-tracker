// vitest.config.ts
import { defineConfig as defineConfig2, mergeConfig } from "file:///C:/Users/ExpertBook/agenticai/projects/invoice-tracker/frontend/node_modules/.pnpm/vitest@2.1.9_@types+node@22.19.18_jsdom@25.0.1_lightningcss@1.32.0_msw@2.14.6_@types+node@22.19.18_typescript@5.9.3_/node_modules/vitest/dist/config.js";

// vite.config.ts
import { defineConfig } from "file:///C:/Users/ExpertBook/agenticai/projects/invoice-tracker/frontend/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.18_lightningcss@1.32.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ExpertBook/agenticai/projects/invoice-tracker/frontend/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.18_lightningcss@1.32.0_/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/ExpertBook/agenticai/projects/invoice-tracker/frontend/node_modules/.pnpm/@tailwindcss+vite@4.3.0_vite@5.4.21_@types+node@22.19.18_lightningcss@1.32.0_/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "node:path";
var __vite_injected_original_dirname = "C:\\Users\\ExpertBook\\agenticai\\projects\\invoice-tracker\\frontend";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  }
});

// vitest.config.ts
var vitest_config_default = mergeConfig(
  vite_config_default,
  defineConfig2({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test-setup.ts"],
      css: false,
      exclude: ["**/node_modules/**", "**/dist/**", "tests/**/*.spec.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "lcov"],
        thresholds: {
          lines: 95,
          functions: 95,
          statements: 95,
          branches: 90
        },
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.test.{ts,tsx}",
          "src/test-setup.ts",
          "src/main.tsx",
          "src/shared/api/mocks/**",
          "src/mocks/**",
          "src/**/*.d.ts",
          "src/**/types.ts",
          // Vendored shadcn/ui primitives — pure presentational wrappers around Radix
          "src/shared/ui/button.tsx",
          "src/shared/ui/input.tsx",
          "src/shared/ui/card.tsx",
          "src/shared/ui/badge.tsx",
          "src/shared/ui/dialog.tsx",
          "src/shared/ui/table.tsx",
          "src/shared/ui/skeleton.tsx",
          "src/shared/ui/sonner.tsx",
          "src/shared/ui/dropdown-menu.tsx",
          "src/shared/ui/avatar.tsx",
          "src/shared/ui/separator.tsx",
          // Additional shadcn/Radix primitive wrappers and utility UI atoms
          "src/shared/ui/sheet.tsx",
          "src/shared/ui/FormField.tsx",
          "src/shared/ui/FormLabel.tsx",
          "src/shared/ui/Icon.tsx"
        ]
      }
    }
  })
);
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyIsICJ2aXRlLmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEV4cGVydEJvb2tcXFxcYWdlbnRpY2FpXFxcXHByb2plY3RzXFxcXGludm9pY2UtdHJhY2tlclxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRXhwZXJ0Qm9va1xcXFxhZ2VudGljYWlcXFxccHJvamVjdHNcXFxcaW52b2ljZS10cmFja2VyXFxcXGZyb250ZW5kXFxcXHZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0V4cGVydEJvb2svYWdlbnRpY2FpL3Byb2plY3RzL2ludm9pY2UtdHJhY2tlci9mcm9udGVuZC92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBtZXJnZUNvbmZpZyB9IGZyb20gJ3ZpdGVzdC9jb25maWcnO1xuaW1wb3J0IHZpdGVDb25maWcgZnJvbSAnLi92aXRlLmNvbmZpZyc7XG5cbmV4cG9ydCBkZWZhdWx0IG1lcmdlQ29uZmlnKFxuICB2aXRlQ29uZmlnLFxuICBkZWZpbmVDb25maWcoe1xuICAgIHRlc3Q6IHtcbiAgICAgIGdsb2JhbHM6IHRydWUsXG4gICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICAgIHNldHVwRmlsZXM6IFsnLi9zcmMvdGVzdC1zZXR1cC50cyddLFxuICAgICAgY3NzOiBmYWxzZSxcbiAgICAgIGV4Y2x1ZGU6IFsnKiovbm9kZV9tb2R1bGVzLyoqJywgJyoqL2Rpc3QvKionLCAndGVzdHMvKiovKi5zcGVjLnRzJ10sXG4gICAgICBjb3ZlcmFnZToge1xuICAgICAgICBwcm92aWRlcjogJ3Y4JyxcbiAgICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdodG1sJywgJ2xjb3YnXSxcbiAgICAgICAgdGhyZXNob2xkczoge1xuICAgICAgICAgIGxpbmVzOiA5NSxcbiAgICAgICAgICBmdW5jdGlvbnM6IDk1LFxuICAgICAgICAgIHN0YXRlbWVudHM6IDk1LFxuICAgICAgICAgIGJyYW5jaGVzOiA5MCxcbiAgICAgICAgfSxcbiAgICAgICAgaW5jbHVkZTogWydzcmMvKiovKi57dHMsdHN4fSddLFxuICAgICAgICBleGNsdWRlOiBbXG4gICAgICAgICAgJ3NyYy8qKi8qLnRlc3Que3RzLHRzeH0nLFxuICAgICAgICAgICdzcmMvdGVzdC1zZXR1cC50cycsXG4gICAgICAgICAgJ3NyYy9tYWluLnRzeCcsXG4gICAgICAgICAgJ3NyYy9zaGFyZWQvYXBpL21vY2tzLyoqJyxcbiAgICAgICAgICAnc3JjL21vY2tzLyoqJyxcbiAgICAgICAgICAnc3JjLyoqLyouZC50cycsXG4gICAgICAgICAgJ3NyYy8qKi90eXBlcy50cycsXG4gICAgICAgICAgLy8gVmVuZG9yZWQgc2hhZGNuL3VpIHByaW1pdGl2ZXMgXHUyMDE0IHB1cmUgcHJlc2VudGF0aW9uYWwgd3JhcHBlcnMgYXJvdW5kIFJhZGl4XG4gICAgICAgICAgJ3NyYy9zaGFyZWQvdWkvYnV0dG9uLnRzeCcsXG4gICAgICAgICAgJ3NyYy9zaGFyZWQvdWkvaW5wdXQudHN4JyxcbiAgICAgICAgICAnc3JjL3NoYXJlZC91aS9jYXJkLnRzeCcsXG4gICAgICAgICAgJ3NyYy9zaGFyZWQvdWkvYmFkZ2UudHN4JyxcbiAgICAgICAgICAnc3JjL3NoYXJlZC91aS9kaWFsb2cudHN4JyxcbiAgICAgICAgICAnc3JjL3NoYXJlZC91aS90YWJsZS50c3gnLFxuICAgICAgICAgICdzcmMvc2hhcmVkL3VpL3NrZWxldG9uLnRzeCcsXG4gICAgICAgICAgJ3NyYy9zaGFyZWQvdWkvc29ubmVyLnRzeCcsXG4gICAgICAgICAgJ3NyYy9zaGFyZWQvdWkvZHJvcGRvd24tbWVudS50c3gnLFxuICAgICAgICAgICdzcmMvc2hhcmVkL3VpL2F2YXRhci50c3gnLFxuICAgICAgICAgICdzcmMvc2hhcmVkL3VpL3NlcGFyYXRvci50c3gnLFxuICAgICAgICAgIC8vIEFkZGl0aW9uYWwgc2hhZGNuL1JhZGl4IHByaW1pdGl2ZSB3cmFwcGVycyBhbmQgdXRpbGl0eSBVSSBhdG9tc1xuICAgICAgICAgICdzcmMvc2hhcmVkL3VpL3NoZWV0LnRzeCcsXG4gICAgICAgICAgJ3NyYy9zaGFyZWQvdWkvRm9ybUZpZWxkLnRzeCcsXG4gICAgICAgICAgJ3NyYy9zaGFyZWQvdWkvRm9ybUxhYmVsLnRzeCcsXG4gICAgICAgICAgJ3NyYy9zaGFyZWQvdWkvSWNvbi50c3gnLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9LFxuICB9KSxcbik7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEV4cGVydEJvb2tcXFxcYWdlbnRpY2FpXFxcXHByb2plY3RzXFxcXGludm9pY2UtdHJhY2tlclxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRXhwZXJ0Qm9va1xcXFxhZ2VudGljYWlcXFxccHJvamVjdHNcXFxcaW52b2ljZS10cmFja2VyXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9FeHBlcnRCb29rL2FnZW50aWNhaS9wcm9qZWN0cy9pbnZvaWNlLXRyYWNrZXIvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpWSxTQUFTLGdCQUFBQSxlQUFjLG1CQUFtQjs7O0FDQTlDLFNBQVMsb0JBQW9CO0FBQzFaLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNoQyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7OztBRGxCRCxJQUFPLHdCQUFRO0FBQUEsRUFDYjtBQUFBLEVBQ0FDLGNBQWE7QUFBQSxJQUNYLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULGFBQWE7QUFBQSxNQUNiLFlBQVksQ0FBQyxxQkFBcUI7QUFBQSxNQUNsQyxLQUFLO0FBQUEsTUFDTCxTQUFTLENBQUMsc0JBQXNCLGNBQWMsb0JBQW9CO0FBQUEsTUFDbEUsVUFBVTtBQUFBLFFBQ1IsVUFBVTtBQUFBLFFBQ1YsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsUUFDakMsWUFBWTtBQUFBLFVBQ1YsT0FBTztBQUFBLFVBQ1AsV0FBVztBQUFBLFVBQ1gsWUFBWTtBQUFBLFVBQ1osVUFBVTtBQUFBLFFBQ1o7QUFBQSxRQUNBLFNBQVMsQ0FBQyxtQkFBbUI7QUFBQSxRQUM3QixTQUFTO0FBQUEsVUFDUDtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFFQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQTtBQUFBLFVBRUE7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGLENBQUM7QUFDSDsiLAogICJuYW1lcyI6IFsiZGVmaW5lQ29uZmlnIiwgImRlZmluZUNvbmZpZyJdCn0K
