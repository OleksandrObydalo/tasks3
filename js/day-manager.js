import { config } from './config.js';

// Day management functionality
export const dayManager = {
    renderDaySelector(currentDay, onDaySelected) {
        const daySelector = document.getElementById('day-selector');
        if (!daySelector) return;
        
        daySelector.innerHTML = '';
        
        config.days.forEach(day => {
            const dayLetter = day.charAt(0).toUpperCase();
            const capsule = document.createElement('div');
            capsule.className = `day-capsule ${day === currentDay ? 'selected' : ''}`;
            capsule.textContent = dayLetter;
            capsule.dataset.day = day;
            capsule.setAttribute('title', config.formatDay(day));
            
            capsule.addEventListener('click', () => {
                document.querySelectorAll('.day-capsule').forEach(cap => cap.classList.remove('selected'));
                capsule.classList.add('selected');
                onDaySelected(day);
            });
            
            daySelector.appendChild(capsule);
        });
    }
};

