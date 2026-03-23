// ═══════════════════════════════════════════════════════════════════════════
// Indian Banking Dashboard — Client-side JS
// All data loaded from static JSON files in data/ folder
// ═══════════════════════════════════════════════════════════════════════════

const DATA = {};
const COLORS = [
  '#3b82f6','#22c55e','#f97316','#a78bfa','#ef4444','#06b6d4','#eab308',
  '#ec4899','#14b8a6','#f43f5e','#8b5cf6','#84cc16','#0ea5e9','#d946ef',
  '#fb923c','#4ade80','#38bdf8','#c084fc','#fbbf24','#f472b6'
];

const PLOTLY_LAYOUT = {
  paper_bgcolor:'transparent', plot_bgcolor:'transparent',
  font:{color:'#94a3b8', size:11},
  margin:{l:50,r:20,t:30,b:40},
  xaxis:{gridcolor:'#1e293b', zerolinecolor:'#334155'},
  yaxis:{gridcolor:'#1e293b', zerolinecolor:'#334155'},
  legend:{bgcolor:'transparent', font:{size:10}},
  hovermode:'x unified',
};
const PLOTLY_CFG = {displayModeBar:false, responsive:true};

// ── Data loading ─────────────────────────────────────────────────────────
async function loadJSON(name) {
  if (DATA[name]) return DATA[name];
  const resp = await fetch('data/' + name + '.json');
  DATA[name] = await resp.json();
  return DATA[name];
}

function bankName(ticker) {
  var names = DATA.meta && DATA.meta.bank_display_names;
  return (names && names[ticker]) || ticker;
}

function qSortKey(q) {
  var m = q.match(/^(\d)QFY(\d{2})$/);
  if (!m) return 0;
  var fy = parseInt(m[2]) < 50 ? 2000 + parseInt(m[2]) : 1900 + parseInt(m[2]);
  return fy * 10 + parseInt(m[1]);
}

// ── Safe DOM helpers ─────────────────────────────────────────────────────
function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function makeText(tag, text, attrs) {
  var el = document.createElement(tag);
  el.textContent = text;
  if (attrs) {
    Object.keys(attrs).forEach(function(k) {
      if (k === 'className') el.className = attrs[k];
      else if (k === 'style') el.setAttribute('style', attrs[k]);
      else el.setAttribute(k, attrs[k]);
    });
  }
  return el;
}

function makeDiv(className, children) {
  var el = document.createElement('div');
  if (className) el.className = className;
  if (children) children.forEach(function(c) { if (c) el.appendChild(c); });
  return el;
}

function makeChartDiv(id, minH) {
  var el = document.createElement('div');
  el.id = id;
  el.className = 'plotly-chart';
  if (minH) el.style.minHeight = minH + 'px';
  return el;
}

function makeChartBox(title, chartId, minH) {
  var box = makeDiv('chart-box');
  box.appendChild(makeText('h3', title));
  box.appendChild(makeChartDiv(chartId, minH || 340));
  return box;
}

function makeLoading() {
  return makeDiv('loading', [document.createTextNode('Loading...')]);
}

// ── Navigation ───────────────────────────────────────────────────────────
var navItems = document.querySelectorAll('.nav-item');
var pages = document.querySelectorAll('.page');
var pageInited = {};

navItems.forEach(function(item) {
  item.addEventListener('click', function() {
    navItems.forEach(function(n) { n.classList.remove('active'); });
    item.classList.add('active');
    var pg = item.getAttribute('data-page');
    pages.forEach(function(p) { p.classList.remove('active'); });
    document.getElementById('page-' + pg).classList.add('active');
    if (!pageInited[pg]) {
      pageInited[pg] = true;
      initPage(pg);
    }
  });
});

async function initPage(pg) {
  await loadJSON('meta');
  switch(pg) {
    case 'dupont': initDupont(); break;
    case 'screener': initScreener(); break;
    case 'deepdive': initDeepDive(); break;
    case 'sector': initSector(); break;
    case 'novel': initNovel(); break;
    case 'cards': initCards(); break;
  }
}

// ── Filter pills builder ─────────────────────────────────────────────────
function makeFilterPills(containerId, onChange) {
  var meta = DATA.meta;
  var presets = meta.preset_filters;
  var container = document.getElementById(containerId);

  var grp = makeDiv('ctrl-group');
  grp.appendChild(makeText('label', 'Bank Filter'));
  var pillGrp = makeDiv('pill-group');

  var presetNames = ['All Banks','Top 5 Private','Top 5 PSU','All Private','All PSU','SFBs'];
  presetNames.forEach(function(name, i) {
    var pill = makeText('div', name, {className: 'pill' + (i === 0 ? ' active' : '')});
    pill.setAttribute('data-filter', name);
    pill.addEventListener('click', function() {
      pillGrp.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
      pill.classList.add('active');
      var banks = presets[pill.getAttribute('data-filter')] || meta.active_banks;
      onChange(banks);
    });
    pillGrp.appendChild(pill);
  });

  grp.appendChild(pillGrp);
  container.appendChild(grp);
  return presets['All Banks'] || meta.active_banks;
}

function addSelect(containerId, label, options, defaultVal, onChange) {
  var container = document.getElementById(containerId);
  var grp = makeDiv('ctrl-group');
  grp.appendChild(makeText('label', label));
  var sel = document.createElement('select');
  options.forEach(function(opt) {
    var o = document.createElement('option');
    o.value = (typeof opt === 'object') ? opt.value : opt;
    o.textContent = (typeof opt === 'object') ? opt.label : opt;
    if (o.value === defaultVal) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', function() { onChange(sel.value); });
  grp.appendChild(sel);
  container.appendChild(grp);
  return sel;
}

function addModePills(containerId, modes, defaultMode, onChange) {
  var container = document.getElementById(containerId);
  var grp = makeDiv('ctrl-group');
  grp.appendChild(makeText('label', 'View'));
  var pillGrp = makeDiv('pill-group');
  modes.forEach(function(m) {
    var pill = makeText('div', m.label, {className:'pill' + (m.value === defaultMode ? ' active' : '')});
    pill.setAttribute('data-mode', m.value);
    pill.addEventListener('click', function() {
      pillGrp.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
      pill.classList.add('active');
      onChange(m.value);
    });
    pillGrp.appendChild(pill);
  });
  grp.appendChild(pillGrp);
  container.appendChild(grp);
}

// ── Table builder ────────────────────────────────────────────────────────
function buildTable(headers, rows) {
  // headers: [{key, label}], rows: [{key: value}]
  var wrap = makeDiv('table-wrap');
  var table = document.createElement('table');
  table.className = 'data-table';

  var thead = document.createElement('thead');
  var htr = document.createElement('tr');
  headers.forEach(function(h) {
    htr.appendChild(makeText('th', h.label));
  });
  thead.appendChild(htr);
  table.appendChild(thead);

  var tbody = document.createElement('tbody');
  rows.forEach(function(row) {
    var tr = document.createElement('tr');
    headers.forEach(function(h, i) {
      var td = document.createElement('td');
      var val = row[h.key];
      td.textContent = val != null ? val : '-';
      if (h.colorFn) {
        var c = h.colorFn(row[h.key]);
        if (c) td.style.color = c;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}


// ═══════════════════════════════════════════════════════════════════════════
// PAGE 1: DuPont RoE Tree
// ═══════════════════════════════════════════════════════════════════════════
async function initDupont() {
  var results = await Promise.all([
    loadJSON('dupont_quarterly'), loadJSON('dupont_annual'), loadJSON('quarters')
  ]);
  var dupQ = results[0], dupA = results[1], quarters = results[2];
  var meta = DATA.meta;
  var container = document.getElementById('dupont-controls');
  var content = document.getElementById('dupont-content');

  var currentBanks = meta.active_banks;
  var currentMode = 'quarterly';
  var currentQuarter = quarters[quarters.length - 1];

  clearEl(container);
  currentBanks = makeFilterPills('dupont-controls', function(b) { currentBanks = b; renderDupont(); });

  addModePills('dupont-controls', [
    {value:'quarterly',label:'Quarterly'},{value:'annual',label:'Annual'},{value:'timeseries',label:'Time Series'}
  ], 'quarterly', function(m) { currentMode = m; renderDupont(); });

  addSelect('dupont-controls', 'Quarter', quarters.map(function(q) { return {value:q,label:q}; }),
    currentQuarter, function(v) { currentQuarter = v; renderDupont(); });

  var COMPS = ['RoE','RoA','Equity_Multiplier','NII_to_Assets','NonII_to_Assets','OpEx_to_Assets','Credit_Cost','Tax_to_Assets','NIM','Yield_on_Assets','Cost_of_Funds'];
  var COMP_LABELS = {
    'RoE':'RoE (%)','RoA':'RoA (%)','Equity_Multiplier':'Equity Multiplier (x)',
    'NII_to_Assets':'NII/Assets (%)','NonII_to_Assets':'NonII/Assets (%)',
    'OpEx_to_Assets':'OpEx/Assets (%)','Credit_Cost':'Credit Cost (%)',
    'Tax_to_Assets':'Tax/Assets (%)','NIM':'NIM (%)',
    'Yield_on_Assets':'Yield on Assets (%)','Cost_of_Funds':'Cost of Funds (%)'
  };

  function renderDupont() {
    clearEl(content);
    var isAnnual = currentMode === 'annual';
    var isTS = currentMode === 'timeseries';
    var data = isAnnual ? dupA : dupQ;

    if (isTS) {
      var grid = makeDiv('chart-row cols-2');
      COMPS.forEach(function(comp) {
        var compData = data[comp] || {};
        var traces = [];
        currentBanks.forEach(function(bank, i) {
          var bd = compData[bank];
          if (!bd) return;
          var periods = Object.keys(bd).sort(isAnnual ?
            function(a,b){return parseInt(a)-parseInt(b);} :
            function(a,b){return qSortKey(a)-qSortKey(b);}
          );
          traces.push({
            x:periods, y:periods.map(function(p){return bd[p];}),
            name:bankName(bank), type:'scatter', mode:'lines',
            line:{color:COLORS[traces.length % COLORS.length], width:1.5}
          });
        });
        if (traces.length === 0) return;
        var box = makeChartBox(COMP_LABELS[comp] || comp, 'dupont-ts-' + comp, 280);
        grid.appendChild(box);
      });
      content.appendChild(grid);

      // Now render each chart
      COMPS.forEach(function(comp) {
        var compData = data[comp] || {};
        var traces = [];
        currentBanks.forEach(function(bank) {
          var bd = compData[bank];
          if (!bd) return;
          var periods = Object.keys(bd).sort(isAnnual ?
            function(a,b){return parseInt(a)-parseInt(b);} :
            function(a,b){return qSortKey(a)-qSortKey(b);}
          );
          traces.push({
            x:periods, y:periods.map(function(p){return bd[p];}),
            name:bankName(bank), type:'scatter', mode:'lines',
            line:{color:COLORS[traces.length % COLORS.length], width:1.5}
          });
        });
        var el = document.getElementById('dupont-ts-' + comp);
        if (el && traces.length > 0) {
          Plotly.newPlot(el, traces, Object.assign({}, PLOTLY_LAYOUT, {showlegend:traces.length<=8}), PLOTLY_CFG);
        }
      });
      return;
    }

    // Cross-sectional view
    var period = isAnnual ? null : currentQuarter;
    var rows = [];
    currentBanks.forEach(function(bank) {
      var row = {bank: bank, bankName: bankName(bank)};
      COMPS.forEach(function(comp) {
        var compData = data[comp] || {};
        var bd = compData[bank] || {};
        if (isAnnual) {
          var yrs = Object.keys(bd).sort(function(a,b){return parseInt(b)-parseInt(a);});
          row[comp] = yrs.length > 0 ? bd[yrs[0]] : null;
        } else {
          row[comp] = bd[period] != null ? bd[period] : null;
        }
      });
      if (row['RoE'] != null || row['RoA'] != null) rows.push(row);
    });
    rows.sort(function(a,b){ return (b.RoE||0) - (a.RoE||0); });

    // Charts
    var chartGrid = makeDiv('chart-row cols-2');
    chartGrid.appendChild(makeChartBox('RoE Comparison (' + (isAnnual ? 'Latest Year' : currentQuarter) + ')', 'dupont-bar-roe'));
    chartGrid.appendChild(makeChartBox('RoA Waterfall Components', 'dupont-bar-roa'));
    content.appendChild(chartGrid);

    // Table
    var tableHeaders = [{key:'bankName',label:'Bank'}];
    COMPS.forEach(function(c) {
      tableHeaders.push({
        key: c + '_fmt', label: COMP_LABELS[c] || c,
        colorFn: function(v) {
          if (v === '-') return null;
          var num = parseFloat(v);
          if (['RoE','RoA','NII_to_Assets','NonII_to_Assets','NIM'].indexOf(c) >= 0) {
            return num > 0 ? '#22c55e' : num < 0 ? '#ef4444' : null;
          }
          if (['OpEx_to_Assets','Credit_Cost','Tax_to_Assets','Cost_of_Funds'].indexOf(c) >= 0) {
            return '#f97316';
          }
          return null;
        }
      });
    });
    var tableRows = rows.map(function(row) {
      var r = {bankName: row.bankName};
      COMPS.forEach(function(c) {
        var v = row[c];
        r[c + '_fmt'] = v != null ? (c === 'Equity_Multiplier' ? v.toFixed(1) + 'x' : v.toFixed(2) + '%') : '-';
      });
      return r;
    });
    var tableBox = makeDiv('chart-box');
    tableBox.appendChild(makeText('h3', 'DuPont Components'));
    tableBox.appendChild(buildTable(tableHeaders, tableRows));
    content.appendChild(tableBox);

    // Render charts
    if (rows.length > 0) {
      Plotly.newPlot('dupont-bar-roe', [{
        x: rows.map(function(r){return r.bankName;}),
        y: rows.map(function(r){return r.RoE || 0;}),
        type:'bar',
        marker:{color: rows.map(function(r){return (r.RoE||0) >= 0 ? '#22c55e' : '#ef4444';})}
      }], Object.assign({}, PLOTLY_LAYOUT, {yaxis:Object.assign({}, PLOTLY_LAYOUT.yaxis, {title:'RoE (%)'})}), PLOTLY_CFG);

      var roaComps = ['NII_to_Assets','NonII_to_Assets','OpEx_to_Assets','Credit_Cost','Tax_to_Assets'];
      var roaColors = ['#22c55e','#3b82f6','#ef4444','#f97316','#a78bfa'];
      var top15 = rows.slice(0, 15);
      var roaTraces = roaComps.map(function(c, i) {
        return {
          x: top15.map(function(r){return r.bankName;}),
          y: top15.map(function(r){
            var v = r[c] || 0;
            return (c==='OpEx_to_Assets'||c==='Credit_Cost'||c==='Tax_to_Assets') ? -v : v;
          }),
          name: COMP_LABELS[c], type:'bar', marker:{color:roaColors[i]}
        };
      });
      Plotly.newPlot('dupont-bar-roa', roaTraces,
        Object.assign({}, PLOTLY_LAYOUT, {barmode:'relative', yaxis:Object.assign({}, PLOTLY_LAYOUT.yaxis, {title:'% of Assets'})}),
        PLOTLY_CFG);
    }
  }

  renderDupont();
}


// ═══════════════════════════════════════════════════════════════════════════
// PAGE 2: Ratio Screener
// ═══════════════════════════════════════════════════════════════════════════
async function initScreener() {
  var results = await Promise.all([
    loadJSON('quarterly_metrics'), loadJSON('quarters')
  ]);
  var qm = results[0], quarters = results[1];
  var meta = DATA.meta;
  var container = document.getElementById('screener-controls');
  var content = document.getElementById('screener-content');

  var currentBanks = meta.active_banks;
  var currentMetric = 'RoE';
  var currentQuarter = quarters[quarters.length - 1];
  var currentMode = 'bar';

  clearEl(container);
  currentBanks = makeFilterPills('screener-controls', function(b) { currentBanks = b; render(); });

  var metrics = Object.keys(qm).sort();
  addSelect('screener-controls', 'Metric', metrics, currentMetric, function(v) { currentMetric = v; render(); });
  addSelect('screener-controls', 'Quarter', quarters.map(function(q){return {value:q,label:q};}),
    currentQuarter, function(v) { currentQuarter = v; render(); });
  addModePills('screener-controls', [{value:'bar',label:'Bar Chart'},{value:'ts',label:'Time Series'}], 'bar',
    function(m) { currentMode = m; render(); });

  function render() {
    clearEl(content);
    var metricData = qm[currentMetric] || {};

    if (currentMode === 'ts') {
      var traces = [];
      currentBanks.forEach(function(bank, i) {
        var bd = metricData[bank];
        if (!bd) return;
        var qs = Object.keys(bd).sort(function(a,b){return qSortKey(a)-qSortKey(b);});
        traces.push({
          x:qs, y:qs.map(function(q){return bd[q];}), name:bankName(bank),
          type:'scatter', mode:'lines', line:{color:COLORS[i % COLORS.length], width:1.5}
        });
      });
      var box = makeChartBox(currentMetric, 'screener-chart', 500);
      content.appendChild(box);
      Plotly.newPlot('screener-chart', traces, Object.assign({}, PLOTLY_LAYOUT, {
        title:{text:currentMetric, font:{size:14,color:'#e2e8f0'}},
        showlegend: traces.length <= 12
      }), PLOTLY_CFG);
    } else {
      var bankVals = [];
      currentBanks.forEach(function(bank) {
        var bd = metricData[bank];
        if (bd && bd[currentQuarter] != null) bankVals.push({bank:bank, value:bd[currentQuarter]});
      });
      bankVals.sort(function(a,b){return b.value - a.value;});
      var box = makeChartBox(currentMetric + ' -- ' + currentQuarter, 'screener-chart', 500);
      content.appendChild(box);
      Plotly.newPlot('screener-chart', [{
        x: bankVals.map(function(r){return bankName(r.bank);}),
        y: bankVals.map(function(r){return r.value;}),
        type:'bar',
        marker:{color: bankVals.map(function(r){return r.value >= 0 ? '#3b82f6' : '#ef4444';})}
      }], Object.assign({}, PLOTLY_LAYOUT, {
        title:{text:currentMetric + ' -- ' + currentQuarter, font:{size:14,color:'#e2e8f0'}},
        yaxis:Object.assign({}, PLOTLY_LAYOUT.yaxis, {title:currentMetric})
      }), PLOTLY_CFG);
    }
  }
  render();
}


// ═══════════════════════════════════════════════════════════════════════════
// PAGE 3: Bank Deep Dive
// ═══════════════════════════════════════════════════════════════════════════
async function initDeepDive() {
  var results = await Promise.all([
    loadJSON('bank_quarterly_detail'), loadJSON('dupont_quarterly'),
    loadJSON('annual_metrics'), loadJSON('asset_quality')
  ]);
  var bqd = results[0], dupQ = results[1], am = results[2], aq = results[3];
  var meta = DATA.meta;
  var container = document.getElementById('deepdive-controls');
  var content = document.getElementById('deepdive-content');

  var currentBank = 'HDFCB';

  clearEl(container);
  var bankOptions = meta.active_banks.map(function(b){return {value:b, label:bankName(b)+' ('+b+')'};});
  addSelect('deepdive-controls', 'Bank', bankOptions, currentBank, function(v) { currentBank = v; render(); });

  var keyMetrics = [
    {group:'Profitability', items:['NII','Other Income','PPOP','PAT','NIM','Cost-Income Ratio','Credit Cost']},
    {group:'Growth', items:['NII Growth','Revenue Growth','PPOP Growth','PAT Growth']},
    {group:'Asset Quality', items:['GNPA %','NNPA %','PCR %','Slippages']},
    {group:'Balance Sheet', items:['Deposits','Advances','Total Assets','Net Worth','Investments']},
  ];
  var dupontComps = ['RoE','RoA','NII_to_Assets','OpEx_to_Assets','Credit_Cost','NIM'];
  var dupontLabels = {'RoE':'RoE (%)','RoA':'RoA (%)','NII_to_Assets':'NII/Assets (%)','OpEx_to_Assets':'OpEx/Assets (%)','Credit_Cost':'Credit Cost (%)','NIM':'NIM (%)'};

  function render() {
    clearEl(content);
    var bankDetail = bqd[currentBank] || {};

    if (Object.keys(bankDetail).length === 0) {
      content.appendChild(makeText('p', 'No detailed quarterly data for this bank.', {style:'color:var(--text2);padding:20px'}));
      return;
    }

    content.appendChild(makeText('h3', bankName(currentBank) + ' -- Quarterly Deep Dive', {style:'font-size:15px;margin-bottom:12px'}));

    // DuPont charts
    var dupGrid = makeDiv('chart-row cols-3');
    dupontComps.forEach(function(comp) {
      dupGrid.appendChild(makeChartBox(dupontLabels[comp] || comp, 'dd-dup-' + comp, 250));
    });
    content.appendChild(dupGrid);

    // Metric groups
    keyMetrics.forEach(function(group) {
      var available = group.items.filter(function(m){return bankDetail[m];});
      if (available.length === 0) return;
      content.appendChild(makeText('h3', group.group, {style:'font-size:14px;margin:16px 0 8px;color:var(--accent2)'}));
      var grid = makeDiv('chart-row cols-2');
      available.forEach(function(m) {
        var safeId = 'dd-m-' + m.replace(/[^a-zA-Z0-9]/g, '_');
        grid.appendChild(makeChartBox(m, safeId, 250));
      });
      content.appendChild(grid);
    });

    // Annual data table
    var annualData = {};
    var annualMetricNames = Object.keys(am);
    annualMetricNames.forEach(function(metric) {
      var bd = am[metric] && am[metric][currentBank];
      if (bd) annualData[metric] = bd;
    });

    if (Object.keys(annualData).length > 0) {
      var allYears = {};
      Object.values(annualData).forEach(function(bd) { Object.keys(bd).forEach(function(y){allYears[y]=true;}); });
      var years = Object.keys(allYears).sort(function(a,b){return parseInt(b)-parseInt(a);}).slice(0, 12);

      content.appendChild(makeText('h3', 'Annual Data', {style:'font-size:14px;margin:16px 0 8px;color:var(--accent2)'}));

      var importantMetrics = ['ROE','ROA','NIM','Cost_to_income','Credit_cost','NII','PAT','ADVANCES','DEPOSITS','CASA PER','GNPA','NNPA','Tier-I','CAR','EPS','BVPS','DPS'];
      var showMetrics = importantMetrics.filter(function(m){return annualData[m];});

      var headers = [{key:'metric', label:'Metric'}];
      years.forEach(function(y) { headers.push({key:y, label:y}); });

      var tableRows = showMetrics.map(function(metric) {
        var row = {metric: metric};
        var bd = annualData[metric];
        years.forEach(function(y) {
          var v = bd[y];
          if (v && typeof v === 'object') v = v.v;
          row[y] = v != null ? Number(v).toFixed(1) : '-';
        });
        return row;
      });

      var tableBox = makeDiv('chart-box');
      tableBox.appendChild(buildTable(headers, tableRows));
      content.appendChild(tableBox);
    }

    // Render DuPont charts
    dupontComps.forEach(function(comp) {
      var compData = dupQ[comp];
      var bd = compData && compData[currentBank];
      if (!bd) return;
      var qs = Object.keys(bd).sort(function(a,b){return qSortKey(a)-qSortKey(b);});
      var el = document.getElementById('dd-dup-' + comp);
      if (el) {
        Plotly.newPlot(el, [{
          x:qs, y:qs.map(function(q){return bd[q];}), type:'scatter', mode:'lines+markers',
          line:{color:'#3b82f6',width:2}, marker:{size:3}
        }], Object.assign({}, PLOTLY_LAYOUT, {margin:{l:40,r:10,t:10,b:30}}), PLOTLY_CFG);
      }
    });

    // Render metric charts
    keyMetrics.forEach(function(group) {
      group.items.forEach(function(m) {
        var bd = bankDetail[m];
        if (!bd) return;
        var qs = Object.keys(bd).sort(function(a,b){return qSortKey(a)-qSortKey(b);});
        var safeId = 'dd-m-' + m.replace(/[^a-zA-Z0-9]/g, '_');
        var el = document.getElementById(safeId);
        if (!el) return;
        var isGrowth = m.indexOf('Growth') >= 0;
        var isRatio = m.indexOf('%') >= 0 || m.indexOf('Ratio') >= 0 || m === 'NIM' || m === 'Credit Cost';
        Plotly.newPlot(el, [{
          x:qs, y:qs.map(function(q){return bd[q];}),
          type: isRatio ? 'scatter' : 'bar',
          mode: isRatio ? 'lines+markers' : undefined,
          marker:{
            color: isGrowth ? qs.map(function(q){return (bd[q]||0)>=0?'#22c55e':'#ef4444';}) : '#3b82f6',
            size:3
          },
          line: isRatio ? {color:'#3b82f6',width:2} : undefined
        }], Object.assign({}, PLOTLY_LAYOUT, {margin:{l:40,r:10,t:10,b:30}}), PLOTLY_CFG);
      });
    });
  }
  render();
}


// ═══════════════════════════════════════════════════════════════════════════
// PAGE 4: Sector & RBI Data
// ═══════════════════════════════════════════════════════════════════════════
async function initSector() {
  var results = await Promise.all([
    loadJSON('rbi_fortnightly'), loadJSON('system_data'), loadJSON('casa_by_group')
  ]);
  var rbi = results[0], sys = results[1], casa = results[2];
  var content = document.getElementById('sector-content');
  clearEl(content);

  // RBI Fortnightly
  if (rbi.dates && rbi.dates.length > 0) {
    content.appendChild(makeText('h3', 'RBI Fortnightly -- System Credit and Deposits', {style:'font-size:14px;margin-bottom:8px;color:var(--accent2)'}));
    var rbiGrid = makeDiv('chart-row cols-2');
    rbiGrid.appendChild(makeChartBox('Credit and Deposit Growth (YoY %)', 'rbi-growth'));
    rbiGrid.appendChild(makeChartBox('CD Ratio and Incremental CD Ratio', 'rbi-cd'));
    rbiGrid.appendChild(makeChartBox('System Deposits (Rs Cr)', 'rbi-dep'));
    rbiGrid.appendChild(makeChartBox('System Advances (Rs Cr)', 'rbi-adv'));
    content.appendChild(rbiGrid);
  }

  // System data
  if (sys.year && sys.year.length > 0) {
    content.appendChild(makeText('h3', 'Long-Term System Data', {style:'font-size:14px;margin:20px 0 8px;color:var(--accent2)'}));
    var sysGrid = makeDiv('chart-row cols-2');
    sysGrid.appendChild(makeChartBox('Credit and Deposit Growth (%)', 'sys-growth'));
    sysGrid.appendChild(makeChartBox('System CASA Ratio (%)', 'sys-casa'));
    sysGrid.appendChild(makeChartBox('CD Ratio (%)', 'sys-cd'));
    sysGrid.appendChild(makeChartBox('Deposit Composition', 'sys-comp'));
    content.appendChild(sysGrid);
  }

  // CASA by group
  var casaMetrics = Object.keys(casa);
  if (casaMetrics.length > 0) {
    content.appendChild(makeText('h3', 'CASA by Bank Group', {style:'font-size:14px;margin:20px 0 8px;color:var(--accent2)'}));
    var casaGrid = makeDiv('chart-row cols-2');
    casaMetrics.slice(0, 6).forEach(function(metric) {
      var safeId = 'casa-' + metric.replace(/[^a-zA-Z0-9]/g, '_');
      casaGrid.appendChild(makeChartBox(metric, safeId));
    });
    content.appendChild(casaGrid);
  }

  // Render RBI charts
  if (rbi.dates && rbi.dates.length > 0) {
    Plotly.newPlot('rbi-growth', [
      {x:rbi.dates, y:rbi.advances_yoy_pct, name:'Credit Growth', type:'scatter', mode:'lines', line:{color:'#3b82f6',width:1.5}},
      {x:rbi.dates, y:rbi.deposits_yoy_pct, name:'Deposit Growth', type:'scatter', mode:'lines', line:{color:'#22c55e',width:1.5}},
    ], PLOTLY_LAYOUT, PLOTLY_CFG);

    Plotly.newPlot('rbi-cd', [
      {x:rbi.dates, y:rbi.cd_ratio, name:'CD Ratio', type:'scatter', mode:'lines', line:{color:'#f97316',width:1.5}},
      {x:rbi.dates, y:rbi.incr_cd_ratio, name:'Incr. CD Ratio', type:'scatter', mode:'lines', line:{color:'#a78bfa',width:1.5}},
    ], PLOTLY_LAYOUT, PLOTLY_CFG);

    Plotly.newPlot('rbi-dep', [{x:rbi.dates, y:rbi.deposits_cr, type:'scatter', mode:'lines', fill:'tozeroy', line:{color:'#22c55e',width:1}}], PLOTLY_LAYOUT, PLOTLY_CFG);
    Plotly.newPlot('rbi-adv', [{x:rbi.dates, y:rbi.advances_cr, type:'scatter', mode:'lines', fill:'tozeroy', line:{color:'#3b82f6',width:1}}], PLOTLY_LAYOUT, PLOTLY_CFG);
  }

  // System data charts
  if (sys.year && sys.year.length > 0) {
    Plotly.newPlot('sys-growth', [
      {x:sys.year, y:sys.credit_yoy, name:'Credit YoY', type:'bar', marker:{color:'#3b82f6'}},
      {x:sys.year, y:sys.deposits_yoy, name:'Deposit YoY', type:'bar', marker:{color:'#22c55e'}},
    ], Object.assign({}, PLOTLY_LAYOUT, {barmode:'group'}), PLOTLY_CFG);

    Plotly.newPlot('sys-casa', [{x:sys.year, y:sys.casa_ratio, type:'scatter', mode:'lines+markers', line:{color:'#f97316',width:2}, marker:{size:4}}], PLOTLY_LAYOUT, PLOTLY_CFG);
    Plotly.newPlot('sys-cd', [{x:sys.year, y:sys.cd_ratio, type:'scatter', mode:'lines+markers', line:{color:'#a78bfa',width:2}, marker:{size:4}}], PLOTLY_LAYOUT, PLOTLY_CFG);

    Plotly.newPlot('sys-comp', [
      {x:sys.year, y:sys.current_account, name:'Current A/c', type:'bar', marker:{color:'#3b82f6'}},
      {x:sys.year, y:sys.savings_account, name:'Savings A/c', type:'bar', marker:{color:'#22c55e'}},
      {x:sys.year, y:sys.term_deposits, name:'Term Deposits', type:'bar', marker:{color:'#f97316'}},
    ], Object.assign({}, PLOTLY_LAYOUT, {barmode:'stack'}), PLOTLY_CFG);
  }

  // CASA by group
  var groupColors = {
    'PUBLIC SECTOR BANKS':'#3b82f6','PRIVATE SECTOR BANKS':'#22c55e',
    'FOREIGN BANKS':'#f97316','SMALL FINANCE BANKS':'#a78bfa',
    "ALL-INDIA SCB's":'#ef4444','REGIONAL RURAL BANKS':'#eab308','PAYMENTS BANKS':'#ec4899'
  };
  casaMetrics.slice(0, 6).forEach(function(metric) {
    var groupData = casa[metric];
    var traces = [];
    Object.keys(groupData).forEach(function(grp) {
      var bd = groupData[grp];
      var yrs = Object.keys(bd).sort();
      traces.push({
        x:yrs, y:yrs.map(function(y){return bd[y];}),
        name:grp.replace('BANKS','').trim(),
        type:'scatter', mode:'lines',
        line:{color:groupColors[grp]||'#94a3b8', width:1.5}
      });
    });
    var safeId = 'casa-' + metric.replace(/[^a-zA-Z0-9]/g, '_');
    var el = document.getElementById(safeId);
    if (el) Plotly.newPlot(el, traces, Object.assign({}, PLOTLY_LAYOUT, {showlegend:true}), PLOTLY_CFG);
  });
}


// ═══════════════════════════════════════════════════════════════════════════
// PAGE 5: Novel Metrics
// ═══════════════════════════════════════════════════════════════════════════
async function initNovel() {
  var results = await Promise.all([loadJSON('novel_metrics'), loadJSON('quarters')]);
  var novel = results[0], quarters = results[1];
  var meta = DATA.meta;
  var container = document.getElementById('novel-controls');
  var content = document.getElementById('novel-content');

  var currentBanks = meta.active_banks;
  var currentMode = 'bar';
  var currentQuarter = quarters[quarters.length - 1];
  var novelMetrics = Object.keys(novel).sort();
  var currentMetric = novelMetrics[0] || 'CASA_per_branch';

  clearEl(container);
  currentBanks = makeFilterPills('novel-controls', function(b) { currentBanks = b; render(); });
  addSelect('novel-controls', 'Metric', novelMetrics, currentMetric, function(v) { currentMetric = v; render(); });
  addSelect('novel-controls', 'Quarter', quarters.map(function(q){return {value:q,label:q};}),
    currentQuarter, function(v) { currentQuarter = v; render(); });
  addModePills('novel-controls', [{value:'bar',label:'Bar'},{value:'ts',label:'Time Series'}], 'bar',
    function(m) { currentMode = m; render(); });

  function render() {
    clearEl(content);
    var metricData = novel[currentMetric] || {};

    if (currentMode === 'ts') {
      var traces = [];
      currentBanks.forEach(function(bank, i) {
        var bd = metricData[bank];
        if (!bd) return;
        var qs = Object.keys(bd).sort(function(a,b){return qSortKey(a)-qSortKey(b);});
        traces.push({
          x:qs, y:qs.map(function(q){return bd[q];}), name:bankName(bank),
          type:'scatter', mode:'lines', line:{color:COLORS[i % COLORS.length], width:1.5}
        });
      });
      var box = makeChartBox(currentMetric.replace(/_/g,' '), 'novel-chart', 500);
      content.appendChild(box);
      Plotly.newPlot('novel-chart', traces, Object.assign({}, PLOTLY_LAYOUT, {
        title:{text:currentMetric.replace(/_/g,' '), font:{size:14,color:'#e2e8f0'}},
        showlegend: traces.length <= 12
      }), PLOTLY_CFG);
    } else {
      var bankVals = [];
      currentBanks.forEach(function(bank) {
        var bd = metricData[bank];
        if (bd && bd[currentQuarter] != null) bankVals.push({bank:bank, value:bd[currentQuarter]});
      });
      bankVals.sort(function(a,b){return b.value - a.value;});
      var box = makeChartBox(currentMetric.replace(/_/g,' ') + ' -- ' + currentQuarter, 'novel-chart', 500);
      content.appendChild(box);
      Plotly.newPlot('novel-chart', [{
        x:bankVals.map(function(r){return bankName(r.bank);}),
        y:bankVals.map(function(r){return r.value;}),
        type:'bar', marker:{color:COLORS[0]}
      }], Object.assign({}, PLOTLY_LAYOUT, {
        title:{text:currentMetric.replace(/_/g,' ') + ' -- ' + currentQuarter, font:{size:14,color:'#e2e8f0'}}
      }), PLOTLY_CFG);
    }
  }
  render();
}


// ═══════════════════════════════════════════════════════════════════════════
// PAGE 6: Cards & Rates
// ═══════════════════════════════════════════════════════════════════════════
async function initCards() {
  var results = await Promise.all([
    loadJSON('credit_cards'), loadJSON('deposit_rates'), loadJSON('branch_vintage')
  ]);
  var cc = results[0], dr = results[1], bv = results[2];
  var content = document.getElementById('cards-content');
  clearEl(content);

  // Credit cards
  if (cc.cards_outstanding && Object.keys(cc.cards_outstanding).length > 0) {
    content.appendChild(makeText('h3', 'Credit Cards', {style:'font-size:14px;margin-bottom:8px;color:var(--accent2)'}));
    var ccGrid = makeDiv('chart-row cols-2');
    ccGrid.appendChild(makeChartBox('Cards Outstanding (Mn)', 'cc-outstanding'));
    if (cc.transaction_value && Object.keys(cc.transaction_value).length > 0) {
      ccGrid.appendChild(makeChartBox('Transaction Value (Mn)', 'cc-txn'));
    }
    content.appendChild(ccGrid);
  }

  // Deposit rates
  if (Object.keys(dr).length > 0) {
    content.appendChild(makeText('h3', 'Deposit Rates', {style:'font-size:14px;margin:20px 0 8px;color:var(--accent2)'}));
    var drGrid = makeDiv('chart-row cols-2');
    drGrid.appendChild(makeChartBox('SA Rate (Up to 0.1 Mn)', 'dr-sa'));
    drGrid.appendChild(makeChartBox('TD Rate (1-3yr High)', 'dr-td'));
    content.appendChild(drGrid);
  }

  // Branch vintage
  if (Object.keys(bv).length > 0) {
    content.appendChild(makeText('h3', 'Branch Vintage Analysis', {style:'font-size:14px;margin:20px 0 8px;color:var(--accent2)'}));
    var bvGrid = makeDiv('chart-row cols-1');
    bvGrid.appendChild(makeChartBox('Branch Age Distribution (%)', 'bv-chart', 400));
    content.appendChild(bvGrid);
  }

  // Render CC charts
  if (cc.cards_outstanding) {
    var traces = [];
    Object.keys(cc.cards_outstanding).forEach(function(bank, i) {
      var bd = cc.cards_outstanding[bank];
      traces.push({x:bd.dates, y:bd.values, name:bank, type:'scatter', mode:'lines', line:{color:COLORS[i%COLORS.length],width:1.5}});
    });
    var el = document.getElementById('cc-outstanding');
    if (el) Plotly.newPlot(el, traces, PLOTLY_LAYOUT, PLOTLY_CFG);
  }
  if (cc.transaction_value) {
    var traces2 = [];
    Object.keys(cc.transaction_value).forEach(function(bank, i) {
      var bd = cc.transaction_value[bank];
      traces2.push({x:bd.dates, y:bd.values, name:bank, type:'scatter', mode:'lines', line:{color:COLORS[i%COLORS.length],width:1.5}});
    });
    var el2 = document.getElementById('cc-txn');
    if (el2) Plotly.newPlot(el2, traces2, PLOTLY_LAYOUT, PLOTLY_CFG);
  }

  // Deposit rates
  if (Object.keys(dr).length > 0) {
    var saTraces = [], tdTraces = [];
    var bankKeys = Object.keys(dr);
    bankKeys.forEach(function(bank, i) {
      var bd = dr[bank];
      if (bd['SA_up_to_0.1mn']) {
        saTraces.push({x:bd['SA_up_to_0.1mn'].dates, y:bd['SA_up_to_0.1mn'].values, name:bank, type:'scatter', mode:'lines+markers', line:{color:COLORS[i%COLORS.length],width:1.5}, marker:{size:4}});
      }
      if (bd['TD_1yr_to_3yr_high']) {
        tdTraces.push({x:bd['TD_1yr_to_3yr_high'].dates, y:bd['TD_1yr_to_3yr_high'].values, name:bank, type:'scatter', mode:'lines+markers', line:{color:COLORS[i%COLORS.length],width:1.5}, marker:{size:4}});
      }
    });
    var saEl = document.getElementById('dr-sa');
    if (saEl && saTraces.length) Plotly.newPlot(saEl, saTraces, PLOTLY_LAYOUT, PLOTLY_CFG);
    var tdEl = document.getElementById('dr-td');
    if (tdEl && tdTraces.length) Plotly.newPlot(tdEl, tdTraces, PLOTLY_LAYOUT, PLOTLY_CFG);
  }

  // Branch vintage
  if (Object.keys(bv).length > 0) {
    var bvBanks = Object.keys(bv);
    var buckets = ['>15 years','10-15 years','5-10 years','2-5 years','<2 years'];
    var bucketColors = ['#1e3a5f','#2563eb','#3b82f6','#60a5fa','#93c5fd'];
    var bvTraces = buckets.map(function(bucket, i) {
      return {
        x:bvBanks,
        y:bvBanks.map(function(b) {
          var bkt = bv[b].buckets.find(function(bk){return bk.bucket === bucket;});
          return bkt ? bkt.pct : 0;
        }),
        name:bucket, type:'bar', marker:{color:bucketColors[i]}
      };
    });
    var bvEl = document.getElementById('bv-chart');
    if (bvEl) {
      Plotly.newPlot(bvEl, bvTraces, Object.assign({}, PLOTLY_LAYOUT, {
        barmode:'stack',
        title:{text:'Branch Age Distribution (%)', font:{size:14,color:'#e2e8f0'}},
        yaxis:Object.assign({}, PLOTLY_LAYOUT.yaxis, {title:'% of Branches'})
      }), PLOTLY_CFG);
    }
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════════════════
(async function() {
  await loadJSON('meta');
  pageInited['dupont'] = true;
  initDupont();
})();

