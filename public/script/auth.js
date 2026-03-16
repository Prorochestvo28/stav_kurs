// Расширение auth из api.js для Laravel
(function () {
    if (typeof auth === 'undefined') return;
    const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : '').replace(/\/$/, '');
    const loginUrl = typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : baseUrl + '/login';

    auth.isAuthenticated = async function () {
        const user = await auth.getCurrentUser();
        return user !== null;
    };

    auth.login = async function (email, password, remember) {
        try {
            const res = await fetch(baseUrl + '/login', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ email, password, remember: !!remember }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                auth.setCurrentUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: data.message || 'Неверный email или пароль' };
        } catch (e) {
            return { success: false, message: 'Ошибка сети' };
        }
    };

    auth.logout = function () {
        auth.clearCurrentUser();
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = baseUrl + '/logout';
        const csrf = document.createElement('input');
        csrf.type = 'hidden';
        csrf.name = '_token';
        csrf.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        form.appendChild(csrf);
        document.body.appendChild(form);
        form.submit();
    };

    auth.updateUser = async function (updatedUser) {
        try {
            const res = await api.put(baseUrl + '/api/user', {
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                position: updatedUser.position,
                department_id: updatedUser.department_id,
            });
            if (!res.ok) return false;
            const user = await res.json();
            auth.setCurrentUser(user);
            return true;
        } catch (e) {
            return false;
        }
    };

    auth.changePassword = async function () {
        return true;
    };

    auth.getUserById = async function (userId) {
        try {
            const users = await database.getTable('users');
            const u = users.find(x => (x.user_id || x.id) === userId);
            if (!u) return null;
            return {
                id: u.user_id ?? u.id,
                user_id: u.user_id ?? u.id,
                fullName: u.full_name ?? u.fullName,
                name: u.full_name ?? u.fullName,
                email: u.email,
                role: u.role,
                position: u.position,
                phone: u.phone,
                department_id: u.department_id,
                is_active: u.is_active !== false,
            };
        } catch (e) {
            return null;
        }
    };
})();
