import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import './AdminSystemOverview.css';

const sections=[
  {title:'Pet Statistics',key:'pets',cards:[['reunited','Reunited Pets'],['lost','Lost Pets'],['found','Found Pets'],['adoptable','Pets for Adoption']]},
  {title:'Account Statistics',key:'accounts',cards:[['users','Total Users'],['shelters','Total Shelters'],['pending','Pending Shelter Approvals']]},
];
export default function AdminSystemOverview(){
  const [data,setData]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true,busy=false;
    async function refresh(){
      if(busy)return;busy=true;
      try{const {data,error}=await supabase.rpc('admin_system_overview');if(error)throw error;if(active){setData(data);setError('');}}
      catch(err){if(active)setError(err.message);}finally{busy=false;}
    }
    void refresh();const timer=setInterval(()=>{if(!document.hidden)void refresh();},15000);
    window.addEventListener('focus',refresh);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[retry]);
  return <div className="admin-system-overview"><h1>System Overview</h1>
    {error&&<p role="alert" className="admin-error">Unable to load statistics: {error} <button onClick={()=>setRetry(value=>value+1)}>Retry</button></p>}
    {!data&&!error&&<p role="status">Loading system statistics...</p>}
    {sections.map(section=><section key={section.key} aria-labelledby={`overview-${section.key}`}><h2 id={`overview-${section.key}`}>{section.title}</h2><div className={`overview-stat-grid overview-${section.key}`}>{section.cards.map(([key,label])=><article key={key}><h3>{label}</h3><strong>{data?data[key].toLocaleString():'\u2014'}</strong></article>)}</div></section>)}
  </div>;
}
