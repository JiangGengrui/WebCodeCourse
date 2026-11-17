import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TodoApp } from './components/TodoApp';
import { ThemeProvider } from './theme';
import './style.css';

// 唯一一处「碰 DOM」的地方：把 React 挂到页面上。
// 从这里往下的所有组件都不再查询/创建 DOM 节点，页面完全由 State 推导出来。
const root = document.getElementById('root');
if (root === null) throw new Error('index.html 里缺少挂载点 #root');

createRoot(root).render(
    <StrictMode>
        {/* Provider 包在 TodoApp 外面：位置在「树的最外层」，
            所以树里任何深度的组件都能 useContext 到主题，
            而不需要 TodoApp 把 theme 一路当 props 传下去。 */}
        <ThemeProvider>
            <TodoApp />
        </ThemeProvider>
    </StrictMode>,
);

console.log('[app] 待办事项 V4.0（Context 主题 + useEffect 持久化）已启动');
