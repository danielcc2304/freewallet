import { verifiedSecurityAlias } from '../securityAliases';

interface CompanyOverview {
    description: string;
    source: string;
    url: string;
}

// Short Spanish summaries of these companies' published activities. Match
// verified symbols only; a similar company name is not proof of identity.
const NEXTIL: CompanyOverview = {
    description: 'Nextil (Nueva Expresión Textil) es un grupo textil que desarrolla tejidos y confecciona prendas para otras marcas. Trabaja en segmentos como lujo, deporte, baño, lencería y aplicaciones médicas.',
    source: 'Nextil', url: 'https://www.nextil.com/',
};
const KNOWN: Record<string, CompanyOverview> = {
    'AMP.MC': {
        description: 'Amper es un grupo tecnológico e industrial con actividad en defensa, seguridad y comunicaciones, además de energía y sostenibilidad. Desarrolla sistemas de comunicaciones, electrónica y soluciones para infraestructuras energéticas.',
        source: 'Grupo Amper', url: 'https://www.grupoamper.com/',
    },
    'OHLA.MC': {
        description: 'OHLA es un grupo de construcción e infraestructuras. Ejecuta proyectos de obra civil, edificación e instalaciones industriales, como carreteras, ferrocarriles, hospitales y proyectos de energía.',
        source: 'OHLA', url: 'https://ohla-group.com/',
    },
};

function briefDescription(value: string): string {
    const clean = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // Stop after two sentences, without splitting abbreviations such as Inc.
    const sentences = new Intl.Segmenter('en', { granularity: 'sentence' }).segment(clean);
    const brief = Array.from(sentences).slice(0, 2).map(item => item.segment).join('').trim();
    if (brief.length <= 420) return brief;
    const cut = brief.slice(0, 419);
    return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : cut.length).trimEnd()}…`;
}

export function companyOverview(symbol: string, publishedDescription?: string): CompanyOverview | undefined {
    const ticker = symbol.trim().toUpperCase();
    if (verifiedSecurityAlias('', ticker)) return NEXTIL;
    if (KNOWN[ticker]) return KNOWN[ticker];
    if (!publishedDescription?.trim()) return undefined;
    const description = briefDescription(publishedDescription);
    return description ? { description, source: 'Yahoo Finance', url: `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/profile/` } : undefined;
}
