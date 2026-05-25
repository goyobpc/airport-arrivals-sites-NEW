const slug = location.pathname.split('/').filter(Boolean)[0] || 'jfk-terminal-1';
async function load(){
  const rowsEl=document.getElementById('rows');
  try{
    const r=await fetch(`/api/arrivals/${slug}`); const data=await r.json();
    document.title=`${data.title} International Arrivals`;
    document.getElementById('title').textContent=`${data.title} — International Arrivals`;
    document.getElementById('count').textContent=`${data.count} international flights`;
    document.getElementById('updated').textContent=`Updated ${new Date(data.updatedAt).toLocaleTimeString()}`;
    rowsEl.innerHTML='';
    if(!data.flights.length){ rowsEl.innerHTML='<tr><td colspan="6">No international arrivals found right now for this terminal.</td></tr>'; return; }
    for(const f of data.flights){
      const tr=document.createElement('tr');
      const delayed=/delay/i.test(f.status||'');
      tr.innerHTML=`<td>${f.arrival||''}</td><td>${f.origin||''}</td><td>${f.flight||''}</td><td>${f.airline||''}</td><td>${f.terminal||''}</td><td><span class="status ${delayed?'delayed':''}">${f.status||''}</span></td>`;
      rowsEl.appendChild(tr);
    }
  }catch(e){ rowsEl.innerHTML='<tr><td colspan="6">Could not load source data. Try refreshing.</td></tr>'; }
}
load(); setInterval(load,60000);
