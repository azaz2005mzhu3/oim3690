// Simple to-do list app with localStorage persistence.
(function () {
    const STORAGE_KEY = "oim3690-todos";

    const form = document.getElementById("todo-form");
    const input = document.getElementById("todo-input");
    const list = document.getElementById("todo-list");
    const emptyMessage = document.getElementById("todo-empty");
    const countLabel = document.getElementById("todo-count");
    const clearCompletedBtn = document.getElementById("todo-clear-completed");

    let todos = loadTodos();

    function loadTodos() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function saveTodos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    function render() {
        list.innerHTML = "";

        todos.forEach((todo) => {
            const item = document.createElement("li");
            item.className = "todo-item" + (todo.completed ? " completed" : "");
            item.dataset.id = todo.id;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = todo.completed;
            checkbox.addEventListener("change", () => toggleTodo(todo.id));

            const text = document.createElement("span");
            text.textContent = todo.text;

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "todo-delete";
            deleteBtn.textContent = "\u2715";
            deleteBtn.setAttribute("aria-label", "Delete task");
            deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

            item.append(checkbox, text, deleteBtn);
            list.appendChild(item);
        });

        emptyMessage.style.display = todos.length === 0 ? "block" : "none";

        const remaining = todos.filter((todo) => !todo.completed).length;
        countLabel.textContent = `${remaining} task${remaining === 1 ? "" : "s"} left`;
    }

    function addTodo(text) {
        todos.push({ id: Date.now().toString(), text, completed: false });
        saveTodos();
        render();
    }

    function toggleTodo(id) {
        const todo = todos.find((t) => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos();
            render();
        }
    }

    function deleteTodo(id) {
        todos = todos.filter((t) => t.id !== id);
        saveTodos();
        render();
    }

    function clearCompleted() {
        todos = todos.filter((t) => !t.completed);
        saveTodos();
        render();
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        addTodo(text);
        input.value = "";
        input.focus();
    });

    clearCompletedBtn.addEventListener("click", clearCompleted);

    render();
})();
