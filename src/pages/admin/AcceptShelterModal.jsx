import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import { findShelter } from '../../lib/maps';
import Icon from '../../components/UserIcon';
import './AcceptShelterModal.css';

export default function AcceptShelterModal({row,onClose,onAccepted,onRejected}){
  const dialog=useRef(null),container=useRef(null),map=useRef(null),marker=useRef(null),locked=useRef(false);
  const [pin,setPin]=useState(null),[busy,setBusy]=useState(false),[success,setSuccess]=useState(false),[error,setError]=useState('');
  const [documents,setDocuments]=useState(null),[documentError,setDocumentError]=useState(''),[viewed,setViewed]=useState(null),[opening,setOpening]=useState(null);
  const [rejecting,setRejecting]=useState(false),[reason,setReason]=useState('');
  useEffect(()=>{let active=true;supabase.rpc('admin_shelter_documents',{shelter_user_id:row.id}).then(({data,error})=>{if(!active)return;if(error)setDocumentError(error.message);else setDocuments(data);});return()=>{active=false;};},[row.id]);
  async function viewDocument(doc){setOpening(doc.path);setDocumentError('');try{const {data,error}=await supabase.storage.from('shelter-docs').createSignedUrl(doc.path,300);if(error)throw error;setViewed({...doc,url:data.signedUrl});}catch(err){setDocumentError(err.message);}finally{setOpening(null);}}
  async function reject(){if(locked.current||!reason.trim())return;locked.current=true;marker.current?.dragging?.disable();setBusy(true);setError('');try{const {error}=await supabase.rpc('admin_reject_shelter',{shelter_user_id:row.id,rejection_reason:reason.trim()});if(error)throw error;setSuccess('rejected');onRejected?.(row.id,reason.trim());}catch(err){setError(err.message);locked.current=false;marker.current?.dragging?.enable();}finally{setBusy(false);}}
  const [locationStatus,setLocationStatus]=useState('Finding the registered address...');
  useEffect(()=>{const el=dialog.current,previous=document.activeElement;el.showModal();const instance=L.map(container.current).setView([10.72,122.54],12);map.current=instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(instance);
    let active=true, manuallyPlaced=false;
    const icon=L.divIcon({className:'accept-shelter-pin',html:'<span></span>',iconSize:[28,28],iconAnchor:[14,14]});
    function place(point){
      marker.current?.remove();
      marker.current=L.marker(point,{icon,draggable:true,autoPan:true}).addTo(instance);
      marker.current.bindTooltip(document.createTextNode(row.name),{permanent:true,direction:'top',offset:[0,-12]});
      marker.current.on('dragstart',()=>{manuallyPlaced=true;});
      marker.current.on('dragend',()=>{if(locked.current)return;setPin(marker.current.getLatLng());setLocationStatus('Pin adjusted. Confirm its position before accepting.');});
      setPin(L.latLng(point));
    }
    instance.on('click',event=>{if(locked.current)return;manuallyPlaced=true;place(event.latlng);setLocationStatus('Pin adjusted. Confirm its position before accepting.');});
    async function locate(){
      if(!row.address?.trim()){setLocationStatus('No address provided. Click the map to set the shelter pin.');return;}
      try{
        const shelter={name:row.name,landmark:row.address};
        let point=await findShelter(shelter);
        if(!active||manuallyPlaced||locked.current)return;
        if(!point)point=await findShelter(shelter,{addressOnly:true});
        if(!active||manuallyPlaced||locked.current)return;
        if(point){place(point);instance.setView(point,16);setLocationStatus('Suggested location from the address. Drag the pin or click the map to correct it.');}
        else setLocationStatus('Address not found. Click the map to set the shelter pin.');
      }catch{if(active&&!manuallyPlaced&&!locked.current)setLocationStatus('Automatic lookup is unavailable. Click the map to set the shelter pin.');}
    }
    void locate();
    const observer=new ResizeObserver(()=>instance.invalidateSize());observer.observe(container.current);
    return()=>{active=false;observer.disconnect();instance.remove();el.close();previous?.focus();};
  },[]);
  async function accept(){if(locked.current||!pin)return;locked.current=true;marker.current?.dragging?.disable();setBusy(true);setError('');try{const {error}=await supabase.rpc('admin_accept_shelter',{shelter_user_id:row.id,pin_latitude:pin.lat,pin_longitude:pin.lng});if(error)throw error;setSuccess('approved');onAccepted(row.id);}catch(err){setError(err.message);locked.current=false;marker.current?.dragging?.enable();}finally{setBusy(false);}}
  return <dialog ref={dialog} className="accept-shelter-modal shelter-review-modal" aria-labelledby="accept-shelter-title" onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
    <header><h2 id="accept-shelter-title">{success?(success==='approved'?'Shelter Accepted':'Application Rejected'):'Shelter Verification: Review Application'}</h2><button disabled={busy} onClick={onClose} aria-label="Close shelter approval"><Icon name="close"/></button></header>
    <div hidden={Boolean(success)}><div className="shelter-review-body"><section className="shelter-review-summary">{[['Shelter Name',row.name],['Facility Director',row.representative],['Official Email',row.email],['Location & Reference',row.address],...(row.phone?[['Phone Number',row.phone]]:[])].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'Not provided'}</strong></div>)}</section>
    <h3>Shelter Location</h3><div ref={container} className="accept-shelter-map" aria-label="Choose shelter location"/><p className="accept-shelter-hint" role="status">{locationStatus}</p><p className="accept-shelter-coordinates">{pin?`Selected: ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`:'No location selected'}</p>
    <h3>Submitted Compliance Documents</h3>{!documents&&!documentError&&<p role="status">Loading documents...</p>}{documentError&&<p role="alert" className="admin-error">{documentError}</p>}<div className="shelter-review-documents">{documents?.map(doc=><article key={doc.label}><div><h4>{doc.label}</h4><p>{doc.path?doc.path.split('.').pop().toUpperCase():'Not submitted'}</p></div><button disabled={!doc.path||opening!==null||busy} onClick={()=>viewDocument(doc)} aria-label={`View ${doc.label}`}>{opening===doc.path?'Opening...':'View'}</button></article>)}</div>
    {viewed&&<section className="shelter-document-preview"><header><h3>{viewed.label}</h3><button onClick={()=>setViewed(null)} aria-label="Close document preview"><Icon name="close"/></button></header>{/\.pdf$/i.test(viewed.path)?<iframe src={viewed.url} title={viewed.label}/>:<img src={viewed.url} alt={viewed.label}/>}<a href={viewed.url} target="_blank" rel="noopener noreferrer">Open document in a new tab</a></section>}
    {rejecting&&<label className="shelter-rejection-reason">Reason for rejection<textarea value={reason} onChange={event=>setReason(event.target.value)} maxLength={1000} disabled={busy} placeholder="Explain why this application cannot be approved."/></label>}{error&&<p role="alert" className="admin-error">{error}</p>}</div>
    <footer>{rejecting?<><button disabled={busy} onClick={()=>setRejecting(false)}>Cancel</button><button className="shelter-review-reject" disabled={busy||!reason.trim()} onClick={reject}>{busy?'Rejecting...':'Confirm Rejection'}</button></>:<><button className="shelter-review-reject" disabled={busy} onClick={()=>setRejecting(true)}>Reject Application</button><button className="accept-shelter-primary" disabled={!pin||busy} onClick={accept}>{busy?'Approving...':'Approve & Grant Shelter Access'}</button></>}</footer></div>
    {success&&<section className="accept-shelter-success"><span><Icon name={success==='approved'?'check':'close'}/></span><h3>{row.name}</h3><p>{success==='approved'?'The application is approved and its map location has been saved.':'The application has been rejected and the reason has been saved.'}</p><button className="accept-shelter-primary" onClick={onClose}>Done</button></section>}
  </dialog>;
}
