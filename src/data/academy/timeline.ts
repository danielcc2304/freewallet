import type { TimelinePhase } from '../../types/types';

// ===== INVESTOR TIMELINE PHASES =====
export const TIMELINE_PHASES: TimelinePhase[] = [
    {
        id: 'phase-0',
        phase: 0,
        title: "Antes de Invertir",
        duration: "0-6 meses",
        objective: "Estabilidad financiera",
        checklist: [
            "Sin pr\u00e9stamos t\u00f3xicos",
            "Fondo de emergencia b\u00e1sico (3-6 meses gastos)",
            "Conocimientos b\u00e1sicos adquiridos",
            "Ahorrar al menos el 10% de tus ingresos"
        ],
        commonErrors: [
            "Invertir sin colch\u00f3n \u2192 liquidar en p\u00e9rdidas por emergencia",
            "Invertir en lo que no comprendes por recomendaci\u00f3n"
        ]
    },
    {
        id: 'phase-1',
        phase: 1,
        title: "Primeros Pasos",
        duration: "1-3 a\u00f1os",
        objective: "Construir h\u00e1bito, invertir m\u00e1s y aprovechar la volatilidad",
        strategy: "Dollar-Cost Averaging (DCA) mensual/trimestral",
        allocation: {
            conservative: "50% RV / 50% RF",
            moderate: "70% RV / 30% RF",
            aggressive: "90% RV / 10% RF"
        },
        commonErrors: [
            "Parar DCA en crisis (justo cuando es m\u00e1s importante seguir inviertiendo)",
            "Mirar la cartera a diario \u2192 estr\u00e9s innecesario"
        ]
    },
    {
        id: 'phase-2',
        phase: 2,
        title: "Consolidaci\u00f3n",
        duration: "3-10 a\u00f1os",
        objective: "Aceleraci\u00f3n del capital compuesto",
        strategy: "Primer rebalanceo si deriva >5%, revisi\u00f3n anual, aumentar con subidas sueldo",
        commonErrors: [
            "No rebalancear \u2192 exceso de riesgo no deseado",
            "Perseguir rentabilidades pasadas (comprar lo que ya subi\u00f3)"
        ]
    },
    {
        id: 'phase-3',
        phase: 3,
        title: "Crecimiento",
        duration: "10+ a\u00f1os",
        objective: "Proteger lo ganado sin perder crecimiento",
        strategy: "Mantener rumbo, reducir riesgo gradualmente si te acercas a objetivo",
        commonErrors: [
            "No ir reduciendo el riesgo a medida que te acercas a tu objetivo",
            "Falta de optimizaci\u00f3n fiscal (no usar fondos traspasables)"
        ]
    },
    {
        id: 'phase-crisis',
        phase: 99, // Special phase
        title: "Durante una Crisis",
        duration: "En cualquier momento",
        objective: "Mantener la calma y seguir el plan",
        commonErrors: [
            "Vender por p\u00e1nico en el momento m\u00e1s bajo",
            "Intentar hacer 'Market Timing' para buscar el suelo"
        ]
    }
];
