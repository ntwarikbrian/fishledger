/**
 * ESLint Configuration for Fish Management System Server
 * Node.js/Express specific configuration
 */

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,js}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
      sourceType: "module",
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-var-requires": "off",

      // General JavaScript rules
      "no-console": "off", // Allow console.log in server
      "no-unused-vars": "off",
      "no-unused-expressions": "off",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": "error",
      "curly": "error",

      // Import/Export rules
      "no-duplicate-imports": "error",

      // Error handling
      "no-throw-literal": "error",
    },
  }
);
