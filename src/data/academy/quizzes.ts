import type { QuizQuestion, RiskProfileQuestion } from '../../types/types';

// ===== BIAS QUIZ QUESTIONS =====
export const BIAS_QUIZ: QuizQuestion[] = [
    {
        id: 'q1',
        question: "Compraste una acci\u00f3n en 100\u20ac. Ahora vale 70\u20ac. El resto del mercado est\u00e1 estable. \u00bfQu\u00e9 haces?",
        options: [
            "Vendo para evitar m\u00e1s p\u00e9rdidas",
            "Compro m\u00e1s porque est\u00e1 en descuento",
            "Mantengo seg\u00fan mi plan original",
            "Entro en p\u00e1nico y no s\u00e9 qu\u00e9 hacer"
        ],
        correctAnswer: 2,
        bias: "Sesgo de aversi\u00f3n a p\u00e9rdidas",
        explanation: "Vender solo porque est\u00e1 en p\u00e9rdidas es un error emocional. Lo correcto es revisar si los fundamentales cambiaron. Si no, mantener seg\u00fan el plan es lo m\u00e1s racional."
    },
    {
        id: 'q2',
        question: "Un gur\u00fa en X dice que 'X acci\u00f3n va a triplicar'. Ya tienes exposici\u00f3n. \u00bfQu\u00e9 haces?",
        options: [
            "Compro m\u00e1s, debe saber algo",
            "Vendo, suena a trampa",
            "Ignoro y sigo mi plan",
            "Investigo por mi cuenta antes de decidir"
        ],
        correctAnswer: 3,
        bias: "Sesgo de autoridad y confirmaci\u00f3n",
        explanation: "Nunca sigas consejos an\u00f3nimos sin verificar. Investigar por ti mismo es fundamental. Los 'gur\u00fas' a menudo tienen intereses ocultos."
    },
    {
        id: 'q3',
        question: "El mercado cae un 20% en un mes. \u00bfCu\u00e1l es tu reacci\u00f3n?",
        options: [
            "Vendo todo y espero a que se estabilice",
            "Ignoro las noticias y sigo invirtiendo seg\u00fan plan",
            "Leo todas las noticias para entender qu\u00e9 pasa",
            "Llamo a mi asesor desesperado"
        ],
        correctAnswer: 1,
        bias: "Sesgo de recencia y p\u00e1nico de masas",
        explanation: "Las ca\u00eddas de 20% son normales cada pocos a\u00f1os. Vender en p\u00e1nico es el mayor error. Mantener el plan y seguir con DCA suele ser lo mejor."
    },
    {
        id: 'q4',
        question: "Una acci\u00f3n tecnol\u00f3gica ha subido 300% en 6 meses. \u00bfEntras ahora?",
        options: [
            "S\u00ed, la tendencia es mi amiga",
            "No, ya llegu\u00e9 tarde",
            "Depende de la valoraci\u00f3n y fundamentales",
            "Invierto solo un poco por si sigue"
        ],
        correctAnswer: 2,
        bias: "FOMO (Fear of Missing Out)",
        explanation: "Las subidas pasadas no predicen las futuras. Lo que importa es si la valoraci\u00f3n actual tiene sentido. FOMO es uno de los peores sesgos."
    },
    {
        id: 'q5',
        question: "Tienes 10.000\u20ac en una acci\u00f3n que ha subido 50%. \u00bfQu\u00e9 haces?",
        options: [
            "Vendo y aseguro beneficios",
            "Mantengo, puede seguir subiendo",
            "Vendo parte (50%) para asegurar algo",
            "Reviso si sigue cumpliendo mi tesis de inversi\u00f3n"
        ],
        correctAnswer: 3,
        bias: "Efecto disposici\u00f3n",
        explanation: "La decisi\u00f3n no debe basarse en si ganaste o perdiste, sino en si la acci\u00f3n sigue siendo una buena inversi\u00f3n HOY. Revisar la tesis es clave."
    },
    {
        id: 'q6',
        question: "Acabas de leer 10 art\u00edculos alcistas sobre una empresa. \u00bfQu\u00e9 haces?",
        options: [
            "Compro, est\u00e1 claro que va a subir",
            "Busco art\u00edculos bajistas para equilibrar",
            "Analizo datos objetivos (earnings, PER, deuda, etc.)",
            "Espero un d\u00eda a ver si cambia la opini\u00f3n"
        ],
        correctAnswer: 2,
        bias: "Sesgo de confirmaci\u00f3n",
        explanation: "Leer solo opiniones que confirman tu hip\u00f3tesis es peligroso. Los datos objetivos y buscar opiniones contrarias te ayuda a tomar mejores decisiones."
    },
    {
        id: 'q7',
        question: "Inviertes en un fondo que pierde 3 a\u00f1os seguidos. \u00bfQu\u00e9 haces?",
        options: [
            "Vendo, claramente es malo",
            "Mantengo, la reversi\u00f3n a la media llegar\u00e1",
            "Investigo si el gestor cambi\u00f3 o los fundamentales empeoraron",
            "Espero un a\u00f1o m\u00e1s por si acaso"
        ],
        correctAnswer: 2,
        bias: "Apego emocional y coste hundido",
        explanation: "Tres a\u00f1os malos pueden ser mala suerte o problemas reales. Investigar si algo cambi\u00f3 estructuralmente es crucial antes de decidir."
    },
    {
        id: 'q8',
        question: "Un compa\u00f1ero de trabajo ha ganado 50% invirtiendo en cripto. \u00bfQu\u00e9 haces?",
        options: [
            "Invierto en cripto tambi\u00e9n",
            "Le pregunto qu\u00e9 compr\u00f3 exactamente y copio",
            "Me alegro por \u00e9l pero sigo mi estrategia",
            "Me siento mal por haberme perdido esa oportunidad"
        ],
        correctAnswer: 2,
        bias: "Envidia y comparaci\u00f3n social",
        explanation: "Compararte con otros es destructivo. Cada uno tiene objetivos, plazos y tolerancia al riesgo diferentes. Mant\u00e9n tu plan."
    },
    {
        id: 'q9',
        question: "\u00bfCu\u00e1ntas horas al d\u00eda dedicas a mirar tu cartera?",
        options: [
            "0, no la miro casi nunca",
            "0.5-1 hora, una vez al d\u00eda",
            "2-3 horas, varias veces al d\u00eda",
            "M\u00e1s de 3 horas, estoy obsesionado"
        ],
        correctAnswer: 0,
        bias: "Sobreconfianza y overtrading",
        explanation: "Si inviertes a largo plazo, mirar la cartera constantemente genera ansiedad y decisiones emocionales. Una vez al mes suele ser suficiente."
    },
    {
        id: 'q10',
        question: "Tu cartera sube 10% en un mes. \u00bfC\u00f3mo te sientes?",
        options: [
            "Euf\u00f3rico, soy un genio",
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
        question: "\u00bfCu\u00e1l es tu horizonte temporal de inversi\u00f3n?",
        options: [
            { text: "Menos de 3 a\u00f1os", score: 1 },
            { text: "3-5 a\u00f1os", score: 2 },
            { text: "5-10 a\u00f1os", score: 3 },
            { text: "M\u00e1s de 10 a\u00f1os", score: 4 }
        ]
    },
    {
        id: 'rp2',
        question: "Si tu cartera pierde un 20% en un mes, \u00bfqu\u00e9 har\u00edas?",
        options: [
            { text: "Vender\u00eda todo inmediatamente", score: 1 },
            { text: "Me preocupar\u00eda mucho pero mantendr\u00eda", score: 2 },
            { text: "Lo ver\u00eda como algo normal", score: 3 },
            { text: "Aprovechar\u00eda para comprar m\u00e1s", score: 4 }
        ]
    },
    {
        id: 'rp3',
        question: "\u00bfQu\u00e9 porcentaje de tu patrimonio puedes permitirte perder sin afectar tu vida?",
        options: [
            { text: "Menos del 10%", score: 1 },
            { text: "10-25%", score: 2 },
            { text: "25-50%", score: 3 },
            { text: "M\u00e1s del 50%", score: 4 }
        ]
    },
    {
        id: 'rp4',
        question: "\u00bfCu\u00e1l es tu experiencia previa invirtiendo?",
        options: [
            { text: "Ninguna, soy principiante", score: 1 },
            { text: "He invertido ocasionalmente", score: 2 },
            { text: "Invierto regularmente hace a\u00f1os", score: 3 },
            { text: "Soy inversor experimentado", score: 4 }
        ]
    },
    {
        id: 'rp5',
        question: "\u00bfCu\u00e1l es tu objetivo principal?",
        options: [
            { text: "Preservar capital, evitar p\u00e9rdidas", score: 1 },
            { text: "Generar ingresos estables", score: 2 },
            { text: "Crecimiento moderado a largo plazo", score: 3 },
            { text: "M\u00e1ximo crecimiento, acepto volatilidad", score: 4 }
        ]
    },
    {
        id: 'rp6',
        question: "\u00bfC\u00f3mo reaccionas ante la volatilidad del mercado?",
        options: [
            { text: "Me estresa mucho, pierdo el sue\u00f1o", score: 1 },
            { text: "Me incomoda pero lo tolero", score: 2 },
            { text: "Lo veo como parte del proceso", score: 3 },
            { text: "Me gusta, es oportunidad", score: 4 }
        ]
    },
    {
        id: 'rp7',
        question: "\u00bfQu\u00e9 rentabilidad anual esperas?",
        options: [
            { text: "2-4% (batir inflaci\u00f3n)", score: 1 },
            { text: "4-6% (bajo riesgo)", score: 2 },
            { text: "6-10% (moderado)", score: 3 },
            { text: "M\u00e1s del 10% (agresivo)", score: 4 }
        ]
    },
    {
        id: 'rp8',
        question: "\u00bfC\u00f3mo es tu situaci\u00f3n laboral?",
        options: [
            { text: "Inestable o cercana a jubilaci\u00f3n", score: 1 },
            { text: "Estable pero sin grandes ahorros", score: 2 },
            { text: "Estable con colch\u00f3n de emergencia", score: 3 },
            { text: "Muy estable con m\u00faltiples fuentes de ingreso", score: 4 }
        ]
    }
];
