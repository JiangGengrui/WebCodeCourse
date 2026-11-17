/**
 * 沿用第 10 周锁定的组合：ESLint 8.57 + @typescript-eslint 7.18。
 * 换 9.x 的话 .eslintrc.cjs 会直接报「ESLintRC 配置不再支持」。
 *
 * 本周新增 .tsx：parserOptions 要打开 jsx，
 * 否则 <div> 这种写法会被当成立即执行函数调用报解析错误。
 */
module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
    },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    rules: {
        complexity: ['error', 10],
        'max-depth': ['error', 3],
        '@typescript-eslint/no-explicit-any': 'error',
        'no-console': 'off',
        '@typescript-eslint/consistent-type-imports': 'warn',
    },
    ignorePatterns: ['dist/', 'node_modules/', '*.config.*'],
};
