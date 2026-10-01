import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import PasswordResetModal from '../../components/PasswordResetModal';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { listRecords, saveRecord, uploadImage } from '../../lib/userData';
import './ShelterSettings.css';

const initialHours = [
  { label: 'Monday - Friday', open: '09:00', close: '18:30', status: 'Open' },
  { label: 'Saturday', open: '10:00', close: '17:00', status: 'Open' },
  { label: 'Sunday', open: '11:00', close: '16:00', status: 'Limited' },
];
function formatTime(value) { const [h,m]=value.split(':').map(Number); return `${String(h%12||12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`; }
function LocationMap({ latitude, longitude, name }) {
  const container = useRef(null); const map = useRef(null); const marker = useRef(null);
  useEffect(() => {
    const instance = L.map(container.current, { zoomControl: false }).setView([10.72,122.54],13); map.current = instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(instance);
    L.control.zoom({position:'bottomright'}).addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize()); observer.observe(container.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    marker.current?.remove(); marker.current=null;
    if (latitude === '' || longitude === '' || latitude == null || longitude == null) return;
    const point=[Number(latitude),Number(longitude)]; if (!point.every(Number.isFinite)) return;
    marker.current=L.circleMarker(point,{radius:10,color:'#689d4b',fillOpacity:1}).bindTooltip(document.createTextNode(name || 'Shelter location'), {permanent:true,direction:'bottom'}).addTo(map.current); map.current.setView(point,16);
  },[latitude,longitude,name]);
  return <div className="shelter-profile-map" ref={container} aria-label="Shelter location map" />;
}

export default function ShelterSettings() {
  const { user, loading: authLoading }=useAuth();
  const [draft,setDraft]=useState(null); const [verified,setVerified]=useState(false); const [loading,setLoading]=useState(true);
  const [editHours,setEditHours]=useState(false);
  const [notice,setNotice]=useState(''); const [busy,setBusy]=useState(false); const [reading,setReading]=useState(false); const [modal,setModal]=useState(null);
  const fileInput=useRef(null); const reader=useRef(null);
  useEffect(() => () => reader.current?.abort(),[]);
  useEffect(() => {
    if(authLoading)return; let active=true;
    if(!user){setDraft({name:'North Valley Animal Sanctuary',landmark:'Mandurriao, Iloilo City, Philippines',phone:'',species:'Dogs, Cats',image:'',latitude:'',longitude:'',operatingHours:initialHours});setLoading(false);return;}
    setLoading(true);
    Promise.all([listRecords('shelter',true),supabase.from('profiles').select('shelter_name,address').eq('id',user.id).maybeSingle(),supabase.from('shelter_approvals').select('status').eq('user_id',user.id).maybeSingle()]).then(([records,profile,approval])=>{
      if(profile.error)throw profile.error;if(approval.error)throw approval.error;if(!active)return;
      const record=records[0];
      setDraft({name:profile.data?.shelter_name || user.user_metadata?.shelter_name || '',landmark:profile.data?.address || '',phone:'',species:'',image:'',latitude:'',longitude:'',...record,operatingHours:record?.operatingHours || initialHours.map(row=>({...row,status:'Closed'}))});setVerified(approval.data?.status==='approved');
    }).catch(error=>{if(active)setNotice(error.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};
  },[user?.id,authLoading]);
  function photo(event){const file=event.target.files?.[0];if(!file)return;reader.current?.abort();setReading(false);if(!['image/jpeg','image/png'].includes(file.type)||!file.size||file.size>10*1024*1024){setNotice('Choose a JPG or PNG image up to 10 MB.');event.target.value='';return;}setReading(true);const next=new FileReader();reader.current=next;next.onload=()=>{setDraft(current=>({...current,image:next.result}));setReading(false);};next.onerror=()=>{setReading(false);setNotice('Unable to read image.');};next.readAsDataURL(file);}
  async function save(){
    if(busy||reading)return;
    if(!draft.image){setNotice('Please add a shelter image.');return;}
    if(draft.operatingHours.some(row=>row.status!=='Closed'&&(!row.open||!row.close||row.open>=row.close))){setNotice('Closing time must be later than opening time.');setEditHours(true);return;}
    setBusy(true);setNotice('');
    try{const hours=draft.operatingHours.map(row=>`${row.label}: ${row.status==='Closed'?'Closed':`${row.open} - ${row.close} (${row.status})`}`).join('; ');let result={...draft,name:draft.name.trim(),landmark:draft.landmark.trim(),hours,status:'See visiting hours'};
      if(user){result.image=await uploadImage(result.image);result=await saveRecord('shelter',result,draft.id);setDraft(result);const {error}=await supabase.auth.updateUser({data:{shelter_name:result.name,avatar_url:result.image}});if(error)throw new Error('Shelter profile saved, but the header could not be updated: '+error.message);}
      setDraft(result);setEditHours(false);setNotice(user?'Shelter profile saved.':'Preview saved for this session only.');
    }catch(error){setNotice(error.message);}finally{setBusy(false);}
  }
  return <UserLayout><main className="shelter-profile-main"><header className="shelter-profile-heading"><h1>Shelter Profile &amp; Settings</h1><button disabled={busy||reading||!draft} onClick={save}><Icon name="check" />{busy?'Saving...':'Save Changes'}</button></header>
    {loading&&<p role="status">Loading shelter profile...</p>}{notice&&<p className="shelter-profile-notice" role="status">{notice}</p>}
    {draft&&!loading&&<><section className="shelter-profile-hero"><div className="shelter-profile-banner">{draft.image?<img src={draft.image} alt={draft.name+' facility'} />:<div className="shelter-banner-empty"><Icon name="camera" /><span>Add your shelter facility photo</span></div>}<button disabled={busy||reading} onClick={()=>fileInput.current.click()}><Icon name="camera" />{reading?'Reading...':'Change Image'}</button><input ref={fileInput} type="file" accept="image/jpeg,image/png" hidden onChange={photo} /></div><div className="shelter-profile-info"><div><h2>{draft.name}<span>{verified?'Verified':user?'Pending verification':'Preview'}</span></h2><p>{draft.landmark}</p></div></div>
    </section><div className="shelter-profile-columns"><div><section className="shelter-hours"><header><div><h2><Icon name="calendar" />Operating &amp; Visiting Hours</h2><p>Public visitation and intake windows</p></div><button disabled={busy} aria-expanded={editHours} onClick={()=>setEditHours(value=>!value)}>Edit hours</button></header>{draft.operatingHours.map((row,index)=><div className="shelter-hours-row" key={row.label}><strong>{row.label}</strong>{editHours?<div className="shelter-hour-inputs"><input type="time" aria-label={row.label+' opening time'} value={row.open} disabled={busy||row.status==='Closed'} onChange={event=>setDraft(current=>({...current,operatingHours:current.operatingHours.map((item,i)=>i===index?{...item,open:event.target.value}:item)}))}/><input type="time" aria-label={row.label+' closing time'} value={row.close} disabled={busy||row.status==='Closed'} onChange={event=>setDraft(current=>({...current,operatingHours:current.operatingHours.map((item,i)=>i===index?{...item,close:event.target.value}:item)}))}/><select aria-label={row.label+' status'} value={row.status} disabled={busy} onChange={event=>setDraft(current=>({...current,operatingHours:current.operatingHours.map((item,i)=>i===index?{...item,status:event.target.value}:item)}))}>{['Open','Limited','Closed'].map(value=><option key={value}>{value}</option>)}</select></div>:<><span>{row.status==='Closed'?'Closed':`${formatTime(row.open)} - ${formatTime(row.close)}`}</span><small className={'hours-'+row.status.toLowerCase()}>{row.status}</small></>}</div>)}</section>
      <div className="shelter-profile-security"><section><h2><Icon name="settings" />Security &amp; Privacy</h2><h3>Account Password</h3><p>Manage your account password.</p><button onClick={()=>user?setModal('password'):setNotice('Sign in with a real shelter account to update your password.')}>Update Password</button></section><section><h2><Icon name="delete" />Delete Account</h2><p>Permanently remove your personal account, data, and access to all shelter applications. This action cannot be undone.</p><button className="shelter-profile-delete" onClick={()=>setModal('delete')}>Delete Account</button></section></div>
    </div><section className="shelter-profile-location"><LocationMap latitude={draft.latitude} longitude={draft.longitude} name={draft.name}/>{(draft.latitude === '' || draft.latitude == null || draft.longitude === '' || draft.longitude == null)&&<p>Your shelter location will appear once the admin sets it.</p>}</section></div></>}
  </main>{modal==='password'&&<PasswordResetModal account={user} onClose={()=>setModal(null)}/>}{modal==='delete'&&<DeleteAccountModal onClose={()=>setModal(null)}/>}</UserLayout>;
}

