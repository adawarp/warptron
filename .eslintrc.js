module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true
  },
  extends: ['standard', 'eslint:recommended'],
  parserOptions: {
    ecmaVersion: 11
  },
  rules: {
    'new-cap': 'off'
  }
}
