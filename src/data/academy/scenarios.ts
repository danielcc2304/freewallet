import type { Scenario } from '../../types/types';

// ===== PRACTICAL SCENARIOS =====
export const SCENARIOS: Scenario[] = [
    {
        id: 'market-crash',
        title: "El mercado cae un 20%",
        emoji: "📉",
        sections: [
            {
                title: "Análisis de Situación",
                content: "Las caídas de doble dígito son normales y ocurren de media cada 1.5 años. No son el fin del mundo, sino parte del ciclo de los mercados financieros. Históricamente, los grandes índices han acabado recuperándose, pero el plazo importa."
            },
            {
                title: "Acciones Recomendadas",
                content: [
                    { icon: 'Shield', title: 'Mantén la calma', description: 'No vendas por pánico. El 90% de los errores se cometen en estos momentos de estrés emocional.', type: 'do' },
                    { icon: 'TrendingUp', title: 'Sigue con tu DCA', description: 'Ahora estás comprando más participaciones por el mismo dinero. Es una oportunidad de acumulación.', type: 'do' },
                    { icon: 'XCircle', title: 'No mires la cartera', description: 'Mirar el color rojo genera cortisol y ansiedad, lo que nubla el juicio racional.', type: 'dont' }
                ]
            }
        ]
    },
    {
        id: 'extra-cash',
        title: "Tengo un dinero extra",
        emoji: "💰",
        sections: [
            {
                title: "¿Qué hacer primero?",
                content: "Antes de invertir un solo euro en activos volátiles, asegúrate de que tus 'cimientos financieros' son sólidos. Invertir sin base es construir sobre arena."
            },
            {
                title: "Prioridades",
                content: [
                    { icon: 'PiggyBank', title: 'Fondo de Emergencia', description: 'Si no tienes 3-6 meses de gastos cubiertos, esto el lo primero. Aporta tranquilidad.', type: 'do' },
                    { icon: 'Zap', title: 'Deudas > 10% TAE', description: 'Pagar una deuda cara es una inversión con retorno garantizado del 10%+. No hay mejor uso para tu dinero.', type: 'do' },
                    { icon: 'Target', title: 'Inversión según Plan', description: 'Si lo anterior está cubierto, inyéctalo en tu cartera según tu asset allocation objetivo.', type: 'do' }
                ]
            }
        ]
    },
    {
        id: 'jubilacion',
        title: "Me acerco a la jubilación",
        emoji: "👴",
        sections: [
            {
                title: "El cambio de chip",
                content: "A medida que el plazo de inversión se acorta, la preservación de capital gana importancia sobre el crecimiento agresivo. Tienes menos tiempo para recuperarte de una caída."
            },
            {
                title: "Pasos a seguir",
                content: [
                    { icon: 'Scale', title: 'Reducción de Riesgo', description: 'Aumentar gradualmente el peso de la Renta Fija y Liquidez (Gilde Path).', type: 'do' },
                    { icon: 'Landmark', title: 'Optimización Fiscal', description: 'Analiza cómo rescatar el dinero de forma progresiva para minimizar el impacto del IRPF.', type: 'do' },
                    { icon: 'ShieldCheck', title: 'Fondo de Retiros', description: 'Tener al menos 2-3 años de retiradas previstas en activos muy seguros (cash/monetarios).', type: 'do' }
                ]
            }
        ]
    },
    {
        id: 'salary-increase',
        title: "Me suben el sueldo",
        emoji: "💵",
        sections: [
            {
                title: "Análisis de Situación",
                content: "No te lo fundas en 'lifestyle inflation'. El aumento de ingresos es la herramienta más potente para acelerar tu libertad financiera, no para comprar un coche más caro automáticamente."
            },
            {
                title: "Acciones Recomendadas",
                content: [
                    { icon: 'TrendingUp', title: 'Auto-incremento', description: 'Destina el 50-70% de la subida neta a aumentar tu inversión mensual. Ahorrarás sin esfuerzo percibido.', type: 'do' },
                    { icon: 'Target', title: 'Recalcular objetivos', description: 'Aprovecha para rellenar antes el fondo de emergencia o liquidar deudas pendientes.', type: 'do' },
                    { icon: 'Scale', title: 'Rebalanceo inteligente', description: 'Usa las nuevas aportaciones mayores para comprar los activos que se hayan quedado atrás en tu cartera.', type: 'do' },
                    { icon: 'XCircle', title: 'Evita gastos fijos', description: 'No subas gastos recurrentes (alquiler, suscripciones, cuotas) de forma automática como reacción a la subida.', type: 'dont' }
                ]
            }
        ]
    },
    {
        id: 'emergency-fund-use',
        title: "He tirado del fondo de emergencia",
        emoji: "🆘",
        sections: [
            {
                title: "Análisis de Situación",
                content: "Primero encárgate de reponer el colchón, luego sigue invirtiendo. El fondo de emergencia ha cumplido su función; ahora tu prioridad absoluta es volver a estar protegido ante lo imprevisible."
            },
            {
                title: "Acciones Recomendadas",
                content: [
                    { icon: 'PauseCircle', title: 'Pausar inversión', description: 'Si es necesario, detén temporalmente las aportaciones a bolsa y redirígelas a reconstruir el fondo.', type: 'do' },
                    { icon: 'Calendar', title: 'Plan de reposición', description: 'Define una cantidad fija mensual hasta volver a tener cubiertos de 3 a 6 meses de gastos.', type: 'do' },
                    { icon: 'ShieldCheck', title: 'Revisar causa', description: '¿Era la emergencia previsible? Quizás necesites mejores seguros o un fondo específico para gastos anuales (sinking funds).', type: 'do' },
                    { icon: 'Zap', title: 'No te endeudes', description: 'No pidas préstamos caros o uses tarjetas para mantener tus inversiones intactas por orgullo.', type: 'dont' }
                ]
            }
        ]
    },
    {
        id: 'fomo-market',
        title: "Me entra FOMO porque todo sube",
        emoji: "🚀",
        sections: [
            {
                title: "Análisis de Situación",
                content: "Comprar por ansiedad suele salir caro. La euforia es tan peligrosa como el miedo. Invertir porque 'está subiendo mucho' es la receta perfecta para comprar en el pico."
            },
            {
                title: "Acciones Recomendadas",
                content: [
                    { icon: 'Repeat', title: 'Sigue tu DCA', description: 'Si ya estás dentro, no cambies nada. Tu plan mensual ya aprovecha las subidas de forma disciplinada.', type: 'do' },
                    { icon: 'Clock', title: 'Entrada promediada', description: 'Si estabas fuera, divide tu capital en 6-12 meses. Si la mano te tiembla, el DCA es tu mejor aliado emocional.', type: 'do' },
                    { icon: 'Twitter', title: 'Apaga el ruido', description: 'Recuerda que tu plan manda sobre lo que diga X o las noticias de última hora.', type: 'do' },
                    { icon: 'ArrowUpCircle', title: 'Evita el All-in', description: 'No metas todo tu capital disponible en máximos históricos solo por miedo a perderte lo que queda de subida.', type: 'dont' }
                ]
            }
        ]
    },
    {
        id: 'panic-selling',
        title: "Quiero vender por miedo",
        emoji: "😱",
        sections: [
            {
                title: "Análisis de Situación",
                content: "Vender en un 'drawdown' es cristalizar el error. Si vendes cuando el mercado cae, conviertes una pérdida temporal en una pérdida definitiva y real."
            },
            {
                title: "Acciones Recomendadas",
                content: [
                    { icon: 'ClipboardCheck', title: 'Checklist de pánico', description: '¿Necesitas de verdad el dinero en menos de 3 años? Si la respuesta es no, no hay razón financiera para vender.', type: 'do' },
                    { icon: 'Thermometer', title: 'Ajuste en frío', description: 'Si el riesgo es demasiado para ti, cambia tu plan (p.ej. más renta fija), pero hazlo cuando el mercado esté calmado, no hoy.', type: 'do' },
                    { icon: 'EyeOff', title: 'Desconexión total', description: 'Deja de mirar la cartera a diario y deja de leer titulares alarmistas que buscan tu click.', type: 'dont' }
                ]
            }
        ]
    },
    {
        id: 'goal-change',
        title: "Cambio de objetivo (Casa/Boda)",
        emoji: "🏠",
        sections: [
            {
                title: "Análisis de Situación",
                content: "Si el plazo es corto (2-3 años), el riesgo debe bajar sí o sí. La renta variable es para horizontes largos; no puedes jugarte la entrada de tu casa a la volatilidad bursátil."
            },
            {
                title: "Acciones Recomendadas",
                content: [
                    { icon: 'Landmark', title: 'Mover a seguridad', description: 'Traslada el dinero destinado a ese objetivo a activos monetarios o renta fija de ultra-corto plazo.', type: 'do' },
                    { icon: 'Briefcase', title: 'Separar buckets', description: 'Diferencia claramente tu cartera de largo plazo (jubilación) de tu hucha para objetivos a corto plazo.', type: 'do' },
                    { icon: 'TrendingDown', title: 'No uses Bolsa', description: 'No mantengas en renta variable dinero que tengas que desembolsar en los próximos 24 meses.', type: 'dont' }
                ]
            }
        ]
    }
];
