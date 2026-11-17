// ============================================================
// theme.tsx —— 主题 Context（W12 V4.0）
//
// 为什么主题要放进 Context 而不是一层层传 props：
// 主题是「跨层级、全局唯一、人人要读」的状态。用 props 传，
// TodoApp → TodoList → TodoItem 每一层都得挂一个 theme prop
// 只为往下递，中间层明明不关心主题，却被迫成为「搬运工」。
// Context 把「谁提供 / 谁消费」解耦：只有真正要用的组件才 useContext。
// ============================================================

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

// 存储 key 单独抽出来：读写两侧用同一个常量，避免一处写 'theme'、另一处写 'Theme'
const STORAGE_KEY = 'theme';

export interface ThemeValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggle: () => void;
}

// 默认值给 null 而不是 'light'：
// 这样「在 Provider 外面调用 useTheme」能被下面的 throw 抓住，
// 而不是安静地拿到一个永远切不动的假主题。
const ThemeContext = createContext<ThemeValue | null>(null);

/** 惰性初始化读主题：只在首次渲染执行一次，且读盘失败不炸页面 */
function loadTheme(): Theme {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
        // 隐私模式 / 存储被禁用时 getItem 本身就会抛，退回浅色
        return 'light';
    }
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
    const [theme, setTheme] = useState<Theme>(loadTheme);

    // 单 Effect：theme 变了才把结果同步到两个「外部系统」
    //   ① <html data-theme> —— 给 CSS 变量用的钩子
    //   ② localStorage —— 下次打开还记得
    // 两件事必须在同一个 Effect 里：拆成两个 Effect 会出现
    // 「DOM 已经变了、存储没跟上」的中间态，刷新后主题回退。
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // 存不进去就算了，不影响本次会话的主题
        }
    }, [theme]);

    // value 用 useMemo 固定：Context 的比较是 Object.is，
    // 每次渲染都新建 {theme, setTheme, toggle} 会让所有消费者白重渲染一遍。
    const value = useMemo<ThemeValue>(
        () => ({
            theme,
            setTheme,
            toggle: () => setTheme(theme === 'light' ? 'dark' : 'light'),
        }),
        [theme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** 自定义 Hook：把 useContext + 空值校验收在一处，组件里只写 const { theme } = useTheme() */
export function useTheme(): ThemeValue {
    const ctx = useContext(ThemeContext);
    if (ctx === null) {
        throw new Error('useTheme 必须在 <ThemeProvider> 内部使用');
    }
    return ctx;
}
