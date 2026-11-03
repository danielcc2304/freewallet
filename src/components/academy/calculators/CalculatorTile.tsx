import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { calculatorCatalogStyles as styles } from './calculatorCatalogStyles';

interface CalculatorTileProps {
    to: string;
    icon: ReactNode;
    tone: 'green' | 'blue' | 'orange-fire' | 'purple' | 'orange' | 'red' | 'teal';
    iconStyle?: CSSProperties;
    title: string;
    description: string;
    features: readonly string[];
}

/** One catalog tile owns layout, navigation and feature styling for every tool. */
export function CalculatorTile({ to, icon, tone, iconStyle, title, description, features }: CalculatorTileProps) {
    return <Link to={to} className={cn('calculators__card calculators__card--available', styles['calculators__card'], styles['calculators__card--available'])}>
        <div className={cn('calculators__card-icon', `calculators__card-icon--${tone}`, styles['calculators__card-icon'], styles[`calculators__card-icon--${tone}`])} style={iconStyle}>{icon}</div>
        <h3 className={cn('calculators__card-title', styles['calculators__card-title'])}>{title}</h3>
        <p className={cn('calculators__card-description', styles['calculators__card-description'])}>{description}</p>
        <ul className={cn('calculators__card-features', styles['calculators__card-features'])}>
            {features.map(feature => <li key={feature}>{feature}</li>)}
        </ul>
    </Link>;
}
