// Система управления документами через Laravel API
const baseUrl = (function () {
    var u = (typeof window !== 'undefined' && (window.APP_URL || window.location.origin || ''));
    return String(u).replace(/\/$/, '');
})();

const documentsManager = {
    async init() {
        if (typeof database === 'undefined') {
            await new Promise(resolve => {
                const check = setInterval(() => {
                    if (typeof database !== 'undefined') {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });
        }
        await database.init();
    },

    async getAllDocuments() {
        await this.init();
        try {
            const res = await api.get(baseUrl + '/api/documents');
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    _mapDocumentFromDB(dbDoc) {
        if (!dbDoc) return null;
        return {
            id: dbDoc.id ?? dbDoc.document_id,
            document_id: dbDoc.id ?? dbDoc.document_id,
            name: dbDoc.name || 'Без названия',
            author: dbDoc.author || 'Неизвестно',
            authorId: dbDoc.authorId ?? dbDoc.author_id,
            status: dbDoc.status || 'draft',
            category: dbDoc.category || 'Без категории',
            category_id: dbDoc.category_id,
            type_id: dbDoc.type_id,
            type: dbDoc.type || '',
            createdAt: dbDoc.createdAt ?? dbDoc.created_at,
            updatedAt: dbDoc.updatedAt ?? dbDoc.updated_at,
            description: dbDoc.description || '',
            fileUrl: dbDoc.fileUrl || '',
            fileName: dbDoc.fileName || dbDoc.file_name || '',
            fileSize: dbDoc.fileSize ?? dbDoc.file_size ?? 0,
            version: dbDoc.version ?? 1,
        };
    },

    saveDocuments() {
        console.warn('saveDocuments устарел');
    },

    async getDocumentById(id) {
        await this.init();
        try {
            const res = await api.get(baseUrl + '/api/documents/' + id);
            if (!res.ok) return null;
            const data = await res.json();
            return this._mapDocumentFromDB(data);
        } catch (e) {
            return null;
        }
    },

    async createDocument(documentData) {
        await this.init();
        const user = await auth.getCurrentUser();
        if (!user) return null;
        try {
            const body = documentData instanceof FormData
                ? documentData
                : {
                    name: documentData.name,
                    category: documentData.category || null,
                    description: documentData.description || 'Первоначальная версия',
                    fileUrl: documentData.fileUrl || null,
                };
            const res = await api.post(baseUrl + '/api/documents', body);
            if (!res.ok) return null;
            const data = await res.json();
            return this._mapDocumentFromDB(data);
        } catch (e) {
            return null;
        }
    },

    async updateDocument(id, documentData) {
        await this.init();
        try {
            if (documentData instanceof FormData) {
                const res = await api.post(baseUrl + '/api/documents/' + id + '/update', documentData);
                if (!res.ok) return null;
                const data = await res.json();
                return this._mapDocumentFromDB(data);
            }
            const body = {
                name: documentData.name,
                category: documentData.category,
                status: documentData.status,
                description: documentData.description,
                fileUrl: documentData.fileUrl,
            };
            const res = await api.put(baseUrl + '/api/documents/' + id, body);
            if (!res.ok) return null;
            const data = await res.json();
            return this._mapDocumentFromDB(data);
        } catch (e) {
            return null;
        }
    },

    async deleteDocument(id) {
        await this.init();
        try {
            const res = await api.delete(baseUrl + '/api/documents/' + id);
            return res.status === 204;
        } catch (e) {
            return false;
        }
    },

    async getDocumentVersions(docId) {
        await this.init();
        try {
            const res = await api.get(baseUrl + '/api/documents/' + docId + '/versions');
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    async filterDocuments(filters) {
        await this.init();
        const params = new URLSearchParams();
        if (filters.status && filters.status !== 'all') params.set('status', filters.status);
        if (filters.category && filters.category !== 'all') params.set('category', filters.category);
        if (filters.search) params.set('search', filters.search);
        if (filters.startDate) {
            const d = filters.startDate instanceof Date ? filters.startDate : new Date(filters.startDate);
            if (!Number.isNaN(d.getTime())) params.set('startDate', d.toISOString().split('T')[0]);
        }
        if (filters.endDate) {
            const d = filters.endDate instanceof Date ? filters.endDate : new Date(filters.endDate);
            if (!Number.isNaN(d.getTime())) params.set('endDate', d.toISOString().split('T')[0]);
        }
        try {
            const url = baseUrl + '/api/documents' + (params.toString() ? '?' + params.toString() : '');
            const res = await api.get(url);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    async getDocumentStats(options = {}) {
        await this.init();
        const params = new URLSearchParams();
        if (options.startDate) {
            const d = options.startDate instanceof Date ? options.startDate : new Date(options.startDate);
            if (!Number.isNaN(d.getTime())) params.set('startDate', d.toISOString().split('T')[0]);
        }
        if (options.endDate) {
            const d = options.endDate instanceof Date ? options.endDate : new Date(options.endDate);
            if (!Number.isNaN(d.getTime())) params.set('endDate', d.toISOString().split('T')[0]);
        }
        try {
            const url = baseUrl + '/api/documents/stats' + (params.toString() ? '?' + params.toString() : '');
            const res = await api.get(url);
            if (!res.ok) return { total: 0, byStatus: {}, byCategory: {} };
            const data = await res.json();
            return {
                total: data.total ?? 0,
                byStatus: data.byStatus ?? { draft: 0, review: 0, approved: 0, rejected: 0 },
                byCategory: data.byCategory ?? {},
            };
        } catch (e) {
            return { total: 0, byStatus: {}, byCategory: {} };
        }
    },

    getStatusText(status) {
        const m = { draft: 'Черновик', review: 'На согласовании', approved: 'Согласован', rejected: 'Отклонен', completed: 'Завершен' };
        return m[status] || status;
    },

    getStatusClass(status) {
        const m = { draft: 'status-draft', review: 'status-review', approved: 'status-approved', rejected: 'status-rejected', completed: 'status-completed' };
        return m[status] || 'status-draft';
    },

    formatDate(dateString) {
        if (!dateString) return '';
        if (typeof formatDateBySettings === 'function') return formatDateBySettings(dateString);
        const date = new Date(dateString);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('ru-RU');
    },
};
