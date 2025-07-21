import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "src/generated/**/*",
      "node_modules/**/*",
      ".next/**/*",
      "prisma/migrations/**/*",
      "*.config.{js,ts,mjs}",
      "next-env.d.ts",
      "**/generated/**/*",
      "**/prisma/generated/**/*"
    ]
  },
  ...compat.extends("next/core-web-vitals")
];

export default eslintConfig;
