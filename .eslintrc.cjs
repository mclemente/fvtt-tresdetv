// SPDX-FileCopyrightText: 2022 Johannes Loher
// SPDX-FileCopyrightText: 2022 David Archibald
//
// SPDX-License-Identifier: MIT

module.exports = {
	parserOptions: {
		ecmaVersion: 2020,
		extraFileExtensions: [".cjs", ".mjs"],
		sourceType: "module",
		requireConfigFile: false,
	},

	parser: "@babel/eslint-parser",

	env: {
		browser: true,
		es6: true,
		jquery: true,
	},

	extends: ["eslint:recommended", "@typhonjs-fvtt/eslint-config-foundry.js/0.8.0", "plugin:prettier/recommended"],

	plugins: [],

	rules: {
		// Specify any specific ESLint rules.
		"prettier/prettier": [
			"error",
			{
				endOfLine: "auto",
			},
		],
	},

	globals: {
		globalThis: false,
		DEFAULT_TOKEN: false,
	},

	overrides: [
		{
			files: ["./*.js", "./*.cjs", "./*.mjs"],
			env: {
				node: true,
			},
		},
	],
};
