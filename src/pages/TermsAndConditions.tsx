import './TermsAndConditions.css';

export function TermsAndConditions() {
    return (
        <div className="terms">
            <div className="terms__container">
                <h1 className="terms__title">Términos y Condiciones de Uso</h1>
                <p className="terms__updated">Última actualización: 3 de febrero de 2026</p>

                <section className="terms__section">
                    <h2>1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder y utilizar FreeWallet ("la Aplicación"), usted acepta estar sujeto a estos
                        Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos,
                        no debe utilizar la Aplicación.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>2. Naturaleza del Servicio</h2>
                    <p>
                        FreeWallet es una herramienta de seguimiento y educación financiera. La Aplicación
                        proporciona:
                    </p>
                    <ul>
                        <li>Seguimiento de inversiones personales</li>
                        <li>Contenido educativo sobre conceptos financieros</li>
                        <li>Calculadoras y simuladores con fines puramente educativos</li>
                        <li>Información de mercado agregada de fuentes públicas</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>3. No Constituye Asesoramiento Financiero</h2>
                    <div className="terms__disclaimer">
                        <strong>IMPORTANTE:</strong> FreeWallet no proporciona asesoramiento financiero,
                        de inversión, fiscal o legal. Todo el contenido educativo, calculadoras, simuladores
                        y herramientas son solo para fines informativos y educativos.
                    </div>
                    <p>
                        Usted reconoce y acepta que:
                    </p>
                    <ul>
                        <li>Las simulaciones de crisis históricas no garantizan resultados futuros</li>
                        <li>Los cálculos fiscales son orientativos y no sustituyen asesoramiento profesional</li>
                        <li>Las sugerencias de asset allocation son genéricas, no personalizadas</li>
                        <li>Debe consultar a un profesional cualificado antes de tomar decisiones de inversión</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>4. Limitación de Responsabilidad</h2>
                    <p>
                        FreeWallet y sus desarrolladores no serán responsables de:
                    </p>
                    <ul>
                        <li>Pérdidas financieras derivadas del uso de la Aplicación</li>
                        <li>Inexactitudes en datos de mercado de terceros</li>
                        <li>Decisiones de inversión tomadas basándose en el contenido de la Aplicación</li>
                        <li>Interrupciones del servicio o pérdida de datos</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>5. Privacidad y Datos</h2>
                    <p>
                        FreeWallet almacena sus datos de inversión localmente en su navegador. No recopilamos,
                        procesamos ni compartimos sus datos personales con terceros. Usted es responsable de
                        realizar copias de seguridad de sus datos.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>6. Contenido Educativo</h2>
                    <p>
                        El contenido de la sección "Academia" se proporciona "tal cual" con fines educativos.
                        Nos esforzamos por mantener la información actualizada y precisa, pero no garantizamos:
                    </p>
                    <ul>
                        <li>La exactitud absoluta de datos históricos</li>
                        <li>La aplicabilidad universal de conceptos fiscales</li>
                        <li>Que el contenido refleje los cambios legislativos más recientes</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>7. Uso Aceptable</h2>
                    <p>
                        Usted se compromete a:
                    </p>
                    <ul>
                        <li>Utilizar la Aplicación solo para fines personales y legales</li>
                        <li>No intentar vulnerar la seguridad de la Aplicación</li>
                        <li>No redistribuir o revender el contenido sin autorización</li>
                        <li>Reconocer que invierte bajo su propio riesgo y responsabilidad</li>
                    </ul>
                </section>

                <section className="terms__section">
                    <h2>8. Exactitud de los Datos de Mercado</h2>
                    <p>
                        Los datos de cotizaciones y fundamentales se obtienen de APIs de terceros (Yahoo Finance).
                        Puede haber retrasos, inexactitudes o interrupciones. FreeWallet no garantiza la exactitud,
                        integridad o actualidad de estos datos.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>9. Disponibilidad del Servicio</h2>
                    <p>
                        FreeWallet se proporciona de forma gratuita y sin garantías de disponibilidad.
                        Nos reservamos el derecho a modificar, suspender o descontinuar el servicio en
                        cualquier momento sin previo aviso.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>10. Modificaciones de los Términos</h2>
                    <p>
                        Nos reservamos el derecho a modificar estos Términos y Condiciones en cualquier momento.
                        Los cambios entrarán en vigor inmediatamente tras su publicación. El uso continuado de
                        la Aplicación constituye su aceptación de los términos modificados.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>11. Legislación Aplicable</h2>
                    <p>
                        Estos términos se rigen por las leyes de España. Cualquier disputa se someterá a la
                        jurisdicción de los tribunales de España.
                    </p>
                </section>

                <section className="terms__section">
                    <h2>12. Contacto</h2>
                    <p>
                        Para preguntas sobre estos Términos y Condiciones, puede contactarnos a través del
                        repositorio del proyecto en GitHub.
                    </p>
                </section>

                <div className="terms__acknowledgment">
                    <p>
                        <strong>Al utilizar FreeWallet, usted reconoce haber leído, entendido y aceptado
                            estos Términos y Condiciones.</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
