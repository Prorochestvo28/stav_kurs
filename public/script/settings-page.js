// Скрипт для страницы настроек

document.addEventListener('DOMContentLoaded', async function () {
    if (typeof auth === 'undefined') {
        window.location.href = (typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : '/login');
        return;
    }
    var isAuth = await auth.isAuthenticated();
    if (!isAuth) {
        window.location.href = (typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : '/login');
        return;
    }

    const currentUser = await auth.getCurrentUser();

    // Ждем загрузки модулей
    function waitForModules() {
        return new Promise((resolve) => {
            const checkModules = setInterval(() => {
                if (typeof database !== 'undefined' &&
                    typeof auth !== 'undefined' &&
                    typeof modals !== 'undefined') {
                    clearInterval(checkModules);
                    resolve();
                }
            }, 100);
            setTimeout(() => {
                clearInterval(checkModules);
                console.warn('Timeout waiting for modules on settings page');
                resolve();
            }, 5000);
        });
    }

    waitForModules().then(() => {
        initSettingsPage();
    });

    async function initSettingsPage() {
        console.log('Инициализация страницы настроек...');
        await database.init();
        setupTabs();
        setupAccessControl();
        await renderUsers();
        setupUsersFilters();
        if (currentUser && currentUser.role === 'Администратор') {
            await renderDepartments();
            await renderCategories();
        }
        setupEventHandlers();
        console.log('Страница настроек инициализирована.');
    }

    function setupAccessControl() {
        const isAdmin = currentUser && currentUser.role === 'Администратор';
        const isRegularUser = currentUser && currentUser.role === 'Пользователь';

        // Скрываем пункт меню "Пользователи" для не-администраторов
        const usersNavItem = document.querySelector('.settings-nav a[href="#users"]');
        if (usersNavItem) {
            const navItem = usersNavItem.parentElement;
            if (!isAdmin) {
                navItem.style.display = 'none';
            } else {
                navItem.style.display = '';
            }
        }

        // Скрываем секцию пользователей для не-администраторов
        const usersSection = document.getElementById('users');
        if (usersSection && !isAdmin) {
            usersSection.style.display = 'none';
        }

        // Пункт "Отделы и типы документов" только для администратора
        const referenceNavItem = document.querySelector('.settings-nav a[href="#reference"]');
        if (referenceNavItem) {
            const navItem = referenceNavItem.parentElement;
            if (!isAdmin) {
                navItem.style.display = 'none';
            } else {
                navItem.style.display = '';
            }
        }
        const referenceSection = document.getElementById('reference');
        if (referenceSection && !isAdmin) {
            referenceSection.style.display = 'none';
        }

        // Скрываем пункт меню "Процессы" для обычных пользователей
        if (isRegularUser) {
            const workflowNavItem = document.querySelector('.settings-nav a[href="#workflow"]');
            if (workflowNavItem) {
                workflowNavItem.parentElement.style.display = 'none';
            }

            // Скрываем секцию процессов для обычных пользователей
            const workflowSection = document.getElementById('workflow');
            if (workflowSection) {
                workflowSection.style.display = 'none';
            }
        }
    }

    function setupTabs() {
        const navLinks = document.querySelectorAll('.settings-nav a');
        const sections = document.querySelectorAll('.settings-section');

        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);

                // Убираем активный класс у всех ссылок
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Скрываем все секции
                sections.forEach(s => s.style.display = 'none');

                // Показываем выбранную секцию
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            });
        });
    }

    let usersPage = 1;
    const usersPerPage = 10;

    async function fetchUsersList(params) {
        const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : (window.location && window.location.origin ? window.location.origin : '')).replace(/\/$/, '');
        const qs = new URLSearchParams(params).toString();
        const res = await api.get(baseUrl + '/api/users' + (qs ? '?' + qs : ''));
        if (!res.ok) return { data: [], total: 0, current_page: 1, last_page: 1 };
        const json = await res.json();
        if (Array.isArray(json)) {
            return { data: json, total: json.length, current_page: 1, last_page: 1 };
        }
        return {
            data: json.data || [],
            total: json.total || 0,
            current_page: json.current_page || 1,
            last_page: json.last_page || 1,
        };
    }

    async function renderUsers() {
        const userListContainer = document.querySelector('#users .user-list');
        const countEl = document.getElementById('usersCount');
        const paginationEl = document.getElementById('usersPagination');
        const searchInput = document.getElementById('usersSearch');
        const roleFilter = document.getElementById('usersRoleFilter');
        const deptFilter = document.getElementById('usersDepartmentFilter');

        if (!userListContainer) return;

        const search = (searchInput && searchInput.value.trim()) || '';
        const role = (roleFilter && roleFilter.value) || '';
        const departmentId = (deptFilter && deptFilter.value) || '';

        const params = { page: usersPage, per_page: usersPerPage };
        if (search) params.search = search;
        if (role) params.role = role;
        if (departmentId) params.department_id = departmentId;

        const result = await fetchUsersList(params);
        const users = result.data;
        const total = result.total;
        const currentPage = result.current_page;
        const lastPage = result.last_page;

        const departments = await database.getTable('departments');
        if (deptFilter && departments && deptFilter.options.length <= 1) {
            deptFilter.innerHTML = '<option value="">Все отделы</option>' + (departments.map(d => {
                const id = d.department_id ?? d.id;
                return '<option value="' + id + '">' + escapeHtml(d.name || '') + '</option>';
            }).join(''));
        }

        if (countEl) {
            countEl.textContent = total === 0 ? 'Ничего не найдено' : 'Найдено: ' + total;
        }

        if (!users || users.length === 0) {
            userListContainer.innerHTML = '<p class="settings-placeholder">Пользователи не найдены</p>';
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        userListContainer.innerHTML = users.map(user => {
            const department = departments && (departments.find(d => (d.department_id || d.id) === (user.department_id || user.department_id)));
            const fullName = user.fullName || user.name || user.full_name || 'Без имени';
            const initials = auth.getInitials(fullName);
            const roleText = user.role || 'Пользователь';
            const isCurrentUser = currentUser && (currentUser.user_id === user.user_id || currentUser.id === user.user_id);
            const phone = user.phone || '';
            const deptName = user.department || (department && department.name) || '';

            return '<li class="user-item">' +
                '<div class="user-avatar-sm">' + initials + '</div>' +
                '<div class="user-details">' +
                '<div class="user-name">' + escapeHtml(fullName) + '</div>' +
                '<div class="user-email">' + escapeHtml(user.email || 'Нет email') + '</div>' +
                '<div class="user-role">' + escapeHtml(roleText) + (deptName ? ' | ' + escapeHtml(deptName) : '') + (user.position ? ' | ' + escapeHtml(user.position) : '') + (phone ? ' | ' + escapeHtml(phone) : '') + '</div>' +
                '</div>' +
                '<div class="user-actions">' +
                '<button class="btn btn-secondary btn-edit-user" data-user-id="' + (user.user_id || user.id) + '">Редактировать</button>' +
                (isCurrentUser ? '' : '<button class="btn btn-danger btn-delete-user" data-user-id="' + (user.user_id || user.id) + '">Удалить</button>') +
                '</div></li>';
        }).join('');

        if (paginationEl) {
            if (lastPage <= 1) {
                paginationEl.innerHTML = '';
            } else {
                let html = '';
                if (currentPage > 1) html += '<button type="button" class="btn btn-secondary btn-sm users-page-btn" data-page="' + (currentPage - 1) + '">← Назад</button>';
                html += ' <span class="users-page-info">Стр. ' + currentPage + ' из ' + lastPage + '</span> ';
                if (currentPage < lastPage) html += '<button type="button" class="btn btn-secondary btn-sm users-page-btn" data-page="' + (currentPage + 1) + '">Вперёд →</button>';
                paginationEl.innerHTML = html;
            }
        }
    }

    function setupUsersFilters() {
        const searchInput = document.getElementById('usersSearch');
        const searchBtn = document.getElementById('usersSearchBtn');
        const roleFilter = document.getElementById('usersRoleFilter');
        const deptFilter = document.getElementById('usersDepartmentFilter');

        const apply = () => {
            usersPage = 1;
            renderUsers();
        };

        if (searchBtn) searchBtn.addEventListener('click', apply);
        const resetBtn = document.getElementById('usersResetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (searchInput) searchInput.value = '';
                if (roleFilter) roleFilter.value = '';
                if (deptFilter) deptFilter.value = '';
                usersPage = 1;
                renderUsers();
            });
        }
        if (searchInput) {
            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') apply();
            });
        }
        if (roleFilter) roleFilter.addEventListener('change', apply);
        if (deptFilter) deptFilter.addEventListener('change', apply);

        document.getElementById('users')?.addEventListener('click', function (e) {
            const btn = e.target.closest('.users-page-btn');
            if (!btn) return;
            e.preventDefault();
            const p = parseInt(btn.getAttribute('data-page'), 10);
            if (!isNaN(p)) {
                usersPage = p;
                renderUsers();
            }
        });
    }

    function setupEventHandlers() {
        const isAdmin = currentUser && currentUser.role === 'Администратор';
        const addUserBtn = document.querySelector('#users .btn-success');
        if (addUserBtn && isAdmin) {
            addUserBtn.addEventListener('click', function () {
                createUserModal();
            });
        } else if (addUserBtn && !isAdmin) {
            addUserBtn.style.display = 'none';
        }

        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-edit-user')) {
                const userId = parseInt(e.target.getAttribute('data-user-id'));
                editUserModal(userId);
            }
        });

        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-delete-user')) {
                const userId = parseInt(e.target.getAttribute('data-user-id'));
                deleteUser(userId);
            }
        });

        // Сохранение общих настроек
        const generalForm = document.querySelector('#general .settings-form');
        if (generalForm) {
            const saveBtn = generalForm.querySelector('.btn-primary');
            if (saveBtn) {
                saveBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    saveGeneralSettings();
                });
            }
        }

        // Загрузка сохраненных настроек
        loadSettings();
    }

    function loadSettings() {
        // Загружаем общие настройки
        const settings = JSON.parse(localStorage.getItem('system_settings') || '{}');

        if (settings.general) {
            const general = settings.general;
            if (general.timezone) {
                const timezoneSelect = document.getElementById('timezone');
                if (timezoneSelect) timezoneSelect.value = general.timezone;
            }
            if (general.dateFormat) {
                const dateFormatSelect = document.getElementById('date-format');
                if (dateFormatSelect) dateFormatSelect.value = general.dateFormat;
            }
            if (general.emailNotifications !== undefined) {
                const emailCheckbox = document.getElementById('email-notifications');
                if (emailCheckbox) emailCheckbox.checked = general.emailNotifications;
            }
            if (general.autoLogout !== undefined) {
                const autoLogoutCheckbox = document.getElementById('auto-logout');
                if (autoLogoutCheckbox) autoLogoutCheckbox.checked = general.autoLogout;
            }
        }

    }

    function saveGeneralSettings() {
        const settings = JSON.parse(localStorage.getItem('system_settings') || '{}');
        const timezoneEl = document.getElementById('timezone');
        const dateFormatEl = document.getElementById('date-format');
        const emailNotifEl = document.getElementById('email-notifications');
        const autoLogoutEl = document.getElementById('auto-logout');
        settings.general = {
            timezone: timezoneEl ? timezoneEl.value : '+3',
            dateFormat: dateFormatEl ? dateFormatEl.value : 'dd.mm.yyyy',
            emailNotifications: emailNotifEl ? emailNotifEl.checked : false,
            autoLogout: autoLogoutEl ? autoLogoutEl.checked : false
        };
        localStorage.setItem('system_settings', JSON.stringify(settings));
        notify.success('Общие настройки сохранены');
    }

    async function createUserModal() {
        const departments = await database.getTable('departments');
        const departmentsOptions = (departments || []).map(d =>
            `<option value="${d.department_id || d.id}">${d.name}</option>`
        ).join('');

        const modalContent = `
            <form id="userForm">
                <div class="form-group">
                    <label class="form-label" for="userFullName">ФИО *</label>
                    <input type="text" class="form-control" id="userFullName" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="userEmail">Email *</label>
                    <input type="email" class="form-control" id="userEmail" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="userPhone">Номер телефона *</label>
                    <input type="tel" class="form-control" id="userPhone" placeholder="+7 (999) 123-45-67" inputmode="tel" autocomplete="tel" data-phone-mask="true" required>
                </div>
                <div class="form-group password-group">
                    <label class="form-label" for="userPassword">Пароль *</label>
                    <div class="password-field">
                        <input type="password" class="form-control" id="userPassword" required>
                        <button type="button" class="password-toggle" id="togglePassword" aria-label="Показать пароль">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="userPosition">Должность</label>
                    <input type="text" class="form-control" id="userPosition">
                </div>
                <div class="form-group">
                    <label class="form-label" for="userDepartment">Отдел</label>
                    <select class="form-control" id="userDepartment">
                        <option value="">Не выбран</option>
                        ${departmentsOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="userRole">Роль *</label>
                    <select class="form-control" id="userRole" required>
                        <option value="user">Пользователь</option>
                        <option value="editor">Редактор</option>
                        <option value="admin">Администратор</option>
                    </select>
                </div>
                <div class="form-group">
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="userIsActive" checked>
                        <label class="form-check-label" for="userIsActive">Активен</label>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                    <button type="button" class="btn btn-secondary" onclick="modals.hide('userModal')">Отмена</button>
                </div>
            </form>
        `;

        // Удаляем старое модальное окно, если есть
        const oldModal = document.getElementById('userModal');
        if (oldModal) {
            oldModal.remove();
        }

        modals.create('userModal', 'Добавить пользователя', modalContent);
        modals.show('userModal');
        const phoneInput = document.getElementById('userPhone');
        if (phoneInput && window.phoneMask) {
            window.phoneMask.applyTo(phoneInput);
        }

        // Обработчик переключателя видимости пароля
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('userPassword');
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function () {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                const type = isPassword ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.classList.toggle('active');

                // Обновляем иконку
                const svg = togglePassword.querySelector('svg');
                if (svg) {
                    if (isPassword) {
                        // Показываем иконку "скрыть"
                        svg.innerHTML = `
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        `;
                    } else {
                        // Показываем иконку "показать"
                        svg.innerHTML = `
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        `;
                    }
                }
            });
        }

        // Обработчик формы
        const form = document.getElementById('userForm');
        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                await saveUser();
            });
        }
    }

    async function editUserModal(userId) {
        const user = await auth.getUserById(userId);
        if (!user) {
            notify.error('Пользователь не найден');
            return;
        }

        const departments = await database.getTable('departments');
        const departmentsOptions = (departments || []).map(d =>
            `<option value="${d.department_id || d.id}" ${(d.department_id || d.id) === user.department_id ? 'selected' : ''}>${d.name}</option>`
        ).join('');

        const roleMap = {
            'Администратор': 'admin',
            'Редактор': 'editor',
            'Пользователь': 'user'
        };
        const currentRole = roleMap[user.role] || 'user';

        const phone = user.phone || '';

        const modalContent = `
            <form id="userForm">
                <div class="form-group">
                    <label class="form-label" for="userFullName">ФИО *</label>
                    <input type="text" class="form-control" id="userFullName" value="${user.fullName || user.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="userEmail">Email *</label>
                    <input type="email" class="form-control" id="userEmail" value="${user.email || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="userPhone">Номер телефона *</label>
                    <input type="tel" class="form-control" id="userPhone" placeholder="+7 (999) 123-45-67" value="${phone}" inputmode="tel" autocomplete="tel" data-phone-mask="true" required>
                </div>
                <div class="form-group password-group">
                    <label class="form-label" for="userPassword">Новый пароль (оставьте пустым, чтобы не менять)</label>
                    <div class="password-field">
                        <input type="password" class="form-control" id="userPassword">
                        <button type="button" class="password-toggle" id="togglePassword" aria-label="Показать пароль">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="userPosition">Должность</label>
                    <input type="text" class="form-control" id="userPosition" value="${user.position || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="userDepartment">Отдел</label>
                    <select class="form-control" id="userDepartment">
                        <option value="">Не выбран</option>
                        ${departmentsOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="userRole">Роль *</label>
                    <select class="form-control" id="userRole" required>
                        <option value="user" ${currentRole === 'user' ? 'selected' : ''}>Пользователь</option>
                        <option value="editor" ${currentRole === 'editor' ? 'selected' : ''}>Редактор</option>
                        <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Администратор</option>
                    </select>
                </div>
                <div class="form-group">
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="userIsActive" ${user.is_active !== false ? 'checked' : ''}>
                        <label class="form-check-label" for="userIsActive">Активен</label>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                    <button type="button" class="btn btn-secondary" onclick="modals.hide('userModal')">Отмена</button>
                </div>
            </form>
        `;

        // Удаляем старое модальное окно, если есть
        const oldModal = document.getElementById('userModal');
        if (oldModal) {
            oldModal.remove();
        }

        modals.create('userModal', 'Редактировать пользователя', modalContent);
        modals.show('userModal');
        const phoneInput = document.getElementById('userPhone');
        if (phoneInput && window.phoneMask) {
            window.phoneMask.applyTo(phoneInput);
        }

        // Обработчик переключателя видимости пароля
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('userPassword');
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function () {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                const type = isPassword ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.classList.toggle('active');

                // Обновляем иконку
                const svg = togglePassword.querySelector('svg');
                if (svg) {
                    if (isPassword) {
                        // Показываем иконку "скрыть"
                        svg.innerHTML = `
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        `;
                    } else {
                        // Показываем иконку "показать"
                        svg.innerHTML = `
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        `;
                    }
                }
            });
        }

        // Сохраняем ID пользователя для обновления
        const form = document.getElementById('userForm');
        if (form) {
            form.dataset.userId = userId;
            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                await saveUser(userId);
            });
        }
    }

    async function saveUser(userId = null) {
        const form = document.getElementById('userForm');
        if (!form) {
            console.error('Форма не найдена');
            return;
        }

        const fullName = document.getElementById('userFullName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const phone = document.getElementById('userPhone').value.trim();
        const password = document.getElementById('userPassword').value;
        const position = document.getElementById('userPosition').value.trim();
        const departmentId = document.getElementById('userDepartment').value ?
            parseInt(document.getElementById('userDepartment').value) : null;
        const role = document.getElementById('userRole').value;
        const isActive = document.getElementById('userIsActive').checked;

        // Валидация
        if (!fullName || !email || !phone) {
            notify.error('Заполните обязательные поля: ФИО, Email и номер телефона');
            return;
        }

        if (!window.validators || !window.validators.validateEmail(email)) {
            notify.error('Пожалуйста, введите корректный email.');
            return;
        }

        // Валидация телефона
        if (!validatePhone(phone)) {
            notify.error('Неверный формат номера телефона. Используйте формат: +7 (999) 123-45-67');
            return;
        }

        const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');

        if (userId) {
            const body = {
                full_name: fullName,
                email: email,
                phone: phone,
                position: position || '',
                department_id: departmentId,
                role: role,
                is_active: isActive
            };
            if (password) body.password = password;
            try {
                const res = await api.put(baseUrl + '/api/users/' + userId, body);
                if (res.ok) {
                    notify.success('Пользователь обновлен');
                    modals.hide('userModal');
                    await renderUsers();
                } else {
                    const err = await res.json().catch(() => ({}));
                    notify.error(err.message || err.error || 'Ошибка при обновлении пользователя');
                }
            } catch (e) {
                notify.error('Ошибка при обновлении пользователя');
            }
        } else {
            try {
                const res = await api.post(baseUrl + '/api/users', {
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    password: password,
                    position: position || '',
                    department_id: departmentId,
                    role: role,
                    is_active: isActive
                });
                if (res.ok || res.status === 201) {
                    notify.success('Пользователь создан');
                    modals.hide('userModal');
                    await renderUsers();
                } else {
                    const err = await res.json().catch(() => ({}));
                    notify.error(err.message || err.errors?.email?.[0] || err.error || 'Ошибка при создании пользователя');
                }
            } catch (e) {
                notify.error('Ошибка при создании пользователя');
            }
        }
    }

    // Валидация номера телефона
    function validatePhone(phone) {
        if (window.validators && window.validators.validatePhone) {
            return window.validators.validatePhone(phone);
        }
        if (!phone) return false;
        const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
        const phoneRegex = /^(\+?7|8)?\d{10}$/;
        return phoneRegex.test(cleaned);
    }

    function deleteUser(userId) {
        if (currentUser && (currentUser.user_id === userId || currentUser.id === userId)) {
            notify.error('Нельзя удалить текущего пользователя');
            return;
        }
        if (typeof modals === 'undefined' || !modals.confirm) {
            if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
                doDeleteUser(userId);
            }
            return;
        }
        modals.confirm({
            title: 'Удалить пользователя?',
            text: 'Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            danger: true,
            onConfirm: function () { doDeleteUser(userId); }
        });
    }

    async function doDeleteUser(userId) {
        const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');
        try {
            const res = await api.delete(baseUrl + '/api/users/' + userId);
            if (res.ok || res.status === 204) {
                notify.success('Пользователь удален');
                await renderUsers();
            } else {
                const err = await res.json().catch(() => ({}));
                notify.error(err.error || err.message || 'Ошибка при удалении пользователя');
            }
        } catch (e) {
            notify.error('Ошибка при удалении пользователя');
        }
    }

    async function renderDepartments() {
        const listEl = document.getElementById('departmentsList');
        if (!listEl) return;
        const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');
        const departments = await database.getTable('departments');
        if (!departments || departments.length === 0) {
            listEl.innerHTML = '<li style="padding: 16px;">Нет отделов</li>';
            return;
        }
        listEl.innerHTML = departments.map(d => {
            const id = d.department_id || d.id;
            const desc = (d.description || '').trim();
            return '<li class="settings-ref-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">' +
                '<div><strong>' + escapeHtml(d.name) + '</strong>' + (desc ? '<br><span style="color: #666; font-size: 0.9rem;">' + escapeHtml(desc) + '</span>' : '') + '</div>' +
                '<div style="display: flex; gap: 8px;">' +
                '<button type="button" class="btn btn-secondary btn-edit-department" data-id="' + id + '" data-name="' + escapeAttr(d.name) + '" data-description="' + escapeAttr(d.description || '') + '">Редактировать</button>' +
                '<button type="button" class="btn btn-danger btn-delete-department" data-id="' + id + '" data-name="' + escapeAttr(d.name) + '">Удалить</button></div></li>';
        }).join('');
    }

    async function renderCategories() {
        const listEl = document.getElementById('categoriesList');
        if (!listEl) return;
        const categories = await database.getTable('categories');
        if (!categories || categories.length === 0) {
            listEl.innerHTML = '<li style="padding: 16px;">Нет категорий</li>';
            return;
        }
        listEl.innerHTML = categories.map(c => {
            const id = c.category_id || c.id;
            const path = (c.path || '').trim();
            return '<li class="settings-ref-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">' +
                '<div><strong>' + escapeHtml(c.name) + '</strong>' + (path && path !== c.name ? ' <span style="color: #666; font-size: 0.9rem;">(' + escapeHtml(path) + ')</span>' : '') + '</div>' +
                '<div style="display: flex; gap: 8px;">' +
                '<button type="button" class="btn btn-secondary btn-edit-category" data-id="' + id + '" data-name="' + escapeAttr(c.name) + '" data-path="' + escapeAttr(c.path || c.name || '') + '">Редактировать</button>' +
                '<button type="button" class="btn btn-danger btn-delete-category" data-id="' + id + '" data-name="' + escapeAttr(c.name) + '">Удалить</button></div></li>';
        }).join('');
    }

    function escapeHtml(s) {
        if (s == null) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }
    function escapeAttr(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.btn-edit-department');
        if (!btn) return;
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name') || '';
        const description = btn.getAttribute('data-description') || '';
        const modalId = 'editDepartmentModal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();
        const content = '<form id="editDepartmentForm">' +
            '<div class="form-group"><label class="form-label">Название</label><input type="text" class="form-control" id="editDeptName" value="' + escapeAttr(name) + '" required></div>' +
            '<div class="form-group"><label class="form-label">Описание</label><textarea class="form-control" id="editDeptDescription" rows="3">' + escapeAttr(description) + '</textarea></div>' +
            '<input type="hidden" id="editDeptId" value="' + escapeAttr(id) + '">' +
            '<div style="margin-top: 16px;"><button type="submit" class="btn btn-primary">Сохранить</button> <button type="button" class="btn btn-secondary" onclick="document.getElementById(\'' + modalId + '\').remove(); document.body.style.overflow=\'\';">Отмена</button></div></form>';
        if (typeof modals !== 'undefined' && modals.create) {
            modals.create(modalId, 'Редактировать отдел', content);
            modals.show(modalId);
        } else {
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal active';
            modal.innerHTML = '<div class="modal-overlay"></div><div class="modal-content"><div class="modal-header"><h3>Редактировать отдел</h3><button type="button" class="modal-close">&times;</button></div><div class="modal-body">' + content + '</div></div>';
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        }
        document.getElementById('editDepartmentForm').addEventListener('submit', async function (ev) {
            ev.preventDefault();
            const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');
            const res = await api.put(baseUrl + '/api/departments/' + id, {
                name: document.getElementById('editDeptName').value.trim(),
                description: document.getElementById('editDeptDescription').value.trim()
            });
            if (res.ok) {
                if (typeof notify !== 'undefined') notify.success('Отдел сохранён');
                if (typeof modals !== 'undefined' && modals.hide) modals.hide(modalId); else { document.getElementById(modalId).remove(); document.body.style.overflow = ''; }
                await renderDepartments();
                await renderUsers();
            } else {
                const err = await res.json().catch(() => ({}));
                if (typeof notify !== 'undefined') notify.error(err.message || 'Ошибка сохранения');
            }
        });
    });

    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.btn-edit-category');
        if (!btn) return;
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name') || '';
        const path = btn.getAttribute('data-path') || '';
        const modalId = 'editCategoryModal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();
        const content = '<form id="editCategoryForm">' +
            '<div class="form-group"><label class="form-label">Название категории</label><input type="text" class="form-control" id="editCategoryName" value="' + escapeAttr(name) + '" required></div>' +
            '<div class="form-group"><label class="form-label">Путь (необязательно)</label><input type="text" class="form-control" id="editCategoryPath" value="' + escapeAttr(path) + '" placeholder="По умолчанию совпадает с названием"></div>' +
            '<input type="hidden" id="editCategoryId" value="' + escapeAttr(id) + '">' +
            '<div style="margin-top: 16px;"><button type="submit" class="btn btn-primary">Сохранить</button> <button type="button" class="btn btn-secondary" onclick="document.getElementById(\'' + modalId + '\').remove(); document.body.style.overflow=\'\';">Отмена</button></div></form>';
        if (typeof modals !== 'undefined' && modals.create) {
            modals.create(modalId, 'Редактировать категорию', content);
            modals.show(modalId);
        } else {
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal active';
            modal.innerHTML = '<div class="modal-overlay"></div><div class="modal-content"><div class="modal-header"><h3>Редактировать категорию</h3><button type="button" class="modal-close">&times;</button></div><div class="modal-body">' + content + '</div></div>';
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        }
        document.getElementById('editCategoryForm').addEventListener('submit', async function (ev) {
            ev.preventDefault();
            const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');
            const res = await api.put(baseUrl + '/api/categories/' + id, {
                name: document.getElementById('editCategoryName').value.trim(),
                path: document.getElementById('editCategoryPath').value.trim()
            });
            if (res.ok) {
                if (typeof notify !== 'undefined') notify.success('Категория сохранена');
                if (typeof modals !== 'undefined' && modals.hide) modals.hide(modalId); else { document.getElementById(modalId).remove(); document.body.style.overflow = ''; }
                await renderCategories();
            } else {
                const err = await res.json().catch(() => ({}));
                if (typeof notify !== 'undefined') notify.error(err.message || 'Ошибка сохранения');
            }
        });
    });

    document.getElementById('addDepartmentBtn')?.addEventListener('click', function () {
        const modalId = 'createDepartmentModal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();
        const content = '<form id="createDepartmentForm">' +
            '<div class="form-group"><label class="form-label">Название</label><input type="text" class="form-control" id="createDeptName" required></div>' +
            '<div class="form-group"><label class="form-label">Описание</label><textarea class="form-control" id="createDeptDescription" rows="3"></textarea></div>' +
            '<div style="margin-top: 16px;"><button type="submit" class="btn btn-primary">Добавить</button> <button type="button" class="btn btn-secondary" onclick="document.getElementById(\'' + modalId + '\').remove(); document.body.style.overflow=\'\';">Отмена</button></div></form>';
        if (typeof modals !== 'undefined' && modals.create) {
            modals.create(modalId, 'Новый отдел', content);
            modals.show(modalId);
        } else {
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal active';
            modal.innerHTML = '<div class="modal-overlay"></div><div class="modal-content"><div class="modal-header"><h3>Новый отдел</h3><button type="button" class="modal-close">&times;</button></div><div class="modal-body">' + content + '</div></div>';
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        }
        document.getElementById('createDepartmentForm').addEventListener('submit', async function (ev) {
            ev.preventDefault();
            const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');
            const res = await api.post(baseUrl + '/api/departments', {
                name: document.getElementById('createDeptName').value.trim(),
                description: document.getElementById('createDeptDescription').value.trim()
            });
            if (res.ok) {
                if (typeof notify !== 'undefined') notify.success('Отдел добавлен');
                if (typeof modals !== 'undefined' && modals.hide) modals.hide(modalId); else { document.getElementById(modalId).remove(); document.body.style.overflow = ''; }
                await renderDepartments();
                await renderUsers();
            } else {
                const err = await res.json().catch(() => ({}));
                if (typeof notify !== 'undefined') notify.error(err.message || 'Ошибка добавления');
            }
        });
    });

    document.getElementById('addCategoryBtn')?.addEventListener('click', function () {
        const modalId = 'createCategoryModal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();
        const content = '<form id="createCategoryForm">' +
            '<div class="form-group"><label class="form-label">Название категории</label><input type="text" class="form-control" id="createCategoryName" required></div>' +
            '<div class="form-group"><label class="form-label">Путь (необязательно)</label><input type="text" class="form-control" id="createCategoryPath" placeholder="По умолчанию совпадает с названием"></div>' +
            '<div style="margin-top: 16px;"><button type="submit" class="btn btn-primary">Добавить</button> <button type="button" class="btn btn-secondary" onclick="document.getElementById(\'' + modalId + '\').remove(); document.body.style.overflow=\'\';">Отмена</button></div></form>';
        if (typeof modals !== 'undefined' && modals.create) {
            modals.create(modalId, 'Новая категория', content);
            modals.show(modalId);
        } else {
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal active';
            modal.innerHTML = '<div class="modal-overlay"></div><div class="modal-content"><div class="modal-header"><h3>Новая категория</h3><button type="button" class="modal-close">&times;</button></div><div class="modal-body">' + content + '</div></div>';
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        }
        document.getElementById('createCategoryForm').addEventListener('submit', async function (ev) {
            ev.preventDefault();
            const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');
            const res = await api.post(baseUrl + '/api/categories', {
                name: document.getElementById('createCategoryName').value.trim(),
                path: document.getElementById('createCategoryPath').value.trim()
            });
            if (res.ok) {
                if (typeof notify !== 'undefined') notify.success('Категория добавлена');
                if (typeof modals !== 'undefined' && modals.hide) modals.hide(modalId); else { document.getElementById(modalId).remove(); document.body.style.overflow = ''; }
                await renderCategories();
            } else {
                const err = await res.json().catch(() => ({}));
                if (typeof notify !== 'undefined') notify.error(err.message || 'Ошибка добавления');
            }
        });
    });

    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.btn-delete-department');
        if (!btn) return;
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name') || 'Отдел';
        const doDelete = async function () {
            const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');
            const res = await api.delete(baseUrl + '/api/departments/' + id);
            if (res.ok || res.status === 204) {
                if (typeof notify !== 'undefined') notify.success('Отдел удалён');
                await renderDepartments();
                await renderUsers();
            } else {
                const err = await res.json().catch(() => ({}));
                if (typeof notify !== 'undefined') notify.error(err.message || 'Ошибка удаления');
            }
        };
        if (typeof modals !== 'undefined' && modals.confirm) {
            modals.confirm({ title: 'Удалить отдел?', text: 'Удалить отдел «' + name + '»? Сотрудникам этого отдела будет сброшен отдел.', confirmText: 'Удалить', cancelText: 'Отмена', danger: true, onConfirm: doDelete });
        } else {
            if (window.confirm('Удалить отдел «' + name + '»?')) doDelete();
        }
    });

    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('.btn-delete-category');
        if (!btn) return;
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name') || 'Категория';
        const doDelete = async function () {
            const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');
            const res = await api.delete(baseUrl + '/api/categories/' + id);
            if (res.ok || res.status === 204) {
                if (typeof notify !== 'undefined') notify.success('Категория удалена');
                await renderCategories();
            } else {
                const err = await res.json().catch(() => ({}));
                if (typeof notify !== 'undefined') notify.error(err.message || 'Ошибка удаления');
            }
        };
        if (typeof modals !== 'undefined' && modals.confirm) {
            modals.confirm({ title: 'Удалить категорию?', text: 'Удалить категорию «' + name + '»? У документов этой категории будет сброшена категория.', confirmText: 'Удалить', cancelText: 'Отмена', danger: true, onConfirm: doDelete });
        } else {
            if (window.confirm('Удалить категорию «' + name + '»?')) doDelete();
        }
    });

});

