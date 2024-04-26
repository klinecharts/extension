import { globSync } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript'
import eslint from '@rollup/plugin-eslint'

export default defineConfig({
	plugins: [
		typescript(),
		eslint({
			throwOnError: true
		}),
	],
	input: Object.fromEntries(
		globSync('src/**/*.ts').map(file => [
			path.relative(
				'src',
				file.slice(0, file.length - path.extname(file).length)
			),
			fileURLToPath(new URL(file, import.meta.url))
		])
	),
	output: {
		format: 'es',
		dir: 'dist',
		banner:`
    /**
     * @license
     * Copyright (c) 2024 lihu.
     * Licensed under Apache License 2.0 https://www.apache.org/licenses/LICENSE-2.0
     */`.trim(),
	}
})