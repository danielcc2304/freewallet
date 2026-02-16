import { Outlet } from 'react-router-dom';
import './AcademyLayout.css';

export function AcademyLayout() {
    return (
        <div className="academy">
            <main className="academy__content">
                <Outlet />
            </main>
        </div>
    );
}
