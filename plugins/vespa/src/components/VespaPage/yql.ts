
  // FIXME: Get all the keywords for YQL
  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "LIMIT",
    "ORDER",
    "BY",
    "SOURCES",
    "IS",
];

// FIXME: Get all the operators for YQL
const operators = [
    'ALL',
    'AND',
    'ANY',
    'BETWEEN',
    'EXISTS',
    'IN',
    'LIKE',
    'NOT',
    'OR',
    'SOME',
    "CONTAINS",
];

// FIXME: Get all the built in functions for YQL
const builtInFunctions = [
    "phrase",
    "near",
    "onear",
    "sameElement",
    // Aggregate
    'AVG',
    'CHECKSUM_AGG',
    'COUNT',
    'COUNT_BIG',
    'GROUPING',
    'GROUPING_ID',
    'MAX',
    'MIN',
    'SUM',
    'STDEV',
    'STDEVP',
    'VAR',
    'VARP',
];

const allKeywords = [
    ...keywords,
    // ...operators,
    ...builtInFunctions,
];

export function monacoRegisterYql(monaco) {

    monaco.languages.register({
        id: 'yql'
    })

    monaco.languages.setMonarchTokensProvider('yql', {
        ignoreCase: true,
        brackets: [
            { open: '[', close: ']', token: 'delimiter.square' },
            { open: '(', close: ')', token: 'delimiter.parenthesis' }
        ],
        keywords: keywords,
        pseudoColumns: ['$ACTION', '$IDENTITY', '$ROWGUID', '$PARTITION'],
        operators: operators,
        builtinVariables: [
            "NotKnownAtThisPoint",
        ],
        builtinFunctions: builtInFunctions,
        tokenizer: {
            root: [
                { include: '@comments' },
                { include: '@whitespace' },
                { include: '@pseudoColumns' },
                { include: '@numbers' },
                { include: '@strings' },
                { include: '@complexIdentifiers' },
                { include: '@scopes' },
                [/[;,.]/, 'delimiter'],
                [/[()]/, '@brackets'],
                [
                    /[\w@#$]+/,
                    {
                        // keyword seems to be the only one colored right now :-(
                        cases: {
                            '@operators': 'operator', // Use keyword as we cannot overide the theme yet
                            '@builtinVariables': 'predefined',
                            '@builtinFunctions': 'predefined',
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }
                ],
                [/[<>=!%&+\-*/|~^]/, 'operator']
            ],
            whitespace: [[/\s+/, 'white']],
            comments: [
                [/--+.*/, 'comment'],
                [/\/\*/, { token: 'comment.quote', next: '@comment' }]
            ],
            comment: [
                [/[^*/]+/, 'comment'],
                [/\*\//, { token: 'comment.quote', next: '@pop' }],
                [/./, 'comment']
            ],
            pseudoColumns: [
                [
                    /[$][A-Za-z_][\w@#$]*/,
                    {
                        cases: {
                            '@pseudoColumns': 'predefined',
                            '@default': 'identifier'
                        }
                    }
                ]
            ],
            numbers: [
                [/0[xX][0-9a-fA-F]*/, 'number'],
                [/[$][+-]*\d*(\.\d*)?/, 'number'],
                [/((\d+(\.\d*)?)|(\.\d+))([eE][\-+]?\d+)?/, 'number']
            ],
            strings: [
                [/N'/, { token: 'string', next: '@string' }],
                [/'/, { token: 'string', next: '@string' }]
            ],
            string: [
                [/[^']+/, 'string'],
                [/''/, 'string'],
                [/'/, { token: 'string', next: '@pop' }]
            ],
            complexIdentifiers: [
                [/\[/, { token: 'identifier.quote', next: '@bracketedIdentifier' }],
                [/"/, { token: 'identifier.quote', next: '@quotedIdentifier' }]
            ],
            bracketedIdentifier: [
                [/[^\]]+/, 'identifier'],
                [/]]/, 'identifier'],
                [/]/, { token: 'identifier.quote', next: '@pop' }]
            ],
            quotedIdentifier: [
                [/[^"]+/, 'identifier'],
                [/""/, 'identifier'],
                [/"/, { token: 'identifier.quote', next: '@pop' }]
            ],
            scopes: [
                [/BEGIN\s+(DISTRIBUTED\s+)?TRAN(SACTION)?\b/i, 'keyword'],
                [/BEGIN\s+TRY\b/i, { token: 'keyword.try' }],
                [/END\s+TRY\b/i, { token: 'keyword.try' }],
                [/BEGIN\s+CATCH\b/i, { token: 'keyword.catch' }],
                [/END\s+CATCH\b/i, { token: 'keyword.catch' }],
                [/(BEGIN|CASE)\b/i, { token: 'keyword.block' }],
                [/END\b/i, { token: 'keyword.block' }],
                [/WHEN\b/i, { token: 'keyword.choice' }],
                [/THEN\b/i, { token: 'keyword.choice' }]
            ]
        }
    });

}

export function monacoRegisterYqlCompletionItemProvider(monaco, schemas) {
    return monaco.languages.registerCompletionItemProvider('yql', {
        provideCompletionItems: (model, position) => {
            const suggestions: any[] = [
                // Add more useful samples here :-)
                {
                    label: " insert sample query",
                    kind: monaco.languages.CompletionItemKind.Method,
                    // insertText: "{\"trace\": {\"level\": 3, \"timestamp\": true, \"explainLevel\": 1 }}",
                    insertText: "select * from index where true limit 100;",
                },
                // Add the schemas for completion
                ...schemas.map(schemaName => {
                    const indexName = schemaName.replace(".sd", "")
                    return {
                        label: indexName,
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: indexName,
                    }
                }),
                ...allKeywords.map(k => {
                    return {
                        label: k,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: k,
                    }
                })
            ];
            return { suggestions: suggestions }
        }
    });
}

// FIXME: This currently does not work
// Uncaught TypeError: Cannot read properties of undefined (reading 'editor.foreground')
export function monacoRegisterYqlTheme(moncao) {

    moncao.editor.defineTheme('yql-dark', {
        base: 'vs-dark',
        rules: [
            { token: "keyword", foreground: "#008b8b", fontStyle: "bold" },
            { token: "identifier", foreground: "#eeee88" },            
            { token: "operator", foreground: "#b0c4de" },
            { token: "predefined", foreground: "#7fffd4" }, // #9932cc
            { token: "comment", foreground: "#88aa88" },

            { token: "string", foreground: "#ffffff" },
            { token: "variable", foreground: "#00ff00" },
        ],
        colors: {
            "editor.foreground": "#eeffff",
            "editor.background": "#1e1e1e",
        },
    })

    moncao.editor.defineTheme('yql-light', {
        base: 'vs',
        rules: [
            { token: "keyword", foreground: "#008b8b", fontStyle: "bold" },
            { token: "identifier", foreground: "#000077" },            
            { token: "operator", foreground: "#008800" },
            { token: "predefined", foreground: "#777700" }, // #9932cc
            { token: "comment", foreground: "#888888" },

            { token: "string", foreground: "#000000" },
            { token: "variable", foreground: "#00ff00" },
        ],
        colors: {
            "editor.foreground": "#1e1e1e",
            "editor.background": "#ffffff",
        },
    })
}
