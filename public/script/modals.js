// Система модальных окон

const modals = {
    // Создать модальное окно
    create: function (id, title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" data-modal="${id}">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.init();
    },

    // Показать модальное окно
    show: function (id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    // Скрыть модальное окно
    hide: function (id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Модальное окно подтверждения (замена confirm/alert).
     * @param {Object} opts - { title, text, confirmText, cancelText, danger, onConfirm }
     * @param {string} opts.title - Заголовок
     * @param {string} opts.text - Текст сообщения
     * @param {string} [opts.confirmText='Подтвердить'] - Текст кнопки подтверждения
     * @param {string} [opts.cancelText='Отмена'] - Текст кнопки отмены
     * @param {boolean} [opts.danger=false] - true — красная кнопка подтверждения
     * @param {function} opts.onConfirm - Вызов при нажатии «Подтвердить»
     */
    confirm: function (opts) {
        const title = opts.title || 'Подтверждение';
        const text = opts.text || '';
        const confirmText = opts.confirmText || 'Подтвердить';
        const cancelText = opts.cancelText || 'Отмена';
        const danger = opts.danger === true;
        const onConfirm = typeof opts.onConfirm === 'function' ? opts.onConfirm : function () {};

        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'confirm-modal-title');
        modal.innerHTML = `
            <div class="confirm-modal__content">
                <div class="confirm-modal__title" id="confirm-modal-title">${title}</div>
                ${text ? `<div class="confirm-modal__text">${text}</div>` : ''}
                <div class="confirm-modal__actions">
                    <button type="button" class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                    <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${confirmText}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        function close() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            modal.remove();
        }

        modal.addEventListener('click', function (e) {
            if (e.target === modal || e.target.dataset.action === 'cancel') {
                close();
            }
        });
        const confirmBtn = modal.querySelector('[data-action="confirm"]');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function () {
                close();
                onConfirm();
            });
        }
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escHandler);
            }
        });
    },

    // Инициализация обработчиков
    init: function () {
        // Закрытие по клику на overlay (только для новых модальных окон)
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            // Проверяем, не установлен ли уже обработчик
            if (!overlay.hasAttribute('data-listener-attached')) {
                overlay.setAttribute('data-listener-attached', 'true');
                overlay.addEventListener('click', function () {
                    const modal = this.closest('.modal');
                    if (modal) {
                        modals.hide(modal.id);
                    }
                });
            }
        });

        // Закрытие по кнопке (только для новых кнопок)
        document.querySelectorAll('.modal-close').forEach(btn => {
            if (!btn.hasAttribute('data-listener-attached')) {
                btn.setAttribute('data-listener-attached', 'true');
                btn.addEventListener('click', function () {
                    const modalId = this.getAttribute('data-modal');
                    modals.hide(modalId);
                });
            }
        });

        // Закрытие по Escape (устанавливаем один раз через window)
        if (!window._escapeListenerAttached) {
            window._escapeListenerAttached = true;
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    document.querySelectorAll('.modal.active').forEach(modal => {
                        modals.hide(modal.id);
                    });
                }
            });
        }
    }
};

// Стили модальных окон заданы в styles.css (поддержка светлой и тёмной темы)

