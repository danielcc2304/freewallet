import {useEffect,useId,useRef,useState} from 'react';
import {Download,Upload} from 'lucide-react';
import {Button,Input} from '../ui';
import {importGoogleNewsImage,isGooglePhotoShare,uploadNewsImage} from '../../services/newsImages';
import {getSafeNewsImageUrl} from '../../utils/newsContent';

export function NewsCoverField({value,onChange,disabled,onBusyChange}:{value:string;onChange:(url:string)=>void;disabled:boolean;onBusyChange:(busy:boolean)=>void}) {
    const id=useId();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
    const [failedImage,setFailedImage]=useState('');const input=useRef<HTMLInputElement>(null);
    const active=useRef(true);const operation=useRef(false);const latest=useRef(value);latest.current=value;
    const busyCallback=useRef(onBusyChange);busyCallback.current=onBusyChange;
    useEffect(()=>{active.current=true;return()=>{active.current=false;busyCallback.current(false);};},[]);
    const share=isGooglePhotoShare(value);const image=getSafeNewsImageUrl(value);
    const prepare=async(file?:File)=>{
        if(operation.current||disabled)return;
        operation.current=true;setBusy(true);onBusyChange(true);setError('');const original=value;
        try {
            const url=file?await uploadNewsImage(file):await importGoogleNewsImage(value);
            if(active.current&&latest.current===original)onChange(url);
        } catch(failure) {if(active.current)setError(failure instanceof Error?failure.message:'No se pudo preparar la imagen.');}
        finally {operation.current=false;if(active.current){setBusy(false);onBusyChange(false);}}
    };
    return <div className="news-admin__cover-field">
        <Input label="Imagen de portada (opcional)" hint="URL de imagen o enlace compartido de Google Fotos." type="url" value={value} disabled={disabled||busy} onChange={event=>{onChange(event.target.value);setError('');}} placeholder="https://…"/>
        <div className="news-admin__cover-actions">
            <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden disabled={disabled||busy} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void prepare(file);}}/>
            <Button type="button" variant="secondary" size="sm" icon={<Upload size={16}/>} disabled={disabled||busy} onClick={()=>input.current?.click()}>Subir imagen</Button>
            {share&&<Button type="button" variant="secondary" size="sm" icon={<Download size={16}/>} loading={busy} disabled={disabled||busy} onClick={()=>void prepare()}>Importar de Google Fotos</Button>}
        </div>
        {busy&&<small role="status">Preparando imagen…</small>}
        {share&&!busy&&<small>Importa la foto para verla y guardarla como portada.</small>}
        {!share&&image&&failedImage!==image&&<img className="news-admin__cover-thumbnail" src={image} alt="Vista previa de la portada" referrerPolicy="no-referrer" onError={()=>setFailedImage(image)}/>}
        {!share&&image&&failedImage===image&&<small role="alert">No se puede mostrar esta URL. Usa el enlace directo de la imagen o súbela desde tu dispositivo.</small>}
        {error&&<small className="news-admin__cover-error" role="alert">{error}</small>}
    </div>;
}
