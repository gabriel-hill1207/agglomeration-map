const map = L.map("map").setView([54.0, -2.5], 6);

// Base tile layer (OpenStreetMap — no API key needed)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

// Scale marker radius to a value field (optional — edit as needed)
function markerRadius(value) {
  return Math.sqrt(value) * 2 + 5;
}

// Render data points
mapData.forEach(function (point) {
  const marker = L.circleMarker([point.lat, point.lng], {
    radius: markerRadius(point.value || 10),
    fillColor: "#3b82f6",
    color: "#1d4ed8",
    weight: 1.5,
    opacity: 0.9,
    fillOpacity: 0.6
  }).addTo(map);

  marker.bindTooltip(point.name, { permanent: false, direction: "top" });

  marker.on("click", function () {
    showSidebar(point);
  });
});

function showSidebar(point) {
  document.getElementById("sidebar-title").textContent = point.name || "Details";

  // Build a simple table of all properties
  const entries = Object.entries(point)
    .filter(([k]) => !["lat", "lng"].includes(k))
    .map(([k, v]) => `<tr><td style="font-weight:600;padding:4px 8px 4px 0">${k}</td><td>${v}</td></tr>`)
    .join("");

  document.getElementById("sidebar-content").innerHTML =
    `<table style="width:100%;border-collapse:collapse">${entries}</table>`;
}
