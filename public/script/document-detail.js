(function () {
    const documentId = typeof window.DOCUMENT_ID !== 'undefined' ? window.DOCUMENT_ID : null;
    const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : (window.location && window.location.origin ? window.location.origin : '')).replace(/\/$/, '');

    function formatDate(iso) {
        if (!iso) return '—';
        if (typeof formatDateBySettings === 'function') return formatDateBySettings(iso);
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return iso;
            return d.toLocaleDateString('ru-RU');
        } catch (e) {
            return iso;
        }
    }

    function formatDateTime(iso) {
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
        const m = { draft: 'Черновик', review: 'На согласовании', approved: 'Согласован', rejected: 'Отклонён' };
        return m[status] || status;
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

    async function doDownloadVersion(docId, versionId, fileName) {
        const url = baseUrl + '/api/documents/' + docId + '/versions/' + versionId + '/file';
        try {
            const res = await fetch(url, { credentials: 'same-origin' });
            if (!res.ok) return;
            const blob = await res.blob();
            const name = fileName || 'document';
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) {}
    }

    async function loadDocument() {
        const loadingEl = document.getElementById('documentDetailLoading');
        const errorEl = document.getElementById('documentDetailError');
        const contentEl = document.getElementById('documentDetailContent');

        if (!documentId) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.textContent = 'Не указан идентификатор документа';
                errorEl.style.display = 'block';
            }
            return;
        }

        try {
            const [docRes, versionsRes] = await Promise.all([
                fetch(baseUrl + '/api/documents/' + documentId, { credentials: 'same-origin' }),
                fetch(baseUrl + '/api/documents/' + documentId + '/versions', { credentials: 'same-origin' })
            ]);

            if (!docRes.ok) {
                const data = await docRes.json().catch(() => ({}));
                throw new Error(data.message || 'Документ не найден');
            }

            const doc = await docRes.json();
            const versions = versionsRes.ok ? await versionsRes.json() : [];

            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'block';

            document.title = (doc.name || 'Документ') + ' — СЭД-СТАВ';

            const titleEl = document.getElementById('documentDetailTitle');
            const metaEl = document.getElementById('documentDetailMeta');
            const descEl = document.getElementById('documentDetailDescription');
            const downloadEl = document.getElementById('documentDetailDownload');
            const actionsEl = document.getElementById('documentDetailActions');
            const versionsEl = document.getElementById('documentDetailVersions');

            if (titleEl) titleEl.textContent = doc.name || 'Без названия';
            if (metaEl) {
                metaEl.innerHTML = [
                    'Автор: ' + (doc.author || '—'),
                    'Категория: ' + (doc.category || '—'),
                    'Статус: ' + statusText(doc.status),
                    'Создан: ' + formatDate(doc.createdAt),
                    'Изменён: ' + formatDate(doc.updatedAt),
                    doc.version ? 'Текущая версия: ' + doc.version : ''
                ].join(' • ');
            }
            if (descEl) {
                descEl.innerHTML = (doc.description && doc.description.trim())
                    ? '<strong>Описание:</strong> ' + escapeHtml(doc.description)
                    : '<span class="document-detail-no-desc">Описание отсутствует</span>';
            }
            if (downloadEl) {
                downloadEl.href = '#';
                downloadEl.onclick = function (e) {
                    e.preventDefault();
                    doDownload(documentId);
                };
                if (!doc.fileName && !doc.fileUrl) downloadEl.style.display = 'none';
            }
            if (actionsEl) actionsEl.innerHTML = '';

            if (versionsEl) {
                if (versions.length === 0) {
                    versionsEl.innerHTML = '<p class="document-detail-no-versions">Нет сохранённых версий.</p>';
                } else {
                    const rows = versions.map(function (v) {
                        const comment = (v.change_comment || '').trim();
                        const commentEscaped = comment ? escapeHtml(comment) : '—';
                        const fileName = (v.file_name || 'document').replace(/"/g, '&quot;');
                        return '<tr>' +
                            '<td>' + (v.version_number || '—') + '</td>' +
                            '<td>' + formatDateTime(v.created_at) + '</td>' +
                            '<td>' + escapeHtml(v.author || '—') + '</td>' +
                            '<td class="document-detail-comment-cell" title="' + commentEscaped + '">' + (commentEscaped.length > 60 ? commentEscaped.slice(0, 60) + '…' : commentEscaped) + '</td>' +
                            '<td><button type="button" class="btn btn-download btn-download-version" data-doc-id="' + documentId + '" data-version-id="' + v.id + '" data-file-name="' + fileName + '">Скачать</button></td>' +
                            '</tr>';
                    }).join('');
                    versionsEl.innerHTML = '<table class="document-detail-versions-table">' +
                        '<thead><tr>' +
                        '<th>Версия</th><th>Дата</th><th>Автор</th><th>Комментарий</th><th></th></tr></thead>' +
                        '<tbody>' + rows + '</tbody></table>';
                }
            }

            document.addEventListener('click', function (e) {
                const btn = e.target.closest('.btn-download-version');
                if (!btn) return;
                e.preventDefault();
                const docId = btn.getAttribute('data-doc-id');
                const versionId = btn.getAttribute('data-version-id');
                const fileName = btn.getAttribute('data-file-name') || 'document';
                if (docId && versionId) doDownloadVersion(parseInt(docId, 10), parseInt(versionId, 10), fileName);
            });
        } catch (err) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'none';
            if (errorEl) {
                errorEl.textContent = err.message || 'Ошибка загрузки документа';
                errorEl.style.display = 'block';
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDocument);
    } else {
        loadDocument();
    }
})();
