import { config } from './config.js';

export const userManager = {
    // Delete a user by their ID
    deleteUser(state, userId) {
        // Prevent deleting the last user
        if (state.users.length <= 1) {
            return {
                success: false,
                message: "Cannot delete the last user. At least one user must remain."
            };
        }

        // Find the user to delete
        const userToDelete = state.users.find(user => user.id === userId);
        if (!userToDelete) {
            return {
                success: false,
                message: "User not found."
            };
        }

        // Filter out the user
        state.users = state.users.filter(user => user.id !== userId);

        // Remove tasks associated with the deleted user
        state.tasks = state.tasks.filter(task => task.userId !== userId);

        // If the current user was deleted, switch to the first available user
        if (state.currentUser.id === userId) {
            state.currentUser = state.users[0];
        }

        // Update local storage
        localStorage.setItem(config.storageKeys.users, JSON.stringify(state.users));
        localStorage.setItem(config.storageKeys.tasks, JSON.stringify(state.tasks));
        localStorage.setItem(config.storageKeys.currentUser, state.currentUser.id);

        return {
            success: true,
            message: `User ${userToDelete.name} has been deleted.`
        };
    }
};