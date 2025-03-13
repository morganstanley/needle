import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import pluginPrettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ["karma.conf.js", 'karma.base.conf.js', 'prettier.config.js' ], // Proper way to ignore files in Flat Config
    },
    { files: ["**/*.{js,mjs,cjs,ts}"]},
    { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        plugins: { prettier: pluginPrettier },
        rules: {
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            "@typescript-eslint/no-explicit-any": 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-this-alias': 'off',
        },
    },
];
