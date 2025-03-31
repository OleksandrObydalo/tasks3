import { config } from './config.js';
import { dayManager } from './day-manager.js';
import { userManager } from './user-manager.js';

// State management
const state = {
    currentDay: config.getCurrentDay(),
    currentUser: null,
    users: [],
    tasks: [],
    taskBeingEdited: null,
    taskToDelete: null
};

// DOM Elements
const elements = {
    daySelector: document.getElementById('day-selector'),
    currentUserElement: document.getElementById('current-user'),
    taskListElement: document.getElementById('task-list'),
    taskProgressBar: document.getElementById('task-progress-bar'),
    taskProgressText: document.getElementById('task-progress-text'),
    
    // Buttons
    addTaskBtn: document.getElementById('add-task-btn'),
    switchUserBtn: document.getElementById('switch-user-btn'),
    
    // Modals
    taskModal: document.getElementById('task-modal'),
    confirmModal: document.getElementById('confirm-modal'),
    userSelectModal: document.getElementById('user-select-modal'),
    addUserModal: document.getElementById('add-user-modal'),
    
    // Forms
    taskForm: document.getElementById('task-form'),
    addUserForm: document.getElementById('add-user-form'),
    
    // Form inputs
    taskTitleInput: document.getElementById('task-title'),
    taskDescriptionInput: document.getElementById('task-description'),
    taskDaySelect: document.getElementById('task-day'),
    taskIdInput: document.getElementById('task-id'),
    userNameInput: document.getElementById('user-name'),
    userColorInput: document.getElementById('user-color'),
    userRewardInput: document.getElementById('user-reward'),
    
    // Other elements
    userListElement: document.getElementById('user-list'),
    errorToast: document.getElementById('error-toast'),
    errorMessage: document.getElementById('error-message'),
    
    // Modal actions
    saveTaskBtn: document.getElementById('save-task-btn'),
    cancelTaskBtn: document.getElementById('cancel-task-btn'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    addUserBtn: document.getElementById('add-user-btn'),
    cancelAddUserBtn: document.getElementById('cancel-add-user-btn')
};

// Close modals when clicking on close buttons
document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        elements.taskModal.style.display = 'none';
        elements.userSelectModal.style.display = 'none';
        elements.addUserModal.style.display = 'none';
    });
});

// Initialize the application
function init() {
    loadUsersFromStorage();
    loadTasksFromStorage();
    updateDaySelector();
    renderTasks();
    updateProgress();
    attachEventListeners();
}

// Update the day selector
function updateDaySelector() {
    dayManager.renderDaySelector(state.currentDay, (selectedDay) => {
        state.currentDay = selectedDay;
        renderTasks();
        updateProgress();
    });
}

// Load users from local storage
function loadUsersFromStorage() {
    const storedUsers = localStorage.getItem(config.storageKeys.users);
    if (storedUsers) {
        state.users = JSON.parse(storedUsers);
    } else {
        // Set default users if none exist
        state.users = config.defaultUsers;
        saveUsersToStorage();
    }
    
    // Load current user
    const currentUserId = localStorage.getItem(config.storageKeys.currentUser);
    if (currentUserId) {
        state.currentUser = state.users.find(user => user.id === currentUserId) || state.users[0];
    } else {
        state.currentUser = state.users[0];
        localStorage.setItem(config.storageKeys.currentUser, state.currentUser.id);
    }
    
    updateCurrentUserDisplay();
}

// Save users to local storage
function saveUsersToStorage() {
    localStorage.setItem(config.storageKeys.users, JSON.stringify(state.users));
}

// Load tasks from local storage
function loadTasksFromStorage() {
    const storedTasks = localStorage.getItem(config.storageKeys.tasks);
    if (storedTasks) {
        state.tasks = JSON.parse(storedTasks);
    } else {
        state.tasks = [];
        saveTasksToStorage();
    }
}

// Save tasks to local storage
function saveTasksToStorage() {
    try {
        localStorage.setItem(config.storageKeys.tasks, JSON.stringify(state.tasks));
    } catch (error) {
        showError("Failed to save tasks. Local storage may be full.");
    }
}

// Update the current user display
function updateCurrentUserDisplay() {
    elements.currentUserElement.textContent = state.currentUser.name;
    const profileImage = document.querySelector('.profile-image');
    profileImage.style.backgroundColor = state.currentUser.color;
}

// Render tasks for the current day and user
function renderTasks() {
    elements.taskListElement.innerHTML = '';
    
    const currentUserTasks = state.tasks.filter(task => 
        task.userId === state.currentUser.id && 
        task.day === state.currentDay
    );
    
    if (currentUserTasks.length === 0) {
        elements.taskListElement.innerHTML = `
            <div class="empty-task-list">
                <p>No tasks for ${state.currentDay}. Click + to add a new task.</p>
            </div>
        `;
        return;
    }
    
    currentUserTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'task-completed' : ''}`;
        taskElement.dataset.id = task.id;
        
        taskElement.innerHTML = `
            <div class="task-content">
                <div class="task-header">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-title">${task.title}</span>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            </div>
            <div class="task-actions">
                <div class="kebab-menu">
                    <i class="fas fa-ellipsis-v kebab-menu-icon"></i>
                    <div class="kebab-dropdown">
                        <div class="kebab-item edit-task">
                            <i class="fas fa-edit"></i>
                            <span>Edit</span>
                        </div>
                        <div class="kebab-item delete-task">
                            <i class="fas fa-trash"></i>
                            <span>Delete</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        elements.taskListElement.appendChild(taskElement);
        
        // Add event listeners to the task element
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
        
        // Kebab menu functionality
        const kebabMenu = taskElement.querySelector('.kebab-menu');
        const kebabDropdown = taskElement.querySelector('.kebab-dropdown');
        
        kebabMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllKebabMenus();
            kebabDropdown.classList.toggle('show');
        });
        
        const editBtn = taskElement.querySelector('.edit-task');
        editBtn.addEventListener('click', () => {
            kebabDropdown.classList.remove('show');
            openEditTaskModal(task);
        });
        
        const deleteBtn = taskElement.querySelector('.delete-task');
        deleteBtn.addEventListener('click', () => {
            kebabDropdown.classList.remove('show');
            confirmDeleteTask(task.id);
        });
    });
    
    updateProgress();
}

// Close all open kebab menus
function closeAllKebabMenus() {
    document.querySelectorAll('.kebab-dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// Toggle task completion status
function toggleTaskCompletion(taskId) {
    const taskIndex = state.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        state.tasks[taskIndex].completed = !state.tasks[taskIndex].completed;
        saveTasksToStorage();
        
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        if (taskElement) {
            if (state.tasks[taskIndex].completed) {
                taskElement.classList.add('task-completed');
            } else {
                taskElement.classList.remove('task-completed');
            }
        }
        
        updateProgress();
    }
}

// Delete a task
function deleteTask() {
    if (state.taskToDelete) {
        const taskElement = document.querySelector(`.task-item[data-id="${state.taskToDelete}"]`);
        if (taskElement) {
            taskElement.classList.add('deleting');
            
            // Wait for animation to complete before removing from DOM
            setTimeout(() => {
                state.tasks = state.tasks.filter(task => task.id !== state.taskToDelete);
                saveTasksToStorage();
                elements.confirmModal.style.display = 'none';
                renderTasks();
                state.taskToDelete = null;
            }, 300);
        } else {
            state.tasks = state.tasks.filter(task => task.id !== state.taskToDelete);
            saveTasksToStorage();
            elements.confirmModal.style.display = 'none';
            renderTasks();
            state.taskToDelete = null;
        }
    }
}

// Open the add task modal
function openAddTaskModal() {
    elements.taskTitleInput.value = '';
    elements.taskDescriptionInput.value = '';
    elements.taskDaySelect.value = state.currentDay;
    elements.taskIdInput.value = '';
    
    document.getElementById('modal-title').textContent = 'Add New Task';
    elements.taskModal.style.display = 'flex';
    elements.taskTitleInput.focus();
}

// Open the edit task modal
function openEditTaskModal(task) {
    elements.taskTitleInput.value = task.title;
    elements.taskDescriptionInput.value = task.description || '';
    elements.taskDaySelect.value = task.day;
    elements.taskIdInput.value = task.id;
    
    document.getElementById('modal-title').textContent = 'Edit Task';
    elements.taskModal.style.display = 'flex';
    elements.taskTitleInput.focus();
}

// Save a task (add new or update existing)
function saveTask(event) {
    event.preventDefault();
    
    const taskId = elements.taskIdInput.value;
    const title = elements.taskTitleInput.value.trim();
    const description = elements.taskDescriptionInput.value.trim();
    const day = elements.taskDaySelect.value;
    
    if (!title) {
        showError('Task title cannot be empty');
        return;
    }
    
    if (taskId) {
        // Update existing task
        const taskIndex = state.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            state.tasks[taskIndex].title = title;
            state.tasks[taskIndex].description = description;
            state.tasks[taskIndex].day = day;
        }
    } else {
        // Add new task
        const newTask = {
            id: generateId(),
            userId: state.currentUser.id,
            title,
            description,
            day,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        state.tasks.push(newTask);
    }
    
    saveTasksToStorage();
    elements.taskModal.style.display = 'none';
    
    // Update the view if the task's day is the current displayed day
    if (day === state.currentDay) {
        renderTasks();
        
        // Add animation class to new task
        if (!taskId) {
            setTimeout(() => {
                const newTaskElement = document.querySelector(`.task-item[data-id="${state.tasks[state.tasks.length-1].id}"]`);
                if (newTaskElement) {
                    newTaskElement.classList.add('new-task');
                    // Remove the class after animation completes
                    setTimeout(() => {
                        newTaskElement.classList.remove('new-task');
                    }, 500);
                }
            }, 10);
        }
    }
}

// Confirm task deletion
function confirmDeleteTask(taskId) {
    state.taskToDelete = taskId;
    elements.confirmModal.style.display = 'flex';
}

// Open user selection modal
function openUserSelectModal() {
    renderUserList();
    elements.userSelectModal.style.display = 'flex';
}

// Render the user list
function renderUserList() {
    elements.userListElement.innerHTML = '';
    
    state.users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.dataset.id = user.id;
        
        userElement.innerHTML = `
            <div style="background-color: ${user.color}; width: 40px; height: 40px; border-radius: 50%; margin-right: 15px;"></div>
            <div class="user-info">
                <span class="user-name">${user.name}</span>
                ${user.reward ? `<span class="user-reward">Reward: ${user.reward}</span>` : ''}
            </div>
            ${state.users.length > 1 ? `
                <div class="user-delete" title="Delete User">
                    <i class="fas fa-trash-alt"></i>
                </div>
            ` : ''}
        `;
        
        userElement.addEventListener('click', (e) => {
            // Prevent user selection if delete icon is clicked
            if (e.target.closest('.user-delete')) return;
            selectUser(user.id);
        });

        // Add delete functionality
        const deleteIcon = userElement.querySelector('.user-delete');
        if (deleteIcon) {
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                confirmDeleteUser(user.id);
            });
        }
        
        elements.userListElement.appendChild(userElement);
    });
}

// Confirm user deletion
function confirmDeleteUser(userId) {
    const user = state.users.find(u => u.id === userId);
    
    // Create a custom confirm modal for user deletion
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal';
    confirmModal.innerHTML = `
        <div class="modal-content">
            <h2>Delete User</h2>
            <p>Are you sure you want to delete the user "${user.name}"? 
               All associated tasks will also be removed.</p>
            <div class="form-actions">
                <button id="confirm-user-delete-btn" class="btn primary-btn">Delete</button>
                <button id="cancel-user-delete-btn" class="btn">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
    confirmModal.style.display = 'flex';
    
    const confirmDeleteBtn = confirmModal.querySelector('#confirm-user-delete-btn');
    const cancelDeleteBtn = confirmModal.querySelector('#cancel-user-delete-btn');
    
    confirmDeleteBtn.addEventListener('click', () => {
        const result = userManager.deleteUser(state, userId);
        
        if (result.success) {
            confirmModal.remove();
            elements.userSelectModal.style.display = 'none';
            
            // Update UI
            updateCurrentUserDisplay();
            renderUserList();
            renderTasks();
            updateProgress();
        } else {
            showError(result.message);
        }
    });
    
    cancelDeleteBtn.addEventListener('click', () => {
        confirmModal.remove();
    });
}

// Select a user
function selectUser(userId) {
    const selectedUser = state.users.find(user => user.id === userId);
    if (selectedUser) {
        state.currentUser = selectedUser;
        localStorage.setItem(config.storageKeys.currentUser, userId);
        updateCurrentUserDisplay();
        elements.userSelectModal.style.display = 'none';
        renderTasks();
    }
}

// Open add user modal
function openAddUserModal() {
    elements.userNameInput.value = '';
    elements.userColorInput.value = config.colors.secondary;
    document.getElementById('user-reward').value = '';
    
    // Apply the enhanced modal class
    elements.addUserModal.classList.add('add-user-modal');
    elements.addUserForm.classList.add('add-user-form');
    
    elements.addUserModal.style.display = 'flex';
    elements.userSelectModal.style.display = 'none';
    
    // Update color preview
    updateColorPreview();
    
    elements.userNameInput.focus();
}

// Add a new user
function addUser(event) {
    event.preventDefault();
    
    const name = elements.userNameInput.value.trim();
    const color = elements.userColorInput.value;
    const reward = document.getElementById('user-reward').value.trim();
    
    if (!name) {
        showError('User name cannot be empty');
        return;
    }
    
    const newUser = {
        id: generateId(),
        name,
        color,
        reward: reward || 'No reward specified'
    };
    
    state.users.push(newUser);
    saveUsersToStorage();
    elements.addUserModal.style.display = 'none';
    openUserSelectModal();
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Show error toast
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorToast.style.display = 'flex';
    
    setTimeout(() => {
        elements.errorToast.style.display = 'none';
    }, config.toastDuration);
}

// Update progress bar and text
function updateProgress() {
    const currentUserTasks = state.tasks.filter(task => 
        task.userId === state.currentUser.id && 
        task.day === state.currentDay
    );
    
    const totalTasks = currentUserTasks.length;
    const completedTasks = currentUserTasks.filter(task => task.completed).length;
    
    let progressPercentage = 0;
    if (totalTasks > 0) {
        progressPercentage = (completedTasks / totalTasks) * 100;
    }
    
    elements.taskProgressBar.style.width = `${progressPercentage}%`;
    elements.taskProgressText.textContent = `${completedTasks}/${totalTasks} Tasks Completed`;
}

// Attach event listeners
function attachEventListeners() {
    // Task actions
    elements.addTaskBtn.addEventListener('click', openAddTaskModal);
    elements.taskForm.addEventListener('submit', saveTask);
    elements.cancelTaskBtn.addEventListener('click', () => elements.taskModal.style.display = 'none');
    
    // Delete confirmation
    elements.confirmDeleteBtn.addEventListener('click', deleteTask);
    elements.cancelDeleteBtn.addEventListener('click', () => elements.confirmModal.style.display = 'none');
    
    // User management
    elements.switchUserBtn.addEventListener('click', openUserSelectModal);
    elements.addUserBtn.addEventListener('click', openAddUserModal);
    elements.addUserForm.addEventListener('submit', addUser);
    elements.cancelAddUserBtn.addEventListener('click', () => {
        elements.addUserModal.style.display = 'none';
        openUserSelectModal();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === elements.taskModal) {
            elements.taskModal.style.display = 'none';
        } else if (event.target === elements.confirmModal) {
            elements.confirmModal.style.display = 'none';
        } else if (event.target === elements.userSelectModal) {
            elements.userSelectModal.style.display = 'none';
        } else if (event.target === elements.addUserModal) {
            elements.addUserModal.style.display = 'none';
        }
    });
    
    // Close kebab menus when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.kebab-menu')) {
            closeAllKebabMenus();
        }
    });
    
    // Add color preview functionality
    if (elements.userColorInput) {
        elements.userColorInput.addEventListener('input', updateColorPreview);
    }
    
    // Close user delete modal when clicking outside
    window.addEventListener('click', (event) => {
        const userDeleteModal = document.querySelector('.modal:not(#user-select-modal):not(#add-user-modal)');
        if (userDeleteModal && event.target === userDeleteModal) {
            userDeleteModal.remove();
        }
    });
}

// Update color preview
function updateColorPreview() {
    const colorPreview = document.getElementById('color-preview');
    if (colorPreview) {
        colorPreview.style.backgroundColor = elements.userColorInput.value;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
