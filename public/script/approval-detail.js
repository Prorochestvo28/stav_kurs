(function () {
    const approvalId = typeof window.APPROVAL_ID !== 'undefined' ? window.APPROVAL_ID : null;
    const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : (window.location && window.location.origin ? window.location.origin : '')).replace(/\/$/, '');

    function formatDate(iso) {
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

    function statusText(status) {
        const map = { approved: 'Согласовано', rejected: 'Отклонено', pending: 'Ожидает решения', waiting: 'Ожидает очереди' };
        return map[status] || status;
    }

    async function loadApproval() {
        const loadingEl = document.getElementById('approvalDetailLoading');
        const errorEl = document.getElementById('approvalDetailError');
        const contentEl = document.getElementById('approvalDetailContent');

        if (!approvalId) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.textContent = 'Не указан идентификатор согласования';
                errorEl.style.display = 'block';
            }
            return;
        }

        try {
            const res = await fetch(baseUrl + '/api/approvals/' + approvalId, { credentials: 'same-origin' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Согласование не найдено');
            }
            const approval = await res.json();

            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'block';

            const titleEl = document.getElementById('approvalDetailTitle');
            const metaEl = document.getElementById('approvalDetailMeta');
            const downloadEl = document.getElementById('approvalDetailDownload');
            const stepsEl = document.getElementById('approvalDetailSteps');

            if (titleEl) titleEl.textContent = approval.documentName || 'Документ';
            if (metaEl) {
                metaEl.innerHTML = [
                    'Инициатор: ' + (approval.initiatorName || '—'),
                    'Начало: ' + formatDate(approval.createdAt),
                    'Дедлайн: ' + formatDate(approval.deadline),
                    approval.endDate ? 'Завершено: ' + formatDate(approval.endDate) : '',
                    'Статус: ' + (approval.status === 'in_progress' ? 'В работе' : approval.status === 'completed' ? 'Согласован' : approval.status === 'rejected' ? 'Отклонён' : approval.status)
                ].filter(Boolean).join(' | ');
            }
            if (downloadEl && approval.documentId) {
                downloadEl.href = '#';
                downloadEl.addEventListener('click', function (e) {
                    e.preventDefault();
                    doDownload(approval.documentId);
                });
            } else             if (downloadEl) {
                downloadEl.style.display = 'none';
            }

            if (approval.initiatorComment && approval.initiatorComment.trim() !== '') {
                const initiatorBlock = document.createElement('div');
                initiatorBlock.className = 'approval-detail-initiator-comment';
                initiatorBlock.innerHTML = '<div class="approval-detail-initiator-label">Комментарий при отправке на согласование (' + formatDate(approval.createdAt) + ')</div><div class="approval-detail-initiator-text">' + escapeHtml(approval.initiatorComment.trim()) + '</div>';
                const h3 = contentEl.querySelector('h3');
                contentEl.insertBefore(initiatorBlock, h3 || stepsEl);
            }

            if (stepsEl) {
                const steps = approval.steps || [];
                stepsEl.innerHTML = steps.map(function (step, index) {
                    const time = step.status === 'approved' || step.status === 'rejected'
                        ? step.approvedAt
                        : step.assignedAt;
                    const timeLabel = step.status === 'approved' || step.status === 'rejected'
                        ? (step.status === 'approved' ? 'Согласовано' : 'Отклонено')
                        : 'Назначено';
                    const commentHtml = step.comment
                        ? '<div class="approval-step-comment"><strong>Комментарий:</strong> ' + escapeHtml(step.comment) + '</div>'
                        : '';
                    return `
                        <div class="approval-detail-step">
                            <div class="approval-detail-step-row">
                                <span class="approval-detail-step-name">Этап ${step.step_number}</span>
                                <span class="approval-detail-step-approver">${escapeHtml(step.approverName || '—')}</span>
                                <span class="approval-detail-step-time">${timeLabel}: ${formatDate(time)}</span>
                                <span class="status-badge status-${step.status}">${statusText(step.status)}</span>
                            </div>
                            ${commentHtml}
                        </div>
                    `;
                }).join('') || '<p>Нет этапов согласования.</p>';
            }

        } catch (err) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'none';
            if (errorEl) {
                errorEl.textContent = err.message || 'Ошибка загрузки согласования';
                errorEl.style.display = 'block';
            }
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function doDownload(docId) {
        const url = baseUrl + '/api/documents/' + docId + '/file';
        try {
            const res = await fetch(url, { credentials: 'same-origin' });
            if (!res.ok) return;
            const blob = await res.blob();
            const name = res.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] || 'document';
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadApproval);
    } else {
        loadApproval();
    }
})();
