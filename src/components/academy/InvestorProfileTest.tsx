import { useState } from 'react';
import {
    Target, ArrowRight, RotateCcw, Shield, Scale,
    TrendingUp, PieChart, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './InvestorProfileTest.css';

interface Question {
    id: number;
    text: string;
    options: {
        text: string;
        score: number;
    }[];
}

const QUESTIONS: Question[] = [
    {
        id: 1,
        text: "¿Cuál es tu horizonte temporal de inversión?",
        options: [
            { text: "Menos de 2 años", score: 1 },
            { text: "Entre 2 y 5 años", score: 2 },
            { text: "Entre 5 y 10 años", score: 3 },
            { text: "Más de 10 años", score: 4 }
        ]
    },
    {
        id: 2,
        text: "¿Cuál es tu objetivo financiero principal?",
        options: [
            { text: "Preservar mi capital y evitar pérdidas", score: 1 },
            { text: "Generar ingresos extra de forma estable", score: 2 },
            { text: "Crecimiento del capital a largo plazo", score: 3 },
            { text: "Maximizar beneficios asumiendo riesgos elevados", score: 4 }
        ]
    },
    {
        id: 3,
        text: "Si tu cartera cae un 20% en un mes por una crisis, ¿cómo reaccionas?",
        options: [
            { text: "Vendo todo inmediatamente por miedo", score: 1 },
            { text: "Vendo una parte para proteger el resto", score: 2 },
            { text: "Mantengo la calma y espero a que se recupere", score: 3 },
            { text: "Lo veo como una oferta y compro más", score: 4 }
        ]
    },
    {
        id: 4,
        text: "¿Qué nivel de conocimientos tienes sobre inversión?",
        options: [
            { text: "Ninguno o muy básico", score: 1 },
            { text: "Conozco los activos básicos (acciones, bonos)", score: 2 },
            { text: "Entiendo conceptos como diversificación y riesgo", score: 3 },
            { text: "Experto: analizo fundamentales y gestiono mi cartera", score: 4 }
        ]
    },
    {
        id: 5,
        text: "¿Cómo calificarías la estabilidad de tus ingresos?",
        options: [
            { text: "Inestables o actualmente sin empleo fijo", score: 1 },
            { text: "Variables (autónomo, comisiones, etc.)", score: 2 },
            { text: "Estables (contrato indefinido, funcionario)", score: 3 },
            { text: "Muy elevados y con alta capacidad de ahorro", score: 4 }
        ]
    }
];

type ProfileType = 'Conservador' | 'Moderado' | 'Agresivo';

export function InvestorProfileTest() {
    const [step, setStep] = useState<'start' | 'quiz' | 'result'>('start');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);

    const handleStart = () => {
        setStep('quiz');
        setCurrentQuestion(0);
        setScore(0);
        setAnswers([]);
    };

    const handleAnswer = (optionScore: number) => {
        const newScore = score + optionScore;
        const newAnswers = [...answers, optionScore];

        if (currentQuestion < QUESTIONS.length - 1) {
            setScore(newScore);
            setAnswers(newAnswers);
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setScore(newScore);
            setStep('result');
        }
    };

    const getProfile = (): { type: ProfileType; icon: any; desc: string; auth: string } => {
        if (score <= 9) {
            return {
                type: 'Conservador',
                icon: Shield,
                desc: 'Priorizas la seguridad por encima de la rentabilidad. Te sientes incómodo con la volatilidad y prefieres activos estables como bonos o depósitos.',
                auth: '20% RV / 80% RF'
            };
        } else if (score <= 15) {
            return {
                type: 'Moderado',
                icon: Scale,
                desc: 'Buscas un equilibrio entre crecimiento y seguridad. Aceptas fluctuaciones moderadas a cambio de superar la inflación a largo plazo.',
                auth: '60% RV / 40% RF'
            };
        } else {
            return {
                type: 'Agresivo',
                icon: TrendingUp,
                desc: 'Tu objetivo es maximizar la rentabilidad a largo plazo. Entiendes que la volatilidad es parte del camino y estás dispuesto a ver caídas fuertes a cambio de un crecimiento explosivo.',
                auth: '100% RV / 0% RF'
            };
        }
    };

    const profile = getProfile();
    const ProgressIcon = profile.icon;

    return (
        <div className="investor-profile">
            <header className="investor-profile__header">
                <h1>Test de Perfil de Inversor</h1>
                <p>Descubre qué tipo de inversor eres y qué estrategia se adapta mejor a tu psicología y objetivos.</p>
            </header>

            <div className="quiz-card">
                {step === 'start' && (
                    <div className="quiz-start">
                        <div className="quiz-start__icon">
                            <Target size={40} />
                        </div>
                        <h2>¿Estás listo para conocerte?</h2>
                        <p>Este test de 5 preguntas analizará tu tolerancia al riesgo y horizonte temporal para sugerirte una distribución de activos ideal.</p>
                        <button className="quiz-button" onClick={handleStart}>
                            Empezar Test <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                        </button>
                    </div>
                )}

                {step === 'quiz' && (
                    <div className="quiz-question">
                        <span className="quiz-question__step">Pregunta {currentQuestion + 1} de {QUESTIONS.length}</span>
                        <h2 className="quiz-question__text">{QUESTIONS[currentQuestion].text}</h2>

                        <div className="quiz-options">
                            {QUESTIONS[currentQuestion].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    className="quiz-option"
                                    onClick={() => handleAnswer(option.score)}
                                >
                                    {option.text}
                                </button>
                            ))}
                        </div>

                        <div className="quiz-progress">
                            <div
                                className="quiz-progress__bar"
                                style={{ width: `${((currentQuestion) / QUESTIONS.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {step === 'result' && (
                    <div className="quiz-result">
                        <div className={`quiz-result__badge quiz-result__badge--${profile.type.toLowerCase()}`}>
                            <ProgressIcon size={16} />
                            Perfil {profile.type}
                        </div>
                        <h2 className="quiz-result__title">Eres un inversor {profile.type}</h2>
                        <p className="quiz-result__desc">{profile.desc}</p>

                        <div className="suggested-portfolio">
                            <h3><PieChart size={20} color="var(--accent-primary)" /> Tu Cartera Recomendada</h3>
                            <div className="portfolio-preview">
                                <div className="portfolio-preview__info">
                                    <span className="portfolio-preview__label">Asignación de Activos</span>
                                    <span className="portfolio-preview__value">{profile.auth}</span>
                                </div>
                                <Link to="/academy/portfolio" className="quiz-button">
                                    Ver Mi Estrategia <ChevronRight size={18} />
                                </Link>
                            </div>
                        </div>

                        <div className="quiz-result__actions" style={{ marginTop: '3rem' }}>
                            <button className="quiz-button button--secondary" onClick={handleStart}>
                                <RotateCcw size={18} /> Repetir Test
                            </button>
                            <Link to="/academy" className="quiz-button" style={{ textDecoration: 'none' }}>
                                <CheckCircle2 size={18} /> Finalizar
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InvestorProfileTest;
