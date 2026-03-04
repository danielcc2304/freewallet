import './TermsAndConditions.css';

export function TermsAndConditions() {
    return (
        <div className="terms">
            <div className="terms__container">
                <h1 className="terms__title">Términos y Condiciones de Uso</h1>
                <p className="terms__updated">Última actualización: 17 de febrero de 2026</p>

                <section className="terms__section">
                    <h2>0. Titularidad y Contacto</h2>
                    <p>
                        FreeWallet es un proyecto de software de código abierto gestionado por el titular identificado en el repositorio oficial.
                        Para cualquier consulta, sugerencia o notificación, el canal principal de comunicación es a través de dicho
                        repositorio en GitHub. Esta herramienta se ofrece de forma gratuita a la comunidad.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder y utilizar FreeWallet ("la Aplicación"), usted acepta estar sujeto a estos
                        Términos y Condiciones. El acceso a la Aplicación es voluntario y atribuye la condición de Usuario a quien lo realiza.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>2. Edad Mínima</h2>
                    <p>
                        El uso de esta Aplicación está dirigido a personas mayores de 18 años. Si usted es menor de edad,
                        debe contar con el permiso de sus padres o tutores legales para utilizar herramientas de simulación financiera.
                        FreeWallet no se responsabiliza del uso de la herramienta por parte de menores sin la debida supervisión.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>3. Naturaleza del Servicio</h2>
                    <p>
                        FreeWallet es una herramienta técnica de seguimiento y educación financiera. La Aplicación proporciona:
                    </p>
                    <ul>
                        <li>Visualización y seguimiento de carteras de inversión personales</li>
                        <li>Contenido educativo y guías sobre conceptos financieros</li>
                        <li>Calculadoras y simuladores estadísticos</li>
                        <li>Agregación de datos de mercado de fuentes públicas</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>4. Descargo de Responsabilidad</h2>
                    <div className="terms__disclaimer">
                        <strong>AVISO IMPORTANTE:</strong> FreeWallet no es un asesor financiero, broker, ni gestor de patrimonios.
                        Todo el contenido, cálculos y simulaciones son exclusivamente para fines informativos y educativos.
                    </div>
                    <p>
                        Usted reconoce que las decisiones de inversión conllevan riesgos de pérdida de capital y que debe consultar
                        a un profesional certificado antes de realizar cualquier operación financiera. Las rentabilidades pasadas o simuladas
                        no garantizan resultados futuros.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>5. Propiedad Intelectual y Licencias</h2>
                    <p>
                        FreeWallet se basa en un modelo híbrido de licencias:
                    </p>
                    <ul>
                        <li><strong>Código Fuente:</strong> Se distribuye bajo la licencia MIT, permitiendo su uso y modificación según los términos de dicha licencia.</li>
                        <li><strong>Marca y Diseño:</strong> El nombre "FreeWallet", el logotipo y los elementos distintivos de la interfaz son propiedad del desarrollador y no se concede licencia alguna sobre los mismos fuera de su uso dentro de la Aplicación.</li>
                        <li><strong>Contenido "Academia":</strong> El contenido educativo y las guías originales están protegidos por derechos de autor y se proporcionan exclusivamente para uso personal y educativo. Salvo que se indique lo contrario en el repositorio oficial, este contenido no se licencia bajo los términos de la licencia MIT.</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>6. Privacidad y Gestión de Datos</h2>
                    <p>
                        FreeWallet apuesta por la privacidad y la transparencia en el tratamiento de la información técnica necesaria para su funcionamiento:
                    </p>
                    <ul>
                        <li><strong>Almacenamiento Local:</strong> Sus datos financieros se guardan exclusivamente en el almacenamiento local de su navegador.</li>
                        <li><strong>Acceso:</strong> FreeWallet no recopila ni almacena en servidores propios los datos de su cartera, que permanecen bajo su exclusivo control en su dispositivo.</li>
                        <li><strong>Hosting:</strong> La Aplicación se aloja en infraestructura de terceros (Vercel), que puede procesar y registrar datos técnicos mínimos (por ejemplo, dirección IP, solicitudes HTTP y metadatos del navegador) necesarios exclusivamente para servir el contenido y garantizar la seguridad del servicio.</li>
                        <li><strong>Proveedores Externos:</strong> Al consultar cotizaciones, la Aplicación contacta con APIs de terceros (proveedores de datos de mercado). Estos proveedores se rigen por sus propias políticas de privacidad sobre las cuales FreeWallet no tiene control.</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>7. Limitación de Responsabilidad</h2>
                    <p>
                        La Aplicación se proporciona “tal cual” (“as-is”), sin garantías expresas ni implícitas sobre su funcionamiento, disponibilidad o adecuación para un propósito específico. En la medida máxima permitida por la ley, FreeWallet no será responsable de:
                    </p>
                    <ul>
                        <li>Errores en los cálculos o fallos técnicos de la Aplicación</li>
                        <li>Pérdidas económicas reales derivadas de decisiones basadas en la herramienta</li>
                        <li>Indisponibilidad de los datos de mercado o fallos en los servicios de terceros</li>
                        <li>Pérdida de datos por limpieza del navegador o fallos en el hardware del Usuario</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>8. Enlaces a Terceros</h2>
                    <p>
                        La Aplicación puede contener enlaces a sitios web externos. FreeWallet no ejerce control sobre dichos sitios ni se hace responsable de su contenido, políticas de privacidad o disponibilidad.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>9. Software de Terceros</h2>
                    <p>
                        Esta Aplicación utiliza bibliotecas de código abierto bajo sus respectivas licencias. Los derechos sobre estas bibliotecas pertenecen a sus respectivos autores.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>10. Exactitud de los Datos de Mercado</h2>
                    <p>
                        Los datos de cotizaciones se obtienen de fuentes externas con fines informativos. Pueden existir errores o posibles retrasos (incluyendo retrasos de varios minutos o más) en la información suministrada. No utilice esta herramienta para operaciones de trading en tiempo real.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>11. Uso Aceptable</h2>
                    <p>
                        El Usuario se compromete a:
                    </p>
                    <ul>
                        <li>No utilizar la Aplicación para fines ilegales o no autorizados.</li>
                        <li>No intentar eludir los límites de frecuencia (rate-limits) de las APIs utilizadas.</li>
                        <li>No realizar acciones que puedan dañar o sobrecargar la infraestructura del servicio.</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>12. Disponibilidad y Terminación</h2>
                    <p>
                        El desarrollador se reserva el derecho de modificar, suspender o terminar la disponibilidad de la Aplicación en cualquier momento sin previo aviso y sin responsabilidad alguna por ello.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>13. Modificaciones de los Términos</h2>
                    <p>
                        Estos términos pueden ser actualizados. El uso continuado de la Aplicación tras una actualización implica su aceptación.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>14. Legislación y Jurisdicción</h2>
                    <p>
                        Estos términos se rigen por las leyes de España. Cualquier controversia se someterá a los Juzgados y Tribunales competentes conforme a la normativa aplicable y, cuando el Usuario tenga la condición de consumidor, se aplicará el fuero que corresponda legalmente.
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
