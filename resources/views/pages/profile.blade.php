@extends('layouts.app')

@section('title', 'Профиль пользователя')

@section('content')
<div class="main-content">
    <div class="content">
        <div class="section-header">
            <h2 class="section-title">Профиль пользователя</h2>
        </div>
        <div class="profile-container">
            <div class="profile-header">
                <div class="profile-avatar-large" id="profileAvatar"></div>
                <div class="profile-info">
                    <h3 id="profileName"></h3>
                    <p id="profileEmail"></p>
                    <p id="profileRole"></p>
                </div>
            </div>
            <div class="profile-tabs">
                <div class="tab active" data-tab="activity">Активность</div>
                <div class="tab" data-tab="personal">Личные данные</div>
                <div class="tab" data-tab="security">Безопасность</div>
            </div>
            <div class="tab-content active" id="activity">
                <div class="settings-card">
                    <div class="settings-card-header"><h3 class="settings-card-title">История активности</h3></div>
                    <div class="activity-list" id="activityList"></div>
                </div>
            </div>
            <div class="tab-content" id="personal">
                <div class="settings-card">
                    <div class="settings-card-header"><h3 class="settings-card-title">Личная информация</h3></div>
                    <form class="settings-form" id="personalForm">
                        <div class="form-group">
                            <label class="form-label" for="fullName">ФИО</label>
                            <input type="text" class="form-control" id="fullName" name="fullName" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="email">Email</label>
                            <input type="email" class="form-control" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="phone">Телефон</label>
                            <input type="tel" class="form-control" id="phone" name="phone" placeholder="+7 (___) ___-__-__" data-phone-mask="true">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="department">Отдел</label>
                            <input type="text" class="form-control" id="department" name="department" readonly disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="position">Должность</label>
                            <input type="text" class="form-control" id="position" name="position" readonly disabled>
                        </div>
                        <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                    </form>
                </div>
            </div>
            <div class="tab-content" id="security">
                <div class="settings-card">
                    <div class="settings-card-header"><h3 class="settings-card-title">Смена пароля</h3></div>
                    <form class="settings-form" id="passwordForm">
                        <div class="form-group">
                            <label class="form-label" for="currentPassword">Текущий пароль</label>
                            <input type="password" class="form-control" id="currentPassword" name="currentPassword" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="newPassword">Новый пароль</label>
                            <input type="password" class="form-control" id="newPassword" name="newPassword" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="confirmNewPassword">Подтверждение нового пароля</label>
                            <input type="password" class="form-control" id="confirmNewPassword" name="confirmNewPassword" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Изменить пароль</button>
                    </form>
                </div>
            </div>
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
<script src="{{ asset('script/profile.js') }}"></script>
@endpush
@endsection
