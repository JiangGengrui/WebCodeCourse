import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TodoApp } from './components/TodoApp';
import './style.css';

// 唯一一处「碰 DOM」的地方：把 React 挂到页面上。
// 从这里往下的所有组件都不再查询/创建 DOM 节点，页面完全由 State 推导出来。
const root = document.getElementById('root');
if (root === null) throw new Error('index.html 里缺少挂载点 #root');

createRoot(root).render(
    <StrictMode>
        <TodoApp />
    </StrictMode>,
);

console.log('[app] 待办事项 V4.0（React）已启动');
