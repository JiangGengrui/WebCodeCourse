import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TodoAppDefect } from './TodoAppDefect';
import '../src/style.css';

const root = document.getElementById('root');
if (root === null) throw new Error('defect.html 里缺少挂载点 #root');

createRoot(root).render(
    <StrictMode>
        <TodoAppDefect />
    </StrictMode>,
);

console.log('[defect] 靶子代码已启动（双 Effect 版）');
