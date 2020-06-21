module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/essential', 'airbnb-base'],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-plusplus': 'off',
    'comma-dangle': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-restricted-syntax': 0,
    'import/export': 0,
    'global-require': 0,
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
  // plugins: ['prettier'],
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
    },
  ],
};
