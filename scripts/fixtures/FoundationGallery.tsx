import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button, buttonStyles, Card, CardHeader, Input, MetricCard, Modal, PageHeader } from '../../src/components/ui';

export function FoundationGallery() {
    const [open, setOpen] = useState(false);
    return <div style={{ display: 'grid', gap: '1rem' }}>
        <PageHeader eyebrow="Componentes"><h1>Interfaz compartida</h1><p>Datos sintéticos para verificar los temas.</p></PageHeader>
        <Card>
            <CardHeader title="Acciones" subtitle="Variantes compartidas" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <Button data-test="primary">Guardar cambios</Button>
                <Button data-test="secondary" variant="secondary">Cancelar</Button>
                <Button variant="ghost">Más opciones</Button>
                <Button variant="danger">Eliminar</Button>
                <Button data-test="loading" loading>Guardando cambios</Button>
                <Button data-test="disabled" disabled>Desactivado</Button>
                <Button data-test="open-modal" onClick={() => setOpen(true)}>Abrir diálogo</Button>
                <a data-test="button-link" href="#foundation" className={buttonStyles({ variant: 'secondary' })}>Ver novedades</a>
            </div>
        </Card>
        <Card className="foundation-fields">
            <Input id="gallery-email" label="Correo" icon={<Mail size={18} />} hint="Ayuda asociada al campo" />
            <Input id="gallery-error" label="Campo con error" error="Revisa este dato" />
        </Card>
        <Card className="foundation-override tw:p-4">Tarjeta con relleno compacto</Card>
        <MetricCard title="Valor actual" value="1.234,56 €" change={2.5} />
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Diálogo compartido">
            <p>El foco permanece en este diálogo.</p>
            <Button onClick={() => setOpen(false)}>Terminar</Button>
        </Modal>
    </div>;
}

// This fixture mounts itself only when explicitly imported by the browser test.
{
    const node = document.createElement('section');
    node.dataset.foundationGallery = '';
    Object.assign(node.style, { width: 'min(760px, 100%)', margin: '2rem auto', padding: '1rem', boxSizing: 'border-box' });
    document.body.append(node);
    createRoot(node).render(<FoundationGallery />);
}
