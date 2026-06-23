// script.js - full to-do logic with date sorting

(function() {
    // ----- STATE -----
    let tasks = [];
    let editingId = null;
    let isUsingCalendarPicker = false;
    let isDateConfirmed = false;
    let searchQuery = '';

    // DOM refs
    const container = document.getElementById('taskListContainer');
    const taskInput = document.getElementById('taskInput');
    const taskDateTime = document.getElementById('taskDateTime');
    const addBtn = document.getElementById('addTaskBtn');
    const calendarIcon = document.getElementById('calendarIcon');
    const okDateBtn = document.getElementById('okDateBtn');
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const searchResultsCount = document.getElementById('searchResultsCount');

    const totalSpan = document.getElementById('totalTasks');
    const completedSpan = document.getElementById('completedTasks');
    const pendingSpan = document.getElementById('pendingTasks');
    const completionRate = document.getElementById('completionRate');
    const progressBar = document.getElementById('progressBar');
    const completedCount = document.getElementById('completedCount');
    const totalCount = document.getElementById('totalCount');
    const statusText = document.getElementById('statusText');

    // ----- PERSISTENCE -----
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            tasks = JSON.parse(saved);
        } else {
            tasks = [];
        }
    }

    // helpers
    function generateId() {
        return Date.now() + Math.random().toString(36).substring(2, 6);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Highlight matching text
    function highlightText(text, query) {
        if (!query || !text) return escapeHtml(text);
        const escapedText = escapeHtml(text);
        const escapedQuery = escapeHtml(query);
        const regex = new RegExp(escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return escapedText.replace(regex, match => `<span class="highlight-match">${match}</span>`);
    }

    // ----- SORT TASKS BY DATE (NEWEST FIRST) -----
    function sortTasksByDate(taskArray) {
        return [...taskArray].sort((a, b) => {
            // Completed tasks go to the bottom
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            
            // If both have due dates, sort by date (newest first)
            if (a.due && b.due) {
                return new Date(b.due) - new Date(a.due);
            }
            
            // If only one has a due date, put the one with date first
            if (a.due && !b.due) return -1;
            if (!a.due && b.due) return 1;
            
            // If no dates, sort by creation time (newest first)
            return b.id - a.id;
        });
    }

    // ----- CALENDAR ICON + OK BUTTON -----
    calendarIcon.addEventListener('click', function(e) {
        e.preventDefault();
        isUsingCalendarPicker = true;
        isDateConfirmed = false;
        okDateBtn.style.display = 'inline-block';
        okDateBtn.textContent = 'OK';
        okDateBtn.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
        
        if (taskDateTime.showPicker) {
            taskDateTime.showPicker();
        } else {
            taskDateTime.focus();
            taskDateTime.click();
        }
    });

    okDateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (taskDateTime.value) {
            isDateConfirmed = true;
            isUsingCalendarPicker = false;
            okDateBtn.textContent = '✓ Confirmed';
            okDateBtn.style.background = 'linear-gradient(135deg, #34d399 0%, #059669 100%)';
            
            setTimeout(() => {
                okDateBtn.style.display = 'none';
                okDateBtn.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
                okDateBtn.textContent = 'OK';
            }, 800);
        } else {
            alert('Please select a date and time first!');
        }
        taskDateTime.blur();
    });

    taskDateTime.addEventListener('change', function() {
        if (taskDateTime.value) {
            okDateBtn.style.display = 'inline-block';
            isDateConfirmed = false;
            isUsingCalendarPicker = true;
            okDateBtn.textContent = 'OK';
            okDateBtn.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
        } else {
            okDateBtn.style.display = 'none';
            isDateConfirmed = false;
            isUsingCalendarPicker = false;
        }
    });

    taskDateTime.addEventListener('input', function() {
        if (!taskDateTime.value) {
            okDateBtn.style.display = 'none';
            isDateConfirmed = false;
            isUsingCalendarPicker = false;
        } else {
            okDateBtn.style.display = 'inline-block';
            isDateConfirmed = false;
            isUsingCalendarPicker = true;
            okDateBtn.textContent = 'OK';
            okDateBtn.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
        }
    });

    // ----- SEARCH FUNCTIONALITY -----
    function performSearch() {
        const query = searchInput.value.trim();
        searchQuery = query;
        
        if (query.length > 0) {
            clearSearch.classList.add('visible');
            clearSearch.style.display = 'flex';
        } else {
            clearSearch.classList.remove('visible');
            clearSearch.style.display = 'none';
        }
        
        render();
    }

    searchInput.addEventListener('input', performSearch);

    clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        searchQuery = '';
        clearSearch.classList.remove('visible');
        clearSearch.style.display = 'none';
        render();
    });

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchQuery = '';
            clearSearch.classList.remove('visible');
            clearSearch.style.display = 'none';
            render();
            searchInput.blur();
        }
    });

    // ----- RENDER -----
    function render() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

        totalSpan.textContent = total;
        completedSpan.textContent = completed;
        pendingSpan.textContent = pending;
        completionRate.textContent = total === 0 ? '0%' : rate + '%';
        progressBar.style.width = (total === 0 ? 0 : rate) + '%';
        completedCount.textContent = completed;
        totalCount.textContent = total;

        if (total === 0) {
            statusText.textContent = 'No tasks yet';
        } else if (completed === total) {
            statusText.textContent = '🎉 All tasks completed!';
        } else if (completed > 0) {
            statusText.textContent = pending + ' task' + (pending > 1 ? 's' : '') + ' remaining';
        } else {
            statusText.textContent = total + ' task' + (total > 1 ? 's' : '') + ' to do';
        }

        // Filter tasks based on search query
        let filteredTasks = tasks;
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            filteredTasks = tasks.filter(task => 
                task.text.toLowerCase().includes(query)
            );
            
            if (searchInput.value.trim()) {
                searchResultsCount.textContent = `${filteredTasks.length} result${filteredTasks.length !== 1 ? 's' : ''}`;
                searchResultsCount.classList.add('highlight');
            } else {
                searchResultsCount.textContent = '';
                searchResultsCount.classList.remove('highlight');
            }
        } else {
            searchResultsCount.textContent = '';
            searchResultsCount.classList.remove('highlight');
        }

        if (filteredTasks.length === 0) {
            if (tasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-smile-wink"></i>
                        <span>No tasks yet · add one above</span>
                    </div>
                `;
            } else if (searchQuery) {
                container.innerHTML = `
                    <div class="no-search-results">
                        <i class="fas fa-search"></i>
                        <span>No tasks found matching "<strong>${escapeHtml(searchQuery)}</strong>"</span>
                    </div>
                `;
            }
            saveTasks();
            return;
        }

        // SORT TASKS BY DATE (NEWEST FIRST)
        const sorted = sortTasksByDate(filteredTasks);

        let html = '';
        for (const task of sorted) {
            const isEditing = editingId === task.id;
            const dueDisplay = task.due ? new Date(task.due).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : null;

            const displayText = searchQuery ? highlightText(task.text, searchQuery) : escapeHtml(task.text);

            if (isEditing) {
                html += `
                    <div class="task-item" data-task-id="${task.id}">
                        <div class="edit-inline">
                            <input type="text" id="editText_${task.id}" value="${escapeHtml(task.text)}" placeholder="Task" />
                            <input type="datetime-local" id="editDue_${task.id}" value="${task.due || ''}" />
                            <button class="save-edit" data-id="${task.id}"><i class="fas fa-check"></i> save</button>
                            <button class="cancel-edit" data-id="${task.id}">cancel</button>
                        </div>
                        <div class="task-actions">
                            <button class="btn-delete" data-id="${task.id}"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="task-item" data-task-id="${task.id}">
                        <div class="task-info">
                            <span class="task-text ${task.completed ? 'completed' : ''}">${displayText}</span>
                            <div class="task-meta">
                                ${dueDisplay ? `<span class="task-due"><i class="far fa-calendar-alt"></i> ${dueDisplay}</span>` : ''}
                                ${task.completed ? '<span style="background:#d1fae5; padding:0.15rem 0.8rem; border-radius:30px; font-size:0.65rem; color:#059669; font-weight:600;"><i class="fas fa-check"></i> done</span>' : ''}
                            </div>
                        </div>
                        <div class="task-actions">
                            ${!task.completed ? `<button class="btn-complete" data-id="${task.id}"><i class="fas fa-check-circle"></i></button>` : ''}
                            <button class="btn-edit" data-id="${task.id}"><i class="fas fa-pen"></i></button>
                            <button class="btn-delete" data-id="${task.id}"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = html;
        attachTaskEvents();
        saveTasks();
    }

    // ----- EVENT DELEGATION -----
    function attachTaskEvents() {
        container.querySelectorAll('.task-item').forEach(item => {
            const id = item.dataset.taskId;
            if (!id) return;

            const completeBtn = item.querySelector('.btn-complete');
            if (completeBtn) {
                completeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const task = tasks.find(t => t.id === id);
                    if (task) {
                        task.completed = true;
                        editingId = null;
                        render();
                    }
                });
            }

            const deleteBtn = item.querySelector('.btn-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tasks = tasks.filter(t => t.id !== id);
                    if (editingId === id) editingId = null;
                    render();
                });
            }

            const editBtn = item.querySelector('.btn-edit');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editingId = id;
                    render();
                });
            }

            const saveBtn = item.querySelector('.save-edit');
            if (saveBtn) {
                saveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const textInput = document.getElementById(`editText_${id}`);
                    const dueInput = document.getElementById(`editDue_${id}`);
                    if (!textInput) return;
                    const newText = textInput.value.trim();
                    if (newText === '') { alert('Task cannot be empty'); return; }
                    const task = tasks.find(t => t.id === id);
                    if (task) {
                        task.text = newText;
                        task.due = dueInput ? dueInput.value || null : null;
                    }
                    editingId = null;
                    render();
                });
            }

            const cancelBtn = item.querySelector('.cancel-edit');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editingId = null;
                    render();
                });
            }
        });
    }

    // ----- ADD TASK -----
    function addTask() {
        const text = taskInput.value.trim();
        if (text === '') { 
            alert('Please write a task.'); 
            return; 
        }
        
        // If calendar picker was used and date is not confirmed, block adding
        if (isUsingCalendarPicker && !isDateConfirmed) {
            alert('⚠️ Please click "OK" to confirm your date selection before adding the task!');
            okDateBtn.style.boxShadow = '0 0 0 3px #ef4444';
            okDateBtn.style.transform = 'scale(1.05)';
            setTimeout(() => {
                okDateBtn.style.boxShadow = 'none';
                okDateBtn.style.transform = 'scale(1)';
            }, 2000);
            return;
        }
        
        const due = taskDateTime.value || null;
        
        tasks.push({
            id: generateId(),
            text: text,
            completed: false,
            due: due,
        });
        
        taskInput.value = '';
        taskDateTime.value = '';
        okDateBtn.style.display = 'none';
        okDateBtn.textContent = 'OK';
        okDateBtn.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
        isDateConfirmed = false;
        isUsingCalendarPicker = false;
        editingId = null;
        render();
    }

    // ----- EVENT LISTENERS -----
    addBtn.addEventListener('click', addTask);
    
    taskInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
    });

    taskDateTime.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (taskDateTime.value && isUsingCalendarPicker) {
                isDateConfirmed = true;
                isUsingCalendarPicker = false;
                okDateBtn.textContent = '✓ Confirmed';
                okDateBtn.style.background = 'linear-gradient(135deg, #34d399 0%, #059669 100%)';
                setTimeout(() => {
                    okDateBtn.style.display = 'none';
                    okDateBtn.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
                    okDateBtn.textContent = 'OK';
                    addTask();
                }, 500);
            } else {
                addTask();
            }
        }
    });

    // ----- INITIALIZE -----
    loadTasks();
    render();

    taskDateTime.value = '';
    okDateBtn.style.display = 'none';
    isDateConfirmed = false;
    isUsingCalendarPicker = false;
})();
