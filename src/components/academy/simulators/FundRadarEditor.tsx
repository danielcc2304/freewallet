import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Modal } from '../../ui';
import { saveRadarFund } from '../../../services/fundRadar/catalog';
import { METRIC_KEYS, RADAR_METRIC_LABELS, type RadarDraft, type RadarFund, type RadarMetrics } from '../../../services/fundRadar/types';

interface Props {fund:RadarFund|null;editorId:string;isOpen:boolean;categories:string[];onClose:()=>void;onSaved:(fund:RadarFund)=>void}
export function FundRadarEditor({fund,editorId,isOpen,categories,onClose,onSaved}:Props){
    const [draft,setDraft]=useState<RadarDraft>(()=>fund?{isin:fund.isin,name:fund.name,category:fund.category,manager:fund.manager,description:fund.description,source_url:fund.source_url,manual_metrics:structuredClone(fund.manual_metrics),extra:structuredClone(fund.extra),auto_refresh:fund.auto_refresh,is_active:fund.is_active}:{isin:'',name:'',category:'',manager:'',description:'',source_url:null,manual_metrics:{},extra:{},auto_refresh:true,is_active:true});
    const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(METRIC_KEYS.map(k=>[k,String(fund?.manual_metrics[k]??'')])));
    const [asOf,setAsOf]=useState(()=>{const dates=[...new Set(Object.values(fund?.manual_metrics.dates??{}).filter(Boolean))];return dates.length===1?dates[0]!:'';});
    const [dateChanged,setDateChanged]=useState(false);
    const [error,setError]=useState('');const [saving,setSaving]=useState(false);
    const field=(key:'name'|'isin'|'category'|'manager'|'description',value:string)=>setDraft(d=>({...d,[key]:value}));
    const submit=async(event:FormEvent)=>{
        event.preventDefault();if(saving)return;setError('');setSaving(true);
        try{
            const metrics:RadarMetrics={currency:draft.manual_metrics.currency||null,window:draft.manual_metrics.window??null,dates:{...draft.manual_metrics.dates}};
            for(const key of METRIC_KEYS){metrics[key]=values[key].trim()===''?null:Number(values[key]);if(dateChanged)metrics.dates![key]=asOf||null;}
            const saved=await saveRadarFund({...draft,isin:draft.isin.trim().toUpperCase(),name:draft.name.trim(),category:draft.category.trim(),manager:draft.manager.trim(),source_url:draft.source_url?.trim()||null,manual_metrics:metrics},fund,editorId);
            onSaved(saved);
        }catch(e){setError(e instanceof Error?e.message:'No se pudo guardar el fondo.');}finally{setSaving(false);}
    };
    return <Modal isOpen={isOpen} onClose={()=>{if(!saving)onClose();}} title={fund?'Editar fondo':'Añadir fondo'} size="lg">
        <form className="radar-editor" onSubmit={submit}>
            <p className="radar-editor__intro">La ficha es editorial. Finect actualiza las métricas por separado, sin sobrescribir tu nombre, categoría ni notas.</p>
            <div className="radar-editor__grid">
                <label>Nombre de la clase<input required maxLength={200} value={draft.name} onChange={e=>field('name',e.target.value)} /></label>
                <label>ISIN{fund&&<small>Para otra clase, añade un fondo nuevo.</small>}<input required minLength={12} maxLength={12} readOnly={!!fund} autoCapitalize="characters" spellCheck={false} value={draft.isin} onChange={e=>field('isin',e.target.value.toUpperCase())}/></label>
                <label>Categoría editorial<input required maxLength={100} list="radar-editor-categories" value={draft.category} onChange={e=>field('category',e.target.value)}/><datalist id="radar-editor-categories">{categories.map(c=><option key={c} value={c}/>)}</datalist></label>
                <label>Gestora<input maxLength={200} value={draft.manager} onChange={e=>field('manager',e.target.value)}/></label>
                <label className="radar-editor__wide">Enlace de referencia<input type="url" placeholder="https://…" maxLength={2000} value={draft.source_url??''} onChange={e=>setDraft(d=>({...d,source_url:e.target.value||null}))}/></label>
                <label className="radar-editor__wide">Notas editoriales<textarea rows={3} maxLength={4000} value={draft.description} onChange={e=>field('description',e.target.value)}/></label>
            </div>
            <label className="radar-editor__check"><input type="checkbox" checked={draft.auto_refresh} onChange={e=>setDraft(d=>({...d,auto_refresh:e.target.checked}))}/><span><strong>Actualizar automáticamente desde Finect</strong><small>Consulta diaria por ISIN. Si lo desactivas, se muestran solo tus datos manuales.</small></span></label>
            <details className="radar-editor__section" open={!draft.auto_refresh}>
                <summary>Datos manuales y de referencia</summary>
                <p>Déjalos vacíos si no constan. Los porcentajes se introducen como 5,2 para un 5,2 %. En modo automático solo se usan como referencia cuando falta un dato del proveedor.</p>
                <div className="radar-editor__grid">
                    <label>Fecha de estas métricas<input type="date" max={new Date().toISOString().slice(0,10)} value={asOf} onChange={e=>{setAsOf(e.target.value);setDateChanged(true);}}/></label>
                    <label>Divisa de la clase<input maxLength={3} placeholder="EUR" value={draft.manual_metrics.currency??''} onChange={e=>setDraft(d=>({...d,manual_metrics:{...d.manual_metrics,currency:e.target.value.toUpperCase()||null}}))}/></label>
                    {METRIC_KEYS.map(key=><label key={key}>{RADAR_METRIC_LABELS[key]}<input type="number" step={key==='risk'?'1':'any'} value={values[key]} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/></label>)}
                </div>
                <label className="radar-editor__check"><input type="checkbox" checked={draft.manual_metrics.window==='3y'} onChange={e=>setDraft(d=>({...d,manual_metrics:{...d.manual_metrics,window:e.target.checked?'3y':null}}))}/><span>Confirmo que la volatilidad, caída máxima y Sharpe corresponden a 3 años, y que la rentabilidad 3Y es anualizada y neta de gastos del fondo.</span></label>
            </details>
            <details className="radar-editor__section"><summary>Otros datos y desglose de cartera</summary>
                <div className="radar-editor__grid">
                    <label>Patrimonio (texto)<input maxLength={200} value={draft.extra.aum??''} onChange={e=>setDraft(d=>({...d,extra:{...d.extra,aum:e.target.value}}))}/></label>
                    <label>Inversión mínima (texto)<input maxLength={200} value={draft.extra.minInvestment??''} onChange={e=>setDraft(d=>({...d,extra:{...d.extra,minInvestment:e.target.value}}))}/></label>
                    <label>Duración (años)<input type="number" min={0} max={100} step="any" value={draft.extra.duration??''} onChange={e=>setDraft(d=>({...d,extra:{...d.extra,duration:e.target.value===''?undefined:Number(e.target.value)}}))}/></label>
                    <label>TIR de referencia (%)<input type="number" min={-100} max={1000} step="any" value={draft.extra.yieldToMaturity??''} onChange={e=>setDraft(d=>({...d,extra:{...d.extra,yieldToMaturity:e.target.value===''?undefined:Number(e.target.value)}}))}/></label>
                    <label>Rating<input maxLength={40} value={draft.extra.rating??''} onChange={e=>setDraft(d=>({...d,extra:{...d.extra,rating:e.target.value}}))}/></label>
                </div>
                <p>Desglose de referencia. Puede ser parcial; la suma no debe superar el 100 %.</p>
                {(draft.extra.allocation??[]).map((a,i)=><div className="radar-editor__allocation" key={i}>
                    <input aria-label={`Bloque ${i+1}`} maxLength={80} value={a.label} onChange={e=>setDraft(d=>({...d,extra:{...d.extra,allocation:d.extra.allocation!.map((row,j)=>j===i?{...row,label:e.target.value}:row)}}))}/>
                    <input aria-label={`Peso del bloque ${i+1}`} type="number" min={0} max={100} step="any" value={a.value} onChange={e=>setDraft(d=>({...d,extra:{...d.extra,allocation:d.extra.allocation!.map((row,j)=>j===i?{...row,value:Number(e.target.value)}:row)}}))}/>
                    <Button type="button" variant="ghost" aria-label={`Quitar bloque ${i+1}`} onClick={()=>setDraft(d=>({...d,extra:{...d.extra,allocation:d.extra.allocation!.filter((_,j)=>j!==i)}}))}><Trash2 size={18}/></Button>
                </div>)}
                {(draft.extra.allocation?.length??0)<30&&<Button type="button" variant="secondary" icon={<Plus size={16}/>} onClick={()=>setDraft(d=>({...d,extra:{...d.extra,allocation:[...(d.extra.allocation??[]),{label:'',value:0}]}}))}>Añadir bloque</Button>}
            </details>
            {error&&<p role="alert" className="radar-error">{error}</p>}
            <div className="radar-editor__actions"><Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" loading={saving}>Guardar fondo</Button></div>
        </form>
    </Modal>;
}
