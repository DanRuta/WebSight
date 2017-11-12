module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true,
    },
    "parserOptions": {
        "ecmaVersion": 2017
    },
    "rules": {
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "never"
        ],
        "no-var": [
            "error"
        ],
        "strict": [
            "error"
        ],
        "prefer-arrow-callback": [
            "error"
        ],
        "prefer-const": [
            "error"
        ],
        "prefer-destructuring": [
            1,
            {
                "object": true
            }
        ],
        "no-extra-parens": [
            "error"
        ],
        "capitalized-comments": [
            1
        ],
        "comma-dangle": [
            "error",
            "never"
        ],
        "keyword-spacing": [
            "error",
            {
                before: true,
                after: true
            }
        ],
        "no-mixed-spaces-and-tabs": [
            "error"
        ]
    }
}