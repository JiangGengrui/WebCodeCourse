/**
 * ESLint 采用 8.x 的「传统配置」格式（.eslintrc.cjs）。
 *
 * 为什么锁 8.x 而不是 9.x：
 *   ESLint 9 默认只认 eslint.config.js（扁平配置），
 *   模板要求的 .eslintrc.cjs 在 9.x 下会直接报 "ESLintRC 配置不再支持"。
 *   8.57 是最后一条支持 .eslintrc.cjs 的版本线，配 @typescript-eslint 7.x 刚好。
 *
 * 三条硬规则来自本周任务书：
 *   complexity 10          —— 单函数分支数上限
 *   max-depth 3            —— 嵌套层数上限
 *   no-explicit-any: error —— 写 any 直接报错，不是警告
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
        // 不开 project：类型感知（type-aware）规则要额外跑一遍编译，
        // 本周三条规则都不需要类型信息，开了只是变慢。
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        // 必须放最后：关掉所有与排版相关的规则，把格式交给 Prettier，
        // 否则 eslint 和 prettier 会互相改、来回打架。
        'prettier',
    ],
    rules: {
        complexity: ['error', 10],
        'max-depth': ['error', 3],
        '@typescript-eslint/no-explicit-any': 'error',
        // 下面两条不是任务书要求，是工程习惯：
        'no-console': 'off',                       // 本项目用 console 做启动日志
        '@typescript-eslint/consistent-type-imports': 'warn',  // 类型导入提醒，只算 warning
    },
    ignorePatterns: ['dist/', 'node_modules/', '*.config.*'],
};
