import {layoutPresentationClasses} from '../../layout/LayoutPresentation.styles';
import {Outlet} from 'react-router-dom';
import {useAppearance} from '../../../context/AppearanceContext';



export function AcademyLayout() {
    const { isLiquidGlass } = useAppearance();

    return (
        <div className={layoutPresentationClasses(`academy${isLiquidGlass ? ' academy--liquid-glass' : ''}`)}>
            <main className={layoutPresentationClasses("academy__content")}>
                <Outlet />
            </main>
        </div>
    );
}
