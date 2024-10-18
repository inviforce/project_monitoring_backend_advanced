document.addEventListener('DOMContentLoaded', (event) => {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Check if user has a preferred theme stored
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        body.classList.add(currentTheme);
        updateToggleButton(currentTheme === 'dark-theme');
    }

    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light-theme');
            updateToggleButton(false);
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark-theme');
            updateToggleButton(true);
        }
    });

    function updateToggleButton(isDarkTheme) {
        const sunIcon = themeToggle.querySelector('.fa-sun');
        const moonIcon = themeToggle.querySelector('.fa-moon');

        if (isDarkTheme) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }
});