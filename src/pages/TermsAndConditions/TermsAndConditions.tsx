import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TermsAndConditions.css';

export function TermsAndConditions() {
    const navigate = useNavigate();

    return (
        <div className="terms">
            <button className="terms__back-fab" onClick={() => navigate(-1)} aria-label="Volver atrás">
                <ArrowLeft size={20} />
            </button>

            <div className="terms__container">
                <h1 className="terms__title">Términos y Condiciones de Uso</h1>
                <p className="terms__updated">Última actualización: 19 de marzo de 2026</p>

                <section className="terms__section">
                    <h2>0. Titularidad y Contacto</h2>
                    <p>
                        FreeWallet es un proyecto de software de código abierto puesto a disposición de los usuarios por
                        <strong> Daniel</strong>. Puede contactar con el titular a través de
                        <strong> daniel230401@outlook.com</strong> y consultar la versión oficial del proyecto en
                        <strong> https://github.com/danielcc2304/freewallet</strong>.
                    </p>
                    <p>
                        FreeWallet se ofrece como herramienta gratuita, técnica y educativa. Salvo indicación expresa en contrario,
                        el acceso y uso de la aplicación no implican la formalización de una relación contractual de prestación
                        de servicios financieros, de inversión, de asesoramiento financiero, de gestión de carteras ni de intermediación.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder y utilizar FreeWallet (&quot;la Aplicación&quot;), usted acepta quedar vinculado por estos
                        Términos y Condiciones. El acceso a la Aplicación es voluntario y atribuye la condición de Usuario
                        a quien lo realiza.
                    </p>
                    <p>
                        Si no está de acuerdo total o parcialmente con estos términos, debe abstenerse de utilizar la Aplicación.
                        El uso continuado de FreeWallet presupone la lectura y aceptación de las condiciones vigentes en cada momento.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>2. Edad Mínima</h2>
                    <p>
                        El uso de esta Aplicación está dirigido preferentemente a personas mayores de 18 años. Si usted es menor de edad,
                        debe contar con la autorización y supervisión de sus padres o tutores legales para utilizar herramientas
                        de simulación y seguimiento financiero.
                    </p>
                    <p>
                        FreeWallet no asume responsabilidad por el uso de la herramienta por parte de menores sin la debida supervisión.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>3. Naturaleza del Servicio</h2>
                    <p>
                        FreeWallet es una herramienta técnica de seguimiento, visualización y educación financiera. La Aplicación puede proporcionar:
                    </p>
                    <ul>
                        <li>Visualización y seguimiento de carteras de inversión personales.</li>
                        <li>Contenido educativo y guías sobre conceptos financieros.</li>
                        <li>Calculadoras, simuladores y herramientas de apoyo técnico.</li>
                        <li>Agregación o representación de datos de mercado procedentes de fuentes externas.</li>
                    </ul>
                    <p>
                        La Aplicación no constituye un servicio de asesoramiento personalizado, recomendación de inversión,
                        gestión discrecional, ejecución de órdenes ni intermediación financiera. El uso de FreeWallet no crea
                        una relación profesional asesor-cliente ni una relación contractual de prestación de servicios financieros.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>4. Descargo de Responsabilidad</h2>
                    <div className="terms__disclaimer">
                        <strong>AVISO IMPORTANTE:</strong> FreeWallet no es un asesor financiero, broker, gestor de patrimonios
                        ni proveedor de servicios de inversión. Todo el contenido, cálculos, gráficos, simulaciones y materiales
                        disponibles se ofrecen exclusivamente con fines informativos, técnicos y educativos.
                    </div>
                    <p>
                        Usted reconoce expresamente que toda decisión de ahorro, inversión, asignación de activos, compra, venta,
                        rebalanceo o gestión del riesgo conlleva riesgos, incluida la posible pérdida total o parcial del capital.
                    </p>
                    <p>
                        FreeWallet no emite recomendaciones individualizadas ni garantiza que una determinada estrategia, activo,
                        simulación o criterio sea adecuado para su situación personal. Si necesita asesoramiento financiero,
                        fiscal, contable o legal, debe acudir a un profesional debidamente cualificado.
                    </p>
                    <p>
                        Las rentabilidades pasadas, hipotéticas o simuladas no garantizan resultados futuros y no deben interpretarse
                        como promesa o expectativa razonable de rendimiento.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>5. Propiedad Intelectual y Licencias</h2>
                    <p>
                        FreeWallet se basa en un modelo híbrido de licencias:
                    </p>
                    <ul>
                        <li><strong>Código fuente:</strong> Se distribuye bajo licencia MIT, permitiendo su uso, copia, modificación y redistribución conforme a los términos de dicha licencia.</li>
                        <li><strong>Marca, nombre, logotipo y diseño visual:</strong> El nombre &quot;FreeWallet&quot;, el logotipo, la identidad visual, la interfaz y otros signos distintivos no quedan automáticamente cubiertos por la licencia MIT salvo indicación expresa en contrario.</li>
                        <li><strong>Contenido educativo:</strong> Los textos, guías, materiales de academia y demás contenidos originales están protegidos por la normativa de propiedad intelectual y no se consideran licenciados bajo MIT salvo indicación expresa en el repositorio oficial.</li>
                    </ul>
                    <p>
                        El usuario se compromete a respetar los derechos de propiedad intelectual e industrial del titular y, en su caso,
                        de terceros.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>6. Privacidad y Gestión de Datos</h2>
                    <p>
                        FreeWallet apuesta por la privacidad y la transparencia en el tratamiento de la información técnica necesaria
                        para su funcionamiento.
                    </p>
                    <ul>
                        <li><strong>Almacenamiento local:</strong> Los datos de cartera y otra información introducida por el usuario se almacenan, con carácter general, en el navegador o dispositivo del propio usuario.</li>
                        <li><strong>Sin tratamiento activo en servidores propios:</strong> FreeWallet no trata activamente en servidores propios los datos financieros del usuario ni mantiene un backend destinado al almacenamiento ordinario de carteras personales.</li>
                        <li><strong>Infraestructura técnica:</strong> Los proveedores de alojamiento, distribución de contenido o analítica técnica estrictamente necesaria pueden tratar datos técnicos mínimos, como dirección IP, solicitudes HTTP, identificadores de dispositivo o metadatos del navegador, conforme a sus propias políticas.</li>
                        <li><strong>Analítica técnica y rendimiento:</strong> FreeWallet puede utilizar servicios de analítica técnica y medición de rendimiento, como Vercel Analytics y Vercel Speed Insights, cuyos proveedores pueden tratar datos técnicos mínimos de navegación y funcionamiento, tales como dirección IP, metadatos del navegador, páginas visitadas, eventos de navegación, tiempos de carga, métricas web de rendimiento y métricas agregadas de uso, conforme a sus propias políticas.</li>
                        <li><strong>APIs y servicios externos:</strong> Cuando la aplicación consulta cotizaciones u otra información de terceros, dichos proveedores pueden recibir los datos técnicos imprescindibles para responder a la solicitud y se regirán por sus propias políticas de privacidad y tratamiento.</li>
                    </ul>
                    <p>
                        El usuario es responsable de la custodia de su dispositivo, de la configuración de su navegador y de cualquier copia,
                        exportación o conservación local de sus datos.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>7. Limitación de Responsabilidad</h2>
                    <p>
                        La Aplicación se proporciona &quot;tal cual&quot; (&quot;as-is&quot;), sin garantías expresas ni implícitas.
                        En particular, FreeWallet no garantiza la exactitud, integridad, disponibilidad, continuidad, actualidad,
                        utilidad, ausencia de errores o idoneidad para un propósito concreto de los datos, cálculos, simulaciones,
                        gráficos, contenidos o funcionalidades mostradas.
                    </p>
                    <p>
                        En la medida máxima permitida por la ley, FreeWallet no será responsable de:
                    </p>
                    <ul>
                        <li>Errores en cálculos, simulaciones, proyecciones o visualizaciones.</li>
                        <li>Pérdidas económicas, lucro cesante, pérdida de oportunidad o daños indirectos derivados del uso o de la imposibilidad de uso de la Aplicación.</li>
                        <li>Inexactitudes, interrupciones, retrasos o errores en datos de mercado o servicios de terceros.</li>
                        <li>Pérdida de datos por limpieza del navegador, uso de extensiones, fallos del dispositivo, restauraciones del sistema o incidencias ajenas a FreeWallet.</li>
                    </ul>
                    <p>
                        El usuario es el único responsable de las decisiones que adopte con base en la información mostrada en FreeWallet.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>8. Enlaces a Terceros</h2>
                    <p>
                        La Aplicación puede contener enlaces o referencias a sitios web, repositorios, APIs, servicios o recursos de terceros.
                        Dichos elementos están fuera del control de FreeWallet, que no responde de su contenido, funcionamiento,
                        disponibilidad, seguridad, exactitud o políticas de privacidad.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>9. Software de Terceros</h2>
                    <p>
                        Esta Aplicación utiliza bibliotecas y componentes de terceros, incluidos proyectos de código abierto,
                        bajo sus respectivas licencias. Los derechos sobre dichos componentes pertenecen a sus autores o titulares
                        correspondientes.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>10. Exactitud de los Datos de Mercado</h2>
                    <p>
                        Los datos de mercado, cotizaciones, precios, variaciones y métricas asociadas se obtienen de fuentes externas
                        con fines meramente informativos. Dichos datos pueden ser inexactos, incompletos, inconsistentes o llegar
                        con retraso, incluidos retrasos de varios minutos o más.
                    </p>
                    <p>
                        FreeWallet no garantiza la exactitud ni la actualidad de dichos datos y no debe utilizarse para trading en tiempo real,
                        ejecución de órdenes, arbitraje, scalping ni para decisiones que exijan disponibilidad inmediata o precisión instantánea.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>11. Uso Aceptable</h2>
                    <p>
                        El usuario se compromete a:
                    </p>
                    <ul>
                        <li>No utilizar la Aplicación para fines ilegales, fraudulentos o no autorizados.</li>
                        <li>No intentar eludir límites técnicos, restricciones de uso o rate limits de APIs o servicios conectados.</li>
                        <li>No realizar acciones que dañen, degraden o sobrecarguen la infraestructura propia o de terceros utilizada por la Aplicación.</li>
                        <li>No introducir datos falsos o manipulados con la finalidad de alterar, probar indebidamente o desnaturalizar el funcionamiento normal de la herramienta.</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>12. Disponibilidad y Terminación</h2>
                    <p>
                        FreeWallet se presta &quot;as-is&quot; y puede ser modificada, actualizada, limitada, suspendida o retirada,
                        total o parcialmente, en cualquier momento, con o sin previo aviso, sin que ello genere derecho a indemnización.
                    </p>
                    <p>
                        El titular podrá introducir cambios técnicos, funcionales, visuales o de contenido cuando lo considere oportuno.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>13. Modificaciones de los Términos</h2>
                    <p>
                        Estos términos pueden ser revisados y actualizados para adaptarlos a cambios legales, técnicos o funcionales.
                        La versión vigente será la publicada en la propia Aplicación o en su repositorio oficial.
                    </p>
                    <p>
                        El uso continuado de FreeWallet tras la publicación de cambios supone la aceptación de la versión actualizada
                        de estos términos.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>14. Legislación y Jurisdicción</h2>
                    <p>
                        Estos términos se regirán e interpretarán conforme al Derecho español.
                    </p>
                    <p>
                        Cualquier controversia que pudiera derivarse del acceso, uso o interpretación de FreeWallet se someterá
                        a los Juzgados y Tribunales competentes conforme a la normativa aplicable. Cuando el usuario tenga la condición
                        legal de consumidor o usuario, se respetará en todo caso el fuero imperativo que resulte aplicable en España.
                    </p>
                </section>

                <div className="terms__acknowledgment">
                    <p>
                        <strong>Al utilizar FreeWallet, usted reconoce haber leído, entendido y aceptado estos Términos y Condiciones.</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
