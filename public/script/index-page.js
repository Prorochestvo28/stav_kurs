// Скрипт для главной страницы

document.addEventListener('DOMContentLoaded', async function() {
    if (typeof auth === 'undefined') {
        window.location.href = (typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : '/login');
        return;
    }
    const ok = await auth.isAuthenticated();
    if (!ok) {
        window.location.href = (typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : '/login');
        return;
    }
    loadScripts().then(() => {
        initIndexPage();
    });

    function loadScripts() {
        return new Promise((resolve) => {
            const scripts = ['script/auth.js', 'script/documents.js', 'script/approvals.js'];
            let loaded = 0;
            
            scripts.forEach(src => {
                if (!document.querySelector(`script[src="${src}"]`)) {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = () => {
                        loaded++;
                        if (loaded === scripts.length) resolve();
                    };
                    document.head.appendChild(script);
                } else {
                    loaded++;
                    if (loaded === scripts.length) resolve();
                }
            });
        });
    }

    async function initIndexPage() {
        var documents = [];
        try {
            documents = await documentsManager.getAllDocuments();
        } catch (e) {
            console.error('Ошибка загрузки документов на главной:', e);
        }
        if (!Array.isArray(documents)) documents = [];
        await refreshFilterCounts(documents);
        await renderTasks();
        await renderRecentDocumentsFromList(documents);
        setupSearch();
        setupSidebarFilters();
    }

    async function refreshFilterCounts(documents) {
        let stats;
        if (documents && documents.length >= 0) {
            const byStatus = { draft: 0, review: 0, approved: 0, rejected: 0 };
            const byCategory = {};
            documents.forEach(doc => {
                byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
                const cat = doc.category || 'Без категории';
                byCategory[cat] = (byCategory[cat] || 0) + 1;
            });
            stats = { total: documents.length, byStatus, byCategory };
        } else {
            stats = await documentsManager.getDocumentStats();
        }
        updateFilterCounts(stats);
    }

    async function renderTasks() {
        const user = await auth.getCurrentUser();
        const isRegularUser = user && user.role === 'Пользователь';
        
        // Скрываем секцию задач для обычных пользователей
        if (isRegularUser) {
            const tasksSection = document.querySelector('.dashboard-section');
            const tasksHeader = tasksSection ? tasksSection.querySelector('h2.section-title') : null;
            if (tasksHeader && tasksHeader.textContent.includes('задачи согласования')) {
                tasksSection.style.display = 'none';
            }
            return;
        }
        
        const myApprovals = await approvalsManager.getMyApprovals();
        const container = document.querySelector('.task-list');
        
        if (!container) return;

        if (myApprovals.length === 0) {
            container.innerHTML = '<li class="task-item"><div class="task-title">Нет задач согласования</div></li>';
            return;
        }

        container.innerHTML = myApprovals.slice(0, 3).map(approval => {
            const isOverdue = approvalsManager.checkOverdue(approval);
            const deadline = approvalsManager.formatDate(approval.deadline);
            const today = new Date();
            const deadlineDate = new Date(approval.deadline);
            const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
            
            let statusText = '';
            if (isOverdue) {
                statusText = 'Просрочено';
            } else if (daysLeft <= 3) {
                statusText = `Осталось ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`;
            } else {
                statusText = `Осталось ${daysLeft} дней`;
            }

            return `
                <li class="task-item ${isOverdue ? 'urgent' : ''}" data-task-id="${approval.id}">
                    <div class="task-title">${approval.documentName}</div>
                    <div class="task-meta">
                        <span>Срок: до ${deadline}</span>
                        <span>${statusText}</span>
                    </div>
                </li>
            `;
        }).join('');

        // Обработчик клика на задачу
        container.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', function() {
                window.location.href = (typeof APP_URL !== 'undefined' ? APP_URL : '') + '/approvals';
            });
        });
    }

    async function renderRecentDocumentsFromList(documents) {
        if (!documents || !Array.isArray(documents)) return;
        const sorted = documents.slice().sort((a, b) => {
            const dateA = (a && a.updatedAt) ? new Date(a.updatedAt).getTime() : 0;
            const dateB = (b && b.updatedAt) ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });
        const recent = sorted.slice(0, 4);
        const container = document.querySelector('.document-list');
        if (!container) return;

        if (recent.length === 0) {
            container.innerHTML = '<li class="document-item"><div class="document-details"><div class="document-name">Нет недавних документов</div></div></li>';
            return;
        }

        const user = await auth.getCurrentUser();
        const isRegularUser = user && user.role === 'Пользователь';

        container.innerHTML = recent.map(doc => {
            if (!doc) return '';
            const name = (doc.name || 'Без названия').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const updatedAt = documentsManager.formatDate(doc.updatedAt || doc.updated_at || '');
            const author = (doc.author || 'Неизвестно').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const statusClass = documentsManager.getStatusClass(doc.status || 'draft');
            const statusText = documentsManager.getStatusText(doc.status || 'draft');
            const docId = doc.id || doc.document_id;
            const canEdit = doc.status !== 'review';
            const actions = isRegularUser 
                ? `<button class="btn btn-download" data-doc-id="${docId}">Скачать</button>`
                : `
                    <button class="btn btn-download" data-doc-id="${docId}">Скачать</button>
                    ${canEdit ? `<button class="btn btn-edit" data-doc-id="${docId}">Редактировать</button>` : ''}
                `;
            
            return `
            <li class="document-item" data-doc-id="${docId}">
                <div class="document-details">
                    <div class="document-name">${name}</div>
                    <div class="document-meta">
                        <div>Изменен: ${updatedAt}</div>
                        <div><span class="status ${statusClass}">${statusText}</span></div>
                        <div>Автор: ${author}</div>
                    </div>
                </div>
                <div class="document-actions">
                    ${actions}
                </div>
            </li>
        `;
        }).join('');

        // Обработчики действий
        container.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', async function() {
                const docId = this.getAttribute('data-doc-id');
                const doc = await documentsManager.getDocumentById(docId);
                if (doc && doc.fileUrl) {
                    window.open(doc.fileUrl, '_blank');
                } else {
                    notify.error('К документу не прикреплен файл');
                }
            });
        });

        // Обработчик редактирования только для не-обычных пользователей
        if (!isRegularUser) {
            container.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const docId = this.getAttribute('data-doc-id');
                    const doc = await documentsManager.getDocumentById(docId);
                    if (doc && doc.status === 'review') {
                        notify.error('Документ находится на согласовании и недоступен для редактирования');
                        return;
                    }
                    window.location.href = (typeof APP_URL !== 'undefined' ? APP_URL : '') + '/documents?edit=' + docId;
                });
            });
        }
    }

    function setupSidebarFilters() {
        const filterLinks = document.querySelectorAll('.filter-options a[data-filter-type]');
        filterLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const type = this.dataset.filterType;
                const value = this.dataset.filterValue;
                sessionStorage.setItem('documentsFilter', JSON.stringify({ type, value }));
                window.location.href = (typeof APP_URL !== 'undefined' ? APP_URL : '') + '/documents';
            });
        });
    }

    function updateFilterCounts(stats) {
        const statusCounts = Object.assign({}, stats.byStatus, { all: stats.total });
        const categoryCounts = Object.assign({}, stats.byCategory, { category_all: stats.total });

        document.querySelectorAll('.filter-count').forEach(span => {
            const key = span.dataset.filterKey;
            if (key in statusCounts) {
                span.textContent = statusCounts[key];
            } else if (key && key in categoryCounts) {
                span.textContent = categoryCounts[key];
            }
        });
    }

    function setupSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchButton = document.querySelector('.search-button');

        if (searchInput && searchButton) {
            searchButton.addEventListener('click', function() {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = (typeof APP_URL !== 'undefined' ? APP_URL : '') + '/documents?search=' + encodeURIComponent(query);
                } else {
                    window.location.href = (typeof APP_URL !== 'undefined' ? APP_URL : '') + '/documents';
                }
            });

            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchButton.click();
                }
            });
        }
    }

});

