import type { GlossaryTerm } from '../../types/types';

// ===== GLOSSARY =====
export const GLOSSARY: GlossaryTerm[] = [
    {
        id: 'diversificacion',
        term: "Diversificaci\u00f3n",
        definition: "Estrategia de inversi\u00f3n que consiste en distribuir el capital entre diferentes activos, sectores o geograf\u00edas para reducir el riesgo global de la cartera.",
        category: "Estrategia",
        relatedTerms: ["Asset Allocation", "Correlaci\u00f3n", "Riesgo"]
    },
    {
        id: 'per',
        term: "PER (Price/Earnings Ratio)",
        definition: "Ratio de valoraci\u00f3n que indica cu\u00e1ntas veces est\u00e1s pagando el beneficio anual de una empresa. Se calcula dividiendo el precio de la acci\u00f3n entre el beneficio por acci\u00f3n.",
        category: "Valoraci\u00f3n",
        relatedTerms: ["PEG", "Valoraci\u00f3n", "Beneficio"]
    },
    {
        id: 'interes-compuesto',
        term: "Inter\u00e9s Compuesto",
        definition: "Es el inter\u00e9s de un capital al que se van acumulando los intereses que produce para que generen otros nuevos. Es la fuerza m\u00e1s potente del universo seg\u00fan Einstein.",
        category: "Conceptos B\u00e1sicos",
        relatedTerms: ["Rentabilidad", "Tiempo", "Capitalizaci\u00f3n"]
    },
    {
        id: 'coste-oportunidad',
        term: "Coste de Oportunidad",
        definition: "Beneficio que se deja de percibir al elegir una opci\u00f3n de inversi\u00f3n en lugar de otra. En finanzas, suele referirse a la rentabilidad perdida por mantener el dinero en efectivo en lugar de invertirlo.",
        category: "Conceptos B\u00e1sicos",
        relatedTerms: ["Riesgo", "Inflaci\u00f3n", "Estrategia"]
    },
    {
        id: 'inflacion',
        term: "Inflaci\u00f3n",
        definition: "Proceso econ\u00f3mico provocado por el desequilibrio existente entre la producci\u00f3n y la demanda; causa una subida continuada de los precios de la mayor parte de los productos y servicios.",
        category: "Econom\u00eda",
        relatedTerms: ["Poder Adquisitivo", "IPC", "Deflaci\u00f3n"]
    },
    {
        id: 'etf',
        term: "ETF (Exchange Traded Fund)",
        definition: "Fondo de inversi\u00f3n cuya principal caracter\u00edstica es que cotiza en bolsa, igual que una acci\u00f3n. Suelen replicar un \u00edndice burs\u00e1til.",
        category: "Instrumentos",
        relatedTerms: ["Fondo de Inversi\u00f3n", "Indexaci\u00f3n", "Gesti\u00f3n Pasiva"]
    },
    {
        id: 'dividendo',
        term: "Dividendo",
        definition: "Parte de los beneficios de una empresa que se reparte entre sus accionistas.",
        category: "Rentabilidad",
        relatedTerms: ["Payout", "Yield", "Acci\u00f3n"]
    },
    {
        id: 'volatilidad',
        term: "Volatilidad",
        definition: "Medida de la variaci\u00f3n del precio de un activo financiero respecto a su media en un periodo de tiempo determinado. A mayor volatilidad, mayor riesgo y potencial rentabilidad.",
        category: "Riesgo",
        relatedTerms: ["Desviaci\u00f3n T\u00edpica", "Beta", "Riesgo"]
    },
    {
        id: 'asset-allocation',
        term: "Asset Allocation",
        definition: "Distribuci\u00f3n de los activos de una cartera entre diferentes clases (acciones, bonos, efectivo, etc.) seg\u00fan el perfil del inversor.",
        category: "Estrategia",
        relatedTerms: ["Diversificaci\u00f3n", "Rebalanceo", "Perfil de Riesgo"]
    },
    {
        id: 'ipc',
        term: "IPC (\u00cdndice de Precios al Consumo)",
        definition: "Indicador que mide la evoluci\u00f3n de los precios de los bienes y servicios consumidos por las familias en Espa\u00f1a.",
        category: "Econom\u00eda",
        relatedTerms: ["Inflaci\u00f3n", "Cesta de la Compra"]
    },
    {
        id: 'renta-fija',
        term: "Renta Fija",
        definition: "Tipo de inversi\u00f3n formada por todos los activos financieros en los que el emisor est\u00e1 obligado a pagar una rentabilidad fija o variable al inversor durante un periodo determinado.",
        category: "Instrumentos",
        relatedTerms: ["Bonos", "Letras del Tesoro", "Cup\u00f3n"]
    },
    {
        id: 'renta-variable',
        term: "Renta Variable",
        definition: "Tipo de inversi\u00f3n en la que la recuperaci\u00f3n del capital invertido y la rentabilidad no est\u00e1n garantizadas, ni se conocen de antemano.",
        category: "Instrumentos",
        relatedTerms: ["Acciones", "Bolsa", "Riesgo"]
    },
    {
        id: 'bear-market',
        term: "Bear Market",
        definition: "Mercado bajista. Periodo en el que los precios de los activos caen un 20% o m\u00e1s desde sus m\u00e1ximos recientes en medio de un pesimismo generalizado.",
        category: "Bolsa",
        relatedTerms: ["Bull Market", "Crash", "Correcci\u00f3n"]
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
        definition: "Diferencia entre el valor intr\u00ednseco de un activo y su precio de mercado. Es un concepto clave del Value Investing.",
        category: "Valoraci\u00f3n",
        relatedTerms: ["Valor Intr\u00ednseco", "Value Investing"]
    },
    {
        id: 'broker',
        term: "Broker",
        definition: "Entidad o individuo que act\u00faa como intermediario en operaciones de compra y venta de valores financieros a cambio de una comisi\u00f3n.",
        category: "Conceptos B\u00e1sicos",
        relatedTerms: ["Exchange", "Comisi\u00f3n", "Custodia"]
    },
    {
        id: 'faci',
        term: "Fondo de Acumulaci\u00f3n",
        definition: "Fondo de inversi\u00f3n en el que los dividendos o intereses generados se reinvierten automáticamente en el propio fondo en lugar de repartirse.",
        category: "Instrumentos",
        relatedTerms: ["Fondo de Distribuci\u00f3n", "Inter\u00e9s Compuesto"]
    },
    {
        id: 'pib',
        term: "PIB (Producto Interior Bruto)",
        definition: "Valor monetario de todos los bienes y servicios finales producidos por un pa\u00eds en un periodo determinado.",
        category: "Econom\u00eda",
        relatedTerms: ["Crecimiento Econ\u00f3mico", "Recesi\u00f3n"]
    },
    {
        id: 'dca',
        term: "DCA (Dollar-Cost Averaging)",
        definition: "Estrategia de inversi\u00f3n que consiste en invertir una cantidad fija de dinero de forma peri\u00f3dica, independientemente de si el mercado sube o baja. Reduce el impacto emocional y el riesgo de invertir todo en un mal momento.",
        category: "Estrategia",
        relatedTerms: ["Inter\u00e9s Compuesto", "Lump Sum", "Volatilidad"]
    },
    {
        id: 'equity',
        term: "Equity",
        definition: "Participaci\u00f3n en la propiedad de una empresa. En inversi\u00f3n suele usarse como sin\u00f3nimo de acciones o renta variable.",
        category: "Instrumentos",
        relatedTerms: ["Renta Variable", "Acciones", "Capital"]
    },
    {
        id: 'yield',
        term: "Yield",
        definition: "Rentabilidad que genera una inversi\u00f3n en relaci\u00f3n a su precio. Suele expresarse como un porcentaje anual.",
        category: "Rentabilidad",
        relatedTerms: ["Dividendo", "Dividend Yield", "Rentabilidad"]
    },
    {
        id: 'breakeven',
        term: "Breakeven (Punto de Equilibrio)",
        definition: "Nivel a partir del cual una inversi\u00f3n deja de generar p\u00e9rdidas y empieza a ser rentable, cuando los beneficios igualan los costes iniciales.",
        category: "Conceptos B\u00e1sicos",
        relatedTerms: ["Rentabilidad", "Costes", "Comisiones"]
    },
    {
        id: 'apalancamiento',
        term: "Apalancamiento",
        definition: "Uso de deuda o instrumentos financieros para aumentar la exposici\u00f3n a una inversi\u00f3n. Amplifica tanto las ganancias como las p\u00e9rdidas, incrementando significativamente el riesgo.",
        category: "Riesgo",
        relatedTerms: ["Deuda", "Riesgo", "Margen"]
    },
    {
        id: 'portfolio',
        term: "Portfolio (Cartera)",
        definition: "Conjunto de activos financieros que posee un inversor. Su composici\u00f3n determina el nivel de riesgo y la rentabilidad esperada.",
        category: "Conceptos B\u00e1sicos",
        relatedTerms: ["Asset Allocation", "Diversificaci\u00f3n", "Rebalanceo"]
    },
    {
        id: 'chicharro',
        term: "Chicharro (Penny Stock)",
        definition: "Acci\u00f3n de baja capitalizaci\u00f3n, poca liquidez y alta volatilidad. Suele moverse m\u00e1s por especulaci\u00f3n que por fundamentos econ\u00f3micos.",
        category: "Bolsa",
        relatedTerms: ["Volatilidad", "Riesgo", "Small Caps"]
    },
    {
        id: 'hawkish',
        term: "Hawkish",
        definition: "Postura de pol\u00edtica monetaria orientada a combatir la inflaci\u00f3n, normalmente mediante subidas de tipos de inter\u00e9s y retirada de est\u00edmulos.",
        category: "Econom\u00eda",
        relatedTerms: ["Tipos de Inter\u00e9s", "Dovish", "Inflaci\u00f3n"]
    },
    {
        id: 'dovish',
        term: "Dovish",
        definition: "Postura de pol\u00edtica monetaria que prioriza el crecimiento econ\u00f3mico, normalmente mediante tipos de inter\u00e9s bajos y pol\u00edticas monetarias expansivas.",
        category: "Econom\u00eda",
        relatedTerms: ["Tipos de Inter\u00e9s", "Hawkish", "Pol\u00edtica Monetaria"]
    },
    {
        id: 'lump-sum',
        term: "Lump Sum",
        definition: "Estrategia de inversi\u00f3n que consiste en invertir todo el capital disponible de una sola vez, en lugar de hacerlo de forma peri\u00f3dica.",
        category: "Estrategia",
        relatedTerms: ["DCA", "Volatilidad", "Market Timing"]
    },
    {
        id: 'liquidez',
        term: "Liquidez",
        definition: "Facilidad con la que un activo puede convertirse en dinero sin perder valor. El efectivo es el activo m\u00e1s l\u00edquido.",
        category: "Conceptos B\u00e1sicos",
        relatedTerms: ["Mercado", "Riesgo", "Cash"]
    },
    {
        id: 'drawdown',
        term: "Drawdown",
        definition: "Ca\u00edda m\u00e1xima desde un pico hasta un m\u00ednimo en el valor de una inversi\u00f3n o cartera. Representa el peor escenario hist\u00f3rico vivido.",
        category: "Riesgo",
        relatedTerms: ["Volatilidad", "Riesgo", "Crisis"]
    },
    {
        id: 'market-timing',
        term: "Market Timing",
        definition: "Intento de anticipar los movimientos del mercado para comprar en m\u00ednimos y vender en m\u00e1ximos. Hist\u00f3ricamente, muy dif\u00edcil de hacer de forma consistente.",
        category: "Estrategia",
        relatedTerms: ["DCA", "Lump Sum", "Sesgos Cognitivos"]
    },
    {
        id: 'value-trap',
        term: "Value Trap (Trampa de Valor)",
        definition: "Acci\u00f3n que parece barata bas\u00e1ndose en ratios de valoraci\u00f3n (como un PER bajo), pero que en realidad es una mala inversi\u00f3n porque los fundamentos de la empresa est\u00e1n deterior\u00e1ndose permanentemente.",
        category: "Riesgo",
        relatedTerms: ["PER", "Value Investing", "An\u00e1lisis Fundamental"]
    },
    {
        id: 'base-currency',
        term: "Moneda Base (Base Currency)",
        definition: "Divisa en la que mides tu patrimonio y tus objetivos (por ejemplo EUR). Una inversi\u00f3n en otra moneda a\u00f1ade riesgo de tipo de cambio.",
        category: "Riesgo",
        relatedTerms: ["Riesgo de Divisa", "Hedged", "Unhedged"]
    },
    {
        id: 'riesgo-divisa',
        term: "Riesgo de Divisa",
        definition: "Variaci\u00f3n del valor de una inversi\u00f3n causada por cambios en el tipo de cambio entre la moneda del activo y tu moneda base.",
        category: "Riesgo",
        relatedTerms: ["Moneda Base", "Cobertura", "Volatilidad"]
    },
    {
        id: 'hedged',
        term: "Hedged (Cubierto de Divisa)",
        definition: "Versi\u00f3n de un fondo o ETF que intenta neutralizar el impacto de la moneda extranjera mediante derivados. Suele reducir volatilidad, pero tiene coste de cobertura.",
        category: "Instrumentos",
        relatedTerms: ["Unhedged", "Riesgo de Divisa", "Tracking Difference"]
    },
    {
        id: 'unhedged',
        term: "Unhedged (Sin Cobertura de Divisa)",
        definition: "Versi\u00f3n de un fondo o ETF que no cubre la moneda. La rentabilidad final refleja tanto el activo subyacente como el movimiento de la divisa.",
        category: "Instrumentos",
        relatedTerms: ["Hedged", "Riesgo de Divisa", "Moneda Base"]
    },
    {
        id: 'tracking-difference',
        term: "Tracking Difference",
        definition: "Diferencia real de rentabilidad entre un fondo/ETF y su \u00edndice de referencia. Incluye costes, impuestos, fricciones y, en productos cubiertos, el coste de cobertura.",
        category: "Instrumentos",
        relatedTerms: ["TER", "Hedged", "\u00cdndice de Referencia"]
    }
];

// ===== ASSET CLASSES DETAIL =====
export const ASSET_CLASSES_DETAIL = [
    {
        id: 'acciones',
        title: "Renta Variable (Acciones)",
        description: "Representan la propiedad parcial de una empresa. Es el activo con mayor potencial de crecimiento a largo plazo, pero con mayor volatilidad.",
        risk: "Alto",
        return: "Hist\u00f3rico ~7-10%",
        pros: ["Potencial de revalorizaci\u00f3n", "Dividendos", "Liquidez alta"],
        cons: ["Alta volatilidad", "Riesgo de p\u00e9rdida de capital", "Requiere tiempo"],
        instruments: ["Acciones individuales", "Fondos Indexados", "ETFs"]
    },
    {
        id: 'bonos',
        title: "Renta Fija (Bonos)",
        description: "Pr\u00e9stamos que el inversor hace a un gobierno o empresa a cambio de un inter\u00e9s (cup\u00f3n). Sirven para mitigar la volatilidad de la cartera.",
        risk: "Bajo / Medio",
        return: "Hist\u00f3rico ~2-10%",
        pros: ["Ingresos predecibles", "Menor volatilidad que acciones", "Prioridad en cobro"],
        cons: ["Menor potencial de crecimiento", "Riesgo de insolvencia", "Riesgo de tipo de inter\u00e9s"],
        instruments: ["Letras del Tesoro", "Bonos del Estado", "Bonos Corporativos"]
    },
    {
        id: 'reits',
        title: "Real Estate (REITs/SOCIMIs)",
        description: "Inversi\u00f3n en el mercado inmobiliario a trav\u00e9s de bolsa. Estas empresas gestionan propiedades y reparten la mayor\u00eda de sus beneficios.",
        risk: "Medio / Alto",
        return: "Hist\u00f3rico ~6-9%",
        pros: ["Protecci\u00f3n contra inflaci\u00f3n", "Dividendos altos", "Diversificaci\u00f3n real"],
        cons: ["Ciclos inmobiliarios", "Sensibles a tipos de inter\u00e9s", "Riesgo de gesti\u00f3n"],
        instruments: ["REITs (USA)", "SOCIMIs (Espa\u00f1a)", "ETFs Inmobiliarios"]
    },
    {
        id: 'cash',
        title: "Efectivo y Monetarios",
        description: "Dinero en cuentas o activos a muy corto plazo y alta seguridad. Su funci\u00f3n es la liquidez y la preservaci\u00f3n nominal.",
        risk: "Muy Bajo",
        return: "Hist\u00f3rico ~0-2%",
        pros: ["Liquidez inmediata", "P\u00e9rdida de valor nula a corto plazo", "Seguridad m\u00e1xima"],
        cons: ["Batido por la inflaci\u00f3n", "Rentabilidad real negativa a menudo", "Coste de oportunidad"],
        instruments: ["Cuentas remuneradas", "Dep\u00f3sitos", "Fondos Monetarios"]
    },
    {
        id: 'crypto',
        title: "Criptoactivos",
        description: "Activos digitales basados en criptograf\u00eda. Es una clase de activo nueva y extremadamente vol\u00e1til usada para especulaci\u00f3n o reserva de valor digital.",
        risk: "Extremo",
        return: "Impredecible",
        pros: ["Potencial de retorno explosivo", "Descentralizaci\u00f3n", "Transferibilidad"],
        cons: ["Volatilidad extrema", "Riesgo regulatorio", "Posibilidad de p\u00e9rdida total"],
        instruments: ["Bitcoin", "Ethereum", "Stablecoins"]
    },
    {
        id: 'oro',
        title: "Materias Primas (Oro/Commodities)",
        description: "Activos f\u00edsicos que suelen actuar como refugio en tiempos de crisis o alta inflaci\u00f3n. No generan flujos de caja (dividendos).",
        risk: "Medio",
        return: "Reserva de Valor",
        pros: ["Refugio seguro", "Desvinculado del mercado de acciones", "Cobertura inflaci\u00f3n"],
        cons: ["No produce rentas", "Costes de almacenamiento (f\u00edsico)", "Precio c\u00edclico"],
        instruments: ["ETC de Oro", "Oro f\u00edsico", "ETFs de Miner\u00eda"]
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
        { title: "El peque\u00f1o libro que bate al mercado", author: "Joel Greenblatt" },
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
        { name: "Morningstar", url: "https://www.morningstar.es", description: "An\u00e1lisis de fondos y ETFs" },
        { name: "JustETF", url: "https://www.justetf.com", description: "Comparador de ETFs europeos" },
        { name: "CNMV", url: "https://www.cnmv.es", description: "Verificaci\u00f3n de fondos registrados en Espa\u00f1a" },
        { name: "Investing.com", url: "https://es.investing.com", description: "Cotizaciones y calendarios econ\u00f3micos" }
    ],
    podcasts: [
        { name: "M\u00e1s que Dividendos", description: "Podcast espa\u00f1ol sobre inversi\u00f3n indexada" },
        { name: "El \u00e1tico de los libros", description: "Educaci\u00f3n financiera pr\u00e1ctica" }
    ]
};
