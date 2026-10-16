import {useState,type CSSProperties} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {PieChart,Pie,Cell,ResponsiveContainer,Tooltip} from 'recharts';
import {ArrowLeft,Calculator,Info,RotateCcw} from 'lucide-react';
import {AcademyPageHeader} from '../layout/AcademyPageHeader';
import {ASSET_CLASSES,ASSET_KEYS,type Allocation,type AssetKey} from '../../../data/academy/portfolioModels';
import {DEFAULT_ALLOCATION,DEFAULT_ASSUMPTIONS,STRESS_SCENARIOS,allocationQuery,calculateAllocationScenario,normalizeAllocation,readAllocationQuery,validAllocation,type Assumptions} from '../../../utils/strategyPortfolio';
import './AssetAllocationSim.css';

const number=new Intl.NumberFormat('es-ES',{maximumFractionDigits:2});
const money=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2});
const signed=new Intl.NumberFormat('es-ES',{maximumFractionDigits:2,signDisplay:'exceptZero'});
const pct=(value:number)=>`${signed.format(value)}%`;
function textAllocation(value:Allocation){return Object.fromEntries(ASSET_KEYS.map(key=>[key,String(value[key])])) as Record<AssetKey,string>;}
function defaultAssumptions(){return Object.fromEntries(ASSET_KEYS.map(key=>[key,{annualReturn:String(DEFAULT_ASSUMPTIONS[key].annualReturn),volatility:String(DEFAULT_ASSUMPTIONS[key].volatility)}])) as Record<AssetKey,{annualReturn:string;volatility:string}>;}
function parsed(value:string){return value.trim()===''?NaN:Number(value);}

export function AssetAllocationSim(){
    const [params]=useSearchParams();const [initial]=useState(()=>readAllocationQuery(params));
    const [weights,setWeights]=useState(()=>textAllocation(initial.allocation));
    const [capital,setCapital]=useState(String(initial.capital));const [assumptions,setAssumptions]=useState(defaultAssumptions);
    const [correlation,setCorrelation]=useState('0.25');const [scenario,setScenario]=useState(STRESS_SCENARIOS[0].id);
    const [shocks,setShocks]=useState(()=>textAllocation(STRESS_SCENARIOS[0].shocks));
    const allocation=Object.fromEntries(ASSET_KEYS.map(key=>[key,parsed(weights[key])])) as Allocation;
    const numericAssumptions=Object.fromEntries(ASSET_KEYS.map(key=>[key,{annualReturn:parsed(assumptions[key].annualReturn),volatility:parsed(assumptions[key].volatility)}])) as Assumptions;
    const numericShocks=Object.fromEntries(ASSET_KEYS.map(key=>[key,parsed(shocks[key])])) as Allocation;
    const amount=parsed(capital);const rho=parsed(correlation);const valid=validAllocation(allocation);
    const validCapital=Number.isFinite(amount)&&amount>0&&amount<=1e12;
    const total=ASSET_KEYS.reduce((sum,key)=>sum+(Number.isFinite(allocation[key])?allocation[key]:0),0);
    const result=(()=>{
        try{return {data:calculateAllocationScenario(allocation,numericAssumptions,rho,numericShocks,amount),error:null};}
        catch(error){return {data:null,error:error instanceof Error?error.message:'Revisa los campos.'};}
    })();
    const chartData=ASSET_CLASSES.filter(asset=>allocation[asset.key]>0).map(asset=>({name:asset.name,value:allocation[asset.key],color:asset.color}));
    const reset=()=>{setWeights(textAllocation(DEFAULT_ALLOCATION));setAssumptions(defaultAssumptions());setCorrelation('0.25');setScenario(STRESS_SCENARIOS[0].id);setShocks(textAllocation(STRESS_SCENARIOS[0].shocks));};
    const changeScenario=(id:string)=>{const next=STRESS_SCENARIOS.find(item=>item.id===id);if(next){setScenario(id);setShocks(textAllocation(next.shocks));}};

    return <div className="alloc-sim">
        <AcademyPageHeader className="alloc-sim__header" section="Construir"><div className="alloc-sim__title-group"><Calculator className="alloc-sim__title-icon"/><div><h1 className="alloc-sim__title">Simulador de cartera</h1><p className="alloc-sim__subtitle">Escenarios hipotéticos con pesos e hipótesis editables.</p></div></div></AcademyPageHeader>
        <div className="alloc-sim__content">
            <div className="alloc-sim__source"><Info size={20}/><p>{initial.model?`Distribución de partida: ${initial.model.title}. `:''}Los subtipos se agrupan por bloques. No se replica la duración, la divisa ni los instrumentos del modelo.</p></div>
            {initial.error&&<p className="alloc-sim__validation" role="alert">{initial.error}</p>}
            <div className="alloc-sim__disclaimer"><strong>Hipótesis, no histórico ni previsión.</strong> Los valores iniciales son ejemplos editables, sin calibración con series de mercado. No incluyen comisiones, impuestos ni inflación.</div>
            <div className="alloc-sim__top-section alloc-sim__top-section--three">
                <div className="alloc-sim__stat-card"><span className="label">Variación anual del escenario</span><span className="value" data-testid="scenario-return">{result.data?pct(result.data.annualReturn):'—'}</span><p className="desc">Media ponderada de las hipótesis introducidas</p></div>
                <div className="alloc-sim__stat-card"><span className="label">Volatilidad bajo hipótesis</span><span className="value" data-testid="scenario-volatility">{result.data?`${number.format(result.data.volatility)}%`:'—'}</span><p className="desc">Desviación típica anual; no es una pérdida máxima</p></div>
                <div className="alloc-sim__stat-card"><span className="label">Choque del escenario seleccionado</span><span className="value" data-testid="scenario-stress">{result.data?pct(result.data.stress):'—'}</span><p className="desc">{result.data?`${money.format(result.data.stressEuros)} · valor tras el choque: ${money.format(result.data.stressValue)}`:'Completa una distribución válida'}</p></div>
            </div>
            <section className="alloc-sim__inputs-area" aria-labelledby="allocation-weights-title">
                <div className="alloc-sim__inputs-header"><div><h2 id="allocation-weights-title" className="box-title">Distribución por bloques</h2><span className="alloc-sim__total">Total: {number.format(total)}%</span></div><button type="button" className="alloc-sim__reset" onClick={reset}><RotateCcw size={16}/>Restablecer ejemplo 60/40</button></div>
                <label className="alloc-sim__capital" htmlFor="allocation-capital">Importe (€)<input id="allocation-capital" type="number" min="0.01" max="1000000000000" step="any" value={capital} onChange={event=>setCapital(event.target.value)} aria-invalid={!validCapital}/></label>
                <div className="alloc-sim__inputs-grid">{ASSET_CLASSES.map(asset=><div className="calc__input-group" key={asset.key}>
                    <label htmlFor={`allocation-${asset.key}`}>{asset.name}</label><div className="calc__input-wrapper"><input id={`allocation-${asset.key}`} type="number" min="0" max="100" step="any" value={weights[asset.key]} onChange={event=>setWeights(current=>({...current,[asset.key]:event.target.value}))} aria-invalid={!Number.isFinite(allocation[asset.key])||allocation[asset.key]<0||allocation[asset.key]>100}/><span className="unit">%</span></div>
                    <input type="range" min="0" max="100" step="0.5" aria-label={`Peso de ${asset.name}`} value={Number.isFinite(allocation[asset.key])?Math.max(0,Math.min(100,allocation[asset.key])):0} onChange={event=>setWeights(current=>({...current,[asset.key]:event.target.value}))} className="custom-slider" style={{'--progress':`${Math.max(0,Math.min(100,allocation[asset.key]||0))}%`} as CSSProperties}/>
                </div>)}</div>
                {!valid&&<p className="alloc-sim__validation" role="alert">Los pesos deben estar entre 0% y 100% y sumar 100%. No se normalizan automáticamente.</p>}
                <button className="alloc-sim__reset" type="button" disabled={!normalizeAllocation(allocation)} onClick={()=>{const next=normalizeAllocation(allocation);if(next)setWeights(textAllocation(next));}}>Ajustar proporcionalmente al 100%</button>
                {!validCapital&&<p className="alloc-sim__validation" role="alert">Introduce un importe mayor que cero y hasta un billón de euros.</p>}
            </section>
            <section className="alloc-sim__visuals" aria-label="Distribución y significado de las métricas">
                <div className="alloc-sim__chart-box"><h2 className="box-title">Distribución de activos</h2>{valid?<><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={chartData} innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>{chartData.map(entry=><Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip formatter={value=>`${value}%`} contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:'10px',color:'var(--text-primary)'}}/></PieChart></ResponsiveContainer><ul className="alloc-sim__legend">{chartData.map(asset=><li key={asset.name}><span style={{background:asset.color}}/>{asset.name}: {number.format(asset.value)}%</li>)}</ul></>:<p>Completa los pesos para ver la distribución.</p>}</div>
                <div className="alloc-sim__info-box"><h2 className="box-title">Cómo leer el resultado</h2><div className="info-content"><p>La variación anual es una combinación de los porcentajes que introduces; no una rentabilidad garantizada ni un cálculo de rentabilidad compuesta.</p><p>La volatilidad mide dispersión bajo una matriz de correlaciones simplificada. Las pérdidas pueden superar ese porcentaje.</p><p>El choque aplica una variación simultánea a cada bloque. No representa un episodio histórico, una probabilidad ni la peor caída posible.</p></div></div>
            </section>
            <section className="alloc-sim__inputs-area" aria-labelledby="allocation-assumptions-title"><h2 className="box-title" id="allocation-assumptions-title">Hipótesis editables</h2><p className="alloc-sim__help">Porcentajes nominales anuales de ejemplo. Ajusta cada bloque a tu hipótesis; el resultado depende de estos valores.</p>
                <div className="alloc-sim__table-scroll" role="region" aria-label="Hipótesis por activo, desplazable horizontalmente" tabIndex={0}><table><thead><tr><th scope="col">Bloque</th><th scope="col">Variación anual (%)</th><th scope="col">Volatilidad anual (%)</th></tr></thead><tbody>{ASSET_CLASSES.map(asset=><tr key={asset.key}><th scope="row">{asset.name}</th>{(['annualReturn','volatility'] as const).map(field=><td key={field}><input type="number" step="any" min={field==='volatility'?0:-100} max={field==='volatility'?200:100} aria-label={`${field==='annualReturn'?'Variación anual':'Volatilidad anual'} de ${asset.name}`} value={assumptions[asset.key][field]} aria-invalid={!Number.isFinite(numericAssumptions[asset.key][field])||numericAssumptions[asset.key][field]<(field==='volatility'?0:-100)||numericAssumptions[asset.key][field]>(field==='volatility'?200:100)} onChange={event=>setAssumptions(current=>({...current,[asset.key]:{...current[asset.key],[field]:event.target.value}}))}/></td>)}</tr>)}</tbody></table></div>
                <label className="alloc-sim__correlation" htmlFor="allocation-correlation">Correlación común entre bloques: {Number.isFinite(rho)?number.format(rho):'—'}<input id="allocation-correlation" type="range" min="0" max="1" step="0.05" value={rho} onChange={event=>setCorrelation(event.target.value)}/></label>
                <p className="alloc-sim__help">0 supone independencia; 1, movimiento perfectamente correlacionado. Se aplica el mismo coeficiente a todos los pares y no se estiman correlaciones de mercado. Esta simplificación no reproduce coberturas con correlación negativa.</p>
            </section>
            <section className="alloc-sim__inputs-area" aria-labelledby="allocation-stress-title"><h2 className="box-title" id="allocation-stress-title">Prueba de sensibilidad</h2><label htmlFor="allocation-stress">Escenario de ejemplo<select id="allocation-stress" value={scenario} onChange={event=>changeScenario(event.target.value)}>{STRESS_SCENARIOS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p className="alloc-sim__help">Choques hipotéticos editables. Cada cambio se aplica al instante; cambiar de escenario restablece sus choques de ejemplo.</p><div className="alloc-sim__shock-grid">{ASSET_CLASSES.map(asset=><label key={asset.key} htmlFor={`shock-${asset.key}`}>{asset.name} (%)<input id={`shock-${asset.key}`} type="number" min="-100" max="100" step="any" value={shocks[asset.key]} aria-invalid={!Number.isFinite(numericShocks[asset.key])||numericShocks[asset.key]<-100||numericShocks[asset.key]>100} onChange={event=>setShocks(current=>({...current,[asset.key]:event.target.value}))}/></label>)}</div></section>
            {result.error&&<p role="alert" className="alloc-sim__validation">{result.error}</p>}
            <details className="alloc-sim__disclaimer"><summary>Fórmulas y límites del cálculo</summary><p>Variación anual: Σ wᵢ·rᵢ. Volatilidad: √[(1−ρ)·Σ(wᵢ·σᵢ)² + ρ·(Σ wᵢ·σᵢ)²]. Choque de cartera: Σ wᵢ·choqueᵢ. Los pesos se expresan como fracciones del capital.</p><p>La matriz usa una correlación común entre 0 y 1. No modela colas extremas, impagos, liquidez, rebalanceos, divisas ni cambios de composición. Una volatilidad hipotética cero de la liquidez no implica ausencia de riesgo.</p></details>
            {valid&&validCapital&&<Link className="alloc-sim__back" to={`/academy/portfolio?${allocationQuery(allocation,amount,initial.model?.id)}`}><ArrowLeft size={17}/>Volver con esta distribución</Link>}
        </div>
    </div>;
}
