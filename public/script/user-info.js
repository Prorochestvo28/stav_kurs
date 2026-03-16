// Обновление информации о пользователе в шапке (Laravel API)
document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('auth-page')) return;

    async function updateUserInfo() {
        if (typeof auth === 'undefined') return;
        const user = await auth.getCurrentUser();
        if (!user) {
            window.location.href = (typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : (typeof APP_URL !== 'undefined' ? APP_URL : '') + '/login');
            return;
        }
        const userNameEl = document.querySelector('.user-name') || document.getElementById('headerUserName');
        const userRoleEl = document.querySelector('.user-role') || document.getElementById('headerUserRole');
        const userAvatarEl = document.querySelector('.user-avatar') || document.getElementById('headerUserAvatar');
        const fullName = user.fullName || user.name || 'Пользователь';
        const shortName = fullName.trim().split(/\s+/).length >= 2
            ? fullName.trim().split(/\s+/).slice(0, 2).join(' ')
            : fullName;
        if (userNameEl) userNameEl.textContent = shortName;
        if (userRoleEl) userRoleEl.textContent = user.role || 'Пользователь';
        if (userAvatarEl) userAvatarEl.textContent = auth.getInitials(fullName);
    }

    if (typeof auth !== 'undefined') {
        updateUserInfo();
    } else {
        const check = setInterval(function () {
            if (typeof auth !== 'undefined') {
                clearInterval(check);
                updateUserInfo();
            }
        }, 100);
    }
});
