interface AssetGuideNavProps {
    sections: { id: string; label: string }[];
}

/** In-page links keep the long guides usable without hiding their content. */
export function AssetGuideNav({ sections }: AssetGuideNavProps) {
    return (
        <nav className="asset-guide-nav" aria-label="Secciones de esta guía">
            <span className="asset-guide-nav__label">En esta guía</span>
            <div className="asset-guide-nav__links">
                {sections.map(({ id, label }) => (
                    <a key={id} href={`#${id}`}>{label}</a>
                ))}
            </div>
        </nav>
    );
}
