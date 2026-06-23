// script.js - full to-do logic with search functionality

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
        completed
