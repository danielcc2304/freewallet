import type { ReactNode } from 'react';
import { experimentStyle as s } from './AcademyBondExperiments.styles';
export function AcademySpreadExperiment({
    title,
    intro,
    mode,
    presets,
    stressEnabled,
    stressChoices,
    controls,
    results,
    note,
}: {
    title: ReactNode;
    intro: ReactNode;
    mode: ReactNode;
    presets: ReactNode;
    stressEnabled: boolean;
    stressChoices: ReactNode;
    controls: ReactNode;
    results: ReactNode;
    note: ReactNode;
}) {
    return (
        <div className={s('spread-sim')}>
            <h3>{title}</h3>
            <p className={s('spread-sim__intro')}>{intro}</p>
            <div className={s('spread-sim__mode')}>{mode}</div>
            <div className={s('spread-sim__preset-buttons')}>{presets}</div>
            {stressEnabled && <div className={s('spread-sim__stress-presets')}>{stressChoices}</div>}
            <div className={s('spread-sim__controls')}>{controls}</div>
            <div className={s('spread-sim__result')}>{results}</div>
            <p className={s('spread-sim__note')}>{note}</p>
        </div>
    );
}
export function AcademyDurationExperiment({
    inputs,
    summary,
    children,
}: {
    inputs: ReactNode;
    summary: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={s('bond-duration-calc')}>
            <div className={s('bond-duration-calc__inputs')}>{inputs}</div>
            <div className={s('bond-duration-calc__summary')}>{summary}</div>
            {children}
        </div>
    );
}
