module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended"
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        },
        {
            "files": ["packages/core/**/*"],
            "rules": {
                "react/jsx-uses-react": "off",
                "react/jsx-uses-vars": "off"
            }
        }
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "plugins": [
        "@typescript-eslint",
        "react",
        "react-hooks"
    ],
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "rules": {
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "@typescript-eslint/no-explicit-any": "off",
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/no-unescaped-entities": "off",
        "react-hooks/exhaustive-deps": "warn",
        "prefer-const": "error",
        "no-case-declarations": "error",
        "no-useless-escape": "error"
    },
    "ignorePatterns": [
        "dist/",
        "node_modules/",
        "*.config.js",
        "*.config.ts"
    ]
}
