import { AcademyControlField } from '../ui/AcademyControlField';
import { AcademyPanel, AcademyLinkCard } from '../ui/AcademyPanel';
import { AcademyGrid } from '../ui/AcademyGrid';
import {useEffect,useState,type CSSProperties} from 'react';
import {ArrowRight,Check,ChevronDown,Coins,Building2,Gem,Landmark,PieChart as PieChartIcon,RotateCcw,Scale,TrendingUp,Wallet} from 'lucide-react';
import {Link,useSearchParams} from 'react-router-dom';
import {AcademyPageHeader} from '../layout/AcademyPageHeader';
import {ASSET_CLASSES,ASSET_KEYS,CATEGORIES,HORIZON_FILTERS,MODEL_PORTFOLIOS,RISK_FILTERS,STYLE_FILTERS,type Allocation,type PortfolioModel} from '../../../data/academy/portfolioModels';
import {allocationQuery,modelAllocation,normalizeAllocation,readAllocationQuery,validAllocation} from '../../../utils/strategyPortfolio';
import './PortfolioBuilder.css';

const STORAGE_KEY='freewallet_strategy_preferences_v1';
const money=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2});
const percent=(value:number)=>`${new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(value)}%`;
const icons={stocks:TrendingUp,bonds:Landmark,cash:Wallet,crypto:Coins,gold:Gem,commodities:Scale,reits:Building2};
function savedPreferences():URLSearchParams {
    try {const saved=localStorage.getItem(STORAGE_KEY);return new URLSearchParams(saved&&saved.length<5000?saved:'');}catch{return new URLSearchParams();}
}
function initialState(query:URLSearchParams){
    const params=savedPreferences();query.forEach((value,key)=>params.set(key,value));const parsed=readAllocationQuery(params);
    const filter=(name:string,options:readonly {value:string}[])=>options.some(option=>option.value===params.get(name))?params.get(name)!:'all';
    return {...parsed,model:parsed.model??MODEL_PORTFOLIOS[0],horizon:filter('horizon',HORIZON_FILTERS),style:filter('style',STYLE_FILTERS),risk:filter('risk',RISK_FILTERS)};
}
function scrollTo(id:string){requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));}
function AllocationBar({allocation}:{allocation:Allocation}){
    return <div className="strategy-bar" role="img" aria-label={ASSET_CLASSES.filter(asset=>allocation[asset.key]>0).map(asset=>`${asset.name}: ${percent(allocation[asset.key])}`).join(', ')}>
        {ASSET_CLASSES.filter(asset=>allocation[asset.key]>0).map(asset=><span key={asset.key} style={{width:`${allocation[asset.key]}%`,background:asset.color}}/>)}</div>;
}

export function PortfolioBuilder(){
    const [params,setParams]=useSearchParams();const [initial]=useState(()=>initialState(params));
    const [horizon,setHorizon]=useState(initial.horizon);const [style,setStyle]=useState(initial.style);const [risk,setRisk]=useState(initial.risk);
    const [selected,setSelected]=useState(initial.model.id);const [planState,setPlanState]=useState(()=>({draft:Object.fromEntries(ASSET_KEYS.map(key=>[key,String(initial.allocation[key])])),confirmed:initial.allocation}));
    const plan=planState.draft;
    const setPlan=(update:Record<string,string>|((current:Record<string,string>)=>Record<string,string>))=>setPlanState(current=>{
        const draft=typeof update==='function'?update(current.draft):update;
        const candidate=Object.fromEntries(ASSET_KEYS.map(key=>[key,draft[key].trim()===''?NaN:Number(draft[key])])) as Allocation;
        return {draft,confirmed:validAllocation(candidate)?candidate:current.confirmed};
    });
    const [capital,setCapital]=useState(String(initial.capital));const [lastCapital,setLastCapital]=useState(initial.capital);const [compared,setCompared]=useState<string[]>([]);const [showAll,setShowAll]=useState(false);
    const [notice,setNotice]=useState(initial.error??'');
    const model=MODEL_PORTFOLIOS.find(model=>model.id===selected)!;
    const allocation=Object.fromEntries(ASSET_KEYS.map(key=>[key,plan[key].trim()===''?NaN:Number(plan[key])])) as Allocation;
    const total=ASSET_KEYS.reduce((sum,key)=>sum+(Number.isFinite(allocation[key])?allocation[key]:0),0);
    const valid=validAllocation(allocation);const amount=Number(capital);const amountValid=capital.trim()!==''&&Number.isFinite(amount)&&amount>0&&amount<=1e12;
    const filtered=MODEL_PORTFOLIOS.filter(model=>(horizon==='all'||model.horizons.includes(horizon as typeof model.horizons[number]))&&(style==='all'||model.styles.includes(style as typeof model.styles[number]))&&(risk==='all'||model.risk===risk));
    const visible=showAll?filtered:filtered.slice(0,6);const comparison=MODEL_PORTFOLIOS.filter(model=>compared.includes(model.id));
    const customized=ASSET_KEYS.some(key=>allocation[key]!==modelAllocation(model)[key]);
    const persistedAllocation=planState.confirmed;
    const persistence=allocationQuery(persistedAllocation,amountValid?amount:lastCapital,selected)+`&horizon=${horizon}&style=${style}&risk=${risk}`;
    useEffect(()=>{
        if(params.toString()!==persistence)setParams(new URLSearchParams(persistence),{replace:true,preventScrollReset:true});
        try{localStorage.setItem(STORAGE_KEY,persistence);}catch{/* The URL still preserves valid choices when storage is unavailable. */}
    },[persistence,params,setParams]);

    const choose=(next:PortfolioModel)=>{
        if(next.id!==selected){setSelected(next.id);setPlan(Object.fromEntries(ASSET_KEYS.map(key=>[key,String(modelAllocation(next)[key])])));}
        setNotice('');scrollTo('strategy-plan');
    };
    const filterChanged=(setter:(value:string)=>void,value:string)=>{setter(value);setShowAll(false);};
    const normalize=()=>{const next=normalizeAllocation(allocation);if(next)setPlan(Object.fromEntries(ASSET_KEYS.map(key=>[key,String(next[key])])));};
    const clearFilters=()=>{setHorizon('all');setStyle('all');setRisk('all');setShowAll(false);};

    return <div className="portfolio-builder strategy-page">
        <AcademyPageHeader className="portfolio-builder__header" section="Construir">
            <h1 className="portfolio-builder__title">Estrategia y cartera</h1>
            <p className="portfolio-builder__subtitle">Explora modelos, ajusta tu distribución y comprueba cómo responde a distintas hipótesis.</p>
        </AcademyPageHeader>
        <nav className="strategy-nav" aria-label="Secciones de estrategia y cartera">
            {[['strategy-models','Modelos'],['strategy-plan','Mi distribución'],['strategy-assets','Activos'],['strategy-profile','Perfil']].map(([id,label])=><a key={id} href={`#${id}`} onClick={event=>{event.preventDefault();scrollTo(id);}}>{label}</a>)}
        </nav>
        <section id="strategy-models" className="portfolio-builder__models-section">
            <div className="strategy-section-heading"><div><h2 className="portfolio-builder__section-title">Modelos como punto de partida</h2><p>Pesos ilustrativos, sin apalancamiento. El riesgo depende también de los instrumentos, la duración y la divisa.</p></div><span>{filtered.length} modelos</span></div>
            <div className="portfolio-builder__filters">
                <p className="strategy-filter-note">El horizonte se refiere al conjunto de la cartera, no solo a su reserva líquida.</p>
                {[
                    {label:'Horizonte',value:horizon,options:HORIZON_FILTERS,setter:setHorizon},
                    {label:'Estilo',value:style,options:STYLE_FILTERS,setter:setStyle},
                    {label:'Riesgo orientativo',value:risk,options:RISK_FILTERS,setter:setRisk},
                ].map(group=><fieldset className="strategy-filter-group" key={group.label}><legend>{group.label}</legend><div className="portfolio-builder__filter-options">{group.options.map(option=><button key={option.value} type="button" aria-pressed={group.value===option.value} className={`portfolio-builder__filter-chip${group.value===option.value?' portfolio-builder__filter-chip--active':''}`} onClick={()=>filterChanged(group.setter,option.value)}>{option.label}</button>)}</div></fieldset>)}
                {(horizon!=='all'||style!=='all'||risk!=='all')&&<button type="button" className="portfolio-builder__filters-reset" onClick={clearFilters}>Limpiar filtros</button>}
            </div>
            {!filtered.length&&<div className="portfolio-builder__empty" role="status"><h3>No hay modelos con esta combinación</h3><p>Amplía los filtros. Un horizonte corto limita las opciones con riesgo de pérdida de capital.</p></div>}
            <AcademyGrid variant="models" className="strategy-model-grid">{visible.map(item=>{
                const weights=modelAllocation(item);const checked=compared.includes(item.id);
                return <AcademyPanel variant="workspace" as="article" className={`strategy-model${selected===item.id?' strategy-model--selected':''}`} key={item.id}>
                    <div className="strategy-model__meta"><span>{CATEGORIES.find(category=>category.id===item.category)?.name}</span><span>{RISK_FILTERS.find(filter=>filter.value===item.risk)?.label}</span></div>
                    <h3>{item.title}</h3><p>{item.desc}</p><p className="strategy-model__mix">Plazo del modelo: {item.horizons.map(value=>HORIZON_FILTERS.find(filter=>filter.value===value)?.label).join(' / ')}</p><AllocationBar allocation={weights}/>
                    <p className="strategy-model__mix">{ASSET_CLASSES.filter(asset=>weights[asset.key]>0).map(asset=>`${asset.name} ${percent(weights[asset.key])}`).join(' · ')}</p>
                    <div className="strategy-model__actions"><button type="button" className="strategy-button" onClick={()=>choose(item)}>{selected===item.id?<Check size={16}/>:<PieChartIcon size={16}/>}Personalizar</button><button type="button" className="strategy-button strategy-button--secondary" aria-pressed={checked} aria-label={`Comparar ${item.title}`} disabled={!checked&&compared.length>=3} onClick={()=>setCompared(current=>current.includes(item.id)?current.filter(id=>id!==item.id):current.length<3?[...current,item.id]:current)}>{checked?'Quitar de comparación':'Comparar'}</button></div>
                </AcademyPanel>;
            })}</AcademyGrid>
            {filtered.length>6&&<button type="button" className="strategy-button strategy-show-more" aria-expanded={showAll} onClick={()=>setShowAll(value=>!value)}><ChevronDown size={17}/>{showAll?'Mostrar menos':`Ver los ${filtered.length} modelos`}</button>}
            <p className="strategy-help">Puedes comparar hasta tres modelos. Los filtros y tu última distribución válida se conservan en este navegador y en el enlace.</p>
        </section>
        {comparison.length>0&&<AcademyPanel variant="workspace" as="section" className="strategy-comparison" aria-labelledby="strategy-comparison-title"><div className="strategy-section-heading"><div><h2 id="strategy-comparison-title">Comparar modelos</h2><p>Pesos originales de los modelos; tu distribución personalizada se muestra más abajo.</p></div><button className="strategy-button strategy-button--secondary" onClick={()=>setCompared([])}>Limpiar comparación</button></div>
            <div className="strategy-table-scroll" role="region" aria-label="Tabla de comparación, desplazable horizontalmente" tabIndex={0}><table><thead><tr><th scope="col">Bloque</th>{comparison.map(item=><th key={item.id} scope="col">{item.title}</th>)}</tr></thead><tbody>
                <tr><th scope="row">Riesgo orientativo</th>{comparison.map(item=><td key={item.id}>{RISK_FILTERS.find(filter=>filter.value===item.risk)?.label}</td>)}</tr>
                <tr><th scope="row">Horizonte</th>{comparison.map(item=><td key={item.id}>{item.horizons.map(h=>HORIZON_FILTERS.find(filter=>filter.value===h)?.label).join(' / ')}</td>)}</tr>
                {ASSET_CLASSES.map(asset=><tr key={asset.key}><th scope="row">{asset.name}</th>{comparison.map(item=><td key={item.id}>{percent(modelAllocation(item)[asset.key])}</td>)}</tr>)}
            </tbody></table></div>
        </AcademyPanel>}
        <AcademyPanel variant="workspace" as="section" id="strategy-plan" className="strategy-plan" aria-labelledby="strategy-plan-title">
            <div className="strategy-section-heading"><div><h2 id="strategy-plan-title">Mi distribución</h2><p>{model.title}{customized?' · personalizada':''}</p></div><button className="strategy-button strategy-button--secondary" onClick={()=>{const weights=modelAllocation(model);setPlan(Object.fromEntries(ASSET_KEYS.map(key=>[key,String(weights[key])])));}}><RotateCcw size={16}/>Restaurar modelo</button></div>
            <p className="strategy-model-note"><strong>Sobre el modelo original: </strong>{model.note}{customized&&' Las etiquetas de plazo y riesgo del catálogo describen el modelo original; no evalúan tu nueva distribución.'}</p>
            {notice&&<p role="alert" className="strategy-error">{notice}</p>}
            <label className="strategy-capital" htmlFor="strategy-capital">Importe para distribuir (€)<input id="strategy-capital" type="number" min="0.01" max="1000000000000" step="any" value={capital} onChange={event=>{const raw=event.target.value;setCapital(raw);const value=Number(raw);if(raw.trim()&&Number.isFinite(value)&&value>0&&value<=1e12)setLastCapital(value);}} aria-invalid={!amountValid}/></label>
            {!amountValid&&<p className="strategy-error" role="alert">Introduce un importe mayor que cero y hasta un billón de euros.</p>}
            <AcademyGrid variant="weights" className="strategy-weight-grid">{ASSET_CLASSES.map(asset=><AcademyControlField variant="strategy" controlId={`strategy-${asset.key}`} label={<>{asset.name}</>} unit={<>%</>} detail={<> {amountValid&&Number.isFinite(allocation[asset.key])&&allocation[asset.key]>=0&&allocation[asset.key]<=100?money.format(amount*allocation[asset.key]/100):'—'} </>} key={asset.key} style={{'--asset-color':asset.color} as CSSProperties}><input id={`strategy-${asset.key}`} type="number" min="0" max="100" step="any" value={plan[asset.key]} onChange={event=>setPlan(current=>({...current,[asset.key]:event.target.value}))} aria-invalid={!Number.isFinite(allocation[asset.key])||allocation[asset.key]<0||allocation[asset.key]>100}/></AcademyControlField>)}</AcademyGrid>
            <div className="strategy-plan__total"><strong>Total: {percent(total)}</strong><button className="strategy-button strategy-button--secondary" type="button" disabled={!normalizeAllocation(allocation)} onClick={normalize}>Ajustar proporcionalmente al 100%</button></div>
            {!valid&&<p className="strategy-error" role="alert">Los pesos deben estar entre 0% y 100% y sumar exactamente 100%. Completa los campos para continuar.</p>}
            {valid&&<AllocationBar allocation={allocation}/>}
            <p className="strategy-help">Edición por bloques: los subtipos del modelo se agrupan. El simulador no distingue regiones, duración ni fondos concretos. Tus cambios no modifican tu cartera del Dashboard.</p>
            {valid&&amountValid?<Link className="strategy-button strategy-button--primary" to={`/academy/asset-allocation?${allocationQuery(allocation,amount,selected)}`}>Simular esta distribución<ArrowRight size={18}/></Link>:<button className="strategy-button strategy-button--primary" disabled>Simular esta distribución</button>}
        </AcademyPanel>
        <section id="strategy-assets" className="strategy-assets" aria-labelledby="strategy-assets-title">
            <h2 id="strategy-assets-title" className="portfolio-builder__section-title">Qué aporta cada bloque</h2>
            <AcademyGrid variant="strategyAssets" className="strategy-asset-grid">
                {ASSET_CLASSES.map(asset=>{
                    const Icon=icons[asset.key];
                    const titleId=`strategy-asset-${asset.key}-title`;
                    const descriptionId=`strategy-asset-${asset.key}-description`;
                    const content=<>
                        <div className="strategy-asset__header">
                            <span className="strategy-asset__icon" aria-hidden="true"><Icon size={23}/></span>
                            <h3 id={titleId}>{asset.name}</h3>
                        </div>
                        <p id={descriptionId} className="strategy-asset__description">{asset.desc}</p>
                        <div className="strategy-asset__footer">
                            <div className="strategy-asset__risk"><span>Riesgo</span><strong>{asset.risk}</strong></div>
                            {asset.path&&<span className="strategy-asset__guide">Ver guía <ArrowRight size={16} aria-hidden="true"/></span>}
                        </div>
                    </>;
                    const style={'--asset-color':asset.color} as CSSProperties;
                    return asset.path
                        ?<AcademyLinkCard variant="workspace" key={asset.key} className="strategy-asset strategy-asset--linked" style={style} to={asset.path} aria-labelledby={titleId} aria-describedby={descriptionId}>{content}</AcademyLinkCard>
                        :<AcademyPanel variant="workspace" as="article" key={asset.key} className="strategy-asset" style={style} aria-labelledby={titleId}>{content}</AcademyPanel>;
                })}
            </AcademyGrid>
        </section>
        <AcademyPanel variant="workspace" as="section" id="strategy-profile" className="strategy-profile"><h2 className="portfolio-builder__section-title">Antes de elegir una distribución</h2><p>El plazo, la necesidad de retirar dinero y la capacidad de soportar pérdidas importan tanto como la tolerancia emocional. Un perfil no determina un porcentaje único de acciones y bonos.</p>
            <AcademyGrid variant="profiles" className="strategy-profile__grid"><article><h3>Conservador</h3><p>Prioriza disponibilidad y pérdidas limitadas. Distingue entre dinero que necesitas pronto y capital que puedes mantener invertido.</p></article><article><h3>Moderado</h3><p>Acepta fluctuaciones y combina fuentes de riesgo. Los bonos no aseguran compensar las caídas de la bolsa.</p></article><article><h3>Agresivo</h3><p>Puede soportar caídas importantes y periodos prolongados de recuperación, sin depender de ese dinero a corto plazo.</p></article></AcademyGrid>
            <div className="strategy-links"><Link to="/academy/investor-profile-test">Revisar mi perfil <ArrowRight size={16}/></Link><Link to="/academy/risk">Gestión del riesgo <ArrowRight size={16}/></Link><Link to="/academy/fund-radar">Explorar fondos <ArrowRight size={16}/></Link></div>
        </AcademyPanel>
    </div>;
}
