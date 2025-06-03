import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import eslintPluginJest from 'eslint-plugin-jest';
import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';

const compat = new FlatCompat();

export default [
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