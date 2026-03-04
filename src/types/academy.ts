export interface CrisisData {
    year: number;
    name: string;
    maxDrawdown: number;
    monthsDown: number;
    monthsRecovery: number;
    return5y?: number;
    description?: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    bias: string;
    explanation: string;
}

export interface TimelinePhase {
    id: string;
    phase: number;
    title: string;
    duration: string;
    objective: string;
    strategy?: string;
    allocation?: {
        conservative: string;
        moderate: string;
        aggressive: string;
    };
    commonErrors: string[];
    checklist?: string[];
}

export interface AssetAllocationConfig {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    crypto: number;
}

export interface RiskProfileQuestion {
    id: string;
    question: string;
    options: {
        text: string;
        score: number;
    }[];
}

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export interface GlossaryTerm {
    id: string;
    term: string;
    definition: string;
    category?: string;
    relatedTerms?: string[];
}

export interface ScenarioAction {
    icon: string;
    title: string;
    description: string;
    type: 'do' | 'dont';
}

export interface Scenario {
    id: string;
    title: string;
    emoji: string;
    sections: {
        title: string;
        content: string | ScenarioAction[];
    }[];
}

export interface Fund {
    id: string;
    name: string;
    isin: string;
    category: string;
    manager: string;
    risk: number; // SRRI 1-7
    ter: number; // Fixed/Management fees
    returns: {
        ytd: number;
        y1: number;
        y3?: number;
        y5?: number;
    };
    volatility: number;
    sharpe?: number;
    maxDrawdown?: number;
    aum?: string; // Assets Under Management (e.g. "1.2B €")
    // Fixed Income specifics
    duration?: number;
    rating?: string;
    yieldToMaturity?: number;
    // Allocation
    allocation?: {
        label: string;
        value: number;
    }[];
    minInvestment?: string;
    description?: string;
    link?: string;
}
