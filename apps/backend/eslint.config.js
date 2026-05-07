import js from '@eslint/js'
import ts from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'
export default [
  js.configs.recommended,
  {
    languageOptions: { parser },
    plugins: { '@typescript-eslint': ts },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  }
]