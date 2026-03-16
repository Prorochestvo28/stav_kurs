// Система управления согласованиями через Laravel API
function _approvalsBaseUrl() {
    var u = (typeof APP_URL !== 'undefined' ? APP_URL : (typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : ''));
    return String(u).replace(/\/$/, '');
}

const approvalsManager = {
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

    async getAllApprovals() {
        await this.init();
        try {
            const res = await api.get(_approvalsBaseUrl() + '/api/approvals');
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    _mapApprovalFromDB(p) {
        if (!p) return null;
        return p;
    },

    _mapProcessStatus(s) {
        return { in_progress: 'in_progress', completed: 'completed', rejected: 'rejected', cancelled: 'cancelled' }[s] || s;
    },

    _mapStepStatus(status, decision) {
        if (status === 'completed') return decision === 'approve' ? 'approved' : 'rejected';
        if (status === 'pending') return 'pending';
        return 'waiting';
    },

    saveApprovals() {
        console.warn('saveApprovals устарел');
    },

    async getApprovalById(id) {
        await this.init();
        try {
            const res = await api.get(_approvalsBaseUrl() + '/api/approvals/' + id);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async getApprovalsByDocumentId(documentId) {
        const all = await this.getAllApprovals();
        return all.filter(p => String(p.documentId) === String(documentId));
    },

    async getMyApprovals() {
        await this.init();
        try {
            const res = await api.get(_approvalsBaseUrl() + '/api/approvals/my');
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    async createApproval(documentId, steps, deadlineDate = null, comment = '') {
        await this.init();
        const user = await auth.getCurrentUser();
        if (!user) return null;
        const document = await documentsManager.getDocumentById(documentId);
        if (!document) return null;
        if (!steps || steps.length === 0) return null;
        const deadline = deadlineDate && deadlineDate instanceof Date
            ? deadlineDate
            : (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d; })();
        try {
            const body = {
                document_id: document.id || document.document_id,
                steps: steps.map(s => ({ approverId: s.approverId })),
                deadline: deadline.toISOString(),
            };
            if (comment != null && String(comment).trim() !== '') {
                body.comment = String(comment).trim();
            }
            const res = await api.post(_approvalsBaseUrl() + '/api/approvals', body);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async approveStep(approvalId, stepId, comment) {
        await this.init();
        try {
            const res = await api.post(
                _approvalsBaseUrl() + '/api/approvals/' + approvalId + '/steps/' + stepId + '/approve',
                { comment: comment || '' }
            );
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    async rejectStep(approvalId, stepId, comment) {
        await this.init();
        try {
            const res = await api.post(
                _approvalsBaseUrl() + '/api/approvals/' + approvalId + '/steps/' + stepId + '/reject',
                { comment: comment || 'Отклонено' }
            );
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    calculateDeadline(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
    },

    checkOverdue(approval) {
        if (!approval.deadline) return false;
        return new Date() > new Date(approval.deadline) && approval.status === 'in_progress';
    },

    formatDate(dateString) {
        if (!dateString) return '';
        if (typeof formatDateBySettings === 'function') return formatDateBySettings(dateString);
        const date = new Date(dateString);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('ru-RU');
    },
};
