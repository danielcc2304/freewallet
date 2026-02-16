/**
 * Centralized Academy routes for the application and build-time SSG generation.
 */
export const ACADEMY_ROUTES = [
    { path: '/academy', label: 'Fundamentos' },
    { path: '/academy/timeline', label: 'Tu Journey' },
    { path: '/academy/crisis', label: 'Crisis Históricas' },
    { path: '/academy/scenarios', label: '¿Qué hacer cuando...?' },
    { path: '/academy/errors', label: 'Errores Comunes' },
    { path: '/academy/portfolio', label: 'Construir Cartera' },
    { path: '/academy/tax', label: 'Fiscalidad' },
    { path: '/academy/strategies', label: 'Estrategias' },
    { path: '/academy/calculators', label: 'Calculadoras' },
    { path: '/academy/risk', label: 'Gestión Riesgo' },
    { path: '/academy/resources', label: 'Recursos' },
    { path: '/academy/glossary', label: 'Glosario' },
    { path: '/academy/asset-types', label: 'Tipos de Activos' },
    { path: '/academy/compound-interest', label: 'Interés Compuesto' },
    { path: '/academy/fire-calculator', label: 'Calculadora FIRE' },
    { path: '/academy/bond-calculator', label: 'Calculadora de Bonos' },
    { path: '/academy/retirement', label: 'Calculadora de Jubilación' },
    { path: '/academy/emergency-fund', label: 'Fondo de Emergencia' },
    { path: '/academy/taxes', label: 'Simulador de Impuestos' },
    { path: '/academy/asset-allocation', label: 'Simulador de Asignación' },
];

export const ALL_PRERENDER_ROUTES = [
    '/',
    '/add',
    '/settings',
    '/terms',
    ...ACADEMY_ROUTES.map(r => r.path)
];
