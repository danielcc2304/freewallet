import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../../utils/cn';

interface AcademyProgressCardProps {
    to: LinkProps['to'];
    title: ReactNode;
    description: ReactNode;
    icon: ReactNode;
    done: boolean;
    onOpen: LinkProps['onClick'];
    onToggle: () => void;
}

/** A lesson link and an independent, accessible completion action. State stays with the learning route. */
export function AcademyProgressCard({ to, title, description, icon, done, onOpen, onToggle }: AcademyProgressCardProps) {
    return <div className={cn('fundamentos__mini-card tw:p-[1rem_1rem_.95rem] tw:grid tw:grid-cols-[minmax(0,1fr)_auto] tw:[align-items:start] tw:gap-[.75rem] tw:rounded-[8px] tw:min-h-full tw:[@media(max-width:768px)]:grid-cols-[1fr] tw:[@media(max-width:768px)]:pl-[.7rem]', done ? 'fundamentos__mini-card--done tw:[border-left:4px_solid_var(--accent-primary)] tw:bg-[rgba(var(--accent-rgb),.08)]' : 'tw:[border-left:4px_solid_#3b82f6] tw:bg-[rgba(59,130,246,.08)]')}>
        <Link to={to} onClick={onOpen} className="fundamentos__mini-link tw:grid tw:grid-cols-[auto_1fr] tw:gap-[.75rem] tw:text-inherit tw:no-underline">
            <span className={cn('fundamentos__mini-icon tw:text-[1.4rem]', done && 'tw:text-accent')}>{icon}</span>
            <div><strong className="tw:block tw:mb-[.25rem] tw:text-main">{title}</strong><p className="tw:m-0 tw:text-secondary tw:text-[.92rem] tw:leading-[1.5]">{description}</p></div>
        </Link>
        <div className="fundamentos__mini-actions tw:flex tw:gap-[.55rem] tw:self-center tw:[@media(max-width:768px)]:flex-wrap tw:[@media(max-width:768px)]:justify-start">
            <button type="button" aria-pressed={done} onClick={onToggle} className={cn('fundamentos__mini-action fundamentos__mini-action--status tw:ui-border-default tw:rounded-[999px] tw:p-[.38rem_.78rem] tw:cursor-pointer tw:[transition:transform_.2s_ease,border-color_.2s_ease,background_.2s_ease,color_.2s_ease] tw:hover:[transform:translateY(-1px)] tw:font-bold tw:text-[.84rem]', done
                ? 'fundamentos__mini-action--done tw:bg-[rgba(16,185,129,.18)] tw:border-[rgba(16,185,129,.42)] tw:text-main tw:[[data-theme=light]_&]:text-[#047857]'
                : 'fundamentos__mini-action--pending tw:bg-[rgba(59,130,246,.1)] tw:border-[rgba(59,130,246,.28)] tw:text-[color:var(--accent-secondary)] tw:[[data-theme=light]_&]:text-[#1d4ed8]')}>{done ? 'Visto' : 'Pendiente'}</button>
        </div>
    </div>;
}
