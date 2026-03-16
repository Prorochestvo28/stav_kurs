// Скрипт для страницы документов

document.addEventListener('DOMContentLoaded', function () {
    const ACTIONS_BREAKPOINT = 1024;
    let currentFilters = {};
    let currentPage = 1;
    const PAGE_SIZE = 5;
    const FILTER_STORAGE_KEY = 'documentsFilter';
    console.log('DOM загружен, инициализация страницы документов...');

    // Ждем загрузки всех необходимых модулей
    function waitForModules() {
        return new Promise((resolve) => {
            const checkModules = setInterval(() => {
                if (typeof database !== 'undefined' &&
                    typeof auth !== 'undefined' &&
                    typeof documentsManager !== 'undefined' &&
                    typeof modals !== 'undefined') {
                    clearInterval(checkModules);
                    console.log('Все модули загружены');
                    resolve();
                }
            }, 100);

            // Таймаут на случай, если модули не загрузятся
            setTimeout(() => {
                clearInterval(checkModules);
                console.warn('Таймаут ожидания модулей');
                resolve();
            }, 5000);
        });
    }

    waitForModules().then(async () => {
        if (typeof auth === 'undefined') {
            window.location.href = (typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : '/login');
            return;
        }
        const ok = await auth.isAuthenticated();
        if (!ok) {
            window.location.href = (typeof LOGIN_URL !== 'undefined' ? LOGIN_URL : '/login');
            return;
        }
        try {
            await initDocumentsPage();
        } catch (err) {
            console.error('Ошибка инициализации страницы документов:', err);
            try {
                if (typeof renderDocuments === 'function') await renderDocuments(currentFilters);
                if (typeof setupSearch === 'function') setupSearch();
                if (typeof setupFilters === 'function') setupFilters();
            } catch (e) {
                console.error('Ошибка при восстановлении:', e);
            }
        }
    });

    async function initDocumentsPage() {
        console.log('Инициализация страницы документов...');

        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        currentFilters = searchQuery ? { search: searchQuery } : {};
        if (searchQuery) {
            const searchInput = document.querySelector('.search-input');
            if (searchInput) searchInput.value = searchQuery;
        }

        try {
            const storedFilter = consumeStoredFilter();
            if (storedFilter) {
                applyExternalFilter(storedFilter);
                currentPage = 1;
            }
        } catch (e) {
            console.warn('Ошибка применения сохранённого фильтра:', e);
        }

        setupEventHandlers();

        const user = await auth.getCurrentUser();
        const isRegularUser = user && user.role === 'Пользователь';

        const createBtn = document.querySelector('.btn-create');
        if (createBtn && isRegularUser) createBtn.style.display = 'none';

        if (!isRegularUser) {
            try {
                createDocumentModal();
            } catch (e) {
                console.error('Ошибка создания модального окна документа:', e);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        await renderDocuments(currentFilters);
        setupSearch();
        setupFilters();
        setupDateFilter();
        syncDateFilterInputs();
        await updateFilterCounts();
        applyFilterHighlights();

        window.addEventListener('resize', updateDocumentActionLayout);

        console.log('Страница документов инициализирована');
    }

    function createDocumentModal() {
        // Проверяем, не создано ли уже модальное окно
        if (document.getElementById('documentModal')) {
            console.log('Модальное окно уже существует');
            return;
        }

        console.log('Создание модального окна...');

        const modalContent = `
            <form id="documentForm">
                <div class="form-group">
                    <label class="form-label" for="docName">Название документа</label>
                    <input type="text" class="form-control" id="docName" name="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="docCategory">Категория</label>
                    <select class="form-control" id="docCategory" name="category" required>
                        <option value="Технические">Технические</option>
                        <option value="Коммерческие">Коммерческие</option>
                        <option value="Проектные">Проектные</option>
                        <option value="Отчетные">Отчетные</option>
                        <option value="Прочие">Прочие</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="docDescription">Описание</label>
                    <textarea class="form-control" id="docDescription" name="description" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="docFile">Файл</label>
                    <input type="file" class="form-control" id="docFile" name="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.odt,.ods">
                    <small class="form-text text-muted" id="docFileName"></small>
                </div>
                <input type="hidden" id="docId" name="id">
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" onclick="if(typeof modals !== 'undefined') modals.hide('documentModal')">Отмена</button>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
            </form>
        `;

        if (typeof modals !== 'undefined' && modals.create) {
            try {
                modals.create('documentModal', 'Новый документ', modalContent);
                // Не показываем сразу — только по кнопке «Создать документ»
                console.log('Модальное окно создано');

                // Устанавливаем обработчик формы после создания модального окна
                setTimeout(() => {
                    const form = document.getElementById('documentForm');
                    if (form) {
                        // Удаляем старый обработчик, если есть
                        const newForm = form.cloneNode(true);
                        form.parentNode.replaceChild(newForm, form);

                        newForm.addEventListener('submit', function (e) {
                            e.preventDefault();
                            console.log('Отправка формы документа');
                            saveDocument();
                        });
                        console.log('Обработчик формы установлен');
                    } else {
                        console.error('Форма не найдена после создания модального окна');
                    }
                }, 300);
            } catch (error) {
                console.error('Ошибка при создании модального окна:', error);
            }
        } else {
            console.error('Модуль modals не загружен. Тип modals:', typeof modals);
            // Попробуем создать модальное окно вручную
            setTimeout(() => {
                if (typeof modals !== 'undefined' && modals.create) {
                    createDocumentModal();
                }
            }, 500);
        }
    }

    async function renderDocuments(filters = {}) {
        console.log('Рендеринг документов с фильтрами:', filters);
        const documents = await documentsManager.filterDocuments(filters);
        console.log('Найдено документов:', documents.length);
        console.log('Документы:', documents);

        // Проверяем роль пользователя
        const user = await auth.getCurrentUser();
        const isRegularUser = user && user.role === 'Пользователь';

        const totalDocuments = documents.length;
        const totalPages = Math.max(1, Math.ceil(totalDocuments / PAGE_SIZE));
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const pageDocuments = documents.slice(startIndex, startIndex + PAGE_SIZE);

        const container = document.querySelector('.document-list');

        if (!container) {
            console.error('Контейнер .document-list не найден');
            return;
        }

        if (pageDocuments.length === 0) {
            container.innerHTML = '<li class="document-item"><p style="text-align: center; padding: 20px;">Документы не найдены</p></li>';
            console.log('Документы не найдены');
            renderPagination(1, 0);
            return;
        }

        const _docBaseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : (window.location && window.location.origin ? window.location.origin : '')).replace(/\/$/, '');
        container.innerHTML = pageDocuments.map(doc => {
            const canEdit = doc.status !== 'review';
            const docPageUrl = _docBaseUrl + '/documents/' + doc.id;
            const actions = isRegularUser
                ? `<button class="btn btn-download" data-doc-id="${doc.id}">Скачать</button>
                    <a href="${docPageUrl}" class="btn btn-edit" title="Открыть документ">Подробнее</a>`
                : `
                    <button class="btn btn-download" data-doc-id="${doc.id}">Скачать</button>
                    <a href="${docPageUrl}" class="btn btn-edit" title="Открыть документ">Подробнее</a>
                    ${canEdit ? `<button class="btn btn-edit" data-doc-id="${doc.id}">Редактировать</button>` : ''}
                    ${doc.status === 'draft' ? `<button class="btn btn-primary btn-send-approval" data-doc-id="${doc.id}" title="Отправить на согласование">На согласование</button>` : ''}
                    ${doc.status === 'rejected' ? `<button class="btn btn-primary btn-resend-approval" data-doc-id="${doc.id}" title="Отправить на повторное согласование">Согласовать повторно</button>` : ''}
                    <button class="btn btn-danger" data-doc-id="${doc.id}" onclick="deleteDocument(${doc.id})">Удалить</button>
                `;

            return `
            <li class="document-item" data-doc-id="${doc.id}">
                <div class="document-details">
                    <div class="document-name"><a href="${docPageUrl}" style="text-decoration: none; color: inherit; font-weight: 600;">${doc.name}</a></div>
                    <div class="document-meta">
                        <div>Изменен: ${documentsManager.formatDate(doc.updatedAt)}</div>
                        <div><span class="status ${documentsManager.getStatusClass(doc.status)}">${documentsManager.getStatusText(doc.status)}</span></div>
                        <div>Автор: ${doc.author}</div>
                        <div>Категория: ${doc.category}</div>
                    </div>
                </div>
                <div class="document-actions">
                    ${actions}
                </div>
            </li>
        `;
        }).join('');

        renderPagination(totalPages, totalDocuments);
        updateDocumentActionLayout();
    }

    function renderPagination(totalPages, totalDocuments) {
        const pagination = document.getElementById('documentsPagination') || document.querySelector('.pagination');
        if (!pagination) {
            return;
        }

        if (totalDocuments <= PAGE_SIZE) {
            pagination.innerHTML = '';
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = '';
        const prevPage = currentPage > 1 ? currentPage - 1 : 1;
        const nextPage = currentPage < totalPages ? currentPage + 1 : totalPages;

        let html = '';
        html += createPaginationLink('←', prevPage, currentPage === 1, false);
        for (let i = 1; i <= totalPages; i++) {
            html += createPaginationLink(i, i, false, i === currentPage);
        }
        html += createPaginationLink('→', nextPage, currentPage === totalPages, false);

        pagination.innerHTML = html;
    }

    function createPaginationLink(label, page, disabled = false, active = false) {
        const classes = [];
        if (active) classes.push('active');
        if (disabled) classes.push('disabled');
        const classAttr = classes.length ? ` class="${classes.join(' ')}"` : '';
        return `<li><a href="#" data-page="${page}"${classAttr}>${label}</a></li>`;
    }

    function setupEventHandlers() {
        console.log('Установка обработчиков событий...');

        // Функция для открытия модального окна создания документа
        function openCreateModal() {
            let modal = document.getElementById('documentModal');
            if (!modal) {
                createDocumentModal();
                modal = document.getElementById('documentModal');
            }
            if (modal) {
                showModal();
            } else {
                if (typeof notify !== 'undefined' && notify.error) notify.error('Не удалось открыть форму создания документа.');
                else console.error('Не удалось открыть форму создания документа.');
            }
        }

        function showModal() {
            const form = document.getElementById('documentForm');
            const docIdField = document.getElementById('docId');

            if (form) {
                form.reset();
            }
            if (docIdField) {
                docIdField.value = '';
            }
            const docFileNameHint = document.getElementById('docFileName');
            if (docFileNameHint) docFileNameHint.textContent = '';

            if (typeof modals !== 'undefined' && modals.show) {
                modals.show('documentModal');
                console.log('Модальное окно открыто успешно');
            } else {
                console.error('Модуль modals не доступен. Тип:', typeof modals);
                // Попробуем показать модальное окно напрямую
                const modal = document.getElementById('documentModal');
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    console.log('Модальное окно открыто напрямую');
                } else {
                    if (typeof notify !== 'undefined' && notify.error) notify.error('Модальное окно не найдено');
                    else console.error('Модальное окно не найдено');
                }
            }
        }

        // Кнопка «Создать документ»
        const createBtn = document.querySelector('.btn-create');
        if (createBtn) {
            createBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                openCreateModal();
            });
        } else {
            console.error('Кнопка .btn-create не найдена в DOM');

            // Используем делегирование как запасной вариант (только для не-обычных пользователей)
            auth.getCurrentUser().then(function (user) {
                const isRegularUser = user && user.role === 'Пользователь';

                if (!isRegularUser) {
                    document.body.addEventListener('click', function (e) {
                        if (e.target.classList.contains('btn-create') || e.target.closest('.btn-create')) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Кнопка найдена через делегирование');
                            openCreateModal();
                        }
                    });
                }
            });
        }

        // Сохраняем функции для использования в других местах (только для не-обычных пользователей)
        auth.getCurrentUser().then(function (user) {
            const isRegularUser = user && user.role === 'Пользователь';

            if (!isRegularUser) {
                window.openCreateModal = openCreateModal;
            }
        });

        // Редактирование документа (делегирование событий)
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-edit')) {
                const docId = e.target.getAttribute('data-doc-id');
                editDocument(docId);
            }
        });

        // Скачивание документа (делегирование событий)
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-download')) {
                const docId = e.target.getAttribute('data-doc-id');
                downloadDocument(docId);
            }
        });

        // Отправка на согласование (делегирование событий)
        document.addEventListener('click', function (e) {
            const sendBtn = e.target.closest('.btn-send-approval');
            if (sendBtn) {
                e.preventDefault();
                e.stopPropagation();
                const docId = sendBtn.getAttribute('data-doc-id');
                console.log('Кнопка "Отправить на согласование" нажата, docId:', docId);
                if (docId) {
                    sendForApproval(parseInt(docId));
                }
            }
        });

        // Отправка на повторное согласование (делегирование событий)
        document.addEventListener('click', function (e) {
            const resendBtn = e.target.closest('.btn-resend-approval');
            if (resendBtn) {
                e.preventDefault();
                e.stopPropagation();
                const docId = resendBtn.getAttribute('data-doc-id');
                console.log('Кнопка "Отправить на повторное согласование" нажата, docId:', docId);
                if (docId) {
                    resendForApproval(parseInt(docId));
                }
            }
        });

        // Пагинация (делегирование событий)
        document.addEventListener('click', function (e) {
            const link = e.target.closest('.pagination a[data-page]');
            if (!link) return;
            e.preventDefault();
            if (link.classList.contains('disabled')) return;
            const page = parseInt(link.getAttribute('data-page'), 10);
            if (isNaN(page) || page === currentPage) return;
            currentPage = Math.max(1, page);
            renderDocuments(currentFilters);
        });
    }

    async function saveDocument() {
        console.log('Сохранение документа...');

        const form = document.getElementById('documentForm');
        if (!form) {
            console.error('Форма не найдена');
            notify.error('Форма документа не найдена');
            return;
        }

        const docId = document.getElementById('docId')?.value;
        const fileInput = document.getElementById('docFile');
        const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

        let savedDoc;
        try {
            if (hasFile || !docId) {
                const formData = new FormData(form);
                if (hasFile) formData.set('file', fileInput.files[0]);
                if (docId) {
                    formData.set('name', form.querySelector('[name="name"]').value);
                    formData.set('category', form.querySelector('[name="category"]').value);
                    formData.set('description', form.querySelector('[name="description"]').value);
                }
                if (docId) {
                    savedDoc = await documentsManager.updateDocument(docId, formData);
                } else {
                    savedDoc = await documentsManager.createDocument(formData);
                }
            } else {
                const documentData = {
                    name: form.querySelector('[name="name"]').value,
                    category: form.querySelector('[name="category"]').value,
                    description: form.querySelector('[name="description"]').value
                };
                savedDoc = await documentsManager.updateDocument(docId, documentData);
            }

            console.log('Документ сохранен:', savedDoc);

            if (!savedDoc) {
                notify.error('Документ не был сохранен');
                return;
            }

            // Принудительно обновляем данные из кэша
            if (typeof database !== 'undefined' && database.syncWithLocalStorage) {
                database.syncWithLocalStorage();
            }

            // Небольшая задержка для синхронизации
            await new Promise(resolve => setTimeout(resolve, 100));

            // Закрываем модальное окно
            if (typeof modals !== 'undefined' && modals.hide) {
                modals.hide('documentModal');
            } else {
                const modal = document.getElementById('documentModal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }

            // Обновляем список документов с текущими фильтрами (или без фильтров)
            // Сбрасываем фильтры, чтобы показать все документы, включая новый
            currentFilters = {};
            currentPage = 1;

            // Принудительно обновляем данные из кэша перед обновлением списка
            if (typeof database !== 'undefined' && database.syncWithLocalStorage) {
                database.syncWithLocalStorage();
            }

            // Небольшая задержка для гарантии синхронизации
            await new Promise(resolve => setTimeout(resolve, 200));

            console.log('Обновление списка документов...');

            // Получаем все документы напрямую для проверки
            const allDocs = await documentsManager.getAllDocuments();
            console.log('Все документы после создания:', allDocs);
            console.log('Количество документов:', allDocs.length);

            await renderDocuments(currentFilters);
            applyFilterHighlights();

            // Очищаем поле поиска
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.value = '';
            }

            // Обновляем счетчики
            await updateFilterCounts();

            console.log('Список документов обновлен');

            if (allDocs.length > 0) {
                notify.success(docId ? 'Документ обновлен' : 'Документ успешно создан');
            } else {
                notify.error('Документ создан, но не отображается. Проверьте консоль браузера.');
            }
        } catch (error) {
            console.error('Ошибка при сохранении документа:', error);
            notify.error('Ошибка при сохранении документа: ' + (error.message || error));
        }
    }

    async function editDocument(id) {
        const doc = await documentsManager.getDocumentById(id);
        if (!doc) return;

        if (doc.status === 'review') {
            notify.error('Документ находится на согласовании и недоступен для редактирования');
            return;
        }

        document.getElementById('docId').value = doc.id;
        document.getElementById('docName').value = doc.name;
        document.getElementById('docCategory').value = doc.category;
        document.getElementById('docDescription').value = doc.description || '';
        const fileInput = document.getElementById('docFile');
        if (fileInput) {
            fileInput.value = '';
            const hint = document.getElementById('docFileName');
            if (hint) hint.textContent = doc.fileName ? 'Текущий файл: ' + doc.fileName : '';
        }

        modals.show('documentModal');
    }

    async function downloadDocument(id) {
        const doc = await documentsManager.getDocumentById(id);
        if (!doc) {
            notify.error('Документ не найден');
            return;
        }
        const base = (typeof APP_URL !== 'undefined' ? APP_URL : (window.location && window.location.origin ? window.location.origin : '')).replace(/\/$/, '');
        const url = base + '/api/documents/' + id + '/file';
        try {
            const res = await fetch(url, { credentials: 'same-origin' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                notify.error(err.message || 'Не удалось скачать файл');
                return;
            }
            const blob = await res.blob();
            const name = doc.fileName || res.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] || 'document';
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) {
            notify.error('Ошибка при скачивании: ' + (e.message || e));
        }
    }

    window.deleteDocument = function (id) {
        if (typeof modals !== 'undefined' && modals.confirm) {
            modals.confirm({
                title: 'Удалить документ?',
                text: 'Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.',
                confirmText: 'Удалить',
                cancelText: 'Отмена',
                danger: true,
                onConfirm: async function () {
                    await documentsManager.deleteDocument(id);
                    await renderDocuments(currentFilters);
                    await updateFilterCounts();
                }
            });
        } else {
            if (window.confirm('Вы уверены, что хотите удалить этот документ?')) {
                documentsManager.deleteDocument(id).then(function () {
                    renderDocuments(currentFilters).then(updateFilterCounts);
                });
            }
        }
    };

    // Отправить документ на согласование
    async function sendForApproval(docId) {
        console.log('Отправка документа на согласование:', docId);

        // Проверяем, что approvalsManager доступен
        if (typeof approvalsManager === 'undefined') {
            notify.error('Модуль согласований не загружен');
            return;
        }

        // Получаем список пользователей и отделов для выбора согласующих
        console.log('Получение списка пользователей и отделов...');
        const baseUrl = (typeof APP_URL !== 'undefined' ? APP_URL : (window.location && window.location.origin ? window.location.origin : '')).replace(/\/$/, '');
        let departments = [];
        try {
            const depRes = await api.get(baseUrl + '/api/departments');
            if (depRes.ok) departments = await depRes.json();
        } catch (e) { console.warn('Не удалось загрузить отделы:', e); }
        const users = await auth.getUsers();
        console.log('Пользователи:', users);

        if (!users || users.length === 0) {
            console.error('Не найдены пользователи');
            notify.error('Не найдены пользователи для согласования');
            return;
        }

        await createApprovalModal(docId, users, departments);
    }

    // Отправить отклоненный документ на повторное согласование
    async function resendForApproval(docId) {
        console.log('Отправка отклоненного документа на повторное согласование:', docId);

        // Проверяем статус документа
        const doc = await documentsManager.getDocumentById(docId);
        if (!doc) {
            notify.error('Документ не найден');
            return;
        }

        if (doc.status !== 'rejected') {
            notify.error('Этот документ не был отклонен');
            return;
        }

        function doResend() {
            documentsManager.updateDocument(docId, { status: 'draft' }).then(function () {
                return sendForApproval(docId);
            });
        }

        if (typeof modals !== 'undefined' && modals.confirm) {
            modals.confirm({
                title: 'Повторное согласование',
                text: 'Вы уверены, что хотите отправить этот документ на повторное согласование? Документ будет изменен со статуса «Отклонен» на «Черновик».',
                confirmText: 'Отправить',
                cancelText: 'Отмена',
                danger: false,
                onConfirm: doResend
            });
        } else {
            if (window.confirm('Вы уверены, что хотите отправить этот документ на повторное согласование? Документ будет изменен со статуса "Отклонен" на "Черновик".')) {
                doResend();
            }
        }
    }

    // Константы пагинации выбора согласующих
    const APPROVERS_PAGE_SIZE = 10;

    // Создать модальное окно для выбора согласующих (поиск, фильтр по отделам, пагинация)
    async function createApprovalModal(docId, users, departments) {
        const existingModal = document.getElementById('approvalModal');
        if (existingModal) existingModal.remove();

        const currentUser = await auth.getCurrentUser();
        const isRegularUser = currentUser && currentUser.role === 'Пользователь';
        if (isRegularUser) {
            notify.error('Обычные пользователи не могут отправлять документы на согласование');
            return;
        }

        let approvers = users.filter(u =>
            u.user_id !== currentUser.user_id && u.role !== 'Пользователь'
        );
        const hasOtherApprovers = approvers.length > 0;
        if (!hasOtherApprovers) approvers = [currentUser];

        // Состояние выбора (сохраняем между перерисовками пагинации)
        const selectedApproverIds = new Set();
        const selectedApproverNames = {};
        if (!hasOtherApprovers && currentUser) {
            selectedApproverIds.add(currentUser.user_id);
            selectedApproverNames[currentUser.user_id] = currentUser.fullName || currentUser.name;
        }

        const departmentList = Array.isArray(departments) ? departments : [];
        const deptIdField = (d) => d.department_id ?? d.id;
        const today = new Date();
        const defaultDeadline = new Date();
        defaultDeadline.setDate(today.getDate() + 5);
        const minDate = today.toISOString().split('T')[0];
        const defaultDate = defaultDeadline.toISOString().split('T')[0];

        function esc(s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        }
        const departmentOptions = departmentList.map(d =>
            '<option value="' + deptIdField(d) + '">' + esc(d.name || '') + '</option>'
        ).join('');

        const modalContent = `
            <form id="approvalForm">
                <div class="form-group approvers-filter-group">
                    <label class="form-label">Выберите согласующих:</label>
                    <div class="approvers-toolbar">
                        <input type="text" id="approvalUserSearch" class="form-control approvers-search" placeholder="Поиск по имени, email, отделу..." autocomplete="off">
                        <select id="approvalDepartmentFilter" class="form-control approvers-department-filter">
                            <option value="">Все отделы</option>
                            ${departmentOptions}
                        </select>
                    </div>
                    <div id="approversSelectedCount" class="approvers-selected-count"></div>
                    <div id="approversList" class="approvers-list"></div>
                    <div id="approversPagination" class="approvers-pagination"></div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="approvalDeadline">Срок согласования (дедлайн):</label>
                    <input type="date" class="form-control" id="approvalDeadline" name="deadline" min="${minDate}" value="${defaultDate}" required>
                    <small class="form-hint">Выберите дату, до которой должно быть завершено согласование</small>
                </div>
                <div class="form-group">
                    <label class="form-label" for="approvalComment">Комментарий (необязательно):</label>
                    <textarea class="form-control" id="approvalComment" name="comment" rows="3" placeholder="Добавьте комментарий к отправке на согласование"></textarea>
                </div>
                <input type="hidden" id="approvalDocId" value="${docId}">
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelApprovalBtn">Отмена</button>
                    <button type="button" class="btn btn-primary" id="submitApprovalBtn">Отправить на согласование</button>
                </div>
            </form>
        `;

        window.__approvalSelectedIds = selectedApproverIds;
        window.__approvalSelectedNames = selectedApproverNames;
        window.__approvalCurrentPage = 1;

        function renderApproversList() {
            const searchEl = document.getElementById('approvalUserSearch');
            const deptEl = document.getElementById('approvalDepartmentFilter');
            const search = (searchEl && searchEl.value.trim() || '').toLowerCase();
            const deptId = (deptEl && deptEl.value) || '';

            const filtered = approvers.filter(u => {
                const matchSearch = !search || [u.fullName, u.name, u.email, u.position, u.department].some(v => String(v || '').toLowerCase().includes(search));
                const matchDept = !deptId || String(u.department_id) === String(deptId);
                return matchSearch && matchDept;
            });

            const totalPages = Math.max(1, Math.ceil(filtered.length / APPROVERS_PAGE_SIZE));
            let page = window.__approvalCurrentPage || 1;
            if (page > totalPages) page = totalPages;
            window.__approvalCurrentPage = page;
            const start = (page - 1) * APPROVERS_PAGE_SIZE;
            const pageUsers = filtered.slice(start, start + APPROVERS_PAGE_SIZE);

            const listEl = document.getElementById('approversList');
            const paginationEl = document.getElementById('approversPagination');
            const countEl = document.getElementById('approversSelectedCount');
            if (!listEl) return;

            listEl.innerHTML = pageUsers.length === 0
                ? '<p class="approvers-empty">Нет пользователей по заданным критериям</p>'
                : pageUsers.map(user => {
                    const subtitle = user.user_id === currentUser.user_id ? (hasOtherApprovers ? (user.position || user.role) : 'Вы (инициатор)') : (user.position || user.role);
                    const deptText = user.department ? ' • ' + (user.department) : '';
                    const name = user.fullName || user.name || '';
                    const checked = selectedApproverIds.has(user.user_id) ? ' checked' : '';
                    return '<div class="approver-item">' +
                        '<label class="approver-item-label">' +
                        '<input type="checkbox" class="approver-checkbox" value="' + user.user_id + '" data-user-name="' + (name.replace(/"/g, '&quot;')) + '"' + checked + '>' +
                        '<span>' + (name.replace(/</g, '&lt;')) + ' (' + (String(subtitle || 'Сотрудник').replace(/</g, '&lt;') + (deptText.replace(/</g, '&lt;')) + ')</span>' +
                            '</label></div>')
                }).join('');

            if (paginationEl) {
                if (totalPages <= 1) paginationEl.innerHTML = '';
                else {
                    let html = '';
                    if (page > 1) html += '<button type="button" class="btn btn-secondary btn-sm approvers-page-btn" data-page="' + (page - 1) + '">← Назад</button>';
                    html += ' <span class="approvers-page-info">Стр. ' + page + ' из ' + totalPages + '</span> ';
                    if (page < totalPages) html += '<button type="button" class="btn btn-secondary btn-sm approvers-page-btn" data-page="' + (page + 1) + '">Вперёд →</button>';
                    paginationEl.innerHTML = html;
                }
            }
            if (countEl) countEl.textContent = 'Выбрано: ' + selectedApproverIds.size;
        }

        if (typeof modals !== 'undefined' && modals.create) {
            try {
                modals.create('approvalModal', 'Отправить на согласование', modalContent);
                console.log('Модальное окно согласования создано');
                modals.show('approvalModal');

                setTimeout(() => {
                    console.log('Настройка обработчиков для модального окна согласования...');

                    const modalElement = document.getElementById('approvalModal');
                    const form = document.getElementById('approvalForm');
                    const submitBtn = document.getElementById('submitApprovalBtn');
                    const cancelBtn = document.getElementById('cancelApprovalBtn');
                    const docIdField = document.getElementById('approvalDocId');

                    renderApproversList();

                    const searchInput = document.getElementById('approvalUserSearch');
                    const deptFilter = document.getElementById('approvalDepartmentFilter');
                    if (searchInput) searchInput.addEventListener('input', function () { window.__approvalCurrentPage = 1; renderApproversList(); });
                    if (deptFilter) deptFilter.addEventListener('change', function () { window.__approvalCurrentPage = 1; renderApproversList(); });

                    modalElement.addEventListener('click', function (e) {
                        const pageBtn = e.target.closest('.approvers-page-btn');
                        if (pageBtn) {
                            e.preventDefault();
                            const p = parseInt(pageBtn.getAttribute('data-page'), 10);
                            if (!isNaN(p)) { window.__approvalCurrentPage = p; renderApproversList(); }
                        }
                    });

                    modalElement.addEventListener('change', function (e) {
                        if (!e.target.classList.contains('approver-checkbox')) return;
                        const id = parseInt(e.target.value, 10);
                        const name = e.target.getAttribute('data-user-name') || '';
                        if (e.target.checked) {
                            selectedApproverIds.add(id);
                            selectedApproverNames[id] = name;
                        } else {
                            selectedApproverIds.delete(id);
                            delete selectedApproverNames[id];
                        }
                        const countEl = document.getElementById('approversSelectedCount');
                        if (countEl) countEl.textContent = 'Выбрано: ' + selectedApproverIds.size;
                    });

                    console.log('Элементы найдены:', {
                        modal: !!modalElement,
                        form: !!form,
                        submitBtn: !!submitBtn,
                        cancelBtn: !!cancelBtn,
                        docIdField: !!docIdField
                    });

                    if (!modalElement) {
                        console.error('Модальное окно approvalModal не найдено');
                        return;
                    }

                    if (!form) {
                        console.error('Форма approvalForm не найдена');
                        return;
                    }

                    // Обработчик на форму (submit) - предотвращаем стандартную отправку
                    form.addEventListener('submit', async function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('=== ФОРМА ОТПРАВЛЕНА (submit event) ===');

                        const currentDocIdField = document.getElementById('approvalDocId');
                        const currentDocId = currentDocIdField ? parseInt(currentDocIdField.value) : parseInt(docId);

                        if (!currentDocId || isNaN(currentDocId)) {
                            notify.error('Не указан документ');
                            return false;
                        }

                        try {
                            await submitApprovalInternal(currentDocId);
                        } catch (error) {
                            console.error('Ошибка в submitApprovalInternal (form submit):', error);
                            notify.error('Ошибка при отправке на согласование: ' + (error.message || error));
                        }

                        return false;
                    });

                    // Обработчик на кнопку отправки (click)
                    if (submitBtn) {
                        // Удаляем все предыдущие обработчики, клонируя элемент
                        const newSubmitBtn = submitBtn.cloneNode(true);
                        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

                        // Устанавливаем обработчик клика
                        newSubmitBtn.addEventListener('click', async function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();

                            console.log('=== КНОПКА ОТПРАВКИ НАЖАТА ===');

                            const currentDocIdField = document.getElementById('approvalDocId');
                            const currentDocId = currentDocIdField ? parseInt(currentDocIdField.value) : parseInt(docId);
                            console.log('ID документа для отправки:', currentDocId);

                            if (!currentDocId || isNaN(currentDocId)) {
                                notify.error('Не указан документ');
                                return false;
                            }

                            try {
                                await submitApprovalInternal(currentDocId);
                            } catch (error) {
                                console.error('Ошибка в submitApprovalInternal:', error);
                                notify.error('Ошибка при отправке на согласование: ' + (error.message || error));
                            }

                            return false;
                        });

                        // Также добавляем onclick как резервный вариант
                        newSubmitBtn.onclick = async function (e) {
                            if (e) {
                                e.preventDefault();
                                e.stopPropagation();
                            }

                            console.log('=== ONCLICK ОБРАБОТЧИК СРАБОТАЛ ===');

                            const currentDocIdField = document.getElementById('approvalDocId');
                            const currentDocId = currentDocIdField ? parseInt(currentDocIdField.value) : parseInt(docId);

                            if (!currentDocId || isNaN(currentDocId)) {
                                notify.error('Не указан документ');
                                return false;
                            }

                            try {
                                await submitApprovalInternal(currentDocId);
                            } catch (error) {
                                console.error('Ошибка в submitApprovalInternal (onclick):', error);
                                notify.error('Ошибка при отправке на согласование: ' + (error.message || error));
                            }

                            return false;
                        };

                        console.log('Обработчик на кнопку отправки установлен');
                    } else {
                        console.error('Кнопка submitApprovalBtn не найдена!');
                    }

                    // Обработчик на кнопку отмены
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Отмена отправки на согласование');
                            if (typeof modals !== 'undefined' && modals.hide) {
                                modals.hide('approvalModal');
                            } else {
                                const modal = document.getElementById('approvalModal');
                                if (modal) {
                                    modal.classList.remove('active');
                                    document.body.style.overflow = '';
                                }
                            }
                            return false;
                        });
                        console.log('Обработчик на кнопку отмены установлен');
                    }

                    // Делегирование на уровне модального окна (резервный вариант)
                    modalElement.addEventListener('click', async function (e) {
                        // Проверяем, что клик был по кнопке отправки или её дочерним элементам
                        const submitBtn = e.target.closest('#submitApprovalBtn');
                        if (submitBtn) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('=== КЛИК ПО КНОПКЕ ОТПРАВКИ ЧЕРЕЗ ДЕЛЕГИРОВАНИЕ ===');

                            const currentDocIdField = document.getElementById('approvalDocId');
                            const currentDocId = currentDocIdField ? parseInt(currentDocIdField.value) : parseInt(docId);

                            if (!currentDocId || isNaN(currentDocId)) {
                                notify.error('Не указан документ');
                                return;
                            }

                            try {
                                await submitApprovalInternal(currentDocId);
                            } catch (error) {
                                console.error('Ошибка в submitApprovalInternal (делегирование):', error);
                                notify.error('Ошибка при отправке на согласование: ' + (error.message || error));
                            }
                            return;
                        }

                        // Проверяем, что клик был по кнопке отмены
                        const cancelBtn = e.target.closest('#cancelApprovalBtn');
                        if (cancelBtn) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Отмена отправки на согласование (делегирование)');
                            if (typeof modals !== 'undefined' && modals.hide) {
                                modals.hide('approvalModal');
                            } else {
                                const modal = document.getElementById('approvalModal');
                                if (modal) {
                                    modal.classList.remove('active');
                                    document.body.style.overflow = '';
                                }
                            }
                            return;
                        }
                    });

                    console.log('Все обработчики успешно установлены');
                }, 300);
            } catch (error) {
                console.error('Ошибка при создании модального окна согласования:', error);
            }
        } else {
            console.error('Модуль modals не загружен');
        }
    }

    // Делаем функцию доступной глобально для тестирования
    window.submitApproval = async function (docId) {
        return await submitApprovalInternal(docId);
    };

    // Отправить на согласование
    async function submitApproval(docId) {
        return await submitApprovalInternal(docId);
    }

    async function submitApprovalInternal(docId) {
        console.log('=== НАЧАЛО ОТПРАВКИ НА СОГЛАСОВАНИЕ ===');
        console.log('ID документа:', docId);
        console.log('Тип ID:', typeof docId);

        try {
            // Проверяем доступность модулей ПЕРЕД всем остальным
            if (typeof approvalsManager === 'undefined') {
                console.error('Модуль approvalsManager не загружен');
                throw new Error('Модуль approvalsManager не загружен');
            }
            console.log('✓ approvalsManager доступен');

            if (typeof documentsManager === 'undefined') {
                console.error('Модуль documentsManager не загружен');
                throw new Error('Модуль documentsManager не загружен');
            }
            console.log('✓ documentsManager доступен');

            if (typeof database === 'undefined') {
                console.error('Модуль database не загружен');
                throw new Error('Модуль database не загружен');
            }
            console.log('✓ database доступен');

            // Получаем выбранных согласующих из состояния модального окна (поддержка поиска/пагинации)
            const selectedIds = window.__approvalSelectedIds;
            const selectedNames = window.__approvalSelectedNames || {};
            if (!selectedIds || selectedIds.size === 0) {
                notify.error('Выберите хотя бы одного согласующего');
                return;
            }
            const steps = Array.from(selectedIds).map(approverId => ({
                approverId: approverId,
                approverName: selectedNames[approverId] || ''
            }));
            console.log('Выбранные согласующие:', steps.length, steps);

            console.log('Шаги согласования:', JSON.stringify(steps, null, 2));

            // Получаем дату дедлайна
            const deadlineInput = document.getElementById('approvalDeadline');
            let deadlineDate = null;
            if (deadlineInput && deadlineInput.value) {
                deadlineDate = new Date(deadlineInput.value);
                deadlineDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
                console.log('Выбранная дата дедлайна:', deadlineDate.toISOString());
            } else {
                // По умолчанию 5 дней от текущей даты
                deadlineDate = new Date();
                deadlineDate.setDate(deadlineDate.getDate() + 5);
                console.log('Используется дедлайн по умолчанию (5 дней):', deadlineDate.toISOString());
            }

            const comment = document.getElementById('approvalComment')?.value || '';
            console.log('Комментарий:', comment);

            // Преобразуем docId в число, если нужно
            const numericDocId = typeof docId === 'string' ? parseInt(docId) : docId;
            console.log('Числовой ID документа:', numericDocId);

            // Проверяем, что документ существует
            console.log('Получение документа из БД...');
            const doc = await documentsManager.getDocumentById(numericDocId);
            console.log('Документ получен:', doc);

            if (!doc) {
                console.error('Документ не найден с ID:', numericDocId);
                throw new Error('Документ не найден');
            }

            console.log('Документ найден:', doc.name, 'Статус:', doc.status);

            // Создаем процесс согласования
            console.log('Вызов approvalsManager.createApproval...');
            console.log('Параметры:', {
                documentId: numericDocId,
                steps: steps,
                deadline: deadlineDate.toISOString()
            });

            const approval = await approvalsManager.createApproval(numericDocId, steps, deadlineDate, comment);

            console.log('Результат createApproval:', approval);

            if (approval) {
                console.log('✓✓✓ ПРОЦЕСС СОГЛАСОВАНИЯ УСПЕШНО СОЗДАН ✓✓✓');
                console.log('Детали:', JSON.stringify(approval, null, 2));

                // Закрываем модальное окно
                console.log('Закрытие модального окна...');
                if (typeof modals !== 'undefined' && modals.hide) {
                    modals.hide('approvalModal');
                } else {
                    const modal = document.getElementById('approvalModal');
                    if (modal) {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }

                // Небольшая задержка для синхронизации
                console.log('Ожидание синхронизации данных...');
                await new Promise(resolve => setTimeout(resolve, 300));

                // Обновляем список документов
                console.log('Обновление списка документов...');
                await renderDocuments(currentFilters);
                await updateFilterCounts();

                console.log('=== УСПЕШНОЕ ЗАВЕРШЕНИЕ ===');
                notify.success('Документ успешно отправлен на согласование');

                // Перенаправляем на страницу согласований через небольшую задержку
                setTimeout(() => {
                    window.location.href = (typeof APP_URL !== 'undefined' ? APP_URL : '') + '/approvals';
                }, 1000);
            } else {
                console.error('✗✗✗ createApproval вернула null ✗✗✗');
                console.error('Это означает, что процесс согласования не был создан');
                notify.error('Не удалось создать процесс согласования. Проверьте консоль.');
            }
        } catch (error) {
            console.error('✗✗✗ КРИТИЧЕСКАЯ ОШИБКА ✗✗✗');
            console.error('Ошибка:', error);
            console.error('Тип ошибки:', error.constructor.name);
            console.error('Сообщение:', error.message);
            console.error('Стек ошибки:', error.stack);
            notify.error('Ошибка при отправке на согласование: ' + (error.message || error));
        }
    }

    function setupSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchButton = document.querySelector('.search-button');

        if (searchInput && searchButton) {
            const performSearch = async () => {
                const query = searchInput.value.trim();
                if (query) {
                    currentFilters.search = query;
                } else {
                    delete currentFilters.search;
                }
                currentPage = 1;
                await renderDocuments(currentFilters);
            };

            searchButton.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }

    function setupFilters() {
        const filterLinks = document.querySelectorAll('.filter-options a[data-filter-type]');
        filterLinks.forEach(link => {
            link.addEventListener('click', async function (e) {
                e.preventDefault();
                const type = this.dataset.filterType;
                const value = this.dataset.filterValue;

                if (value === 'all') {
                    delete currentFilters[type];
                } else {
                    currentFilters[type] = value;
                }

                setFilterActive(type, value);
                currentPage = 1;
                await renderDocuments(currentFilters);
            });
        });
    }

    function setupDateFilter() {
        const startInput = document.getElementById('docFilterStartDate');
        const endInput = document.getElementById('docFilterEndDate');
        const applyBtn = document.getElementById('docFilterDateApply');
        const clearBtn = document.getElementById('docFilterDateClear');
        if (!startInput || !endInput || !applyBtn || !clearBtn) return;

        applyBtn.addEventListener('click', async function () {
            const startVal = startInput.value.trim();
            const endVal = endInput.value.trim();
            if (startVal && endVal) {
                if (new Date(startVal) > new Date(endVal)) {
                    if (typeof notify !== 'undefined') notify.error('Дата «С» не может быть позже даты «По».');
                    return;
                }
            }
            if (startVal) currentFilters.startDate = startVal;
            else delete currentFilters.startDate;
            if (endVal) currentFilters.endDate = endVal;
            else delete currentFilters.endDate;
            currentPage = 1;
            await renderDocuments(currentFilters);
        });

        clearBtn.addEventListener('click', async function () {
            startInput.value = '';
            endInput.value = '';
            delete currentFilters.startDate;
            delete currentFilters.endDate;
            currentPage = 1;
            await renderDocuments(currentFilters);
        });
    }

    function syncDateFilterInputs() {
        const startInput = document.getElementById('docFilterStartDate');
        const endInput = document.getElementById('docFilterEndDate');
        if (!startInput || !endInput) return;
        if (currentFilters.startDate) {
            const d = typeof currentFilters.startDate === 'string' ? currentFilters.startDate : currentFilters.startDate.toISOString().split('T')[0];
            startInput.value = d;
        } else startInput.value = '';
        if (currentFilters.endDate) {
            const d = typeof currentFilters.endDate === 'string' ? currentFilters.endDate : currentFilters.endDate.toISOString().split('T')[0];
            endInput.value = d;
        } else endInput.value = '';
    }

    function applyFilterHighlights() {
        const statusValue = currentFilters.status || 'all';
        const categoryValue = currentFilters.category || 'all';
        setFilterActive('status', statusValue);
        setFilterActive('category', categoryValue);
    }

    function setFilterActive(type, value) {
        const links = document.querySelectorAll(`.filter-options a[data-filter-type="${type}"]`);
        links.forEach(link => {
            if (value === 'all') {
                link.classList.toggle('active', link.dataset.filterValue === 'all');
            } else {
                link.classList.toggle('active', link.dataset.filterValue === value);
            }
        });
    }

    function consumeStoredFilter() {
        const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
        if (!raw) return null;
        sessionStorage.removeItem(FILTER_STORAGE_KEY);
        try {
            return JSON.parse(raw);
        } catch (error) {
            console.error('Ошибка чтения сохраненного фильтра:', error);
            return null;
        }
    }

    function applyExternalFilter(filterData) {
        if (!filterData || !filterData.type) return;
        if (filterData.value === 'all') {
            delete currentFilters[filterData.type];
        } else {
            currentFilters[filterData.type] = filterData.value;
        }
    }

    async function updateFilterCounts() {
        const stats = await documentsManager.getDocumentStats();
        const statusCounts = Object.assign({}, stats.byStatus, { all: stats.total });
        const categoryCounts = Object.assign({}, stats.byCategory, { category_all: stats.total });

        document.querySelectorAll('.filter-count').forEach(countEl => {
            const key = countEl.dataset.filterKey;
            if (key in statusCounts) {
                countEl.textContent = statusCounts[key];
            } else if (key in categoryCounts) {
                countEl.textContent = categoryCounts[key];
            }
        });
    }

    function updateDocumentActionLayout() {
        const shouldStack = window.innerWidth <= ACTIONS_BREAKPOINT;
        document.querySelectorAll('.document-actions').forEach(actions => {
            actions.classList.toggle('stacked', shouldStack);
        });
    }
});

