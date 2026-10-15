import {ASSET_KEYS,MODEL_PORTFOLIOS,type Allocation,type PortfolioModel,type AssetKey} from '../data/academy/portfolioModels';
export const EMPTY_ALLOCATION:Allocation={stocks:0,bonds:0,cash:0,crypto:0,gold:0,commodities:0,reits:0};
export const DEFAULT_ALLOCATION:Allocation={...EMPTY_ALLOCATION,stocks:60,bonds:40};
export function modelAllocation(model:PortfolioModel):Allocation {
    return model.data.reduce((allocation,part)=>{allocation[part.asset]+=part.value;return allocation;},{...EMPTY_ALLOCATION});
}
export function validAllocation(value:unknown):value is Allocation {
    return !!value&&typeof value==='object'&&ASSET_KEYS.every(key=>typeof (value as Allocation)[key]==='number'&&Number.isFinite((value as Allocation)[key])&&(value as Allocation)[key]>=0&&(value as Allocation)[key]<=100)&&Math.abs(ASSET_KEYS.reduce((sum,key)=>sum+(value as Allocation)[key],0)-100)<1e-8;
}
export function normalizeAllocation(value:Allocation):Allocation|null {
    if(!ASSET_KEYS.every(key=>Number.isFinite(value[key])&&value[key]>=0&&value[key]<=100))return null;
    const total=ASSET_KEYS.reduce((sum,key)=>sum+value[key],0);if(total<=0)return null;
    const units=ASSET_KEYS.map(key=>value[key]/total*10000);const rounded=units.map(Math.floor);
    const ranking=units.map((value,index)=>({index,remainder:value-rounded[index]})).sort((a,b)=>b.remainder-a.remainder);
    const missing=10000-rounded.reduce((a,b)=>a+b,0);for(let i=0;i<missing;i++)rounded[ranking[i].index]++;
    return Object.fromEntries(ASSET_KEYS.map((key,i)=>[key,rounded[i]/100])) as Allocation;
}
export function allocationQuery(allocation:Allocation,capital:number,modelId?:string):string {
    const params=new URLSearchParams({allocation:JSON.stringify(allocation),capital:String(capital)});if(modelId)params.set('model',modelId);return params.toString();
}
export function readAllocationQuery(params:URLSearchParams):{allocation:Allocation;capital:number;model?:PortfolioModel;error:string|null} {
    const model=MODEL_PORTFOLIOS.find(model=>model.id===params.get('model'));let allocation=model?modelAllocation(model):{...DEFAULT_ALLOCATION};let error:string|null=null;
    if(params.has('allocation'))try {const candidate:unknown=JSON.parse(params.get('allocation')!);if(!validAllocation(candidate))throw new Error();allocation={...candidate};}catch{error='La distribución del enlace no es válida. Se muestra una distribución inicial para que puedas revisarla.';}
    const raw=params.get('capital');const amount=raw===null?10000:Number(raw);
    const capital=Number.isFinite(amount)&&amount>0&&amount<=1e12?amount:10000;
    if(capital!==amount)error='El importe del enlace no es válido. Se ha restablecido a 10.000 €.';
    return {allocation,capital,model,error};
}
export interface AssetAssumption {annualReturn:number;volatility:number}
export type Assumptions=Record<AssetKey,AssetAssumption>;
// Editable teaching assumptions; deliberately not presented as observed history.
export const DEFAULT_ASSUMPTIONS:Assumptions={stocks:{annualReturn:6,volatility:18},bonds:{annualReturn:2,volatility:7},cash:{annualReturn:1,volatility:0},crypto:{annualReturn:0,volatility:70},gold:{annualReturn:2,volatility:18},commodities:{annualReturn:2,volatility:22},reits:{annualReturn:5,volatility:24}};
export const STRESS_SCENARIOS=[
    {id:'risk-off',name:'Caída de activos de riesgo',shocks:{stocks:-35,bonds:-8,cash:0,crypto:-65,gold:5,commodities:-20,reits:-35}},
    {id:'inflation',name:'Inflación y subida de tipos',shocks:{stocks:-15,bonds:-15,cash:0,crypto:-35,gold:-5,commodities:25,reits:-20}},
    {id:'recovery',name:'Recuperación y bajada de tipos',shocks:{stocks:12,bonds:8,cash:0,crypto:15,gold:8,commodities:5,reits:12}},
] satisfies Array<{id:string;name:string;shocks:Allocation}>;
export function calculateAllocationScenario(allocation:Allocation,assumptions:Assumptions,correlation:number,shocks:Allocation,capital:number) {
    if(!validAllocation(allocation)||!Number.isFinite(capital)||capital<=0||capital>1e12||!Number.isFinite(correlation)||correlation<0||correlation>1)throw new Error('Revisa los pesos, el importe y la correlación.');
    if(!ASSET_KEYS.every(key=>Number.isFinite(assumptions[key]?.annualReturn)&&assumptions[key].annualReturn>=-100&&assumptions[key].annualReturn<=100&&Number.isFinite(assumptions[key].volatility)&&assumptions[key].volatility>=0&&assumptions[key].volatility<=200&&Number.isFinite(shocks[key])&&shocks[key]>=-100&&shocks[key]<=100))throw new Error('Revisa las hipótesis: rentabilidad y choque entre −100% y 100%; volatilidad entre 0% y 200%.');
    let annualReturn=0,stress=0,sigmaSum=0,sigmaSquares=0;
    for(const key of ASSET_KEYS){const w=allocation[key]/100;annualReturn+=w*assumptions[key].annualReturn;stress+=w*shocks[key];const sigma=w*assumptions[key].volatility;sigmaSum+=sigma;sigmaSquares+=sigma*sigma;}
    // Equicorrelation covariance matrix, PSD for rho in [0,1]. Percent inputs stay in percent units.
    const volatility=Math.sqrt((1-correlation)*sigmaSquares+correlation*sigmaSum*sigmaSum);
    return {annualReturn,volatility,stress,stressEuros:capital*stress/100,stressValue:capital*(1+stress/100)};
}
