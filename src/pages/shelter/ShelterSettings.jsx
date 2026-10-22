import { useEffect, useRef, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import PasswordResetModal from '../../components/PasswordResetModal';
import ShelterHoursModal from '../../components/ShelterHoursModal';
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
export default function ShelterSettings() {
  const { user, loading: authLoading }=useAuth();
  const [draft,setDraft]=useState(null); const [verified,setVerified]=useState(false); const [loading,setLoading]=useState(true);
  const [editHours,setEditHours]=useState(false);
  const [notice,setNotice]=useState(''); const [busy,setBusy]=useState(false); const [reading,setReading]=useState(false); const [modal,setModal]=useState(null);
  const fileInput=useRef(null); const reader=useRef(null);
  useEffect(() => () => reader.current?.abort(),[]);
  useEffect(() => {
    if(authLoading)return; let active=true;
    if(!user){setDraft(null);setNotice('Sign in to view your shelter settings.');setLoading(false);return;}
    setLoading(true);
    Promise.all([listRecords('shelter',true),supabase.from('profiles').select('shelter_name,address,phone').eq('id',user.id).maybeSingle(),supabase.from('shelter_approvals').select('status').eq('user_id',user.id).maybeSingle()]).then(([records,profile,approval])=>{
      if(profile.error)throw profile.error;if(approval.error)throw approval.error;if(!active)return;
      const record=records[0];
      setDraft({name:profile.data?.shelter_name || user.user_metadata?.shelter_name || '',landmark:profile.data?.address || '',phone:profile.data?.phone || user.user_metadata?.phone || '',species:'',image:'',latitude:'',longitude:'',...record,operatingHours:record?.operatingHours || initialHours.map(row=>({...row,status:'Closed'}))});setVerified(approval.data?.status==='approved');
    }).catch(error=>{if(active)setNotice(error.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};
  },[user?.id,authLoading]);
  function photo(event){const file=event.target.files?.[0];if(!file)return;reader.current?.abort();setReading(false);if(!['image/jpeg','image/png'].includes(file.type)||!file.size||file.size>10*1024*1024){setNotice('Choose a JPG or PNG image up to 10 MB.');event.target.value='';return;}setReading(true);const next=new FileReader();reader.current=next;next.onload=()=>{setDraft(current=>({...current,image:next.result}));setReading(false);};next.onerror=()=>{setReading(false);setNotice('Unable to read image.');};next.readAsDataURL(file);}
  async function save(nextDraft = draft){
    if(busy||reading)return;
    if(!nextDraft.image){setNotice('Please add a shelter image.');return 'Please add a shelter image before saving.';}
    if(nextDraft.operatingHours.some(row=>row.status!=='Closed'&&(!row.open||!row.close||row.open>=row.close))){setNotice('Closing time must be later than opening time.');setEditHours(true);return 'Closing time must be later than opening time.';}
    setBusy(true);setNotice('');
    try{const hours=nextDraft.operatingHours.map(row=>`${row.label}: ${row.status==='Closed'?'Closed':`${row.open} - ${row.close} (${row.status})`}`).join('; ');let result={...nextDraft,name:nextDraft.name.trim(),landmark:nextDraft.landmark.trim(),hours,status:'See visiting hours'};
      if(user){result.image=await uploadImage(result.image);result=await saveRecord('shelter',result,nextDraft.id);setDraft(result);const {error}=await supabase.auth.updateUser({data:{shelter_name:result.name,avatar_url:result.image}});if(error)throw new Error('Shelter profile saved, but the header could not be updated: '+error.message);}
      setDraft(result);setEditHours(false);setNotice(user?'Shelter profile saved.':'Preview saved for this session only.');
    }catch(error){setNotice(error.message);return error.message;}finally{setBusy(false);}
  }
  return <UserLayout><main className="shelter-profile-main"><header className="shelter-profile-heading"><h1>Shelter Profile &amp; Settings</h1><button disabled={busy||reading||!draft} onClick={()=>save()}>{busy?'Saving...':'Save Changes'}</button></header>
    {loading&&<p role="status">Loading shelter profile...</p>}{notice&&<p className="shelter-profile-notice" role="status">{notice}</p>}
    {draft&&!loading&&<><section className="shelter-profile-hero"><div className="shelter-profile-banner">{draft.image?<img src={draft.image} alt={draft.name+' facility'} />:<div className="shelter-banner-empty"><Icon name="camera" /><span>Add your shelter facility photo</span></div>}<button disabled={busy||reading} onClick={()=>fileInput.current.click()}><Icon name="camera" />{reading?'Reading...':'Change Image'}</button><input ref={fileInput} type="file" accept="image/jpeg,image/png" hidden onChange={photo} /></div><div className="shelter-profile-info"><div><h2>{draft.name}<span>{verified?'Verified':user?'Pending verification':'Preview'}</span></h2><p>{draft.landmark}</p></div></div>
    </section><div className="shelter-profile-columns"><div><section className="shelter-hours"><header><div><h2>Operating &amp; Visiting Hours</h2><p>Public visitation and intake windows</p></div><button disabled={busy||reading} aria-haspopup="dialog" aria-expanded={editHours} onClick={()=>setEditHours(value=>!value)}>Edit hours</button></header>{draft.operatingHours.map(row=><div className="shelter-hours-row" key={row.label}><strong>{row.label}</strong><span>{row.status==='Closed'?'Closed':`${formatTime(row.open)} - ${formatTime(row.close)}`}</span><small className={'hours-'+row.status.toLowerCase()}>{row.status}</small></div>)}</section>
      <div className="shelter-profile-security"><section><h2>Security &amp; Privacy</h2><h3>Account Password</h3><p>Manage your account password.</p><button onClick={()=>user?setModal('password'):setNotice('Sign in with a real shelter account to update your password.')}>Update Password</button></section><section><h2>Delete Account</h2><p>Permanently remove your personal account, data, and access to all shelter applications. This action cannot be undone.</p><button className="shelter-profile-delete" onClick={()=>setModal('delete')}>Delete Account</button></section></div>
    </div></div></>}
  </main>{editHours && draft && <ShelterHoursModal hours={draft.operatingHours} onClose={()=>setEditHours(false)} onSave={operatingHours=>save({...draft,operatingHours})}/ >}{modal==='password'&&<PasswordResetModal shelter account={user} onClose={()=>setModal(null)}/>}{modal==='delete'&&<DeleteAccountModal shelter onClose={()=>setModal(null)}/>}</UserLayout>;
}

