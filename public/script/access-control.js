// Контроль доступа по ролям (Laravel API)
document.addEventListener('DOMContentLoaded', async function () {
    async function waitForAuth() {
        for (let i = 0; i < 30; i++) {
            if (typeof auth !== 'undefined') {
                const ok = await auth.isAuthenticated();
                if (ok) return true;
            }
            await new Promise(r => setTimeout(r, 100));
        }
        return false;
    }
    const ok = await waitForAuth();
    if (!ok) return;
    const user = await auth.getCurrentUser();
    if (!user) return;
    const isRegularUser = user.role === 'Пользователь';
    if (isRegularUser) {
        const approvalsLink = document.querySelector('nav a[href*="approvals"]');
        if (approvalsLink && approvalsLink.parentElement) {
            approvalsLink.parentElement.style.display = 'none';
        }
        const reportsLink = document.querySelector('nav a[href*="reports"]');
        if (reportsLink && reportsLink.parentElement) {
            reportsLink.parentElement.style.display = 'none';
        }
    }
});
