// ============================================================
// app.js —— V1.0：待办事项的「添加」与「删除」
// 此时 DOM 就是数据源：列表项直接 appendChild 进 <ul>，
// 删除时把节点 remove() 掉。没有独立的数据层，也没有存储。
// ============================================================

(function () {
    'use strict';

    var input = document.getElementById('todo-input');
    var list = document.getElementById('todo-list');
    var addBtn = document.getElementById('add-btn');

    // 添加一条待办
    function addTodo() {
        // trim 去掉首尾空白，空内容直接拦截
        var text = input.value.trim();
        if (text === '') {
            input.focus();
            return;
        }

        // 用 DOM API + textContent，用户输入当纯文本处理，杜绝 XSS
        var li = document.createElement('li');

        var span = document.createElement('span');
        span.textContent = text;        // 不解析 HTML，安全

        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'del-btn';
        delBtn.textContent = '删除';

        li.appendChild(span);
        li.appendChild(delBtn);
        list.appendChild(li);

        input.value = '';
        input.focus();
    }

    // 事件委托：只绑定一次，动态新增的 li 也能响应删除
    list.addEventListener('click', function (e) {
        var target = e.target;
        if (target && target.classList.contains('del-btn')) {
            target.parentNode.remove();
        }
    });

    addBtn.addEventListener('click', addTodo);

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
})();
