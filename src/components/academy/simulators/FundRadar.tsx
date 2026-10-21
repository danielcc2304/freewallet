import { radarStyles, radarLabel, radarInput } from './radarStyles';
import { cn } from '../../../utils/cn';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Plus, Pencil, Archive, RotateCcw, ChevronDown, ExternalLink, Info, SlidersHorizontal, Layers3, ArrowUpRight } from 'lucide-react';
import { Button, ConfirmDialog } from '../../ui';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { useNewsEditorId } from '../../../hooks/useNewsEditorId';
import { loadRadarCatalog, refreshRadarData, setRadarFundActive } from '../../../services/fundRadar/catalog';
import { effectiveMetrics, RADAR_METRIC_LABELS, type MetricKey, type RadarFund } from '../../../services/fundRadar/types';
import { scoreRadarFunds, type RadarScore } from '../../../services/funds/fundScoring';
import { FundRadarEditor } from './FundRadarEditor';
import './FundRadar.css';

const fmt=(value:number|null|undefined,suffix='%')=>value==null||!Number.isFinite(value)?'—':`${value.toLocaleString('es-ES',{maximumFractionDigits:2})}${suffix}`;
const day=(value:string|null|undefined)=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('es-ES'):'Sin fecha verificada';
const text=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
function Metric({fund,metric,label,hero=false}:{fund:RadarFund;metric:MetricKey;label?:string;hero?:boolean}){
    const m=effectiveMetrics(fund),value=m[metric],date=m.dates?.[metric];
    const missingDate=fund.auto_refresh&&fund.fund_radar_data?.metrics[metric]!=null?'Fecha no publicada':'Sin fecha verificada';
    const suffix=metric==='sharpe'?'':metric==='nav'?` ${m.currency??''}`:'%';
    return <div className={cn(radarStyles['radar-card__metric'], hero && radarStyles['radar-card__metric--hero'], ['ytd','y1','y3','y5'].includes(metric) && value!=null && radarStyles[value>=0?'radar-card__metric--positive':'radar-card__metric--negative'])}><dt>{label??RADAR_METRIC_LABELS[metric]}</dt><dd>{fmt(value,suffix)}</dd><small>{value!=null?(date?day(date):missingDate):'No facilitado'}</small></div>;
}
function RadarCard({fund,score,expanded,onToggle,editor,onEdit,onArchive,onRefresh,busy}:{fund:RadarFund;score:RadarScore|undefined;expanded:boolean;onToggle:()=>void;editor:boolean;onEdit:()=>void;onArchive:()=>void;onRefresh:()=>void;busy:boolean}){
    const m=effectiveMetrics(fund),source=fund.auto_refresh?fund.fund_radar_data?.source_url??fund.source_url:fund.source_url;
    const lastFetchFailed=fund.auto_refresh&&!!fund.fund_radar_data?.checked_at&&(!fund.fund_radar_data.last_success_at||Date.parse(fund.fund_radar_data.checked_at)>Date.parse(fund.fund_radar_data.last_success_at));
    const detailsId=`radar-details-${fund.id}`;
    return <article className={cn(radarStyles['radar-card'], !fund.is_active && radarStyles['radar-card--archived'])}>
        <div className={radarStyles['radar-card__badges']}><span>{fund.category}</span>{!fund.is_active&&<span>Retirado</span>}<Layers3 size={19} aria-hidden="true"/></div>
        <header className={radarStyles['radar-card__heading']}><span className={radarStyles['radar-card__manager']}>{fund.manager||fund.fund_radar_data?.profile?.manager||'Gestora sin indicar'}</span><h2>{fund.name}</h2><code>{fund.isin}</code></header>
        <dl className={radarStyles['radar-card__headline']}><Metric fund={fund} metric="y3" label="Rentabilidad anualizada · 3 años" hero/></dl>
        <dl className={cn(radarStyles['radar-card__summary'], radarStyles['radar-card__summary--compact'])}><Metric fund={fund} metric="ytd" label="Este año"/><Metric fund={fund} metric="y1" label="Últimos 12 meses"/><Metric fund={fund} metric="ter" label="Coste anual · TER"/></dl>
        <div className={radarStyles['radar-card__risk']}><span>Riesgo {m.risk!=null?`${m.risk}/7`:'sin verificar'}</span><span className={radarStyles['radar-card__risk-scale']} data-level={m.risk!=null?(m.risk>=5?'high':m.risk>=3?'mid':'low'):'unknown'} aria-hidden="true">{Array.from({length:7},(_,i)=><i key={i} className={m.risk!=null&&i<m.risk?'is-active':''}/>)}</span></div>
        <div className={radarStyles['radar-card__score']}>
            <div><span>Nota en su categoría</span><strong>{score?.grade!=null?<>{fmt(score.grade,'')}<small> / 100</small></>:'—'}</strong></div>
            {score?.grade!=null?<>
                <meter className="radar-card__grade-meter" min={0} max={100} value={score.grade} aria-label={`Nota relativa en ${score.category}: ${fmt(score.grade,'')} de 100`}/>
                <p>{score.category} · {score.peers} fondos{score.provisional?' · Provisional':''}</p>
                <small>Puesto {score.rank} · 50 es el centro del grupo</small>
            </>:<p>{score?.reason||score?.comparisonReason||'Datos pendientes de verificar.'}</p>}
            {score?.value!=null&&<p className={radarStyles['radar-card__ratio']}>Retorno / volatilidad · {fmt(score.value,'×')}</p>}
        </div>
        {expanded&&<div className={radarStyles['radar-card__details']} id={detailsId}>
            <p className={radarStyles['radar-card__score-note']}>{score?.value!=null?`${fmt(m.y3)} de rentabilidad anualizada ÷ ${fmt(m.volatility)} de volatilidad = ${fmt(score.value,'×')}. El ratio es histórico y no es Sharpe. ${score.grade!=null?`La nota compara distancias respecto al centro de ${score.category}; no es un percentil ni una previsión. ${score.provisional?'Muestra pequeña: nota provisional.':''}`:score.comparisonReason}`:score?.reason}</p>
            <dl className={radarStyles['radar-card__summary']}><Metric fund={fund} metric="y3" label="3 años · anualizada"/><Metric fund={fund} metric="y5" label="5 años · anualizada"/><Metric fund={fund} metric="volatility" label="Volatilidad · 3 años"/><Metric fund={fund} metric="maxDrawdown" label="Caída máxima · 3 años"/><Metric fund={fund} metric="sharpe" label="Sharpe · 3 años"/><Metric fund={fund} metric="nav" label="Valor liquidativo"/></dl>
            {fund.fund_radar_data?.provider_category&&<p><strong>Categoría Finect:</strong> {fund.fund_radar_data.provider_category}</p>}
            {fund.fund_radar_data?.profile?.description&&<p>{fund.fund_radar_data.profile.description}</p>}
            {fund.description&&<p><strong>Notas editoriales:</strong> {fund.description}</p>}
            {(fund.extra.aum||fund.fund_radar_data?.profile?.aum!=null)&&<p><strong>Patrimonio:</strong> {fund.auto_refresh&&fund.fund_radar_data?.profile?.aum!=null?fmt(fund.fund_radar_data.profile.aum,` ${m.currency??''}`):fund.extra.aum}</p>}
            {fund.extra.duration!=null&&<p><strong>Duración de referencia:</strong> {fmt(fund.extra.duration,' años')}</p>}
            {fund.extra.yieldToMaturity!=null&&<p><strong>TIR de referencia:</strong> {fmt(fund.extra.yieldToMaturity)}</p>}
            {fund.extra.rating&&<p><strong>Rating de referencia:</strong> {fund.extra.rating}</p>}
            {fund.extra.minInvestment&&<p><strong>Inversión mínima de referencia:</strong> {fund.extra.minInvestment}</p>}
            {!!fund.extra.allocation?.length&&<div className={radarStyles['radar-card__allocation']}><h3>Desglose de referencia</h3>{fund.extra.allocation.map((row,i)=><div key={i}><span>{row.label}</span><strong>{fmt(row.value)}</strong><progress value={row.value} max={100} aria-label={`${row.label}: ${fmt(row.value)}`}/></div>)}</div>}
            {lastFetchFailed&&<p>La última consulta no aportó datos válidos. Se conserva la información anterior.</p>}
            <p className={radarStyles['radar-card__provenance']}>{fund.auto_refresh?'Consulta a Finect':'Actualización manual'}: {fund.auto_refresh?day(fund.fund_radar_data?.checked_at):day(fund.updated_at)}. Las fechas de cada métrica pueden ser diferentes.</p>
        </div>}
        <div className={radarStyles['radar-card__footer']}><button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={detailsId}>{expanded?'Menos detalles':'Ver ficha'}<ChevronDown size={16} className={expanded ? radarStyles['radar-card__chevron--open'] : ''} aria-hidden="true"/></button>{source&&<a href={source} target="_blank" rel="noopener noreferrer">{fund.auto_refresh?'Finect':'Fuente'} <ArrowUpRight size={16} aria-hidden="true"/></a>}</div>
        {editor&&<div className={radarStyles['radar-card__editor']} aria-label={`Gestión de ${fund.name}`}><button type="button" onClick={onEdit}><Pencil size={16} aria-hidden="true"/>Editar</button><button type="button" disabled={busy} onClick={onArchive}>{fund.is_active?<Archive size={16} aria-hidden="true"/>:<RotateCcw size={16} aria-hidden="true"/>}{fund.is_active?'Retirar':'Restaurar'}</button>{fund.auto_refresh&&fund.is_active&&<button type="button" disabled={busy} onClick={onRefresh} aria-label={`Actualizar datos de ${fund.name}`}><RefreshCw size={16} aria-hidden="true"/>Datos</button>}</div>}
    </article>;
}
export function FundRadar(){
    const editorId=useNewsEditorId();
    const [funds,setFunds]=useState<RadarFund[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
    const [search,setSearch]=useState(''),[category,setCategory]=useState('Todas'),[sort,setSort]=useState('name'),[risk,setRisk]=useState('all'),[status,setStatus]=useState('active');
    const [expanded,setExpanded]=useState<Set<string>>(()=>new Set());
    const [editing,setEditing]=useState<{fund:RadarFund|null;actor:string}|null>(null),[retiring,setRetiring]=useState<RadarFund|null>(null),[working,setWorking]=useState(false);
    const request=useRef(0),mounted=useRef(true);
    const reload=useCallback(async()=>{
        const n=++request.current;setLoading(true);setError('');
        try{const data=await loadRadarCatalog();if(mounted.current&&n===request.current)setFunds(data);}
        catch(e){if(mounted.current&&n===request.current)setError(e instanceof Error?e.message:'No se pudo cargar el radar.');}
        finally{if(mounted.current&&n===request.current)setLoading(false);}
    },[]);
    useEffect(()=>{mounted.current=true;void reload();return()=>{mounted.current=false;};},[reload,editorId]);
    const publicFunds=useMemo(()=>funds.filter(f=>f.is_active),[funds]);
    const categories=useMemo(()=>[...new Set(funds.filter(f=>editorId||f.is_active).map(f=>f.category))].sort((a,b)=>a.localeCompare(b,'es')),[funds,editorId]);
    const scores=useMemo(()=>scoreRadarFunds(publicFunds),[publicFunds]);
    const visible=useMemo(()=>funds.filter(f=>{
        if(!editorId&&!f.is_active)return false;
        if((!editorId||status==='active')&&!f.is_active||editorId&&status==='archived'&&f.is_active)return false;
        if(category!=='Todas'&&f.category!==category)return false;
        if(!text([f.name,f.isin,f.manager,f.fund_radar_data?.profile?.name].join(' ')).includes(text(search.trim())))return false;
        const r=effectiveMetrics(f).risk;if(risk!=='all'&&(r==null||risk==='low'&&r>2||risk==='mid'&&(r<3||r>4)||risk==='high'&&r<5))return false;
        return true;
    }).sort((a,b)=>{
        if(sort==='name')return a.name.localeCompare(b.name,'es');
        if(sort==='score'&&a.category!==b.category)return a.category.localeCompare(b.category,'es');
        const av=sort==='score'?scores.get(a.id)?.grade:effectiveMetrics(a)[sort==='ter'?'ter':'y3'];
        const bv=sort==='score'?scores.get(b.id)?.grade:effectiveMetrics(b)[sort==='ter'?'ter':'y3'];
        if(av==null&&bv!=null)return 1;if(bv==null&&av!=null)return -1;
        return (av!=null&&bv!=null?(sort==='ter'?av-bv:bv-av):0)||a.name.localeCompare(b.name,'es');
    }),[funds,editorId,status,category,search,risk,sort,scores]);
    const refresh=async(fundId?:string)=>{
        if(!editorId||working)return;setWorking(true);setError('');setNotice('');
        try{const result=await refreshRadarData(editorId,fundId);if(mounted.current){setNotice(result.requested?`${result.updated} fondos actualizados${result.failed?`; ${result.failed} consultas fallidas: se conserva el dato anterior`:''}.`:'Sin consultas pendientes. Cada fondo admite una nueva consulta editorial cada 15 minutos.');await reload();}}
        catch(e){if(mounted.current)setError(e instanceof Error?e.message:'No se pudieron consultar los datos.');}finally{if(mounted.current)setWorking(false);}
    };
    const retire=async()=>{
        if(!retiring||!editorId||working)return;setWorking(true);setError('');
        try{await setRadarFundActive(retiring,!retiring.is_active,editorId);setNotice(retiring.is_active?'Fondo retirado del catálogo público. Puedes restaurarlo desde Retirados.':'Fondo restaurado.');setRetiring(null);await reload();}
        catch(e){setRetiring(null);setError(e instanceof Error?e.message:'No se pudo cambiar el estado.');}finally{setWorking(false);}
    };
    return <div className={radarStyles['fund-radar']}>
        <AcademyPageHeader section="Herramientas" className="radar-header"><h1>Radar de fondos</h1><p>Explora clases por ISIN, compara costes y consulta sus datos de origen antes de decidir.</p><div className={radarStyles['radar-header__meta']}><span>{publicFunds.length} fondos publicados</span><span>{categories.length} categorías</span><span>Consulta diaria a Finect</span></div></AcademyPageHeader>
        <div className={radarStyles['radar-toolbar']}><div><strong>Catálogo de fondos</strong><span>Las métricas conservan su fecha de origen.</span></div><div className={radarStyles['radar-toolbar__actions']}><Button variant="secondary" size="sm" icon={<RefreshCw size={16}/>} disabled={loading} onClick={()=>void reload()}>Recargar</Button>{editorId&&<><Button variant="secondary" size="sm" disabled={working||loading} onClick={()=>void refresh()}>Actualizar Finect</Button><Button size="sm" icon={<Plus size={16}/>} onClick={()=>setEditing({fund:null,actor:editorId})}>Añadir fondo</Button></>}</div></div>
        <section className={radarStyles['radar-filters']} aria-label="Filtros del catálogo"><label className={radarStyles['radar-filters__search']}><span>Buscar fondo</span><div><Search size={18} aria-hidden="true"/><input className={cn(radarInput, 'tw:border-0 tw:bg-transparent')} type="search" placeholder="Nombre, ISIN o gestora" value={search} onChange={e=>setSearch(e.target.value)}/></div></label><label className={radarLabel}>Categoría<select className={radarInput} value={category} onChange={e=>setCategory(e.target.value)}><option>Todas</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className={radarLabel}>Riesgo<select className={radarInput} value={risk} onChange={e=>setRisk(e.target.value)}><option value="all">Todos</option><option value="low">1–2</option><option value="mid">3–4</option><option value="high">5–7</option></select></label><label className={radarLabel}>Ordenar<select className={radarInput} value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Nombre</option><option value="ter">Menor TER</option><option value="y3">Mayor rentabilidad 3Y</option><option value="score">Mayor nota en su categoría</option></select></label>{editorId&&<label className={radarLabel}>Estado<select className={radarInput} value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Publicados</option><option value="archived">Retirados</option><option value="all">Todos</option></select></label>}</section>
        {error&&<div role="alert" className={radarStyles['radar-error']}>{error}<button type="button" onClick={()=>void reload()}>Reintentar carga</button></div>}
        {notice&&<p className={radarStyles['radar-notice']} role="status">{notice}</p>}
        <div className={radarStyles['radar-results']}><span role="status">{loading?'Cargando catálogo…':`${visible.length} fondos encontrados`}</span><button className="tw:inline-flex tw:items-center tw:justify-center tw:gap-[.45rem] tw:min-h-[44px] tw:border-0 tw:bg-transparent tw:text-main tw:font-[inherit] tw:text-[.85rem] tw:cursor-pointer tw:py-[.4rem] tw:px-[.65rem]" type="button" onClick={()=>{setSearch('');setCategory('Todas');setRisk('all');setSort('name');setStatus('active');}}><SlidersHorizontal size={16} aria-hidden="true"/>Restablecer filtros</button></div>
        {loading&&funds.length===0?<div className={radarStyles['radar-loading']} role="status"><RefreshCw size={22} aria-hidden="true"/>Preparando las fichas…</div>:<div className={radarStyles['radar-grid']} aria-busy={loading}>{visible.map(f=><RadarCard key={f.id} fund={f} score={scores.get(f.id)} expanded={expanded.has(f.id)} onToggle={()=>setExpanded(prev=>{const next=new Set(prev);if(next.has(f.id))next.delete(f.id);else next.add(f.id);return next;})} editor={!!editorId} onEdit={()=>editorId&&setEditing({fund:f,actor:editorId})} onArchive={()=>setRetiring(f)} onRefresh={()=>void refresh(f.id)} busy={working}/>)}</div>}
        {!loading&&!error&&visible.length===0&&<div className={radarStyles['radar-empty']}><Search size={28} aria-hidden="true"/><h2>No hay fondos con estos filtros</h2><p>Prueba con otro nombre, ISIN o categoría.</p></div>}
        <details className={radarStyles['radar-method']}><summary><Info size={18} aria-hidden="true"/>Cómo interpretar las métricas</summary><div><h2>Rentabilidad y riesgo, con sus fechas</h2><p>YTD y 1Y son retornos acumulados; 3Y y 5Y son anualizados. Un guion indica que falta un dato verificable.</p><code>Retorno / volatilidad = rentabilidad anualizada a 3 años ÷ volatilidad anualizada a 3 años</code><p>Por ejemplo, un retorno anual del 12 % con volatilidad del 10 % da 1,20×. El ratio es continuo: cambiar el catálogo o los filtros no modifica su valor. No es Sharpe, porque no se descuenta un tipo libre de riesgo. El TER ya está reflejado en la rentabilidad neta y no se resta de nuevo.</p><h2>Una nota de 0 a 100 por categoría</h2><p>La nota compara el ratio retorno/volatilidad dentro de las categorías generales del radar, con igual divisa y mes de rentabilidad. Una nota más alta indica un mejor resultado relativo en ese grupo. El 50 marca su centro: no es un aprobado. Los empates reciben la misma nota y pequeñas diferencias producen cambios pequeños.</p><code>Centro = mediana de los ratios · Escala = máximo(0,5; 1,4826 × desviación absoluta mediana)<br/>Nota = 50 + 50 × tanh((ratio − centro) / (2 × escala))</code><p>La escala mínima evita exagerar diferencias diminutas; la mediana reduce la influencia de valores extremos. No hay saltos fijos de 25 puntos. Exigimos al menos dos fondos con datos válidos; con dos a cuatro la nota es provisional. La nota puede cambiar si cambia el catálogo de su categoría, pero no por aplicar filtros.</p><p>Las categorías generales pueden incluir estrategias distintas; la ficha muestra también la categoría de Finect. No compares notas entre categorías. Una nota alta puede corresponder a pérdidas si el resto del grupo lo hizo peor. Consulta las rentabilidades, la caída máxima y el Sharpe antes de decidir.</p><p>El cálculo exige ventana de 3 años, divisa, fechas verificadas, antigüedad máxima de 90 días y desfase máximo de 45 días entre retorno y volatilidad. Los datos ausentes o inválidos no se convierten en ceros.</p><p>Finect puede publicar fechas distintas para cada métrica. Las referencias manuales sin fecha se muestran, pero no entran en el cálculo. Información histórica, no una recomendación de compra.</p></div></details>
        <div className={radarStyles['radar-next']}><Link to="/academy/portfolio">Diseñar una cartera <ExternalLink size={16} aria-hidden="true"/></Link><Link to="/academy/risk">Revisar el riesgo <ExternalLink size={16} aria-hidden="true"/></Link>{!editorId&&<Link to="/admin/news">Acceso editorial</Link>}</div>
        {editing&&<FundRadarEditor key={`${editing.fund?.id??'new'}-${editing.actor}`} fund={editing.fund} editorId={editing.actor} isOpen={editorId===editing.actor} categories={categories} onClose={()=>setEditing(null)} onSaved={saved=>{setFunds(prev=>[...prev.filter(f=>f.id!==saved.id),saved]);setEditing(null);setNotice('Fondo guardado. Las próximas consultas automáticas usarán esta ficha.');if(saved.auto_refresh&&(!editing.fund||!editing.fund.auto_refresh))void refresh(saved.id);}}/>}
        <ConfirmDialog isOpen={!!retiring&&!!editorId} onClose={()=>{if(!working)setRetiring(null);}} onConfirm={()=>void retire()} title={retiring?.is_active?'Retirar fondo del radar':'Restaurar fondo'} message={retiring?.is_active?`«${retiring.name}» dejará de mostrarse al público. La ficha y su historial se conservan y podrás restaurarlo.`:`«${retiring?.name??''}» volverá a estar disponible en el catálogo público.`} confirmText={retiring?.is_active?'Retirar fondo':'Restaurar'} variant="info" loading={working}/>
    </div>;
}
