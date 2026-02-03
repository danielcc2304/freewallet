import { useState, useMemo } from 'react';
import { Search, Info } from 'lucide-react';
import { GLOSSARY } from '../../data/academyData';
import './Glossary.css';

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
        <div className="glossary-page">
            <header className="glossary-page__header">
                <h1 className="glossary-page__title">Diccionario Financiero</h1>
                <p className="glossary-page__subtitle">
                    Los conceptos que necesitas dominar para hablar el lenguaje del dinero.
                    Busca cualquier término o filtra por categoría.
                </p>
            </header>

            <div className="glossary-controls">
                <div className="glossary-search">
                    <Search className="icon" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar término (ej. Dividendos, PER...)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="glossary-filters">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glossary-grid">
                {filteredTerms.length > 0 ? (
                    filteredTerms.map((item) => (
                        <article key={item.id} className="glossary-card">
                            <span className="glossary-card__category">{item.category}</span>
                            <h2 className="glossary-card__term">{item.term}</h2>
                            <p className="glossary-card__def">{item.definition}</p>

                            {item.relatedTerms && item.relatedTerms.length > 0 && (
                                <div className="glossary-card__related">
                                    <h5>Relacionado</h5>
                                    <div className="related-tags">
                                        {item.relatedTerms.map(tag => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </article>
                    ))
                ) : (
                    <div className="glossary-empty">
                        <Info size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No se encontraron términos que coincidan con tu búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
