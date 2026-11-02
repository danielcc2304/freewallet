import {GuideBlock,GuideGrid,GuideReadingHeader} from '../ui/GuideReading';
import {AcademyGlossarySearch,AcademyGlossaryFilter,AcademyGlossaryCard} from '../ui/AcademyGlossary';

import { useState, useMemo } from 'react';
import { Search, Info } from 'lucide-react';
import { GLOSSARY } from '../../../data/academyData';


export function Glossary() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todas');

    const categories = useMemo(() => {
        const cats = new Set(GLOSSARY.map(item => item.category).filter(Boolean) as string[]);
        return ['Todas', ...Array.from(cats)].sort();
    }, []);

    const filteredTerms = useMemo(() => {
        return GLOSSARY.filter(item => {
            const matchesSearch = item.term.toLowerCase().includes(search.toLowerCase()) ||
                item.definition.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'Todas' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => a.term.localeCompare(b.term));
    }, [search, activeCategory]);

    return (
        <GuideBlock appearance="glossaryPage"  >
            <GuideReadingHeader appearance="glossary" section="Aprender" title={<>Diccionario Financiero</>} description={<>
                    Los conceptos que necesitas dominar para hablar el lenguaje del dinero.
                </>} />

            <GuideBlock appearance="glossaryControls"  >
                <AcademyGlossarySearch icon={<Search className="icon" size={20} />} type="text" placeholder="Buscar término (ej. Dividendos, PER...)" value={search} onChange={(e) => setSearch(e.target.value)} />

                <GuideBlock appearance="glossaryFilters"  >
                    {categories.map(cat => (
                        <AcademyGlossaryFilter key={cat} onClick={() => setActiveCategory(cat)} selected={activeCategory === cat}>
                            {cat}
                        </AcademyGlossaryFilter>
                    ))}
                </GuideBlock>
            </GuideBlock>

            <GuideGrid appearance="glossaryGrid"  variant="glossary">
                {filteredTerms.length > 0 ? (
                    filteredTerms.map((item) => (
                        <AcademyGlossaryCard key={item.id} category={item.category} term={item.term} definition={item.definition} related={item.relatedTerms} />
                    ))
                ) : (
                    <GuideBlock appearance="glossaryEmpty"  >
                        <Info size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No se encontraron términos que coincidan con tu búsqueda.</p>
                    </GuideBlock>
                )}
            </GuideGrid>
        </GuideBlock>
    );
}
