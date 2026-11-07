import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Existing UI copy contains natural French apostrophes; JSX text is rendered safely by React.
      "react/no-unescaped-entities": "off",
      // Supabase response shapes are validated at runtime at the current integration boundary.
      "@typescript-eslint/no-explicit-any": "off",
      // A few static portal anchors intentionally trigger full navigation between auth boundaries.
      "@next/next/no-html-link-for-pages": "off"
    }
  }
];