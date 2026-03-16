@extends('layouts.app')

@section('title', 'Настройки')

@section('content')
<div class="main-content">
    <div class="content">
        <div class="section-header">
            <h2 class="section-title">Настройки системы</h2>
        </div>
        <div class="settings-container">
            <aside class="settings-sidebar">
                <ul class="settings-nav">
                    <li><a href="#general" class="active">Общие настройки</a></li>
                    <li><a href="#users">Пользователи</a></li>
                    <li><a href="#reference">Отделы и категории</a></li>
                    <li><a href="#workflow">Процессы</a></li>
                    <li><a href="#notifications">Уведомления</a></li>
                    <li><a href="#security">Безопасность</a></li>
                    <li><a href="#backup">Резервное копирование</a></li>
                    <li><a href="#system">Системные настройки</a></li>
                </ul>
            </aside>
            <main class="settings-content">
                <div id="general" class="settings-section">
                    <div class="settings-card">
                        <div class="settings-card-header"><h3 class="settings-card-title">Основные настройки системы</h3></div>
                        <form class="settings-form">
                            <div class="form-group">
                                <label class="form-label" for="timezone">Часовой пояс</label>
                                <select class="form-control" id="timezone">
                                    <option value="+3">Москва (UTC+3)</option>
                                    <option value="+4">Самара (UTC+4)</option>
                                    <option value="+5">Екатеринбург (UTC+5)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="date-format">Формат даты</label>
                                <select class="form-control" id="date-format">
                                    <option value="dd.mm.yyyy">ДД.ММ.ГГГГ</option>
                                    <option value="yyyy-mm-dd">ГГГГ-ММ-ДД</option>
                                </select>
                            </div>
                            <button type="button" class="btn btn-primary">Сохранить настройки</button>
                        </form>
                    </div>
                </div>
                <div id="users" class="settings-section" style="display: none;">
                    <div class="settings-card">
                        <div class="settings-card-header"><h3 class="settings-card-title">Управление пользователями</h3><button class="btn btn-success">Добавить пользователя</button></div>
                        <div class="users-toolbar">
                            <input type="text" id="usersSearch" class="form-control users-search" placeholder="Поиск по имени, email, должности, отделу..." autocomplete="off">
                            <select id="usersRoleFilter" class="form-control users-filter">
                                <option value="">Все роли</option>
                                <option value="admin">Администратор</option>
                                <option value="editor">Редактор</option>
                                <option value="user">Пользователь</option>
                            </select>
                            <select id="usersDepartmentFilter" class="form-control users-filter">
                                <option value="">Все отделы</option>
                            </select>
                            <button type="button" class="btn btn-secondary" id="usersSearchBtn">Найти</button>
                            <button type="button" class="btn btn-secondary" id="usersResetBtn">Сбросить</button>
                        </div>
                        <div id="usersCount" class="users-count"></div>
                        <ul class="user-list"></ul>
                        <div id="usersPagination" class="users-pagination"></div>
                    </div>
                </div>
                <div id="reference" class="settings-section" style="display: none;">
                    <div class="settings-card">
                        <div class="settings-card-header"><h3 class="settings-card-title">Отделы</h3><button type="button" class="btn btn-success" id="addDepartmentBtn">Добавить отдел</button></div>
                        <p class="settings-description">Добавление, редактирование и удаление отделов. Изменения отобразятся в карточках пользователей.</p>
                        <ul class="reference-list" id="departmentsList"></ul>
                    </div>
                    <div class="settings-card" style="margin-top: 24px;">
                        <div class="settings-card-header"><h3 class="settings-card-title">Категории документов</h3><button type="button" class="btn btn-success" id="addCategoryBtn">Добавить категорию</button></div>
                        <p class="settings-description">Добавление, редактирование и удаление категорий. Используются при создании и фильтрации документов.</p>
                        <ul class="reference-list" id="categoriesList"></ul>
                    </div>
                </div>
                <div id="workflow" class="settings-section" style="display: none;"><div class="settings-card"><div class="settings-card-header"><h3 class="settings-card-title">Настройки процессов согласования</h3></div><div class="settings-placeholder">В разработке</div></div></div>
                <div id="notifications" class="settings-section" style="display: none;"><div class="settings-card"><div class="settings-card-header"><h3 class="settings-card-title">Настройки уведомлений</h3></div><div class="settings-placeholder">В разработке</div></div></div>
                <div id="security" class="settings-section" style="display: none;"><div class="settings-card"><div class="settings-card-header"><h3 class="settings-card-title">Настройки безопасности</h3></div><div class="settings-placeholder">В разработке</div></div></div>
                <div id="backup" class="settings-section" style="display: none;"><div class="settings-card"><div class="settings-card-header"><h3 class="settings-card-title">Резервное копирование</h3></div><div class="settings-placeholder">В разработке</div></div></div>
                <div id="system" class="settings-section" style="display: none;"><div class="settings-card"><div class="settings-card-header"><h3 class="settings-card-title">Системные настройки</h3></div><div class="settings-placeholder">В разработке</div></div></div>
            </main>
        </div>
    </div>
</div>
@push('scripts')
<script>window.APP_URL = '{{ url("/") }}'; window.LOGIN_URL = '{{ url("/login") }}';</script>
<script src="{{ asset('script/script.js') }}"></script>
<script src="{{ asset('script/api.js') }}"></script>
<script src="{{ asset('script/auth.js') }}"></script>
<script src="{{ asset('script/user-info.js') }}"></script>
<script src="{{ asset('script/access-control.js') }}"></script>
<script src="{{ asset('script/documents.js') }}"></script>
<script src="{{ asset('script/modals.js') }}"></script>
<script src="{{ asset('script/settings-page.js') }}"></script>
@endpush
@endsection
