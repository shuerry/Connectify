import { defineConfig } from "cypress";
import dotenv from "dotenv";

dotenv.config();

const baseUrl = process.env.CLIENT_URL || "http://localhost:4530";

export default defineConfig({
  e2e: {
    baseUrl,
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(_on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
      config.env = {
        ...process.env,
        ...config.env,
      };

      return config;
    },
  },
});
