import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3000;

const TERMINALS = {
  'jfk-terminal-1': { airport:'JFK', terminal:'1', title:'JFK Terminal 1', source:'https://www.airport-jfk.com/arrivals-terminal-1' },
  'jfk-terminal-4': { airport:'JFK', terminal:'4', title:'JFK Terminal 4', source:'https://www.airport-jfk.com/arrivals-terminal-4' },
  'jfk-terminal-7': { airport:'JFK', terminal:'7', title:'JFK Terminal 7', source:'https://www.airport-jfk.com/arrivals-terminal-7' },
  'jfk-terminal-8': { airport:'JFK', terminal:'8', title:'JFK Terminal 8', source:'https://www.airport-jfk.com/arrivals-terminal-8' },
  'ewr-terminal-b': { airport:'EWR', terminal:'B', title:'EWR Terminal B', source:'https://www.airport-ewr.com/newark-arrivals-terminal-B' },
  'ewr-terminal-c': { airport:'EWR', terminal:'C', title:'EWR Terminal C', source:'https://www.airport-ewr.com/newark-arrivals-terminal-C' }
};

// US + territories to remove domestic flights. Canada/Mexico/Caribbean remain international.
const US_AIRPORTS = new Set(`ABE ABI ABQ ACK ACT ACV ACY ADK ADQ AEX AGS ALB ANC APN ASE ATL ATW AUS AVL AVP AZA BDL BET BFF BFI BFL BGM BGR BHM BIL BIS BJI BLI BMI BNA BOI BOS BPT BQK BRD BRO BTM BTR BTV BUF BUR BWI BZN CAE CAK CDC CDV CGI CHA CHO CHS CID CIU CKB CLE CLL CLT CMH CMI CMX COD COS COU CPR CRP CRW CSG CVG CWA DAB DAL DAY DBQ DCA DEN DFW DHN DIK DLG DLH DRO DSM DTW EAU ECP EGE EKO ELM ELP ERI ESC EUG EVV EWN EWR EYW FAI FAR FAT FAY FCA FLG FLL FLO FNT FSD FSM FWA GCK GEG GFK GGG GJT GNV GPT GRB GRK GRR GSO GSP GST GTF GTR GUC HDN HGR HHH HIB HLN HNL HOB HOU HPN HRL HSV HTS HVN HYA IAD IAH ICT IDA ILM IMT IND INL IPL ITH JAC JAN JAX JFK JLN JNU KOA KTN LAN LAS LAW LAX LBB LBE LCH LEX LFT LGA LGB LIH LIT LNK LRD LSE LWS MAF MBS MCI MCO MDT MDW MEI MEM MFE MFR MGM MHK MHT MIA MKE MKG MLB MLI MLU MOB MOT MQT MRY MSN MSO MSP MSY MTJ MVY MYR OAJ OAK OGG OKC OMA ONT ORD ORF ORH OTH PAH PBG PBI PDX PGD PHF PHL PHX PIA PIB PIE PIT PLN PNS PPG PSC PSE PSG PSP PUB PVD PWM RAP RDD RDM RDU RFD RHI RIC RKS RNO ROA ROC ROW RST RSW SAF SAN SAT SAV SBA SBN SBP SCC SCE SDF SEA SFO SGF SGU SHD SHV SIT SJC SJT SJU SLC SLN SMF SMX SNA SPI SPS SRQ STC STL STS SUN SUX SWF SYR TLH TOL TPA TRI TTN TUL TUS TVC TWF TXK TYR TYS USA VEL VPS WRG XNA YAK YUM ITO GUM SPN STT STX BQN ILG ILN TEB PAE`.split(/\s+/));

// Common international origins into JFK/EWR. Add more here anytime.
const AIRPORT_COUNTRIES = {
  YYZ:'CA', YUL:'CA', YVR:'CA', YOW:'CA', YHZ:'CA', YQB:'CA', YYC:'CA', YEG:'CA', YWG:'CA', YTZ:'CA',
  MEX:'MX', CUN:'MX', GDL:'MX', MTY:'MX', BJX:'MX', PVR:'MX', SJD:'MX',
  LHR:'GB', LGW:'GB', MAN:'GB', EDI:'GB', BHX:'GB', GLA:'GB',
  DUB:'IE', SNN:'IE',
  CDG:'FR', ORY:'FR', NCE:'FR',
  AMS:'NL', BRU:'BE', ZRH:'CH', GVA:'CH', VIE:'AT',
  FRA:'DE', MUC:'DE', BER:'DE', DUS:'DE', HAM:'DE',
  MAD:'ES', BCN:'ES', AGP:'ES', LIS:'PT', OPO:'PT',
  FCO:'IT', MXP:'IT', VCE:'IT', NAP:'IT',
  ATH:'GR', IST:'TR', SAW:'TR', WAW:'PL', PRG:'CZ', BUD:'HU', CPH:'DK', ARN:'SE', OSL:'NO', HEL:'FI', KEF:'IS',
  DXB:'AE', AUH:'AE', DOH:'QA', JED:'SA', RUH:'SA', AMM:'JO', CAI:'EG', TLV:'IL', BEY:'LB', KWI:'KW',
  DEL:'IN', BOM:'IN', BLR:'IN', HYD:'IN', AMD:'IN', MAA:'IN',
  ISB:'PK', LHE:'PK', KHI:'PK', DAC:'BD', CMB:'LK', KTM:'NP',
  NRT:'JP', HND:'JP', KIX:'JP', ICN:'KR', PEK:'CN', PKX:'CN', PVG:'CN', CAN:'CN', HKG:'HK', TPE:'TW',
  SIN:'SG', BKK:'TH', MNL:'PH', SGN:'VN', HAN:'VN', KUL:'MY', CGK:'ID',
  GRU:'BR', GIG:'BR', BSB:'BR', EZE:'AR', AEP:'AR', SCL:'CL', LIM:'PE', BOG:'CO', MDE:'CO', CLO:'CO', UIO:'EC', GYE:'EC', GEO:'GY',
  PTY:'PA', SJO:'CR', GUA:'GT', SAL:'SV', SAP:'HN', MGA:'NI', BZE:'BZ',
  SDQ:'DO', STI:'DO', PUJ:'DO', POP:'DO', SJU:'PR', NAS:'BS', BDA:'BM', AUA:'AW', CUR:'CW', BON:'BQ', SXM:'SX', POS:'TT', ANU:'AG', BGI:'BB', MBJ:'JM', KIN:'JM', GCM:'KY', PLS:'TC', UVF:'LC', GND:'GD', PAP:'HT', HAV:'CU',
  CMN:'MA', RAK:'MA', ACC:'GH', LOS:'NG', ABJ:'CI', DSS:'SN', NBO:'KE', JNB:'ZA', CPT:'ZA', ADD:'ET',
  SYD:'AU', MEL:'AU', AKL:'NZ'
};

function flagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  return countryCode.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()));
}
function isFlightCode(s) { return /^[A-Z0-9]{1,3}\d{1,4}[A-Z]?$/.test(String(s).trim()); }
function iataFromOrigin(origin) { const m = String(origin || '').match(/\(([A-Z0-9]{3})\)\s*$/); return m ? m[1] : ''; }
function isInternational(origin) { const code = iataFromOrigin(origin); return code && !US_AIRPORTS.has(code); }
function airlineCodeFromFlight(flight) { const m = String(flight || '').match(/^([A-Z0-9]{1,3})\d/); return m ? m[1] : ''; }
function expectedFromStatus(status, scheduled) {
  const text = String(status || '');
  const times = text.match(/\b\d{1,2}:\d{2}\s*(?:am|pm)\b/ig) || [];
  const diff = times.find(t => t.toLowerCase() !== String(scheduled || '').toLowerCase());
  return diff || scheduled || '';
}
function uniqByFlight(rows) {
  const seen = new Set();
  return rows.filter(r => { const k = `${r.flight}|${r.scheduled}|${r.terminal}|${r.dayKey || ''}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

// Same-day display window: keep flights from the last 3 hours through midnight today.
// Example: at 5 PM, show 2 PM today through 11:59 PM today.
// This intentionally rejects tomorrow flights.
const LOOKBACK_HOURS = 3;

function nyParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(date).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour), minute: Number(parts.minute), second: Number(parts.second)
  };
}

function nyOffsetMinutes(utcMs) {
  const p = nyParts(new Date(utcMs));
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUTC - utcMs) / 60000);
}

function nyLocalToUtcMs(year, month, day, hour, minute) {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  return guess - nyOffsetMinutes(guess) * 60000;
}

function addDaysNY(baseNY, days) {
  const d = new Date(Date.UTC(baseNY.year, baseNY.month - 1, baseNY.day + days, 12, 0, 0));
  const p = nyParts(d);
  return { year: p.year, month: p.month, day: p.day };
}

function parseClock(timeText) {
  const m = String(timeText || '').match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const ap = m[3].toLowerCase();
  if (ap === 'pm' && hour !== 12) hour += 12;
  if (ap === 'am' && hour === 12) hour = 0;
  return { hour, minute };
}

function flightDateInfo(dayOffset, timeText) {
  const nowNY = nyParts(new Date());
  const d = addDaysNY(nowNY, dayOffset);
  const t = parseClock(timeText);
  if (!t) return { scheduledDateTime: null, dayLabel: '' };
  const ms = nyLocalToUtcMs(d.year, d.month, d.day, t.hour, t.minute);
  const label = dayOffset === -1 ? 'Yesterday' : dayOffset === 0 ? 'Today' : 'Tomorrow';
  return {
    scheduledDateTime: new Date(ms).toISOString(),
    scheduledMs: ms,
    dayLabel: label,
    scheduledDisplay: `${timeText} ${label === 'Today' ? '' : label}`.trim()
  };
}

function withinSameDayWindow(f) {
  if (!f.scheduledMs) return false;
  const now = Date.now();
  const nowNY = nyParts(new Date(now));

  // Start at midnight today, unless the 3-hour lookback is later.
  const startOfToday = nyLocalToUtcMs(nowNY.year, nowNY.month, nowNY.day, 0, 0);
  const endOfToday = nyLocalToUtcMs(nowNY.year, nowNY.month, nowNY.day, 23, 59) + 59999;
  const lookbackStart = now - LOOKBACK_HOURS * 60 * 60 * 1000;
  const start = Math.max(startOfToday, lookbackStart);

  // Hard stop: never show tomorrow flights.
  return f.scheduledMs >= start && f.scheduledMs <= endOfToday;
}

function parseFlights(html, dayOffset = 0) {
  const $ = cheerio.load(html);
  $('script,style,noscript,svg,form,nav,footer').remove();
  const raw = $('body').text().split('\n').map(x => x.replace(/\s+/g,' ').trim()).filter(Boolean);
  const start = raw.findIndex((v,i) => v === 'Origin' && raw[i+1] === 'Arrival');
  const endHints = ['This list contains', 'Date:', 'Check other time periods:'];
  const tokens = raw.slice(start > -1 ? start + 6 : 0);
  const rows = [];
  let i = 0;
  while (i < tokens.length) {
    if (endHints.some(h => tokens[i]?.startsWith(h))) break;
    if (!/\([A-Z0-9]{3}\)$/.test(tokens[i] || '') || !/^\d{1,2}:\d{2}\s*(am|pm)$/i.test(tokens[i+1] || '')) { i++; continue; }
    const origin = tokens[i];
    const originCode = iataFromOrigin(origin);
    const countryCode = AIRPORT_COUNTRIES[originCode] || '';
    const scheduled = tokens[i+1];
    let j = i + 2;
    let terminal = '';
    while (j < tokens.length - 1) {
      const t = tokens[j];
      const n = tokens[j+1];
      if (/^[A-Z0-9]$/.test(t) && n === `Terminal ${t}`) { terminal = t; break; }
      if (/\([A-Z0-9]{3}\)$/.test(t) && /^\d{1,2}:\d{2}\s*(am|pm)$/i.test(tokens[j+1] || '')) break;
      j++;
    }
    if (!terminal) { i += 2; continue; }
    const middle = tokens.slice(i+2, j);
    const flightCodes = [];
    const airlineNames = [];
    let inAirlines = false;
    for (const m of middle) {
      if (!inAirlines && isFlightCode(m)) flightCodes.push(m); else { inAirlines = true; airlineNames.push(m); }
    }
    const status = (tokens[j+2] || '').replace(' [+]', '').replace('[+]', '').trim();
    const flight = flightCodes.join(' / ');
    const airlineCode = airlineCodeFromFlight(flightCodes[0] || '');
    const dateInfo = flightDateInfo(dayOffset, scheduled);
    rows.push({
      origin,
      originCode,
      countryCode,
      flag: flagEmoji(countryCode),
      scheduled,
      scheduledDisplay: dateInfo.scheduledDisplay,
      scheduledDateTime: dateInfo.scheduledDateTime,
      scheduledMs: dateInfo.scheduledMs,
      dayLabel: dateInfo.dayLabel,
      expected: expectedFromStatus(status, scheduled),
      flight,
      airline: airlineNames.join(' / '),
      airlineCode,
      logoUrl: airlineCode ? `https://images.kiwi.com/airlines/64/${airlineCode}.png` : '',
      terminal,
      status
    });
    i = j + 3;
  }
  return rows;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = Object.fromEntries(Object.keys(TERMINALS).map(slug => [
  slug,
  { flights: [], updatedAt: null, refreshing: false, error: null }
]));

async function fetchTerminalDayLive(slug) {
  const cfg = TERMINALS[slug];
  const base = cfg.source;

  // IMPORTANT FIX:
  // Instead of scraping the big airport-wide page and filtering afterward,
  // each terminal now pulls its own terminal-specific page for all four same-day time blocks.
  // This fixes the issue where every page stopped around 11 AM.
  const requests = ['', '?tp=0', '?tp=6', '?tp=12', '?tp=18'].map(suffix => ({
    url: `${base}${suffix}`,
    dayOffset: 0
  }));

  async function fetchOne(req) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(req.url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache'
        },
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const html = await res.text();
      return parseFlights(html, req.dayOffset);
    } finally {
      clearTimeout(timer);
    }
  }

  const settled = await Promise.allSettled(requests.map(fetchOne));
  const out = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') out.push(...result.value);
    else console.error(`${slug} source page failed:`, result.reason?.message || result.reason);
  }

  return uniqByFlight(out)
    .filter(f => String(f.terminal).toUpperCase() === String(cfg.terminal).toUpperCase())
    .filter(f => isInternational(f.origin))
    .filter(withinSameDayWindow)
    .sort((a, b) => (a.scheduledMs || 0) - (b.scheduledMs || 0));
}

async function refreshTerminal(slug, force = false) {
  const c = cache[slug];
  const freshEnough = c.updatedAt && (Date.now() - new Date(c.updatedAt).getTime() < CACHE_TTL_MS);
  if (!force && freshEnough) return c;
  if (c.refreshing) return c;

  c.refreshing = true;
  c.error = null;
  try {
    console.log(`Refreshing ${slug} arrivals cache...`);
    const flights = await fetchTerminalDayLive(slug);
    c.flights = flights;
    c.updatedAt = new Date().toISOString();
    c.error = flights.length ? null : 'No international same-day flights returned from source site';
    console.log(`${slug} cache updated: ${flights.length} flights`);
  } catch (e) {
    c.error = e.message;
    console.error(`${slug} cache refresh failed`, e);
    if (!c.updatedAt) c.updatedAt = new Date().toISOString();
  } finally {
    c.refreshing = false;
  }
  return c;
}

function getTerminalCached(slug) {
  const c = cache[slug];
  const stale = !c.updatedAt || (Date.now() - new Date(c.updatedAt).getTime() > CACHE_TTL_MS);
  if (stale && !c.refreshing) refreshTerminal(slug).catch(console.error);
  return c;
}

// Warm each terminal cache immediately, then refresh in background every 10 minutes.
// This is server-side only; the browser page itself does NOT auto-refresh.
for (const slug of Object.keys(cache)) {
  refreshTerminal(slug, true).catch(console.error);
  setInterval(() => refreshTerminal(slug, true).catch(console.error), CACHE_TTL_MS);
}

app.use(express.static('public'));
app.get('/api/arrivals/:slug', async (req, res) => {
  const cfg = TERMINALS[req.params.slug];
  if (!cfg) return res.status(404).json({ error:'Unknown terminal' });

  const c = getTerminalCached(req.params.slug);
  const flights = c.flights.filter(withinSameDayWindow);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    ...cfg,
    source: cfg.source,
    updatedAt: c.updatedAt || new Date().toISOString(),
    refreshing: c.refreshing,
    error: c.error,
    count: flights.length,
    flights
  });
});

app.get('/api/refresh', async (req, res) => {
  await Promise.all(Object.keys(cache).map(slug => refreshTerminal(slug, true)));
  res.json({ ok:true, cache });
});

app.get('/:slug', (req,res,next) => TERMINALS[req.params.slug] ? res.sendFile(process.cwd() + '/public/index.html') : next());
app.get('/', (req,res) => res.redirect('/jfk-terminal-1'));
app.listen(PORT, () => console.log(`Airport arrivals site running at http://localhost:${PORT}`));
