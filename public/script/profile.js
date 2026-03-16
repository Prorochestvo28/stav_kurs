// Профиль пользователя (Laravel API)
document.addEventListener('DOMContentLoaded', async function () {
    if (typeof auth === 'undefined') {
        window.location.href = (typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : '/login');
        return;
    }
    const user = await auth.getCurrentUser();
    if (!user) {
        window.location.href = (typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : '/login');
        return;
    }
    const fullName = user.fullName || user.name || 'Пользователь';
    document.getElementById('profileName').textContent = fullName;
    document.getElementById('profileEmail').textContent = user.email || '';
    document.getElementById('profileRole').textContent = user.role || 'Пользователь';
    document.getElementById('profileAvatar').textContent = auth.getInitials(fullName);
    document.getElementById('fullName').value = fullName;
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('department').value = user.department || '';
    document.getElementById('position').value = user.position || '';

    loadActivity();

    document.getElementById('personalForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const updated = {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
        };
        const success = await auth.updateUser(updated);
        if (success && typeof notify !== 'undefined') {
            notify.success('Данные сохранены');
        } else if (typeof notify !== 'undefined') {
            notify.error('Ошибка сохранения');
        }
    });
});

function formatActivityDate(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        const datePart = typeof formatDateBySettings === 'function' ? formatDateBySettings(d) : d.toLocaleDateString('ru-RU');
        const timePart = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        return datePart + ' ' + timePart;
    } catch (e) {
        return iso;
    }
}

function activityIcon(type) {
    const icons = { document_created: '📄', document_updated: '✏️', approval_started: '📤', approval_approved: '✓', approval_rejected: '✗' };
    return icons[type] || '•';
}

async function loadActivity() {
    const listEl = document.getElementById('activityList');
    if (!listEl) return;
    const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : (window.location && window.location.origin ? window.location.origin : '')).replace(/\/$/, '');
    try {
        const res = await fetch(baseUrl + '/api/user/activity', { credentials: 'same-origin' });
        if (!res.ok) {
            listEl.innerHTML = '<div class="activity-empty">Не удалось загрузить историю активности</div>';
            return;
        }
        const items = await res.json();
        if (!items || items.length === 0) {
            listEl.innerHTML = '<div class="activity-empty">Пока нет записей активности</div>';
            return;
        }
        listEl.innerHTML = items.map(function (item) {
            const url = item.url ? (baseUrl + item.url) : '';
            const link = url ? ('<a href="' + url + '" style="text-decoration: none; color: inherit;">' + escapeHtml(item.title) + '</a>') : escapeHtml(item.title);
            return '<div class="activity-item">' +
                '<div class="activity-icon">' + activityIcon(item.type) + '</div>' +
                '<div class="activity-content">' +
                '<div class="activity-title">' + link + '</div>' +
                '<div class="activity-date">' + formatActivityDate(item.date) + '</div>' +
                '</div></div>';
        }).join('');
    } catch (e) {
        listEl.innerHTML = '<div class="activity-empty">Ошибка загрузки истории активности</div>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
