module.exports = {
  extends: ['airbnb-base', 'prettier'],

  env: {
    browser: false,
    node: true
  },

  parserOptions: {
    ecmaVersion: 6
  },

  parser: 'typescript-eslint-parser',

  // eventuell auslagern in dev.config???
  rules: {
    'func-names': [0, 'as-needed'],
    'no-console': 0,
    yoda: 0
  }
};
