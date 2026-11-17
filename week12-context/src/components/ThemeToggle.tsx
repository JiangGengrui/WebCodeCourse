import { useTheme } from '../theme';

/**
 * 消费者 ①：只负责「切换」这一个动作。
 * 它不需要知道主题存在哪儿、怎么落盘、CSS 变量叫什么，
 * 只要从 Context 里拿 theme 和 toggle —— 这是 Context 最典型的用法。
 */
export function ThemeToggle(): JSX.Element {
    const { theme, toggle } = useTheme();
    const next = theme === 'light' ? '深色' : '浅色';

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            title={'切换到' + next + '主题'}
            aria-label={'当前' + (theme === 'light' ? '浅色' : '深色') + '主题，点击切换到' + next}
        >
            {theme === 'light' ? '🌙 深色' : '☀️ 浅色'}
        </button>
    );
}
