const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');
const eslintPluginJest = require('eslint-plugin-jest');
const eslintPluginTs = require('@typescript-eslint/eslint-plugin');
const parserTs = require('@typescript-eslint/parser');

const compat = new FlatCompat();

module.exports = [
  js.configs.recommended,
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  ...compat.extends('plugin:jest/recommended'),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': eslintPluginTs,
      jest: eslintPluginJest,
    },
    rules: {
      // Add or override rules here
    },
  },
]; 