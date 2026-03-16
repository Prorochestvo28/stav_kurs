<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>СЭД-СТАВ | Вход в систему</title>
    <link rel="stylesheet" href="{{ asset('style/normalize.css') }}">
    <link rel="stylesheet" href="{{ asset('style/styles.css') }}">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <img src="{{ asset('img/logo.svg') }}" alt="Логотип СЭД-СТАВ" class="auth-logo">
                <p>Система электронного документооборота</p>
            </div>

            @if($errors->any())
            <div class="alert alert-danger">
                {{ $errors->first() }}
            </div>
            @endif

            <form class="auth-form" id="loginForm" action="{{ route('login') }}" method="POST">
                @csrf
                <div class="form-group">
                    <label class="form-label" for="email">Email</label>
                    <input type="email" class="form-control" id="email" name="email" value="{{ old('email') }}" placeholder="Введите ваш email" required>
                </div>
                <div class="form-group password-group">
                    <label class="form-label" for="password">Пароль</label>
                    <div class="password-field">
                        <input type="password" class="form-control" id="password" name="password" placeholder="Введите пароль" required>
                        <button type="button" class="password-toggle" aria-label="Показать пароль">
                            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path d="M12 5C6.5 5 2 9.5 2 12s4.5 7 10 7 10-4.5 10-7-4.5-7-10-7zm0 12c-3.6 0-6.5-3.2-7.4-5 .9-1.8 3.8-5 7.4-5 3.6 0 6.5 3.2 7.4 5-.9 1.8-3.8 5-7.4 5zm0-8a3 3 0 100 6 3 3 0 000-6z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="form-group form-remember">
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="remember" name="remember">
                        <label class="form-check-label" for="remember">Запомнить меня</label>
                    </div>
                    <a href="#" class="forgot-password">Забыли пароль?</a>
                </div>
                <button type="submit" class="btn btn-primary btn-auth">Войти</button>
            </form>

            <p class="auth-demo-hint">
                Тестовый администратор:<br>
                <span>admin@stav.ltd / admin123</span>
            </p>
        </div>
    </div>

    <div class="modal" id="forgotPasswordModal" aria-hidden="true">
        <div class="modal-overlay" data-close-forgot></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Восстановление пароля</h3>
                <button type="button" class="modal-close" id="closeForgotPasswordModal" aria-label="Закрыть">&times;</button>
            </div>
            <div class="modal-body">
                <p>Для выдачи нового пароля обратитесь к администратору системы.</p>
            </div>
        </div>
    </div>

    <script src="{{ asset('script/script.js') }}"></script>
    <script>
        document.querySelector('.password-toggle')?.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const isVisible = passwordInput.type === 'text';
            passwordInput.type = isVisible ? 'password' : 'text';
        });
        document.querySelector('.forgot-password')?.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('forgotPasswordModal').classList.add('active');
        });
        document.querySelector('[data-close-forgot]')?.addEventListener('click', function() {
            document.getElementById('forgotPasswordModal').classList.remove('active');
        });
    </script>
</body>
</html>
