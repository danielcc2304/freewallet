import type { CrisisData, QuizQuestion, TimelinePhase, RiskProfileQuestion, GlossaryTerm, Scenario } from '../types/types';

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
            "Sin préstamos tóxicos",
            "Fondo de emergencia básico (3-6 meses gastos)",
            "Conocimientos básicos adquiridos",
            "Ahorrar al menos el 10% de tus ingresos"
        ],
        commonErrors: [
            "Invertir sin colchón → liquidar en pérdidas por emergencia",
            "Invertir en lo que no comprendes por recomendación"
        ]
    },
    {
        id: 'phase-1',
        phase: 1,
        title: "Primeros Pasos",
        duration: "1-3 años",
        objective: "Construir hábito, invertir más y aprovechar la volatilidad",
        strategy: "Dollar-Cost Averaging (DCA) mensual/trimestral",
        allocation: {
            conservative: "50% RV / 50% RF",
            moderate: "70% RV / 30% RF",
            aggressive: "90% RV / 10% RF"
        },
        commonErrors: [
            "Parar DCA en crisis (justo cuando es más importante seguir inviertiendo)",
            "Mirar la cartera a diario → estrés innecesario"
        ]
    },
    {
        id: 'phase-2',
        phase: 2,
        title: "Consolidación",
        duration: "3-10 años",
        objective: "Aceleración del capital compuesto",
        strategy: "Primer rebalanceo si deriva >5%, revisión anual, aumentar con subidas sueldo",
        commonErrors: [
            "No rebalancear → exceso de riesgo no deseado",
            "Perseguir rentabilidades pasadas (comprar lo que ya subió)"
        ]
    },
    {
        id: 'phase-3',
        phase: 3,
        title: "Crecimiento",
        duration: "10+ años",
        objective: "Proteger lo ganado sin perder crecimiento",
        strategy: "Mantener rumbo, reducir riesgo gradualmente si te acercas a objetivo",
        commonErrors: [
            "No ir reduciendo el riesgo a medida que te acercas a tu objetivo",
            "Falta de optimización fiscal (no usar fondos traspasables)"
        ]
    },
    {
        id: 'phase-crisis',
        phase: 99, // Special phase
        title: "Durante una Crisis",
        duration: "En cualquier momento",
        objective: "Mantener la calma y seguir el plan",
        commonErrors: [
            "Vender por pánico en el momento más bajo",
            "Intentar hacer 'Market Timing' para buscar el suelo"
        ]
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
        question: "Un gurú en X dice que 'X acción va a triplicar'. Ya tienes exposición. ¿Qué haces?",
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
        id: 'diversificacion',
        term: "Diversificación",
        definition: "Estrategia de inversión que consiste en distribuir el capital entre diferentes activos, sectores o geografías para reducir el riesgo global de la cartera.",
        category: "Estrategia",
        relatedTerms: ["Asset Allocation", "Correlación", "Riesgo"]
    },
    {
        id: 'per',
        term: "PER (Price/Earnings Ratio)",
        definition: "Ratio de valoración que indica cuántas veces estás pagando el beneficio anual de una empresa. Se calcula dividiendo el precio de la acción entre el beneficio por acción.",
        category: "Valoración",
        relatedTerms: ["PEG", "Valoración", "Beneficio"]
    },
    {
        id: 'interes-compuesto',
        term: "Interés Compuesto",
        definition: "Es el interés de un capital al que se van acumulando los intereses que produce para que generen otros nuevos. Es la fuerza más potente del universo según Einstein.",
        category: "Conceptos Básicos",
        relatedTerms: ["Rentabilidad", "Tiempo", "Capitalización"]
    },
    {
        id: 'inflacion',
        term: "Inflación",
        definition: "Proceso económico provocado por el desequilibrio existente entre la producción y la demanda; causa una subida continuada de los precios de la mayor parte de los productos y servicios.",
        category: "Economía",
        relatedTerms: ["Poder Adquisitivo", "IPC", "Deflación"]
    },
    {
        id: 'etf',
        term: "ETF (Exchange Traded Fund)",
        definition: "Fondo de inversión cuya principal característica es que cotiza en bolsa, igual que una acción. Suelen replicar un índice bursátil.",
        category: "Instrumentos",
        relatedTerms: ["Fondo de Inversión", "Indexación", "Gestión Pasiva"]
    },
    {
        id: 'dividendo',
        term: "Dividendo",
        definition: "Parte de los beneficios de una empresa que se reparte entre sus accionistas.",
        category: "Rentabilidad",
        relatedTerms: ["Payout", "Yield", "Acción"]
    },
    {
        id: 'volatilidad',
        term: "Volatilidad",
        definition: "Medida de la variación del precio de un activo financiero respecto a su media en un periodo de tiempo determinado. A mayor volatilidad, mayor riesgo y potencial rentabilidad.",
        category: "Riesgo",
        relatedTerms: ["Desviación Típica", "Beta", "Riesgo"]
    },
    {
        id: 'asset-allocation',
        term: "Asset Allocation",
        definition: "Distribución de los activos de una cartera entre diferentes clases (acciones, bonos, efectivo, etc.) según el perfil del inversor.",
        category: "Estrategia",
        relatedTerms: ["Diversificación", "Rebalanceo", "Perfil de Riesgo"]
    },
    {
        id: 'ipc',
        term: "IPC (Índice de Precios al Consumo)",
        definition: "Indicador que mide la evolución de los precios de los bienes y servicios consumidos por las familias en España.",
        category: "Economía",
        relatedTerms: ["Inflación", "Cesta de la Compra"]
    },
    {
        id: 'renta-fija',
        term: "Renta Fija",
        definition: "Tipo de inversión formada por todos los activos financieros en los que el emisor está obligado a pagar una rentabilidad fija o variable al inversor durante un periodo determinado.",
        category: "Instrumentos",
        relatedTerms: ["Bonos", "Letras del Tesoro", "Cupón"]
    },
    {
        id: 'renta-variable',
        term: "Renta Variable",
        definition: "Tipo de inversión en la que la recuperación del capital invertido y la rentabilidad no están garantizadas, ni se conocen de antemano.",
        category: "Instrumentos",
        relatedTerms: ["Acciones", "Bolsa", "Riesgo"]
    },
    {
        id: 'bear-market',
        term: "Bear Market",
        definition: "Mercado bajista. Periodo en el que los precios de los activos caen un 20% o más desde sus máximos recientes en medio de un pesimismo generalizado.",
        category: "Bolsa",
        relatedTerms: ["Bull Market", "Crash", "Corrección"]
    },
    {
        id: 'bull-market',
        term: "Bull Market",
        definition: "Mercado alcista. Periodo prolongado en el que los precios de los activos suben o se espera que suban.",
        category: "Bolsa",
        relatedTerms: ["Bear Market", "Rally", "Euforia"]
    },
    {
        id: 'margin-of-safety',
        term: "Margen de Seguridad",
        definition: "Diferencia entre el valor intrínseco de un activo y su precio de mercado. Es un concepto clave del Value Investing.",
        category: "Valoración",
        relatedTerms: ["Valor Intrínseco", "Value Investing"]
    },
    {
        id: 'broker',
        term: "Broker",
        definition: "Entidad o individuo que actúa como intermediario en operaciones de compra y venta de valores financieros a cambio de una comisión.",
        category: "Conceptos Básicos",
        relatedTerms: ["Exchange", "Comisión", "Custodia"]
    },
    {
        id: 'faci',
        term: "Fondo de Acumulación",
        definition: "Fondo de inversión en el que los dividendos o intereses generados se reinvierten automáticamente en el propio fondo en lugar de repartirse.",
        category: "Instrumentos",
        relatedTerms: ["Fondo de Distribución", "Interés Compuesto"]
    },
    {
        id: 'pib',
        term: "PIB (Producto Interior Bruto)",
        definition: "Valor monetario de todos los bienes y servicios finales producidos por un país en un periodo determinado.",
        category: "Economía",
        relatedTerms: ["Crecimiento Económico", "Recesión"]
    }
];

// ===== ASSET CLASSES DETAIL =====
export const ASSET_CLASSES_DETAIL = [
    {
        id: 'acciones',
        title: "Renta Variable (Acciones)",
        description: "Representan la propiedad parcial de una empresa. Es el activo con mayor potencial de crecimiento a largo plazo, pero con mayor volatilidad.",
        risk: "Alto",
        return: "Histórico ~7-10%",
        pros: ["Potencial de revalorización", "Dividendos", "Liquidez alta"],
        cons: ["Alta volatilidad", "Riesgo de pérdida de capital", "Requiere tiempo"],
        instruments: ["Acciones individuales", "Fondos Indexados", "ETFs"]
    },
    {
        id: 'bonos',
        title: "Renta Fija (Bonos)",
        description: "Préstamos que el inversor hace a un gobierno o empresa a cambio de un interés (cupón). Sirven para mitigar la volatilidad de la cartera.",
        risk: "Bajo / Medio",
        return: "Histórico ~2-4%",
        pros: ["Ingresos predecibles", "Menor volatilidad que acciones", "Prioridad en cobro"],
        cons: ["Menor potencial de crecimiento", "Riesgo de insolvencia", "Riesgo de tipo de interés"],
        instruments: ["Letras del Tesoro", "Bonos del Estado", "Bonos Corporativos"]
    },
    {
        id: 'reits',
        title: "Real Estate (REITs/SOCIMIs)",
        description: "Inversión en el mercado inmobiliario a través de bolsa. Estas empresas gestionan propiedades y reparten la mayoría de sus beneficios.",
        risk: "Medio / Alto",
        return: "Histórico ~6-9%",
        pros: ["Protección contra inflación", "Dividendos altos", "Diversificación real"],
        cons: ["Ciclos inmobiliarios", "Sensibles a tipos de interés", "Riesgo de gestión"],
        instruments: ["REITs (USA)", "SOCIMIs (España)", "ETFs Inmobiliarios"]
    },
    {
        id: 'cash',
        title: "Efectivo y Monetarios",
        description: "Dinero en cuentas o activos a muy corto plazo y alta seguridad. Su función es la liquidez y la preservación nominal.",
        risk: "Muy Bajo",
        return: "Histórico ~0-2%",
        pros: ["Liquidez inmediata", "Pérdida de valor nula a corto plazo", "Seguridad máxima"],
        cons: ["Batido por la inflación", "Rentabilidad real negativa a menudo", "Coste de oportunidad"],
        instruments: ["Cuentas remuneradas", "Depósitos", "Fondos Monetarios"]
    },
    {
        id: 'crypto',
        title: "Criptoactivos",
        description: "Activos digitales basados en criptografía. Es una clase de activo nueva y extremadamente volátil usada para especulación o reserva de valor digital.",
        risk: "Extremo",
        return: "Impredecible",
        pros: ["Potencial de retorno explosivo", "Descentralización", "Transferibilidad"],
        cons: ["Volatilidad extrema", "Riesgo regulatorio", "Posibilidad de pérdida total"],
        instruments: ["Bitcoin", "Ethereum", "Stablecoins"]
    },
    {
        id: 'oro',
        title: "Materias Primas (Oro/Commodities)",
        description: "Activos físicos que suelen actuar como refugio en tiempos de crisis o alta inflación. No generan flujos de caja (dividendos).",
        risk: "Medio",
        return: "Reserva de Valor",
        pros: ["Refugio seguro", "Desvinculado del mercado de acciones", "Cobertura inflación"],
        cons: ["No produce rentas", "Costes de almacenamiento (físico)", "Precio cíclico"],
        instruments: ["ETC de Oro", "Oro físico", "ETFs de Minería"]
    }
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

// ===== COMMON ERRORS =====
export const COMMON_ERRORS = [
    {
        id: 'market-timing',
        title: "Market Timing",
        emoji: "🕰️",
        desc: "Intentar predecir el suelo o el techo del mercado. Nadie sabe qué hará mañana la bolsa.",
        consequence: "Perderse los mejores días de subida, que suelen ocurrir justo después de las grandes caídas.",
        solution: "Entrar de forma promediada (DCA) y mantener el rumbo pase lo que pase."
    },
    {
        id: 'fomo',
        title: "FOMO (Miedo a perderse algo)",
        emoji: "🚀",
        desc: "Comprar un activo solo porque 'todo el mundo habla de ello' o porque acaba de subir un 50%.",
        consequence: "Sueles comprar en el pico de euforia, justo antes de que los inversores profesionales empiecen a vender.",
        solution: "Invertir basándote en fundamentales y en tu plan, no en las noticias o RRSS."
    },
    {
        id: 'no-fondo',
        title: "No tener Fondo de Emergencia",
        emoji: "🆘",
        desc: "Invertir el dinero que podrías necesitar para comer o pagar el alquiler el mes que viene.",
        consequence: "Verte obligado a vender tus inversiones en el peor momento posible (en pérdidas) debido a un imprevisto.",
        solution: "Ahorrar 3-6 meses de gastos en una cuenta remunerada antes de empezar a invertir."
    },
    {
        id: 'recencia',
        title: "Sesgo de Recencia",
        emoji: "🔄",
        desc: "Pensar que lo que ha pasado en los últimos 6 meses es lo que pasará siempre.",
        consequence: "Extrapolar rentabilidades pasadas al futuro y asumir riesgos excesivos.",
        solution: "Entender los ciclos económicos y mirar datos históricos de largo plazo (10+ años)."
    }
];
