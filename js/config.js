// Configuration settings for the family task manager app
export const config = {
    // Days of the week
    days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ],
    
    // Format days for display
    formatDay: (day) => {
        return day.charAt(0).toUpperCase() + day.slice(1);
    },
    
    // Get current day of the week
    getCurrentDay: () => {
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const today = new Date().getDay();
        return days[today];
    },
    
    // Local storage keys
    storageKeys: {
        users: 'family_task_manager_users',
        currentUser: 'family_task_manager_current_user',
        tasks: 'family_task_manager_tasks'
    },
    
    // Default users for first-time app usage
    defaultUsers: [
        {
            id: '1',
            name: 'Parent',
            color: '#03A9F4',
            reward: 'Cup of coffee'
        },
        {
            id: '2',
            name: 'Child',
            color: '#FF4081',
            reward: '30 minutes of video games'
        }
    ],
    
    // Toast notification duration in milliseconds
    toastDuration: 3000,
    
    // Color palette
    colors: {
        primary: '#03A9F4',
        secondary: '#4CAF50',
        accent: '#FF4081',
        gold: '#FFD700'
    }
};