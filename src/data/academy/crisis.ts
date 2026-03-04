import type { CrisisData } from '../../types/types';

// ===== CRISIS HISTORICAL DATA =====
export const CRISIS_DATA: Record<number, CrisisData> = {
    2008: {
        year: 2008,
        name: "Crisis Financiera Global",
        maxDrawdown: -56.8,
        monthsDown: 17,
        monthsRecovery: 49,
        return5y: 95.5, // S&P 500 return 5 years after bottom (Mar 2009 - Mar 2014)
        description: "Colapso del mercado inmobiliario bancario por crisis de hipotecas subprime. Mayor caída desde la Gran Depresión."
    },
    2020: {
        year: 2020,
        name: "Pandemia COVID-19",
        maxDrawdown: -33.9,
        monthsDown: 1,
        monthsRecovery: 5,
        return5y: 68.2, // S&P 500 return from March 2020 low to March 2025
        description: "Caída más rápida de la historia, pero también recuperación más rápida gracias a estímulos masivos."
    },
    2022: {
        year: 2022,
        name: "Inflación y Subida de Tipos",
        maxDrawdown: -25.4,
        monthsDown: 9,
        monthsRecovery: 15,
        return5y: undefined, // Too recent to have 5-year data
        description: "Crisis menos dramática pero prolongada. Afectó especialmente a tecnología (-33% Nasdaq)."
    }
};
