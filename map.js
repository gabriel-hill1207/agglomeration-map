// ── Config ────────────────────────────────────────────────────────────────────

const BOUNDS_URL = 'lad_boundaries.geojson';
const DEFAULT_SIC = '62'; // Computer Programming & IT

// RdYlGn 7-class colour scale (rank 1 = best = green, high rank = red)
const COLOURS = ['#1a9850', '#91cf60', '#d9ef8b', '#fee08b', '#fc8d59', '#f46d43', '#d73027'];

function getColour(rank) {
  const pct = (rank - 1) / (MAX_RANK - 1); // 0 = best, 1 = worst
  const idx = Math.min(Math.floor(pct * COLOURS.length), COLOURS.length - 1);
  return COLOURS[idx];
}

// ── Map setup ─────────────────────────────────────────────────────────────────

const map = L.map('map', { zoomControl: true }).setView([52.8, -2.0], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// ── Dropdown ──────────────────────────────────────────────────────────────────

const select = document.getElementById('sic-select');

SIC_CODES.forEach(code => {
  const opt = document.createElement('option');
  opt.value = code;
  opt.textContent = `SIC ${code} — ${SIC_NAMES[code] || code}`;
  if (code === DEFAULT_SIC) opt.selected = true;
  select.appendChild(opt);
});

// ── GeoJSON layer ─────────────────────────────────────────────────────────────

let geojsonLayer = null;
let currentSic = DEFAULT_SIC;

function styleFeature(feature) {
  const code = feature.properties.LAD21CD;
  const ladData = AGGLOMERATION_DATA[code];
  if (!ladData) {
    return { fillColor: '#cccccc', fillOpacity: 0.4, color: '#999', weight: 0.5 };
  }
  const rank = ladData.ranks[currentSic];
  return {
    fillColor: getColour(rank),
    fillOpacity: 0.75,
    color: '#fff',
    weight: 0.8
  };
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight
  });
}

function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({ weight: 2.5, color: '#1e3a5f', fillOpacity: 0.9 });
  layer.bringToFront();

  const props = layer.feature.properties;
  const code = props.LAD21CD;
  const name = props.LAD21NM;
  const ladData = AGGLOMERATION_DATA[code];

  const panel = document.getElementById('hover-info');

  if (!ladData) {
    panel.innerHTML = `<div class="lad-name">${name}</div><p class="placeholder">No data available</p>`;
    return;
  }

  const rank = ladData.ranks[currentSic];
  const sicLabel = SIC_NAMES[currentSic] || `SIC ${currentSic}`;

  const top3Html = ladData.top3.map((item, i) => {
    const badgeClass = ['gold', 'silver', 'bronze'][i];
    return `<li>
      <span class="rank-badge ${badgeClass}">#${item.rank}</span>
      <span class="industry-name">${item.name}</span>
    </li>`;
  }).join('');

  panel.innerHTML = `
    <div class="lad-name">${name}</div>
    <div class="selected-rank">
      Rank <strong>#${rank}</strong> of ${MAX_RANK} for <em>${sicLabel}</em>
    </div>
    <div class="top3-title">Top 3 industries for this area</div>
    <ul class="top3-list">${top3Html}</ul>
  `;
}

function resetHighlight(e) {
  geojsonLayer.resetStyle(e.target);
  document.getElementById('hover-info').innerHTML =
    '<p class="placeholder">Hover over an area to see details</p>';
}

function updateMap() {
  if (geojsonLayer) geojsonLayer.setStyle(styleFeature);
}

// ── Load boundaries & render ──────────────────────────────────────────────────

fetch(BOUNDS_URL)
  .then(r => {
    if (!r.ok) throw new Error(`Failed to load boundaries: ${r.status}`);
    return r.json();
  })
  .then(geojson => {
    geojsonLayer = L.geoJSON(geojson, {
      style: styleFeature,
      onEachFeature: onEachFeature
    }).addTo(map);

    map.fitBounds(geojsonLayer.getBounds(), { padding: [10, 10] });
  })
  .catch(err => {
    console.error(err);
    document.getElementById('hover-info').innerHTML =
      `<p style="color:#dc2626;font-size:0.82rem">Error loading map boundaries. If running locally, use a local server (e.g. <code>python3 -m http.server</code>).</p>`;
  });

// ── Dropdown change ───────────────────────────────────────────────────────────

select.addEventListener('change', () => {
  currentSic = select.value;
  updateMap();
  document.getElementById('hover-info').innerHTML =
    '<p class="placeholder">Hover over an area to see details</p>';
});
