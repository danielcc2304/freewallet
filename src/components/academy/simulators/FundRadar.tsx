import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Plus, Pencil, Archive, RotateCcw, ChevronDown, ExternalLink, Info, SlidersHorizontal } from 'lucide-react';
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
function Metric({fund,metric,label}:{fund:RadarFund;metric:MetricKey;label?:string}){
    const m=effectiveMetrics(fund),value=m[metric],date=m.dates?.[metric];
    const missingDate=fund.auto_refresh&&fund.fund_radar_data?.metrics[metric]!=null?'Fecha no publicada':'Sin fecha verificada';
    const suffix=metric==='sharpe'?'':metric==='nav'?` ${m.currency??''}`:'%';
    return <div className="radar-card__metric"><dt>{label??RADAR_METRIC_LABELS[metric]}</dt><dd>{fmt(value,suffix)}</dd><small>{value!=null?(date?day(date):missingDate):'No facilitado'}</small></div>;
}
function RadarCard({fund,score,expanded,onToggle,editor,onEdit,onArchive,onRefresh,busy}:{fund:RadarFund;score:RadarScore|undefined;expanded:boolean;onToggle:()=>void;editor:boolean;onEdit:()=>void;onArchive:()=>void;onRefresh:()=>void;busy:boolean}){
    const m=effectiveMetrics(fund),source=fund.auto_refresh?fund.fund_radar_data?.source_url??fund.source_url:fund.source_url;
    const lastFetchFailed=fund.auto_refresh&&!!fund.fund_radar_data?.checked_at&&(!fund.fund_radar_data.last_success_at||Date.parse(fund.fund_radar_data.checked_at)>Date.parse(fund.fund_radar_data.last_success_at));
    const detailsId=`radar-details-${fund.id}`;
    return <article className={`radar-card ${!fund.is_active?'radar-card--archived':''}`}>
        <div className="radar-card__badges"><span>{fund.category}</span><span>{m.risk!=null?`Riesgo ${m.risk}/7`:'Riesgo sin verificar'}</span>{!fund.is_active&&<span>Retirado</span>}</div>
        <h2>{fund.name}</h2><div className="radar-card__identity"><code>{fund.isin}</code><span>{fund.manager||fund.fund_radar_data?.profile?.manager||'Gestora sin indicar'}</span></div>
        <dl className="radar-card__summary"><Metric fund={fund} metric="ytd" label="YTD"/><Metric fund={fund} metric="y1" label="1 año"/><Metric fund={fund} metric="y3" label="3 años · anualizada"/><Metric fund={fund} metric="ter" label="TER anual"/></dl>
        <div className="radar-card__score">{score?.value!=null?<><strong>{fmt(score.value,'')}<small> / 100</small></strong><span>#{score.rank} de {score.peers} comparables</span></>:<><span>Sin puntuación comparable</span><Info size={16} aria-hidden="true"/></>}</div>
        {expanded&&<div className="radar-card__details" id={detailsId}>
            <p className="radar-card__score-note">{score?.value!=null?'Percentil relativo dentro de su grupo; no es una previsión de rentabilidad.':score?.reason}</p>
            <dl className="radar-card__summary"><Metric fund={fund} metric="y5" label="5 años · anualizada"/><Metric fund={fund} metric="volatility" label="Volatilidad · 3 años"/><Metric fund={fund} metric="maxDrawdown" label="Caída máxima · 3 años"/><Metric fund={fund} metric="sharpe" label="Sharpe · 3 años"/><Metric fund={fund} metric="nav" label="Valor liquidativo"/></dl>
            {fund.fund_radar_data?.provider_category&&<p><strong>Categoría Finect:</strong> {fund.fund_radar_data.provider_category}</p>}
            {fund.fund_radar_data?.profile?.description&&<p>{fund.fund_radar_data.profile.description}</p>}
            {fund.description&&<p><strong>Notas editoriales:</strong> {fund.description}</p>}
            {(fund.extra.aum||fund.fund_radar_data?.profile?.aum!=null)&&<p><strong>Patrimonio:</strong> {fund.auto_refresh&&fund.fund_radar_data?.profile?.aum!=null?fmt(fund.fund_radar_data.profile.aum,` ${m.currency??''}`):fund.extra.aum}</p>}
            {fund.extra.duration!=null&&<p><strong>Duración de referencia:</strong> {fmt(fund.extra.duration,' años')}</p>}
            {fund.extra.yieldToMaturity!=null&&<p><strong>TIR de referencia:</strong> {fmt(fund.extra.yieldToMaturity)}</p>}
            {fund.extra.rating&&<p><strong>Rating de referencia:</strong> {fund.extra.rating}</p>}
            {fund.extra.minInvestment&&<p><strong>Inversión mínima de referencia:</strong> {fund.extra.minInvestment}</p>}
            {!!fund.extra.allocation?.length&&<div className="radar-card__allocation"><h3>Desglose de referencia</h3>{fund.extra.allocation.map((row,i)=><div key={i}><span>{row.label}</span><strong>{fmt(row.value)}</strong><progress value={row.value} max={100} aria-label={`${row.label}: ${fmt(row.value)}`}/></div>)}</div>}
            {lastFetchFailed&&<p>La última consulta no aportó datos válidos. Se conserva la información anterior.</p>}
            <p className="radar-card__provenance">{fund.auto_refresh?'Consulta a Finect':'Actualización manual'}: {fund.auto_refresh?day(fund.fund_radar_data?.checked_at):day(fund.updated_at)}. Las fechas de cada métrica pueden ser diferentes.</p>
        </div>}
        <div className="radar-card__footer"><button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={detailsId}>{expanded?'Menos detalles':'Ver ficha'}<ChevronDown size={16} className={expanded?'radar-card__chevron--open':''} aria-hidden="true"/></button>{source&&<a href={source} target="_blank" rel="noopener noreferrer">Fuente <ExternalLink size={15} aria-hidden="true"/></a>}</div>
        {editor&&<div className="radar-card__editor" aria-label={`Gestión de ${fund.name}`}><button type="button" onClick={onEdit}><Pencil size={16} aria-hidden="true"/>Editar</button><button type="button" disabled={busy} onClick={onArchive}>{fund.is_active?<Archive size={16} aria-hidden="true"/>:<RotateCcw size={16} aria-hidden="true"/>}{fund.is_active?'Retirar':'Restaurar'}</button>{fund.auto_refresh&&fund.is_active&&<button type="button" disabled={busy} onClick={onRefresh} aria-label={`Actualizar datos de ${fund.name}`}><RefreshCw size={16} aria-hidden="true"/>Datos</button>}</div>}
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
        const av=sort==='score'?scores.get(a.id)?.value:effectiveMetrics(a)[sort==='ter'?'ter':'y3'];
        const bv=sort==='score'?scores.get(b.id)?.value:effectiveMetrics(b)[sort==='ter'?'ter':'y3'];
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
    return <div className="fund-radar">
        <AcademyPageHeader section="Herramientas" className="radar-header"><h1>Radar de fondos</h1><p>Explora clases por ISIN, compara costes y consulta sus datos de origen antes de decidir.</p><div className="radar-header__meta"><span>{publicFunds.length} fondos publicados</span><span>{categories.length} categorías</span><span>Consulta diaria a Finect</span></div></AcademyPageHeader>
        <div className="radar-toolbar"><div><strong>Catálogo de fondos</strong><span>Las métricas conservan su fecha de origen.</span></div><div className="radar-toolbar__actions"><Button variant="secondary" size="sm" icon={<RefreshCw size={16}/>} disabled={loading} onClick={()=>void reload()}>Recargar</Button>{editorId&&<><Button variant="secondary" size="sm" disabled={working||loading} onClick={()=>void refresh()}>Actualizar Finect</Button><Button size="sm" icon={<Plus size={16}/>} onClick={()=>setEditing({fund:null,actor:editorId})}>Añadir fondo</Button></>}</div></div>
        <section className="radar-filters" aria-label="Filtros del catálogo"><label className="radar-filters__search"><span>Buscar fondo</span><div><Search size={18} aria-hidden="true"/><input type="search" placeholder="Nombre, ISIN o gestora" value={search} onChange={e=>setSearch(e.target.value)}/></div></label><label>Categoría<select value={category} onChange={e=>setCategory(e.target.value)}><option>Todas</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Riesgo<select value={risk} onChange={e=>setRisk(e.target.value)}><option value="all">Todos</option><option value="low">1–2</option><option value="mid">3–4</option><option value="high">5–7</option></select></label><label>Ordenar<select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Nombre</option><option value="ter">Menor TER</option><option value="y3">Mayor rentabilidad 3Y</option><option value="score">Puntuación comparable</option></select></label>{editorId&&<label>Estado<select value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Publicados</option><option value="archived">Retirados</option><option value="all">Todos</option></select></label>}</section>
        {error&&<div role="alert" className="radar-error">{error}<button type="button" onClick={()=>void reload()}>Reintentar carga</button></div>}
        {notice&&<p className="radar-notice" role="status">{notice}</p>}
        <div className="radar-results"><span role="status">{loading?'Cargando catálogo…':`${visible.length} fondos encontrados`}</span><button type="button" onClick={()=>{setSearch('');setCategory('Todas');setRisk('all');setSort('name');setStatus('active');}}><SlidersHorizontal size={16} aria-hidden="true"/>Restablecer filtros</button></div>
        {loading&&funds.length===0?<div className="radar-loading" role="status"><RefreshCw size={22} aria-hidden="true"/>Preparando las fichas…</div>:<div className="radar-grid" aria-busy={loading}>{visible.map(f=><RadarCard key={f.id} fund={f} score={scores.get(f.id)} expanded={expanded.has(f.id)} onToggle={()=>setExpanded(prev=>{const next=new Set(prev);if(next.has(f.id))next.delete(f.id);else next.add(f.id);return next;})} editor={!!editorId} onEdit={()=>editorId&&setEditing({fund:f,actor:editorId})} onArchive={()=>setRetiring(f)} onRefresh={()=>void refresh(f.id)} busy={working}/>)}</div>}
        {!loading&&!error&&visible.length===0&&<div className="radar-empty"><Search size={28} aria-hidden="true"/><h2>No hay fondos con estos filtros</h2><p>Prueba con otro nombre, ISIN o categoría.</p></div>}
        <details className="radar-method"><summary><Info size={18} aria-hidden="true"/>Cómo interpretar los datos y la puntuación</summary><div><h2>Comparaciones con contexto</h2><p>YTD y 1Y son retornos acumulados; 3Y y 5Y son anualizados. El riesgo es el declarado por la fuente. Un guion significa que no se dispone del dato; nunca se trata como cero.</p><p>La puntuación solo aparece con al menos 5 fondos de la misma categoría editorial, divisa y mes de rentabilidad, con métricas de 3 años, fechas verificadas, datos de menos de 90 días y un desfase máximo de 45 días entre riesgo y rentabilidad.</p><code>Base = rentabilidad 3Y − 0,50 × volatilidad 3Y − 0,25 × |caída máxima 3Y|</code><p>Se convierte en un percentil de 0 a 100 dentro de ese grupo; los empates comparten puesto. No se resta otra vez el TER, ya reflejado en las rentabilidades netas. No compares puntuaciones de categorías diferentes.</p><p>Los valores manuales sin fecha se conservan como referencia. La consulta diaria no implica que todas las métricas sean de hoy: Finect puede publicar fechas distintas. Este catálogo es informativo, no una recomendación de compra.</p></div></details>
        <div className="radar-next"><Link to="/academy/portfolio">Diseñar una cartera <ExternalLink size={16} aria-hidden="true"/></Link><Link to="/academy/risk">Revisar el riesgo <ExternalLink size={16} aria-hidden="true"/></Link>{!editorId&&<Link to="/admin/news">Acceso editorial</Link>}</div>
        {editing&&<FundRadarEditor key={`${editing.fund?.id??'new'}-${editing.actor}`} fund={editing.fund} editorId={editing.actor} isOpen={editorId===editing.actor} categories={categories} onClose={()=>setEditing(null)} onSaved={saved=>{setFunds(prev=>[...prev.filter(f=>f.id!==saved.id),saved]);setEditing(null);setNotice('Fondo guardado. Las próximas consultas automáticas usarán esta ficha.');if(saved.auto_refresh&&(!editing.fund||!editing.fund.auto_refresh))void refresh(saved.id);}}/>}
        <ConfirmDialog isOpen={!!retiring&&!!editorId} onClose={()=>{if(!working)setRetiring(null);}} onConfirm={()=>void retire()} title={retiring?.is_active?'Retirar fondo del radar':'Restaurar fondo'} message={retiring?.is_active?`«${retiring.name}» dejará de mostrarse al público. La ficha y su historial se conservan y podrás restaurarlo.`:`«${retiring?.name??''}» volverá a estar disponible en el catálogo público.`} confirmText={retiring?.is_active?'Retirar fondo':'Restaurar'} variant="info" loading={working}/>
    </div>;
}
