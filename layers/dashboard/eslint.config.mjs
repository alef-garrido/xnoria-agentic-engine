import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";
import reactRefresh from "eslint-plugin-react-refresh";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      tailwindcss,
      "react-refresh": reactRefresh,
    },
    settings: {
      tailwindcss: {
        callees: ["cn"],
        config: "tailwind.config.ts",
      },
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true, allowExportNames: ["metadata"] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
