<!DOCTYPE html>
<html lang="ru" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script>window.APP_URL = "{{ url('/') }}"; window.LOGIN_URL = "{{ url('/login') }}";</script>
    <script>
        (function() {
            var theme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', theme);
        })();
    </script>
    <title>СЭД-СТАВ | @yield('title', 'Главная')</title>
    <link rel="stylesheet" href="{{ asset('style/normalize.css') }}">
    <link rel="stylesheet" href="{{ asset('style/styles.css') }}">
</head>
<body>
    <header>
        <div class="container">
            <div class="header-top">
                <div class="logo">
                    <a href="{{ route('home') }}"><img src="{{ asset('img/logo.svg') }}" alt="Логотип СЭД-СТАВ" class="logo-icon"></a>
                </div>
                <div class="user-info">
                    <div class="user-avatar" id="headerUserAvatar">--</div>
                    <div>
                        <div class="user-name" id="headerUserName">Загрузка...</div>
                        <div class="user-role" id="headerUserRole">—</div>
                    </div>
                    <form action="{{ route('logout') }}" method="POST" style="display:inline;">
                        @csrf
                        <button type="submit" class="logout-btn">Выйти</button>
                    </form>
                </div>
                <button class="mobile-menu-toggle">☰</button>
            </div>
        </div>
        <nav id="main-nav">
            <div class="nav-container">
                <ul class="nav-menu">
                    <li><a href="{{ route('home') }}" class="{{ request()->routeIs('home') ? 'active' : '' }}">Главная</a></li>
                    <li><a href="{{ url('/documents') }}" class="{{ request()->is('documents') ? 'active' : '' }}">Документы</a></li>
                    <li><a href="{{ url('/approvals') }}" class="{{ request()->is('approvals') ? 'active' : '' }}">Согласования</a></li>
                    <li><a href="{{ url('/reports') }}" class="{{ request()->is('reports') ? 'active' : '' }}">Отчеты</a></li>
                    <li><a href="{{ url('/settings') }}" class="{{ request()->is('settings') ? 'active' : '' }}">Настройки</a></li>
                    <li><a href="{{ url('/profile') }}" class="{{ request()->is('profile') ? 'active' : '' }}">Профиль</a></li>
                </ul>
            </div>
        </nav>
    </header>

    @hasSection('search')
    <div class="search-container">
        <div class="container">
            @yield('search', '<div class="search-box"><input type="text" class="search-input" placeholder="Поиск по документам..."><button type="button" class="search-button">Найти</button></div>')
        </div>
    </div>
    @endif

    <div class="container">
        @yield('content')
    </div>

    <footer>
        <div class="container">
            <div class="footer-inner">
                <div class="footer-text">
                    <p>Система электронного документооборота "СЭД-СТАВ" © 2026</p>
                    <p>Компания "СТАВ ЛТД"</p>
                </div>
                <button type="button" class="theme-toggle" id="themeToggle" title="Переключить тему" aria-label="Переключить тему">
                    <span class="theme-toggle-icon theme-icon-light" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    </span>
                    <span class="theme-toggle-icon theme-icon-dark" aria-hidden="true" style="display: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    </span>
                    <span class="theme-toggle-label">Тёмная тема</span>
                </button>
            </div>
        </div>
    </footer>

    <script src="{{ asset('script/theme-toggle.js') }}"></script>
    @stack('scripts')
</body>
</html>
