import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';

export default tseslint.config(
  {
    ignores: ['dist/**/*']
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended],
    plugins: {
      'react': reactPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
    }
  },
  {
    files: ['**/*.rules'],
    languageOptions: {
      parser: firebaseRulesPlugin.parser,
    },
    plugins: {
      '@firebase/security-rules': firebaseRulesPlugin,
    },
    rules: {
      ...firebaseRulesPlugin.configs['flat/recommended'].rules,
    },
  }
);
