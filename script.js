// To-Do List Application
class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.taskIdCounter = 1;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadTasksFromStorage();
        this.renderTasks();
        this.updateStats();
    }

    initializeElements() {
        // Form elements
        this.taskForm = document.getElementById('taskForm');
        this.taskTitleInput = document.getElementById('taskTitle');
        this.taskCategorySelect = document.getElementById('taskCategory');
        this.taskPrioritySelect = document.getElementById('taskPriority');
        this.taskDueDateInput = document.getElementById('taskDueDate');

        // Display elements
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');

        // Filter elements
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.categoryButtons = document.querySelectorAll('.category-btn');

        // Stats elements
        this.totalTasksElement = document.getElementById('totalTasks');
        this.completedTasksElement = document.getElementById('completedTasks');
        this.pendingTasksElement = document.getElementById('pendingTasks');
    }

    attachEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target);
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
            });
        });

        // Category buttons
        this.categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveCategory(e.target);
                this.currentCategory = e.target.dataset.category;
                this.renderTasks();
            });
        });
    }

    addTask() {
        const title = this.taskTitleInput.value.trim();
        if (!title) return;

        const task = {
            id: this.taskIdCounter++,
            title: title,
            category: this.taskCategorySelect.value || 'other',
            priority: this.taskPrioritySelect.value,
            dueDate: this.taskDueDateInput.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasksToStorage();
        this.renderTasks();
        this.updateStats();
        this.resetForm();
    }

    resetForm() {
        this.taskTitleInput.value = '';
        this.taskCategorySelect.value = '';
        this.taskPrioritySelect.value = 'low';
        this.taskDueDateInput.value = '';
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasksToStorage();
            this.renderTasks();
            this.updateStats();
        }
    }

    deleteTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.saveTasksToStorage();
                this.renderTasks();
                this.updateStats();
            }, 300);
        }
    }

    getFilteredTasks() {
        let filteredTasks = [...this.tasks];

        // Apply status filter
        if (this.currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (this.currentFilter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (this.currentFilter === 'overdue') {
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = filteredTasks.filter(task => 
                !task.completed && task.dueDate && task.dueDate < today
            );
        }

        // Apply category filter
        if (this.currentCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === this.currentCategory);
        }

        // Sort tasks by priority and due date
        filteredTasks.sort((a, b) => {
            // First sort by completion status
            if (a.completed !== b.completed) {
                return a.completed - b.completed;
            }

            // Then by priority
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // Finally by due date
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            
            return 0;
        });

        return filteredTasks;
    }

    isTaskOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        const today = new Date().toISOString().split('T')[0];
        return task.dueDate < today;
    }

    formatDueDate(dueDate) {
        if (!dueDate) return null;
        
        const date = new Date(dueDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const taskDate = date.toDateString();
        const todayDate = today.toDateString();
        const tomorrowDate = tomorrow.toDateString();

        if (taskDate === todayDate) {
            return 'Today';
        } else if (taskDate === tomorrowDate) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''} ${this.isTaskOverdue(task) ? 'overdue' : ''}`;
        taskElement.dataset.taskId = task.id;

        const formattedDueDate = this.formatDueDate(task.dueDate);
        const dueDateClass = this.isTaskOverdue(task) ? 'overdue' : '';

        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <div class="task-actions">
                    <button class="btn complete-btn ${task.completed ? 'completed' : ''}" 
                            onclick="todoApp.toggleTaskComplete(${task.id})"
                            title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                        ${task.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button class="btn delete-btn" 
                            onclick="todoApp.deleteTask(${task.id})"
                            title="Delete task">
                        Delete
                    </button>
                </div>
            </div>
            <div class="task-details">
                <span class="task-category ${task.category}">${this.capitalizeFirst(task.category)}</span>
                <span class="task-priority ${task.priority}">
                    ${this.capitalizeFirst(task.priority)} Priority
                </span>
                ${formattedDueDate ? `<span class="task-due-date ${dueDateClass}">Due: ${formattedDueDate}</span>` : ''}
            </div>
        `;

        return taskElement;
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        this.taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.emptyState.style.display = 'block';
        } else {
            this.emptyState.classList.add('hidden');
            this.emptyState.style.display = 'none';
            
            filteredTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                this.taskList.appendChild(taskElement);
            });
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        this.totalTasksElement.textContent = totalTasks;
        this.completedTasksElement.textContent = completedTasks;
        this.pendingTasksElement.textContent = pendingTasks;
    }

    setActiveFilter(activeButton) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    setActiveCategory(activeButton) {
        this.categoryButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    saveTasksToStorage() {
        try {
            // Using a simple in-memory storage simulation since localStorage is not available
            this.tasksStorage = JSON.stringify(this.tasks);
        } catch (error) {
            console.warn('Storage not available, tasks will not persist between sessions');
        }
    }

    loadTasksFromStorage() {
        try {
            // In a real environment, this would use localStorage
            // const savedTasks = localStorage.getItem('todoTasks');
            // For this demo, we'll start with some sample tasks
            if (this.tasks.length === 0) {
                this.loadSampleTasks();
            }
        } catch (error) {
            console.warn('Could not load tasks from storage');
            this.loadSampleTasks();
        }
    }

    loadSampleTasks() {
        const sampleTasks = [
            {
                id: this.taskIdCounter++,
                title: 'Complete project proposal',
                category: 'work',
                priority: 'high',
                dueDate: '2025-06-15',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: this.taskIdCounter++,
                title: 'Buy groceries for the week',
                category: 'shopping',
                priority: 'medium',
                dueDate: '2025-06-12',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: this.taskIdCounter++,
                title: 'Schedule doctor appointment',
                category: 'health',
                priority: 'medium',
                dueDate: '',
                completed: true,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            }
        ];
        
        this.tasks = sampleTasks;
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});

// Optional: Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + N to focus on new task input
    if (e.altKey && e.key === 'n') {
        e.preventDefault();
        document.getElementById('taskTitle').focus();
    }
    
    // Escape to clear the form
    if (e.key === 'Escape') {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
            window.todoApp.resetForm();
            document.activeElement.blur();
        }
    }
});