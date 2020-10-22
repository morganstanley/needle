const path = require('path');

module.exports = {
    linterOptions: {
        exclude: [
            "node_modules/**"
        ]
    },
    extends: [
        "tslint:recommended",
        "tslint-plugin-prettier", // runs prettier as tslint rule
        "tslint-config-prettier" // turns off tslint rules that conflict with prettier
    ],
    rules: {
        "prettier": [true, path.join(__dirname, "prettier.config.js")],
        "interface-over-type-literal": false,
        "array-type": false,
        "no-empty-interface": false,
        "quotemark": false,
        "no-string-literal": false,
        "variable-name": ["check-format", "allow-leading-underscore"],
        "no-console": false,
        "max-line-length": false,
        "arrow-parens": false,
        "object-literal-sort-keys": false,
        "max-classes-per-file": [true, 3],
        "prefer-for-of": false,
        "radix": false,
        "member-ordering": [
            true,
            {
                "order": [
                    "private-static-field",
                    "protected-static-field",
                    "public-static-field",
                    "private-instance-field",
                    "protected-instance-field",
                    "public-instance-field",
                    "private-constructor",
                    "protected-constructor",
                    "public-constructor",
                    "public-instance-method",
                    "protected-instance-method",
                    "private-instance-method"
                ]
            }
        ]
    }
}