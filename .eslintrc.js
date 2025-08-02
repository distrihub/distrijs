module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
    ],
    overrides: [
        {
            env: {
                node: true,
            },
            files: [
                ".eslintrc.{js,cjs}",
                "*.config.{js,ts}",
                "scripts/**/*.{js,ts}",
            ],
            parserOptions: {
                sourceType: "script",
            },
        },
        {
            files: ["**/*.ts", "**/*.tsx"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            plugins: ["@typescript-eslint", "react", "react-hooks"],
            rules: {
                // TypeScript specific rules
                "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
                "@typescript-eslint/no-explicit-any": "warn",
                "@typescript-eslint/explicit-function-return-type": "off",
                "@typescript-eslint/explicit-module-boundary-types": "off",
                "@typescript-eslint/no-non-null-assertion": "warn",

                // React specific rules
                "react/react-in-jsx-scope": "off", // Not needed in React 17+
                "react/prop-types": "off", // Using TypeScript for prop validation
                "react/jsx-uses-react": "off", // Not needed in React 17+
                "react/jsx-uses-vars": "error",
                "react-hooks/rules-of-hooks": "error",
                "react-hooks/exhaustive-deps": "warn",

                // General rules
                "no-console": "warn",
                "no-debugger": "error",
                "prefer-const": "error",
                "no-var": "error",
                "no-unused-vars": "off", // Using TypeScript version instead
            },
        },
        {
            files: ["**/*.js", "**/*.jsx"],
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            plugins: ["react", "react-hooks"],
            rules: {
                "react/react-in-jsx-scope": "off",
                "react/prop-types": "off",
                "react/jsx-uses-react": "off",
                "react/jsx-uses-vars": "error",
                "react-hooks/rules-of-hooks": "error",
                "react-hooks/exhaustive-deps": "warn",
                "no-console": "warn",
                "no-debugger": "error",
                "prefer-const": "error",
                "no-var": "error",
            },
        },
    ],
    settings: {
        react: {
            version: "detect",
        },
    },
    ignorePatterns: [
        "node_modules/",
        "dist/",
        "build/",
        ".next/",
        "coverage/",
        "*.min.js",
        "*.bundle.js",
    ],
};
