import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils/cn';
import { settingsControlClass } from './settingsControlStyles';
import { portfolioInputClass } from './portfolioInputStyles';

type Props = ({ as: 'input' } & ComponentPropsWithRef<'input'> | { as: 'select' } & ComponentPropsWithRef<'select'>) & { appearance: 'settings' | 'portfolio' };
const controlStyle = (appearance: Props['appearance']) => appearance === 'settings' ? settingsControlClass('settings__input') : portfolioInputClass('portfolio-csv-select');

/** Native input/select props and refs pass through without changing parsing or controlled state. */
export function NativeControl(props: Props) {
    if (props.as === 'input') {
        const { as: Input, appearance, className, ...input } = props;
        return <Input {...input} className={cn(controlStyle(appearance), className)} />;
    }
    const { as: Select, appearance, className, ...select } = props;
    return <Select {...select} className={cn(controlStyle(appearance), className)} />;
}
