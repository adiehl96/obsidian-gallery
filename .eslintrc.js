module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "standard-with-typescript",
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
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": ["tsconfig.json"]
    },
    "rules": {
        'object-curly-newline': 2,
        'react/jsx-curly-newline': [
            2,
            {
                'multiline': "require",
                'singleline': "require"
            }
        ],
        //"linebreak-style": [2, "unix"],
        "semi": [2, "always"],
        "indent": [2, 4, {"VariableDeclarator": 0}],
        "brace-style": [2, "allman"]
    }
}
