import type { ReactNode } from 'react';
import { AcademyPanel } from './AcademyPanel';
import { assetCategoryClass as part } from './assetCategoryStyles';
import { cn } from '../../../utils/cn';

interface Props {
    title: ReactNode;
    risk: string;
    description: ReactNode;
    duration: ReactNode;
}

const riskStyles = {
    mnimo: part('bond-subtype__risk--mnimo'), muybajo: part('bond-subtype__risk--muybajo'), bajo: part('bond-subtype__risk--bajo'),
    bajomedio: part('bond-subtype__risk--bajomedio'), medio: part('bond-subtype__risk--medio'), alto: part('bond-subtype__risk--alto'), muyalto: part('bond-subtype__risk--muyalto'),
};

export function BondCategoryCard({ title, risk, description, duration }: Props) {
    const riskClassName = `bond-subtype__risk bond-subtype__risk--${risk.toLowerCase().replace(/[^a-z]/g, '')}`;
    const tone = Object.entries(riskStyles).find(([key]) => riskClassName.split(/\s+/).includes(`bond-subtype__risk--${key}`))?.[1];
    return <AcademyPanel variant="bondSubtype" className={part('bond-subtype')}>
        <div className={part('bond-subtype__header')}><h4>{title}</h4><span className={cn(part('bond-subtype__risk'), tone, riskClassName)}>{risk}</span></div>
        <p>{description}</p><span className={part('bond-subtype__duration')}>{duration}</span>
    </AcademyPanel>;
}
