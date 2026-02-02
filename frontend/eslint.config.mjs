import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next";

const eslintConfig = defineConfig([
  ...next,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
