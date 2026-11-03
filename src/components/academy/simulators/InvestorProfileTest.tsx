import { AcademyQuizIntro, AcademyQuizQuestion, AcademyQuizResult, AcademyQuizButton, AcademyQuizLink, AcademyQuizChoice, AcademyQuizRecommendation, AcademyQuizActions } from '../ui/AcademyQuiz';
import { AcademyPanel } from '../ui/AcademyPanel';
import { useState } from 'react';
import {
    Target, ArrowRight, RotateCcw, Shield, Scale,
    TrendingUp, PieChart, CheckCircle2, ChevronRight, type LucideIcon
} from 'lucide-react';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
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

    const getProfile = (): { type: ProfileType; icon: LucideIcon; desc: string; auth: string } => {
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
            <AcademyPageHeader className="investor-profile__header" section="Construir">
                <h1>Test de Perfil de Inversor</h1>
                <p>Descubre qué tipo de inversor eres y qué estrategia se adapta mejor a tu psicología y objetivos.</p>
            </AcademyPageHeader>

            <AcademyPanel variant="quiz" className="quiz-card">
                {step === 'start' && (
                    <AcademyQuizIntro icon={<>
                            <Target size={40} />
                        </>} title={<>¿Estás listo para conocerte?</>} description={<>Este test de 5 preguntas analizará tu tolerancia al riesgo y horizonte temporal para sugerirte una distribución de activos ideal.</>}><AcademyQuizButton onClick={handleStart} >
                            Empezar Test <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                        </AcademyQuizButton></AcademyQuizIntro>
                )}

                {step === 'quiz' && (
                    <AcademyQuizQuestion step={<>Pregunta {currentQuestion + 1} de {QUESTIONS.length}</>} title={<>{QUESTIONS[currentQuestion].text}</>} progress={(currentQuestion / QUESTIONS.length) * 100}>
                            {QUESTIONS[currentQuestion].options.map((option, idx) => (
                                <AcademyQuizChoice key={idx} onClick={() => handleAnswer(option.score)}>
                                    {option.text}
                                </AcademyQuizChoice>
                            ))}
                        </AcademyQuizQuestion>
                )}

                {step === 'result' && (
                    <AcademyQuizResult badge={<>
                            <ProgressIcon size={16} />
                            Perfil {profile.type}
                        </>} type={profile.type.toLowerCase() as 'conservador' | 'moderado' | 'agresivo'} title={<>Eres un inversor {profile.type}</>} description={<>{profile.desc}</>}><AcademyQuizRecommendation title={<><PieChart size={20} color="var(--accent-primary)" /> Tu Cartera Recomendada</>} label={<>Asignación de Activos</>} value={<>{profile.auth}</>} action={<AcademyQuizLink to="/academy/portfolio" >
                                    Ver Mi Estrategia <ChevronRight size={18} />
                                </AcademyQuizLink>} /><AcademyQuizActions style={{ marginTop: '3rem' }}>
                            <AcademyQuizButton onClick={handleStart} secondary>
                                <RotateCcw size={18} /> Repetir Test
                            </AcademyQuizButton>
                            <AcademyQuizLink to="/academy" style={{ textDecoration: 'none' }} >
                                <CheckCircle2 size={18} /> Finalizar
                            </AcademyQuizLink>
                        </AcademyQuizActions></AcademyQuizResult>
                )}
            </AcademyPanel>
        </div>
    );
}

export default InvestorProfileTest;
