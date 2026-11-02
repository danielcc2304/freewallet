import{simulationFrameStyle}from'../ui/SimulationFrames.styles';
import{SimulationFrame,SimulationFramePanel,SimulationFrameGrid,SimulationFrameTitle,AllocationBack}from'../ui/SimulationFrames';
import { AcademySimulationPageHeader } from '../ui/AcademySimulationPageHeader';
import { AcademySimulationNote, AcademySimulationDisclaimer, AcademySimulationSectionHeader, AcademySimulationField, AcademySimulationGrid, AcademySimulationLegend, AcademySimulationTable } from '../ui/AcademySimulationWorkspace';
import {AcademySimulationInsight,AcademyAllocationExplanation} from '../ui/AcademySimulatorParts';
import {AcademyAllocationAction} from '../ui/AcademySimulatorParts';
import { AcademyMetric } from '../ui/AcademyMetric';


import {useState,type CSSProperties} from 'react';
import {useSearchParams} from 'react-router-dom';
import {PieChart,Pie,Cell,ResponsiveContainer,Tooltip} from 'recharts';
import {ArrowLeft,Calculator,Info,RotateCcw} from 'lucide-react';
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

    return <SimulationFrame appearance="allocSim"  >
        <AcademySimulationPageHeader appearance="allocation" section="Construir" icon={<Calculator/>} title="Simulador de cartera" description="Escenarios hipotéticos con pesos e hipótesis editables." />
        <SimulationFrame appearance="allocSimContent"  >
            <AcademySimulationInsight variant="allocation" icon={<Info size={20}/>}>{initial.model?`Distribución de partida: ${initial.model.title}. `:''}Los subtipos se agrupan por bloques. No se replica la duración, la divisa ni los instrumentos del modelo.</AcademySimulationInsight>
            {initial.error&&<AcademySimulationNote appearance="allocation" kind="error" role="alert">{initial.error}</AcademySimulationNote>}
            <AcademySimulationDisclaimer  ><strong>Hipótesis, no histórico ni previsión.</strong> Los valores iniciales son ejemplos editables, sin calibración con series de mercado. No incluyen comisiones, impuestos ni inflación.</AcademySimulationDisclaimer>
            <SimulationFrameGrid appearance="allocSimTopSection"  className={simulationFrameStyle('allocSimTopSectionThree')} variant="allocationStats">
                <AcademyMetric variant="allocation" label={<>Variación anual del escenario</>} value={<>{result.data?pct(result.data.annualReturn):'—'}</>} valueProps={{"className":"value","data-testid":"scenario-return"}} detail={<>Media ponderada de las hipótesis introducidas</>} />
                <AcademyMetric variant="allocation" label={<>Volatilidad bajo hipótesis</>} value={<>{result.data?`${number.format(result.data.volatility)}%`:'—'}</>} valueProps={{"className":"value","data-testid":"scenario-volatility"}} detail={<>Desviación típica anual; no es una pérdida máxima</>} />
                <AcademyMetric variant="allocation" label={<>Choque del escenario seleccionado</>} value={<>{result.data?pct(result.data.stress):'—'}</>} valueProps={{"className":"value","data-testid":"scenario-stress"}} detail={<>{result.data?`${money.format(result.data.stressEuros)} · valor tras el choque: ${money.format(result.data.stressValue)}`:'Completa una distribución válida'}</>} />
            </SimulationFrameGrid>
            <SimulationFramePanel appearance="allocSimInputsArea"  variant="allocationInputs" as="section" aria-labelledby="allocation-weights-title">
                <AcademySimulationSectionHeader appearance="allocation"  title={<>Distribución por bloques</>} headingProps={{'id': "allocation-weights-title",'className': "box-title"}} meta={<>Total: {number.format(total)}%</>} actions={<AcademyAllocationAction type="button" onClick={reset}><RotateCcw size={16}/>Restablecer ejemplo 60/40</AcademyAllocationAction>} />
                <AcademySimulationField appearance="allocation" htmlFor="allocation-capital" label={<>Importe (€)</>}><input id="allocation-capital" type="number" min="0.01" max="1000000000000" step="any" value={capital} onChange={event=>setCapital(event.target.value)} aria-invalid={!validCapital}/></AcademySimulationField>
                <AcademySimulationGrid appearance="inputs" >{ASSET_CLASSES.map(asset=><div className="calc__input-group" key={asset.key}>
                    <label htmlFor={`allocation-${asset.key}`}>{asset.name}</label><SimulationFrame appearance="calcInputWrapper"  ><input id={`allocation-${asset.key}`} type="number" min="0" max="100" step="any" value={weights[asset.key]} onChange={event=>setWeights(current=>({...current,[asset.key]:event.target.value}))} aria-invalid={!Number.isFinite(allocation[asset.key])||allocation[asset.key]<0||allocation[asset.key]>100}/><span className="unit">%</span></SimulationFrame>
                    <input type="range" min="0" max="100" step="0.5" aria-label={`Peso de ${asset.name}`} value={Number.isFinite(allocation[asset.key])?Math.max(0,Math.min(100,allocation[asset.key])):0} onChange={event=>setWeights(current=>({...current,[asset.key]:event.target.value}))} className="custom-slider" style={{'--progress':`${Math.max(0,Math.min(100,allocation[asset.key]||0))}%`} as CSSProperties}/>
                </div>)}</AcademySimulationGrid>
                {!valid&&<AcademySimulationNote appearance="allocation" kind="error" role="alert">Los pesos deben estar entre 0% y 100% y sumar 100%. No se normalizan automáticamente.</AcademySimulationNote>}
                <AcademyAllocationAction type="button" disabled={!normalizeAllocation(allocation)} onClick={()=>{const next=normalizeAllocation(allocation);if(next)setWeights(textAllocation(next));}}>Ajustar proporcionalmente al 100%</AcademyAllocationAction>
                {!validCapital&&<AcademySimulationNote appearance="allocation" kind="error" role="alert">Introduce un importe mayor que cero y hasta un billón de euros.</AcademySimulationNote>}
            </SimulationFramePanel>
            <AcademySimulationGrid appearance="visuals" aria-label="Distribución y significado de las métricas">
                <SimulationFramePanel appearance="allocSimChartBox"  variant="allocation"><SimulationFrameTitle appearance="boxTitle"  >Distribución de activos</SimulationFrameTitle>{valid?<><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={chartData} innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>{chartData.map(entry=><Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip formatter={value=>`${value}%`} contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:'10px',color:'var(--text-primary)'}}/></PieChart></ResponsiveContainer><AcademySimulationLegend items={chartData.map(asset=>({key:asset.name,color:asset.color,label:<>{asset.name}: {number.format(asset.value)}%</>}))} /></>:<p>Completa los pesos para ver la distribución.</p>}</SimulationFramePanel>
                <SimulationFramePanel appearance="allocSimInfoBox"  variant="allocation"><SimulationFrameTitle appearance="boxTitle"  >Cómo leer el resultado</SimulationFrameTitle><AcademyAllocationExplanation paragraphs={[<>La variación anual es una combinación de los porcentajes que introduces; no una rentabilidad garantizada ni un cálculo de rentabilidad compuesta.</>,<>La volatilidad mide dispersión bajo una matriz de correlaciones simplificada. Las pérdidas pueden superar ese porcentaje.</>,<>El choque aplica una variación simultánea a cada bloque. No representa un episodio histórico, una probabilidad ni la peor caída posible.</>]} /></SimulationFramePanel>
            </AcademySimulationGrid>
            <SimulationFramePanel appearance="allocSimInputsArea"  variant="allocationInputs" as="section" aria-labelledby="allocation-assumptions-title"><SimulationFrameTitle appearance="boxTitle"  id="allocation-assumptions-title">Hipótesis editables</SimulationFrameTitle><AcademySimulationNote appearance="allocation" kind="help" >Porcentajes nominales anuales de ejemplo. Ajusta cada bloque a tu hipótesis; el resultado depende de estos valores.</AcademySimulationNote>
                <AcademySimulationTable appearance="allocation" role="region" aria-label="Hipótesis por activo, desplazable horizontalmente" tabIndex={0}><thead><tr><th scope="col">Bloque</th><th scope="col">Variación anual (%)</th><th scope="col">Volatilidad anual (%)</th></tr></thead><tbody>{ASSET_CLASSES.map(asset=><tr key={asset.key}><th scope="row">{asset.name}</th>{(['annualReturn','volatility'] as const).map(field=><td key={field}><input type="number" step="any" min={field==='volatility'?0:-100} max={field==='volatility'?200:100} aria-label={`${field==='annualReturn'?'Variación anual':'Volatilidad anual'} de ${asset.name}`} value={assumptions[asset.key][field]} aria-invalid={!Number.isFinite(numericAssumptions[asset.key][field])||numericAssumptions[asset.key][field]<(field==='volatility'?0:-100)||numericAssumptions[asset.key][field]>(field==='volatility'?200:100)} onChange={event=>setAssumptions(current=>({...current,[asset.key]:{...current[asset.key],[field]:event.target.value}}))}/></td>)}</tr>)}</tbody></AcademySimulationTable>
                <AcademySimulationField appearance="correlation" htmlFor="allocation-correlation" label={<>Correlación común entre bloques: {Number.isFinite(rho)?number.format(rho):'—'}</>}><input id="allocation-correlation" type="range" min="0" max="1" step="0.05" value={rho} onChange={event=>setCorrelation(event.target.value)}/></AcademySimulationField>
                <AcademySimulationNote appearance="allocation" kind="help" >0 supone independencia; 1, movimiento perfectamente correlacionado. Se aplica el mismo coeficiente a todos los pares y no se estiman correlaciones de mercado. Esta simplificación no reproduce coberturas con correlación negativa.</AcademySimulationNote>
            </SimulationFramePanel>
            <SimulationFramePanel appearance="allocSimInputsArea"  variant="allocationInputs" as="section" aria-labelledby="allocation-stress-title"><SimulationFrameTitle appearance="boxTitle"  id="allocation-stress-title">Prueba de sensibilidad</SimulationFrameTitle><label htmlFor="allocation-stress">Escenario de ejemplo<select id="allocation-stress" value={scenario} onChange={event=>changeScenario(event.target.value)}>{STRESS_SCENARIOS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><AcademySimulationNote appearance="allocation" kind="help" >Choques hipotéticos editables. Cada cambio se aplica al instante; cambiar de escenario restablece sus choques de ejemplo.</AcademySimulationNote><SimulationFrameGrid appearance="allocSimShockGrid"  variant="shocks">{ASSET_CLASSES.map(asset=><label key={asset.key} htmlFor={`shock-${asset.key}`}>{asset.name} (%)<input id={`shock-${asset.key}`} type="number" min="-100" max="100" step="any" value={shocks[asset.key]} aria-invalid={!Number.isFinite(numericShocks[asset.key])||numericShocks[asset.key]<-100||numericShocks[asset.key]>100} onChange={event=>setShocks(current=>({...current,[asset.key]:event.target.value}))}/></label>)}</SimulationFrameGrid></SimulationFramePanel>
            {result.error&&<AcademySimulationNote appearance="allocation" kind="error" role="alert">{result.error}</AcademySimulationNote>}
            <AcademySimulationDisclaimer  summary={<>Fórmulas y límites del cálculo</>}><p>Variación anual: Σ wᵢ·rᵢ. Volatilidad: √[(1−ρ)·Σ(wᵢ·σᵢ)² + ρ·(Σ wᵢ·σᵢ)²]. Choque de cartera: Σ wᵢ·choqueᵢ. Los pesos se expresan como fracciones del capital.</p><p>La matriz usa una correlación común entre 0 y 1. No modela colas extremas, impagos, liquidez, rebalanceos, divisas ni cambios de composición. Una volatilidad hipotética cero de la liquidez no implica ausencia de riesgo.</p></AcademySimulationDisclaimer>
            {valid&&validCapital&&<AllocationBack to={`/academy/portfolio?${allocationQuery(allocation,amount,initial.model?.id)}`}><ArrowLeft size={17}/>Volver con esta distribución</AllocationBack>}
        </SimulationFrame>
    </SimulationFrame>;
}
