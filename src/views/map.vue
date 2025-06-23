<!-- src/views/MapPage.vue -->
<template>
  <div class="map-page-wrapper">
    <!-- Glass Navbar wie im Dashboard -->
    <nav class="navbar glass">
      <div class="nav-left">
        <img src="../assets/swissflag.png" alt="Swiss Flag" class="flag">
        <span class="name">Swiss Weather</span>
      </div>
      <div class="tabs">
        <router-link to="/dashboard" class="tab" active-class="router-link-exact-active">Dashboard</router-link>
        <router-link to="/map" class="tab" active-class="router-link-exact-active">Map</router-link>
        <router-link to="/search" class="tab" active-class="router-link-exact-active">Search</router-link>
      </div>
    </nav>

    <main class="content-wrapper">
      <section class="map-widget glass-card">
        <h2 class="widget-title">Temparaturkarte</h2>
        <div id="karte" class="actual-map"></div>
        <p class="map-info">
          Interaktive Karte mit Temperaturdaten. Zoome und bewege die Karte, um Details zu entdecken.
        </p>
        
      </section>

      <aside class="info-widget glass-card">
        <h3>Legende</h3>
        <div class="legend-item">
          <span class="legend-color temp-cold"></span>
          <span>Kalt (unter 0°C)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color temp-mild"></span>
          <span>Mild (0°C - 20°C)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color temp-warm"></span>
          <span>Warm (über 20°C)</span>
        </div>
        <p class="legend-note">Temperaturdaten von OpenWeatherMap.</p>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

let map

onMounted(() => {
  // Leaflet-Icons korrekt setzen
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  })

  // Karte initialisieren (Fallback-Position)
  map = L.map('karte').setView([47.58, 8.52], 9)

  // Versuche, Karte auf aktuellen Standort zu zentrieren
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        map.setView([coords.latitude, coords.longitude], 13)
      },
      () => {
        // GPS verweigert oder Fehler: belasse es bei der Fallback-Position
      }
    )
  }

  // Basiskarte von Stadia Maps
  L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; Stadia Maps &copy; OpenStreetMap contributors'
  }).addTo(map)

  // Temperatur-Overlay von OpenWeatherMap
  const apiKey = '8198635183eda125f7fe682e16be92d1'
  L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
    attribution: 'Wetterdaten © OpenWeatherMap',
    opacity: 0.65
  }).addTo(map)

  // Erzwinge Neuberechnung der Kartengröße
  setTimeout(() => map.invalidateSize(), 100)
})
</script>

<style scoped>
/* Basis-Styles */
* { box-sizing: border-box }
html, body { margin: 0; padding: 0; background: #e0e0e0; overflow-x: hidden; }

/* Wrapper */
.map-page-wrapper { display: flex; flex-direction: column; align-items: center; min-height: 100vh }

/* Glass Navbar */
.navbar {
  position: sticky;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.2); /* Glasiger Effekt: Weiße Farbe mit 20% Deckkraft */
  backdrop-filter: blur(15px); /* Stärkere Unschärfe für echten Glaseffekt */
  -webkit-backdrop-filter: blur(15px); /* Für Browser-Kompatibilität */
  border-radius: 0 0 16px 16px;
  border: 1px solid rgba(255, 255, 255, 0.4); /* Leichter, transparenter Rand */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* Angepasster Schatten für Glas-Look */
  z-index: 1000;
}
.nav-left {
  display: flex;
  align-items: center;
}
.flag {
  width: 32px;
  margin-right: 0.85rem;
}
.name {
  font-size: 1.35rem;
  font-weight: 600;
  color: #1a1a1a;
}
.tabs {
  display: flex;
}
.tab {
  margin-left: 0.85rem;
  text-decoration: none;
  font-size: 0.95rem;
  color: #555;
  position: relative;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  transition: background 0.3s ease, color 0.3s ease;
}
.tab:hover {
  background: rgba(255, 255, 255, 0.4); /* Transparenter Hintergrund beim Hover */
  color: #1a1a1a;
}
.tab.router-link-exact-active {
  background: rgba(255, 255, 255, 0.5); /* Etwas weniger transparent, aber immer noch glasig */
  color: #1a1a1a;
  font-weight: 600;
}
.tab.router-link-exact-active::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 3px;
  background: #007aff;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Content Layout */
.content-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  width: 100%;
  padding: 2rem 1rem;
  margin-top: 2rem;
}

/* Glass Cards */
.glass-card {
  background: rgba(255, 255, 255, 0.25); /* Glasiger Effekt: Weiße Farbe mit 25% Deckkraft */
  backdrop-filter: blur(20px); /* Stärkere Unschärfe */
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4); /* Leichter, transparenter Rand */
  border-radius: 18px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1); /* Angepasster Schatten */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* Map Widget */
.map-widget {
  width: 95%;
  max-width: 1000px;
  padding: 1.8rem;
  margin-bottom: 1rem;
}
.widget-title {
  font-size: 1.9rem;
  margin-bottom: 1.2rem;
  text-align: center;
  color: #1a1a1a;
  font-weight: 700;
}
.actual-map {
  width: 100%;
  height: 60vh;
  max-height: 600px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  background: rgba(240, 240, 240, 0.8); /* Auch hier glasig gestalten */
  border: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px); /* Leichte Unschärfe für die Karte selbst */
  -webkit-backdrop-filter: blur(5px);
}
.map-info {
  margin-top: 1.5rem;
  font-size: 0.95rem;
  color: #777;
  text-align: center;
  line-height: 1.4;
}

/* Legend Widget */
.info-widget {
  width: 95%;
  max-width: 400px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.info-widget h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #1a1a1a;
  font-weight: 600;
}
.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.6rem;
  font-size: 0.9rem;
  color: #555;
}
.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 0.8rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
.temp-cold {
  background: linear-gradient(to right, rgba(0, 123, 255, 0.7), rgba(102, 179, 255, 0.7)); /* Transparenter Farbverlauf */
}
.temp-mild {
  background: linear-gradient(to right, rgba(255, 193, 7, 0.7), rgba(255, 219, 125, 0.7)); /* Transparenter Farbverlauf */
}
.temp-warm {
  background: linear-gradient(to right, rgba(220, 53, 69, 0.7), rgba(255, 107, 126, 0.7)); /* Transparenter Farbverlauf */
}
.legend-note {
  font-size: 0.8rem;
  color: #888;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    padding: 0 0.5rem;
  }
  .map-widget {
    padding: 1.2rem;
    min-height: 400px;
  }
  .actual-map {
    height: 50vh;
  }
  .info-widget {
    width: 100%;
    padding: 1.2rem;
  }
}
@media (max-width: 480px) {
  .navbar {
    padding: 0.4rem 0.6rem;
  }
  .flag {
    width: 24px;
  }
  .name {
    font-size: 1.1rem;
  }
  .tab {
    font-size: 0.85rem;
    padding: 0.2rem 0.5rem;
  }
  .widget-title {
    font-size: 1.4rem;
  }
  .actual-map {
    height: 40vh;
    border-radius: 10px;
  }
}
</style>