import type { CrisisData, QuizQuestion, TimelinePhase, RiskProfileQuestion, GlossaryTerm } from '../types/types';

// ===== CRISIS HISTORICAL DATA =====
// Core static data with architecture ready for updates
export const CRISIS_DATA: Record<number, CrisisData> = {
    2008: {
        year: 2008,
        name: "Crisis Financiera Global",
        maxDrawdown: -56.8,
        monthsDown: 17,
        monthsRecovery: 49,
        return5y: 95.5, // S&P 500 return 5 years after bottom (Mar 2009 - Mar 2014)
        description: "Colapso del mercado inmobiliario y crisis bancaria. Mayor caída desde la Gran Depresión."
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

// ===== INVESTOR TIMELINE PHASES =====
export const TIMELINE_PHASES: TimelinePhase[] = [
    {
        id: 'phase-0',
        phase: 0,
        title: "Antes de Invertir",
        duration: "0-6 meses",
        objective: "Estabilidad financiera",
        checklist: [
            "Préstamos tóxicos saldados (>10% TAE)",
            "Fondo de emergencia básico (3-6 meses gastos)",
            "Conocimientos básicos adquiridos"
        ],
        commonError: "Invertir sin colchón → liquidar en pérdidas por emergencia"
    },
    {
        id: 'phase-1',
        phase: 1,
        title: "Primeros Pasos",
        duration: "1-3 años",
        objective: "Construir hábito + aprovechar volatilidad",
        strategy: "Dollar-Cost Averaging (DCA) mensual/trimestral",
        allocation: {
            conservative: "50% RV / 50% RF",
            moderate: "70% RV / 30% RF",
            aggressive: "90% RV / 10% RF"
        },
        commonError: "Parar DCA en crisis (justo cuando hay que seguir)"
    },
    {
        id: 'phase-2',
        phase: 2,
        title: "Consolidación",
        duration: "3-10 años",
        objective: "Aceleración del capital compuesto",
        strategy: "Primer rebalanceo si deriva >5%, revisión anual, aumentar con subidas sueldo",
        commonError: "No rebalancear → exceso de riesgo no deseado"
    },
    {
        id: 'phase-3',
        phase: 3,
        title: "Crecimiento",
        duration: "10+ años",
        objective: "Proteger lo ganado sin perder crecimiento",
        strategy: "Mantener rumbo, reducir riesgo gradualmente si te acercas a objetivo",
        commonError: "Volverse ultra-conservador demasiado pronto"
    },
    {
        id: 'phase-crisis',
        phase: 99, // Special phase
        title: "Durante una Crisis",
        duration: "En cualquier momento",
        objective: "Mantener la calma y seguir el plan",
        commonError: "Vender por pánico en el momento más bajo"
    }
];

// ===== BIAS QUIZ QUESTIONS =====
export const BIAS_QUIZ: QuizQuestion[] = [
    {
        id: 'q1',
        question: "Compraste una acción en 100€. Ahora vale 70€. El resto del mercado está estable. ¿Qué haces?",
        options: [
            "Vendo para evitar más pérdidas",
            "Compro más porque está en descuento",
            "Mantengo según mi plan original",
            "Entro en pánico y no sé qué hacer"
        ],
        correctAnswer: 2,
        bias: "Sesgo de aversión a pérdidas",
        explanation: "Vender solo porque está en pérdidas es un error emocional. Lo correcto es revisar si los fundamentales cambiaron. Si no, mantener según el plan es lo más racional."
    },
    {
        id: 'q2',
        question: "Un gurú en Twitter dice que 'X acción va a triplicar'. Ya tienes exposición. ¿Qué haces?",
        options: [
            "Compro más, debe saber algo",
            "Vendo, suena a trampa",
            "Ignoro y sigo mi plan",
            "Investigo por mi cuenta antes de decidir"
        ],
        correctAnswer: 3,
        bias: "Sesgo de autoridad y confirmación",
        explanation: "Nunca sigas consejos anónimos sin verificar. Investigar por ti mismo es fundamental. Los 'gurús' a menudo tienen intereses ocultos."
    },
    {
        id: 'q3',
        question: "El mercado cae un 20% en un mes. ¿Cuál es tu reacción?",
        options: [
            "Vendo todo y espero a que se estabilice",
            "Ignoro las noticias y sigo invirtiendo según plan",
            "Leo todas las noticias para entender qué pasa",
            "Llamo a mi asesor desesperado"
        ],
        correctAnswer: 1,
        bias: "Sesgo de recencia y pánico de masas",
        explanation: "Las caídas de 20% son normales cada pocos años. Vender en pánico es el mayor error. Mantener el plan y seguir con DCA suele ser lo mejor."
    },
    {
        id: 'q4',
        question: "Una acción tecnológica ha subido 300% en 6 meses. ¿Entras ahora?",
        options: [
            "Sí, la tendencia es mi amiga",
            "No, ya llegué tarde",
            "Depende de la valoración y fundamentales",
            "Invierto solo un poco por si sigue"
        ],
        correctAnswer: 2,
        bias: "FOMO (Fear of Missing Out)",
        explanation: "Las subidas pasadas no predicen las futuras. Lo que importa es si la valoración actual tiene sentido. FOMO es uno de los peores sesgos."
    },
    {
        id: 'q5',
        question: "Tienes 10.000€ en una acción que ha subido 50%. ¿Qué haces?",
        options: [
            "Vendo y aseguro beneficios",
            "Mantengo, puede seguir subiendo",
            "Vendo parte (50%) para asegurar algo",
            "Reviso si sigue cumpliendo mi tesis de inversión"
        ],
        correctAnswer: 3,
        bias: "Efecto disposición",
        explanation: "La decisión no debe basarse en si ganaste o perdiste, sino en si la acción sigue siendo una buena inversión HOY. Revisar la tesis es clave."
    },
    {
        id: 'q6',
        question: "Acabas de leer 10 artículos alcistas sobre una empresa. ¿Qué haces?",
        options: [
            "Compro, está claro que va a subir",
            "Busco artículos bajistas para equilibrar",
            "Analizo datos objetivos (earnings, PER, deuda, etc.)",
            "Espero un día a ver si cambia la opinión"
        ],
        correctAnswer: 2,
        bias: "Sesgo de confirmación",
        explanation: "Leer solo opiniones que confirman tu hipótesis es peligroso. Los datos objetivos y buscar opiniones contrarias te ayuda a tomar mejores decisiones."
    },
    {
        id: 'q7',
        question: "Inviertes en un fondo que pierde 3 años seguidos. ¿Qué haces?",
        options: [
            "Vendo, claramente es malo",
            "Mantengo, la reversión a la media llegará",
            "Investigo si el gestor cambió o los fundamentales empeoraron",
            "Espero un año más por si acaso"
        ],
        correctAnswer: 2,
        bias: "Apego emocional y coste hundido",
        explanation: "Tres años malos pueden ser mala suerte o problemas reales. Investigar si algo cambió estructuralmente es crucial antes de decidir."
    },
    {
        id: 'q8',
        question: "Un compañero de trabajo ha ganado 50% invirtiendo en cripto. ¿Qué haces?",
        options: [
            "Invierto en cripto también",
            "Le pregunto qué compró exactamente y copio",
            "Me alegro por él pero sigo mi estrategia",
            "Me siento mal por haberme perdido esa oportunidad"
        ],
        correctAnswer: 2,
        bias: "Envidia y comparación social",
        explanation: "Compararte con otros es destructivo. Cada uno tiene objetivos, plazos y tolerancia al riesgo diferentes. Mantén tu plan."
    },
    {
        id: 'q9',
        question: "¿Cuántas horas al día dedicas a mirar tu cartera?",
        options: [
            "0, no la miro casi nunca",
            "0.5-1 hora, una vez al día",
            "2-3 horas, varias veces al día",
            "Más de 3 horas, estoy obsesionado"
        ],
        correctAnswer: 0,
        bias: "Sobreconfianza y overtrading",
        explanation: "Si inviertes a largo plazo, mirar la cartera constantemente genera ansiedad y decisiones emocionales. Una vez al mes suele ser suficiente."
    },
    {
        id: 'q10',
        question: "Tu cartera sube 10% en un mes. ¿Cómo te sientes?",
        options: [
            "Eufórico, soy un genio",
            "Satisfecho pero cauteloso",
            "Neutral, es solo volatilidad",
            "Preocupado, puede caer pronto"
        ],
        correctAnswer: 2,
        bias: "Exceso de confianza",
        explanation: "Las ganancias a corto plazo suelen ser suerte, no habilidad. Mantener la humildad y saber que la volatilidad va en ambas direcciones es clave."
    }
];

// ===== RISK PROFILE TEST =====
export const RISK_PROFILE_QUESTIONS: RiskProfileQuestion[] = [
    {
        id: 'rp1',
        question: "¿Cuál es tu horizonte temporal de inversión?",
        options: [
            { text: "Menos de 3 años", score: 1 },
            { text: "3-5 años", score: 2 },
            { text: "5-10 años", score: 3 },
            { text: "Más de 10 años", score: 4 }
        ]
    },
    {
        id: 'rp2',
        question: "Si tu cartera pierde un 20% en un mes, ¿qué harías?",
        options: [
            { text: "Vendería todo inmediatamente", score: 1 },
            { text: "Me preocuparía mucho pero mantendría", score: 2 },
            { text: "Lo vería como algo normal", score: 3 },
            { text: "Aprovecharía para comprar más", score: 4 }
        ]
    },
    {
        id: 'rp3',
        question: "¿Qué porcentaje de tu patrimonio puedes permitirte perder sin afectar tu vida?",
        options: [
            { text: "Menos del 10%", score: 1 },
            { text: "10-25%", score: 2 },
            { text: "25-50%", score: 3 },
            { text: "Más del 50%", score: 4 }
        ]
    },
    {
        id: 'rp4',
        question: "¿Cuál es tu experiencia previa invirtiendo?",
        options: [
            { text: "Ninguna, soy principiante", score: 1 },
            { text: "He invertido ocasionalmente", score: 2 },
            { text: "Invierto regularmente hace años", score: 3 },
            { text: "Soy inversor experimentado", score: 4 }
        ]
    },
    {
        id: 'rp5',
        question: "¿Cuál es tu objetivo principal?",
        options: [
            { text: "Preservar capital, evitar pérdidas", score: 1 },
            { text: "Generar ingresos estables", score: 2 },
            { text: "Crecimiento moderado a largo plazo", score: 3 },
            { text: "Máximo crecimiento, acepto volatilidad", score: 4 }
        ]
    },
    {
        id: 'rp6',
        question: "¿Cómo reaccionas ante la volatilidad del mercado?",
        options: [
            { text: "Me estresa mucho, pierdo el sueño", score: 1 },
            { text: "Me incomoda pero lo tolero", score: 2 },
            { text: "Lo veo como parte del proceso", score: 3 },
            { text: "Me gusta, es oportunidad", score: 4 }
        ]
    },
    {
        id: 'rp7',
        question: "¿Qué rentabilidad anual esperas?",
        options: [
            { text: "2-4% (batir inflación)", score: 1 },
            { text: "4-6% (bajo riesgo)", score: 2 },
            { text: "6-10% (moderado)", score: 3 },
            { text: "Más del 10% (agresivo)", score: 4 }
        ]
    },
    {
        id: 'rp8',
        question: "¿Cómo es tu situación laboral?",
        options: [
            { text: "Inestable o cercana a jubilación", score: 1 },
            { text: "Estable pero sin grandes ahorros", score: 2 },
            { text: "Estable con colchón de emergencia", score: 3 },
            { text: "Muy estable con múltiples fuentes de ingreso", score: 4 }
        ]
    }
];

// ===== GLOSSARY (Empty for user to fill) =====
export const GLOSSARY: GlossaryTerm[] = [
    {
        id: 'sample-1',
        term: "Diversificación",
        definition: "Estrategia de inversión que consiste en distribuir el capital entre diferentes activos, sectores o geografías para reducir el riesgo global de la cartera.",
        category: "Estrategia",
        relatedTerms: ["Asset Allocation", "Correlación", "Riesgo"]
    },
    {
        id: 'sample-2',
        term: "PER (Price/Earnings Ratio)",
        definition: "Ratio de valoración que indica cuántas veces estás pagando el beneficio anual de una empresa. Se calcula dividiendo el precio de la acción entre el beneficio por acción.",
        category: "Valoración",
        relatedTerms: ["PEG", "Valoración", "Beneficio"]
    }
    // User will add more terms here
];

// ===== ASSET ALLOCATION PRESETS =====
export const ALLOCATION_PRESETS = {
    conservative: {
        name: "Conservadora",
        stocks: 30,
        bonds: 60,
        cash: 10,
        realEstate: 0,
        crypto: 0,
        expectedReturn: 4.5,
        volatility: 8
    },
    moderate: {
        name: "Moderada",
        stocks: 60,
        bonds: 30,
        cash: 5,
        realEstate: 5,
        crypto: 0,
        expectedReturn: 7,
        volatility: 14
    },
    aggressive: {
        name: "Agresiva",
        stocks: 80,
        bonds: 10,
        cash: 5,
        realEstate: 5,
        crypto: 0,
        expectedReturn: 9.5,
        volatility: 18
    }
};

// ===== LEARNING RESOURCES =====
export const BOOKS_BY_LEVEL = {
    beginner: [
        { title: "Un paso por delante de Wall Street", author: "Peter Lynch" },
        { title: "El inversor inteligente", author: "Benjamin Graham" },
        { title: "Padre Rico, Padre Pobre", author: "Robert Kiyosaki" }
    ],
    intermediate: [
        { title: "Common Stocks and Uncommon Profits", author: "Philip Fisher" },
        { title: "El pequeño libro que bate al mercado", author: "Joel Greenblatt" },
        { title: "A Random Walk Down Wall Street", author: "Burton Malkiel" }
    ],
    advanced: [
        { title: "Security Analysis", author: "Benjamin Graham & David Dodd" },
        { title: "The Most Important Thing", author: "Howard Marks" },
        { title: "Margin of Safety", author: "Seth Klarman" }
    ]
};

export const TRUSTED_RESOURCES = {
    data: [
        { name: "Morningstar", url: "https://www.morningstar.es", description: "Análisis de fondos y ETFs" },
        { name: "JustETF", url: "https://www.justetf.com", description: "Comparador de ETFs europeos" },
        { name: "CNMV", url: "https://www.cnmv.es", description: "Verificación de fondos registrados en España" },
        { name: "Investing.com", url: "https://es.investing.com", description: "Cotizaciones y calendarios económicos" }
    ],
    podcasts: [
        { name: "Más que Dividendos", description: "Podcast español sobre inversión indexada" },
        { name: "El ático de los libros", description: "Educación financiera práctica" }
    ]
};
