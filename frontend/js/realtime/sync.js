// Realtime Sync Service

class RealtimeSyncService {
    constructor() {
        this.channel = null;
    }

    getSb() {
        return window.supabase || window.appSupabase;
    }

    init() {
        const sb = this.getSb();
        if (!sb || typeof sb.channel !== 'function') {
            console.warn('Supabase client not initialized for Realtime');
            return;
        }

        console.log('Initializing realtime subscriptions...');
        this.channel = sb.channel('realtime:madura_house_platform_sync');

        // Users
        this.channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'users' },
            (payload) => this.handleUserChange(payload)
        );

        // Houses
        this.channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'houses' },
            (payload) => this.handleHouseChange(payload)
        );

        // Maintenance Records
        this.channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'maintenance_records' },
            (payload) => this.handleRecordChange(payload)
        );

        // Expenses
        this.channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'expenses' },
            (payload) => this.handleExpenseChange(payload)
        );

        // Invoices
        this.channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'invoices' },
            (payload) => this.handleInvoiceChange(payload)
        );

        // Notifications
        this.channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            (payload) => this.handleNotificationChange(payload)
        );

        this.channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to Supabase Realtime');
            }
        });
    }

    // Handlers
    handleUserChange(payload) {
        console.log('Realtime User Change:', payload);
        if (typeof window.loadGlobalData === 'function') window.loadGlobalData();
    }

    handleHouseChange(payload) {
        console.log('Realtime House Change:', payload);
        if (payload && payload.new) {
            try {
                const currentHouse = window.appStore ? window.appStore.getState().house : {};
                let newSettings = payload.new.settings;
                if (typeof newSettings === 'string') {
                    try { newSettings = JSON.parse(newSettings); } catch(e) {}
                }
                const updatedHouse = {
                    ...(currentHouse || {}),
                    ...payload.new,
                    settings: (typeof newSettings === 'object' && newSettings !== null) ? newSettings : (currentHouse?.settings || {})
                };
                if (window.appStore) {
                    window.appStore.setState({ house: updatedHouse });
                }
                window.dispatchEvent(new CustomEvent('house-settings-updated', { detail: updatedHouse }));
            } catch (err) {
                console.warn('Realtime house parse warning:', err);
            }
        }
        if (typeof window.loadGlobalData === 'function') window.loadGlobalData();
    }

    handleRecordChange(payload) {
        console.log('Realtime Record Change:', payload);
        if (typeof window.loadGlobalData === 'function') window.loadGlobalData();
    }

    handleExpenseChange(payload) {
        console.log('Realtime Expense Change:', payload);
        if (typeof window.loadGlobalData === 'function') window.loadGlobalData();
    }

    handleInvoiceChange(payload) {
        console.log('Realtime Invoice Change:', payload);
        if (typeof window.loadGlobalData === 'function') window.loadGlobalData();
    }

    handleNotificationChange(payload) {
        console.log('Realtime Notification Change:', payload);
        if (typeof window.loadGlobalData === 'function') window.loadGlobalData();
    }

    unsubscribe() {
        const sb = this.getSb();
        if (this.channel && sb && typeof sb.removeChannel === 'function') {
            sb.removeChannel(this.channel);
        }
    }
}

window.realtimeSyncService = new RealtimeSyncService();

// Safe Auto-initialize helper
function setupRealtimeSubscriber() {
    const storeInstance = window.appStore || window.store;
    if (storeInstance && typeof storeInstance.subscribe === 'function') {
        storeInstance.subscribe((state) => {
            if (state.isLoggedIn && !window.realtimeSyncService.channel) {
                window.realtimeSyncService.init();
            } else if (!state.isLoggedIn && window.realtimeSyncService.channel) {
                window.realtimeSyncService.unsubscribe();
                window.realtimeSyncService.channel = null;
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRealtimeSubscriber);
} else {
    setupRealtimeSubscriber();
}
