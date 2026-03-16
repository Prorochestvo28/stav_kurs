// Адаптер для работы с Laravel API вместо localStorage
(function (global) {
    const baseUrl = (global.APP_URL || (typeof global.location !== 'undefined' ? global.location.origin : '')).replace(/\/$/, '');
    const loginUrl = global.LOGIN_URL || baseUrl + '/login';

    function getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

    function getHeaders(useJson = true) {
        const headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
        };
        if (useJson) {
            headers['Content-Type'] = 'application/json';
        }
        const token = getCsrfToken();
        if (token) {
            headers['X-CSRF-TOKEN'] = token;
        }
        return headers;
    }

    const api = {
        async get(url) {
            const res = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
                headers: getHeaders(false),
            });
            if (res.status === 401) {
                window.location.href = loginUrl;
                throw new Error('Unauthorized');
            }
            return res;
        },
        async post(url, body) {
            const isFormData = body instanceof FormData;
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: getHeaders(!isFormData),
                body: typeof body === 'object' && body !== null && !isFormData ? JSON.stringify(body) : body,
            });
            if (res.status === 401) {
                window.location.href = loginUrl;
                throw new Error('Unauthorized');
            }
            return res;
        },
        async put(url, body) {
            const isFormData = body instanceof FormData;
            const res = await fetch(url, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: getHeaders(!isFormData),
                body: typeof body === 'object' && body !== null && !isFormData ? JSON.stringify(body) : body,
            });
            if (res.status === 401) {
                window.location.href = loginUrl;
                throw new Error('Unauthorized');
            }
            return res;
        },
        async delete(url) {
            const res = await fetch(url, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: getHeaders(false),
            });
            if (res.status === 401) {
                window.location.href = loginUrl;
                throw new Error('Unauthorized');
            }
            return res;
        },
    };

    // Совместимость с database: асинхронные getTable, find, findAll для данных с API
    const tableEndpoints = {
        users: '/api/users',
        departments: '/api/departments',
        categories: '/api/categories',
        document_types: '/api/document-types',
        documents: '/api/documents',
        approval_processes: '/api/approvals',
    };

    const database = {
        _cache: {},
        async init() {
            return Promise.resolve();
        },
        syncWithLocalStorage() {},
        getTable(tableName) {
            return this._getTable(tableName);
        },
        async _getTable(tableName) {
            const path = tableEndpoints[tableName];
            if (!path) return [];
            try {
                const res = await api.get(baseUrl + path);
                if (!res.ok) return [];
                const data = await res.json();
                if (tableName === 'users') {
                    return data.map(u => ({
                        user_id: u.user_id ?? u.id,
                        full_name: u.fullName ?? u.name,
                        email: u.email,
                        role: u.role,
                        position: u.position,
                        phone: u.phone,
                        department_id: u.department_id,
                        is_active: u.is_active,
                    }));
                }
                if (tableName === 'departments') {
                    return data.map(d => ({ department_id: d.department_id ?? d.id, name: d.name, description: d.description }));
                }
                if (tableName === 'categories') {
                    return data.map(c => ({ category_id: c.category_id ?? c.id, name: c.name, parent_id: c.parent_id, path: c.path }));
                }
                if (tableName === 'document_types') {
                    return data.map(t => ({ type_id: t.type_id ?? t.id, name: t.name, code: t.code, description: t.description }));
                }
                if (tableName === 'documents') return data;
                if (tableName === 'approval_processes') return data;
                return Array.isArray(data) ? data : [];
            } catch (e) {
                return [];
            }
        },
        find(tableName, predicate) {
            return this.getTable(tableName).then(arr => arr.find(predicate));
        },
        findAll(tableName, predicate) {
            return this.getTable(tableName).then(arr => predicate ? arr.filter(predicate) : arr);
        },
    };

    // auth.getCurrentUser через API
    let currentUserCache = null;
    const auth = {
        async getCurrentUser() {
            if (currentUserCache) return currentUserCache;
            try {
                const res = await api.get(baseUrl + '/api/user');
                if (!res.ok) return null;
                const user = await res.json();
                currentUserCache = {
                    id: user.id,
                    user_id: user.user_id ?? user.id,
                    email: user.email,
                    fullName: user.fullName ?? user.name,
                    name: user.fullName ?? user.name,
                    role: user.role,
                    position: user.position ?? '',
                    phone: user.phone ?? '',
                    department: user.department ?? '',
                    department_id: user.department_id,
                    is_active: user.is_active,
                };
                return currentUserCache;
            } catch (e) {
                return null;
            }
        },
        setCurrentUser(user) {
            currentUserCache = user;
        },
        clearCurrentUser() {
            currentUserCache = null;
        },
        getInitials(fullName) {
            if (!fullName) return '??';
            const parts = String(fullName).trim().split(/\s+/);
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return '??';
        },
        async getUsers() {
            try {
                const res = await api.get(baseUrl + '/api/users');
                if (!res.ok) return [];
                return await res.json();
            } catch (e) {
                return [];
            }
        },
    };

    global.api = api;
    global.database = database;
    global.auth = auth;
})(typeof window !== 'undefined' ? window : this);
