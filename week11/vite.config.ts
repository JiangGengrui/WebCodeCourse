// 用 vitest/config 的 defineConfig：它多认一个 test 字段，
// 换成 vite 的 defineConfig 时 test 会被 TS 当成未知属性报错。
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        // todo.test.ts 只测纯函数，不需要 jsdom，跑在 node 里最快
        environment: 'node',
        include: ['tests/**/*.test.ts'],
    },
});
