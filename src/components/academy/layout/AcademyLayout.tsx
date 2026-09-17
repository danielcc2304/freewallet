import { Outlet } from 'react-router-dom';
import { useAppearance } from '../../../context/AppearanceContext';
import './AcademyLayout.css';

export function AcademyLayout() {
    const { isLiquidGlass } = useAppearance();

    return (
        <div className={`academy${isLiquidGlass ? ' academy--liquid-glass' : ''}`}>
            <main className="academy__content">
                <Outlet />
            </main>
        </div>
    );
}
