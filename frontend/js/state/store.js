// Global State Store for Vanilla JS

const initialState = {
    user: null,
    users: [], // Tenant directory
    records: [], // Maintenance records
    house: null,
    invoices: [],
    notificationLogs: [],
    auditLogs: [],
    isLoggedIn: false,
    theme: localStorage.getItem('madura_theme') || 'light'
};

class Store {
    constructor(state) {
        this.state = { ...state };
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }

    addNotification(notification) {
        const item = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        const updated = [item, ...(this.state.notifications || this.state.notificationLogs || [])];
        this.setState({ notifications: updated, notificationLogs: updated });
        return item;
    }

    addAuditLog(log) {
        const item = {
            id: 'audit_' + Date.now(),
            created_at: new Date().toISOString(),
            ...log
        };
        const updated = [item, ...(this.state.auditLogs || [])];
        this.setState({ auditLogs: updated });
        return item;
    }

    setTheme(theme) {
        const isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
        localStorage.setItem('madura_theme', theme);
        this.setState({ theme });
    }
}

const store = new Store(initialState);
window.appStore = store;
