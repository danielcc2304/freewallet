import { academyPrerenderRoutes, academyRouteDefinitions } from '../app/routes/academyRoutes';

/**
 * Centralized Academy routes for the application and build-time SSG generation.
 */
export const ACADEMY_ROUTES = academyRouteDefinitions.map(({ path, label }) => ({
    path: path ? `/academy/${path}` : '/academy',
    label,
}));

export const ALL_PRERENDER_ROUTES = [
    '/',
    '/add',
    '/portfolio-csv',
    '/settings',
    '/terms',
    ...academyPrerenderRoutes,
];
