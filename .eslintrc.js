module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-native/all'
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react']
    }
  },
  plugins: ['react', 'react-native'],
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'react/prop-types': 'off',
    'react-native/no-unused-styles': 'warn',
    'react-native/no-inline-styles': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
