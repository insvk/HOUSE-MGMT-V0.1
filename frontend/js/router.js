// Simple hash-based router for Vanilla JS SPA

class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentRoute = null;
        
        window.addEventListener('hashchange', this.handleRouteChange.bind(this));
    }

    init() {
        this.handleRouteChange();
    }

    handleRouteChange() {
        let hash = window.location.hash || '#/';
        
        // Remove trailing query params for matching
        const path = hash.split('?')[0];

        const route = this.routes.find(r => {
            if (r.path === '*') return true;
            return r.path === path;
        });

        if (route) {
            this.currentRoute = route;
            if (route.guard && !route.guard()) {
                window.location.hash = '#/login';
                return;
            }
            route.handler();
        }
    }

    navigate(path) {
        window.location.hash = path;
    }
}

window.appRouter = null; // Instantiated in app.js

window.navigateTo = function(path) {
    if (!path) path = '#/';
    if (!path.startsWith('#/')) {
        path = '#/' + (path === 'dashboard' ? '' : path);
    }
    window.location.hash = path;
};
