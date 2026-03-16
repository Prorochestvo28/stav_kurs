(function () {
    var THEME_KEY = 'theme';
    var root = document.documentElement;

    function getTheme() {
        return root.getAttribute('data-theme') || 'light';
    }

    function setTheme(theme) {
        theme = theme === 'dark' ? 'dark' : 'light';
        root.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        updateButton(theme);
    }

    function updateButton(theme) {
        var btn = document.getElementById('themeToggle');
        if (!btn) return;
        var label = btn.querySelector('.theme-toggle-label');
        var iconLight = btn.querySelector('.theme-icon-light');
        var iconDark = btn.querySelector('.theme-icon-dark');
        if (theme === 'dark') {
            if (label) label.textContent = 'Светлая тема';
            if (iconLight) iconLight.style.display = 'none';
            if (iconDark) iconDark.style.display = '';
        } else {
            if (label) label.textContent = 'Тёмная тема';
            if (iconLight) iconLight.style.display = '';
            if (iconDark) iconDark.style.display = 'none';
        }
    }

    function init() {
        var theme = localStorage.getItem(THEME_KEY) || 'light';
        setTheme(theme);

        var btn = document.getElementById('themeToggle');
        if (btn) {
            btn.addEventListener('click', function () {
                setTheme(getTheme() === 'dark' ? 'light' : 'dark');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
