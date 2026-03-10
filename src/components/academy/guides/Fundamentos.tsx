import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Fundamentos.css";

type AcademyLevel = "Principiante" | "Intermedio" | "Avanzado";
type ModuleStatus = "pending" | "done";

type AcademyModule = {
  id: string;
  title: string;
  to: string;
  description: string;
  level: AcademyLevel;
  icon: string;
  goal: "empezar" | "cartera" | "fondos" | "crisis";
  format: "guia" | "simulador" | "calculadora";
};

type ProgressState = Record<
  string,
  { status: ModuleStatus }
>;

const STORAGE_KEY = "freewallet_academy_progress";

const MODULES: AcademyModule[] = [
  {
    id: "glossary",
    title: "Diccionario financiero",
    to: "/academy/glossary",
    description:
      "Base rápida para entender términos antes de entrar en materia.",
    level: "Principiante",
    icon: "📚",
    goal: "empezar",
    format: "guia",
  },
  {
    id: "timeline",
    title: "Tu recorrido",
    to: "/academy/timeline",
    description:
      "Ordena expectativas y prioridades según tu fase como inversor.",
    level: "Principiante",
    icon: "🧭",
    goal: "empezar",
    format: "guia",
  },
  {
    id: "profile",
    title: "Perfil inversor",
    to: "/academy/investor-profile-test",
    description: "Test interactivo para aterrizar tu tolerancia al riesgo.",
    level: "Principiante",
    icon: "🎯",
    goal: "empezar",
    format: "simulador",
  },
  {
    id: "compound",
    title: "Interés compuesto",
    to: "/academy/compound-interest",
    description:
      "Entiende por qué el tiempo manda en la acumulación de capital.",
    level: "Principiante",
    icon: "📈",
    goal: "empezar",
    format: "calculadora",
  },
  {
    id: "portfolio",
    title: "Estrategia y cartera",
    to: "/academy/portfolio",
    description: "Construye la lógica base de tu asignación de activos.",
    level: "Intermedio",
    icon: "🏛️",
    goal: "cartera",
    format: "guia",
  },
  {
    id: "allocation",
    title: "Simulador de cartera",
    to: "/academy/asset-allocation",
    description: "Ajusta pesos y mira cómo cambia el riesgo esperado.",
    level: "Intermedio",
    icon: "🧮",
    goal: "cartera",
    format: "simulador",
  },
  {
    id: "risk",
    title: "Gestión del riesgo",
    to: "/academy/risk",
    description:
      "Controla drawdown, tamaño de posición y estabilidad emocional.",
    level: "Intermedio",
    icon: "🛡️",
    goal: "cartera",
    format: "guia",
  },
  {
    id: "tax",
    title: "Fiscalidad",
    to: "/academy/tax",
    description: "Evita errores fiscales antes de que condicionen tu cartera.",
    level: "Intermedio",
    icon: "🧾",
    goal: "cartera",
    format: "guia",
  },
  {
    id: "fund-radar",
    title: "Radar de fondos",
    to: "/academy/fund-radar",
    description: "Explora fondos ya seleccionados y aprende a filtrarlos.",
    level: "Intermedio",
    icon: "🎯",
    goal: "fondos",
    format: "simulador",
  },
  {
    id: "valuation",
    title: "Guía de valoración",
    to: "/academy/valuation",
    description: "Marco práctico para leer calidad y precio en acciones.",
    level: "Avanzado",
    icon: "📐",
    goal: "fondos",
    format: "guia",
  },
  {
    id: "crisis",
    title: "Mercado y crisis",
    to: "/academy/crisis",
    description: "Ve crisis históricas con contexto y comportamiento esperado.",
    level: "Intermedio",
    icon: "📉",
    goal: "crisis",
    format: "simulador",
  },
  {
    id: "scenarios",
    title: "Qué hacer si...",
    to: "/academy/scenarios",
    description:
      "Playbooks para dinero inesperado, pánico o cambio de objetivos.",
    level: "Intermedio",
    icon: "🧩",
    goal: "crisis",
    format: "guia",
  },
  {
    id: "errors",
    title: "Errores comunes",
    to: "/academy/errors",
    description:
      "Revisión de fallos típicos antes de repetirlos con dinero real.",
    level: "Principiante",
    icon: "🚫",
    goal: "crisis",
    format: "guia",
  },
  {
    id: "timing",
    title: "Timing vs DCA",
    to: "/academy/market-timing-game",
    description:
      "Juego corto para interiorizar por qué acertar máximos y mínimos es difícil.",
    level: "Intermedio",
    icon: "🎮",
    goal: "crisis",
    format: "simulador",
  },
  {
    id: "inflation",
    title: "Impacto de la inflación",
    to: "/academy/inflation-predator",
    description:
      "Visualiza el daño de dejar liquidez inmóvil demasiado tiempo.",
    level: "Principiante",
    icon: "🔥",
    goal: "empezar",
    format: "simulador",
  },
  {
    id: "strategies",
    title: "Estrategias",
    to: "/academy/strategies",
    description: "Compara DCA, buy and hold y otros enfoques con criterio.",
    level: "Intermedio",
    icon: "🗺️",
    goal: "cartera",
    format: "guia",
  },
  {
    id: "calculators",
    title: "Calculadoras",
    to: "/academy/calculators",
    description: "Centro de herramientas para jubilación, impuestos y cartera.",
    level: "Intermedio",
    icon: "🧮",
    goal: "cartera",
    format: "calculadora",
  },
  {
    id: "resources",
    title: "Recursos y guías",
    to: "/academy/resources",
    description:
      "Material complementario para profundizar cuando ya tienes base.",
    level: "Avanzado",
    icon: "🎁",
    goal: "fondos",
    format: "guia",
  },
];

const CHECKLISTS = [
  {
    title: "Antes de invertir",
    to: "/academy/investor-profile-test",
    items: [
      "Tengo fondo de emergencia",
      "Sé mi horizonte temporal",
      "Conozco mi tolerancia al riesgo",
    ],
  },
  {
    title: "Antes de comprar un fondo",
    to: "/academy/fund-radar",
    items: [
      "Entiendo categoría y benchmark",
      "Reviso costes",
      "Encaja con mi cartera actual",
    ],
  },
  {
    title: "Antes de analizar una acción",
    to: "/academy/valuation",
    items: [
      "Leo márgenes y rentabilidad",
      "Reviso deuda",
      "Valoro calidad antes que precio",
    ],
  },
];

const GOALS = [
  {
    title: "Quiero empezar",
    description: "Primero entiende conceptos, perfil y expectativas realistas.",
    modules: ["glossary", "timeline", "profile", "compound"],
  },
  {
    title: "Quiero construir cartera",
    description: "Pasa de teoría a asignación, riesgo y ejecución.",
    modules: ["portfolio", "allocation", "risk", "tax", "strategies"],
  },
  {
    title: "Quiero entender fondos",
    description: "Filtra mejor productos y evita comprar sin criterio.",
    modules: ["fund-radar", "resources", "valuation"],
  },
  {
    title: "Quiero prepararme para crisis",
    description: "Entrena tu comportamiento antes de que llegue la caída real.",
    modules: ["crisis", "scenarios", "errors", "timing"],
  },
];

const SIMULATOR_IDS = [
  "profile",
  "allocation",
  "timing",
  "crisis",
  "fund-radar",
  "inflation",
];

function loadProgress(): ProgressState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressState) : {};
  } catch {
    return {};
  }
}

export function Fundamentos() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  const updateProgress = (
    updater: (current: ProgressState) => ProgressState,
  ) => {
    setProgress((current) => {
      const next = updater(current);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage failures.
      }
      return next;
    });
  };

  const modulesById = useMemo(
    () => Object.fromEntries(MODULES.map((module) => [module.id, module])),
    [],
  );

  const levelSections = useMemo(
    () =>
      (["Principiante", "Intermedio", "Avanzado"] as AcademyLevel[]).map(
        (level) => ({
          level,
          modules: MODULES.filter((module) => module.level === level),
        }),
      ),
    [],
  );

  const simulatorModules = useMemo(
    () => SIMULATOR_IDS.map((id) => modulesById[id]).filter(Boolean),
    [modulesById],
  );

  const completedCount = useMemo(
    () =>
      Object.values(progress).filter((entry) => entry.status === "done").length,
    [progress],
  );

  const toggleDone = (moduleId: string) => {
    updateProgress((current) => ({
      ...current,
      [moduleId]: {
        status: current[moduleId]?.status === "done" ? "pending" : "done",
      },
    }));
  };

  const getStatus = (moduleId: string): ModuleStatus =>
    progress[moduleId]?.status || "pending";
  const markAsDone = (moduleId: string) => {
    updateProgress((current) => ({
      ...current,
      [moduleId]: {
        status: "done",
      },
    }));
  };

  return (
    <div className="fundamentos">
      <header className="fundamentos__header">
        <div className="fundamentos__eyebrow">Academia</div>
        <h1 className="fundamentos__title">Tu mapa para aprender a invertir</h1>
        <p className="fundamentos__description">
          Aprende desde 0 sobre el mundo de la inversión en una ruta guiada para
          perfiles de todo tipo.
        </p>
      </header>

      <section className="fundamentos__summary">
        <article className="fundamentos__summary-card">
          <span>Completados</span>
          <strong>{completedCount}</strong>
        </article>
        <article className="fundamentos__summary-card">
          <span>Simuladores</span>
          <strong>{simulatorModules.length}</strong>
        </article>
        <article className="fundamentos__summary-card">
          <span>MÃ³dulos visibles</span>
          <strong>{MODULES.length}</strong>
        </article>
      </section>

      <section className="fundamentos__section-block">
        <div className="fundamentos__section-head">
          <h2>Ruta guiada por nivel</h2>
          <p>
            Empieza por la base, sube de nivel y usa el progreso para no
            perder el hilo.
          </p>
        </div>
        <div className="fundamentos__level-grid">
          {levelSections.map(({ level, modules }) => (
            <article key={level} className="fundamentos__level-card">
              <div className="fundamentos__level-head">
                <h3>{level}</h3>
                <span>{modules.length} módulos</span>
              </div>
              <div className="fundamentos__mini-list">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className={`fundamentos__mini-card ${getStatus(module.id) === "done" ? "fundamentos__mini-card--done" : ""}`}
                  >
                    <Link
                      to={module.to}
                      className="fundamentos__mini-link"
                      onClick={() => markAsDone(module.id)}
                    >
                      <span className="fundamentos__mini-icon">
                        {module.icon}
                      </span>
                      <div>
                        <strong>{module.title}</strong>
                        <p>{module.description}</p>
                      </div>
                    </Link>
                    <div className="fundamentos__mini-actions">
                      <button
                        type="button"
                        className={`fundamentos__mini-action fundamentos__mini-action--status ${getStatus(module.id) === "done" ? "fundamentos__mini-action--done" : "fundamentos__mini-action--pending"}`}
                        onClick={() => toggleDone(module.id)}
                      >
                        {getStatus(module.id) === "done"
                          ? "Visto"
                          : "Pendiente"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fundamentos__section-block">
        <div className="fundamentos__section-head">
          <h2>Academia por objetivo</h2>
          <p>Atajos prácticos para entrar por intención.</p>
        </div>
        <div className="fundamentos__goal-grid">
          {GOALS.map((goal) => (
            <article key={goal.title} className="fundamentos__goal-card">
              <h3>{goal.title}</h3>
              <p>{goal.description}</p>
              <div className="fundamentos__goal-links">
                {goal.modules.map((moduleId) => {
                  const module = modulesById[moduleId];
                  return (
                    <Link
                      key={module.id}
                      to={module.to}
                      className="fundamentos__goal-link"
                      onClick={() => markAsDone(module.id)}
                    >
                      <span>{module.icon}</span>
                      <span>{module.title}</span>
                    </Link>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fundamentos__section-block">
        <div className="fundamentos__section-head">
          <h2>Checklists visuales</h2>
          <p>
            Tres entradas cortas para revisar lo esencial antes de mover dinero.
          </p>
        </div>
        <div className="fundamentos__checklist-grid">
          {CHECKLISTS.map((checklist) => (
            <article
              key={checklist.title}
              className="fundamentos__checklist-card"
            >
              <h3>{checklist.title}</h3>
              <ul>
                {checklist.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link
                to={checklist.to}
                className="fundamentos__button fundamentos__button--secondary"
              >
                Abrir módulo relacionado
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="fundamentos__section-block">
        <div className="fundamentos__section-head">
          <h2>Centro de simuladores</h2>
          <p>
            Todo lo interactivo en un solo sitio para descubrirlo sin depender
            del sidebar.
          </p>
        </div>
        <div className="fundamentos__sections">
          {simulatorModules.map((module) => (
            <Link
              key={module.id}
              to={module.to}
              className="fundamentos__card"
              onClick={() => markAsDone(module.id)}
            >
              <div className="fundamentos__card-icon">{module.icon}</div>
              <h3 className="fundamentos__card-title">{module.title}</h3>
              <p className="fundamentos__card-description">
                {module.description}
              </p>
              <div className="fundamentos__card-meta">
                <span className="fundamentos__card-badge">{module.level}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="fundamentos__spotlight">
        <div className="fundamentos__spotlight-copy">
          <span className="fundamentos__spotlight-badge">Academia + CSV</span>
          <h2>Cómo leer tu cartera real con Portfolio CSV</h2>
          <p>
            Si ya tienes una cartera montada, el siguiente paso no siempre es
            otro artículo: muchas veces necesitas aprender a leer tus pesos,
            concentración, buckets y desvíos con datos reales.
          </p>
        </div>
        <div className="fundamentos__spotlight-actions">
          <Link
            to="/portfolio-csv"
            className="fundamentos__button fundamentos__button--primary"
          >
            Abrir Portfolio CSV
          </Link>
          <Link
            to="/academy/portfolio"
            className="fundamentos__button fundamentos__button--secondary"
          >
            Ver estrategia y cartera
          </Link>
        </div>
      </section>

      <div className="fundamentos__next">
        <h3>Siguiente paso recomendado</h3>
        <p>
          Si vienes totalmente desde cero: glosario, perfil, interés compuesto y
          estrategia. Si ya tienes cartera: Portfolio CSV, gestión del riesgo y
          mercado y crisis.
        </p>
        <div className="fundamentos__next-links">
          <Link to="/academy/glossary" className="fundamentos__next-link">
            📚 Empezar por glosario
          </Link>
          <Link
            to="/academy/investor-profile-test"
            className="fundamentos__next-link"
          >
            🎯 Definir perfil inversor
          </Link>
          <Link to="/portfolio-csv" className="fundamentos__next-link">
            📊 Analizar mi cartera real
          </Link>
          <Link to="/academy/crisis" className="fundamentos__next-link">
            📉 Prepararme para crisis
          </Link>
        </div>
      </div>
    </div>
  );
}
