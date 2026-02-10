export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/ui", "@vueuse/nuxt"],

  build: {
    transpile: ['jwt-decode']
  },

  css: ["~/assets/css/main.css"],

  routeRules: {
    "/api/**": {
      cors: true,
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.PROD_API_BASE_URL,
      // apiBaseUrl: process.env.DEV_API_BASE_URL,
    },
    googleFonts: {
      families: {
        Content: [400, 700],
      },
      display: "swap",
    },
  },
});
