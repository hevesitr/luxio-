module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn'
  }
};
