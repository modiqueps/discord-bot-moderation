import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "coverage/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "constructor-super": "error",
      "no-async-promise-executor": "error",
      "no-constant-binary-expression": "error",
      "no-duplicate-imports": "error",
      "no-new-native-nonconstructor": "error",
      "no-promise-executor-return": "error",
      "no-self-assign": "error",
      "no-unreachable": "error",
      "no-unused-private-class-members": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-use-before-define": ["error", { functions: false }],
      "no-useless-assignment": "error",
      "no-useless-catch": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
    },
  },
];
