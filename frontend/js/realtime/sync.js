// Realtime Sync Service

class RealtimeSyncService {
    constructor() {
        this.channel = null;
    }

    init() {
        if (!supabase) {
            console.error('Supabase client not initialized');
            return;
        }

        console.log('Initializing realtime subscriptions...');

        this.channel = supabase.channel('realtime:madura_house_platform_sync');

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
        // We can just trigger a full data reload to be safe, or do optimistic merge.
        // For migration safety, we reload data.
        if (window.loadGlobalData) window.loadGlobalData();
    }

    handleHouseChange(payload) {
        console.log('Realtime House Change:', payload);
        if (window.loadGlobalData) window.loadGlobalData();
    }

    handleRecordChange(payload) {
        console.log('Realtime Record Change:', payload);
        if (window.loadGlobalData) window.loadGlobalData();
    }

    handleExpenseChange(payload) {
        console.log('Realtime Expense Change:', payload);
        if (window.loadGlobalData) window.loadGlobalData();
    }

    handleInvoiceChange(payload) {
        console.log('Realtime Invoice Change:', payload);
        if (window.loadGlobalData) window.loadGlobalData();
    }

    handleNotificationChange(payload) {
        console.log('Realtime Notification Change:', payload);
        if (window.loadGlobalData) window.loadGlobalData();
    }

    unsubscribe() {
        if (this.channel) {
            supabase.removeChannel(this.channel);
        }
    }
}

window.realtimeSyncService = new RealtimeSyncService();

// Auto-initialize if logged in
window.appStore.subscribe((state) => {
    if (state.isLoggedIn && !window.realtimeSyncService.channel) {
        window.realtimeSyncService.init();
    } else if (!state.isLoggedIn && window.realtimeSyncService.channel) {
        window.realtimeSyncService.unsubscribe();
        window.realtimeSyncService.channel = null;
    }
});
