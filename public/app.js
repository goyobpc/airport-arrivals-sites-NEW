const slug = location.pathname.split('/').filter(Boolean)[0] || 'jfk-terminal-1';
const WARMUP_RETRY_MS = 15 * 1000;

function esc(v){
  return String(v ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function logoHtml(f){
  if(!f.logoUrl) return '<span class="airline-fallback">✈</span>';
  return `<img class="airline-logo" src="${esc(f.logoUrl)}" alt="${esc(f.airlineCode || 'airline')}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';"><span class="airline-fallback" style="display:none">✈</span>`;
}

async function load(){
  const rowsEl=document.getElementById('rows');
  try{
    const r=await fetch(`/api/arrivals/${slug}`);
    const data=await r.json();
    document.title=`${data.title} International Arrivals`;
    document.getElementById('title').textContent=`${data.title} — International Arrivals`;
    document.getElementById('count').textContent=`${data.count} international flights — rolling 24 hours`;
    document.getElementById('updated').textContent=data.refreshing
      ? `Updating now… last cache ${data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : 'not ready yet'}`
      : `Updated ${new Date(data.updatedAt).toLocaleTimeString()} — manual refresh only`;
    rowsEl.innerHTML='';
    if(!data.flights.length){
      const msg = data.refreshing
        ? 'Warming up flight data. This can take 30–60 seconds on the free Render plan. The page will retry automatically.'
        : (data.error ? `No flights loaded yet. Source message: ${data.error}` : 'No international arrivals found right now for this terminal.');
      rowsEl.innerHTML=`<tr><td colspan="7">${esc(msg)}</td></tr>`;
      if(data.refreshing || data.error) setTimeout(load, WARMUP_RETRY_MS);
      return;
    }
    for(const f of data.flights){
      const tr=document.createElement('tr');
      const delayed=/delay|late/i.test(f.status||'');
      const landed=/landed|arrived/i.test(f.status||'');
      tr.innerHTML=`
        <td class="time scheduled">${esc(f.scheduledDisplay || f.scheduled)}</td>
        <td class="time expected">${esc(f.expected)}</td>
        <td><span class="flag">${esc(f.flag)}</span> ${esc(f.origin)}</td>
        <td class="flight">${esc(f.flight)}</td>
        <td><div class="airline-cell">${logoHtml(f)}<span>${esc(f.airline)}</span></div></td>
        <td>${esc(f.terminal)}</td>
        <td><span class="status ${delayed?'delayed':''} ${landed?'landed':''}">${esc(f.status)}</span></td>`;
      rowsEl.appendChild(tr);
    }
  }catch(e){
    rowsEl.innerHTML='<tr><td colspan="7">Could not load cached data yet. Retrying automatically.</td></tr>';
    setTimeout(load, WARMUP_RETRY_MS);
  }
}

load();
