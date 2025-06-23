<template>
  <div class="dashboard-wrapper">
    <nav class="navbar glass">
      <div class="nav-left">
        <img src="@/assets/swissflag.png" alt="Swiss Flag" class="flag">
        <span class="name">Swiss Weather</span>
      </div>
      <div class="tabs">
        <router-link to="/dashboard" class="tab" active-class="router-link-exact-active">
          Dashboard
        </router-link>
        <router-link to="/map" class="tab" active-class="router-link-exact-active">
          Map
        </router-link>
        <router-link to="/search" class="tab" active-class="router-link-exact-active">
          Search
        </router-link>
      </div>
    </nav>

    <main>

      <!-- Fehlermeldung -->
<div v-if="error" class="error-wrapper">
  <div class="error">{{ error }}</div>
</div>

      <!-- Aktuelles Wetter -->
      <div class="widget current-weather-widget glass" v-if="current">
        <h2>Aktuelles Wetter</h2>
        <div class="temp">{{ Math.round(current.main.temp) }}°C</div>
        <div class="desc">{{ current.weather[0].description }}</div>
        <div class="location">{{ locationName }}</div>
      </div>

      <!-- Wochenübersicht (jeweils Tages-Max/Min über Forecast berechnet) -->
      <div class="widget weekly-forecast-widget glass" v-if="daily.length > 0">
        <h2>Wochenübersicht</h2>
        <div class="week-forecast">
          <div
            class="day-forecast"
            v-for="(day, i) in daily"
            :key="i"
          >
            <span class="day">{{ getWeekday(day.dt) }}</span>
            <img :src="getIconUrl(day.weather.icon)" alt="Icon" class="icon">
            <span class="temp-range">
              {{ Math.round(day.max) }}°C / {{ Math.round(day.min) }}°C
            </span>
          </div>
        </div>
      </div>

      <!-- Sonnenauf- und -untergang (aus Current Data) -->
      <div class="widget sun-times-widget glass" v-if="current">
        <h2>Sonne</h2>
        <div class="sun-time"> {{ formatTime(current.sys.sunrise) }}</div>
        <div class="sun-time"> {{ formatTime(current.sys.sunset) }}</div>
      </div>


      <!-- Wind & Luftfeuchtigkeit -->
  <!-- Wind Widget -->
<div class="widget wind-widget glass" v-if="current">
  <h2>Wind</h2>
  <div class="detail-item">
    <span>Wind:</span>
    <span>
      {{ Math.round(current.wind.speed * 3.6) }} km/h
      {{ getWindDir(current.wind.deg) }}
    </span>
  </div>
</div>

<!-- Humidity Widget -->
<div class="widget Luftfeuchtigkeits-widget glass" v-if="current">
  <h2>Luftfeuchtigkeit</h2>
  <div class="detail-item">
    <span>Luftfeuchtigkeit:</span>
    <span>{{ current.main.humidity }} %</span>
  </div>
</div>
<!-- Luftdruck Widget -->
<div class="widget luftdruck-widget glass" v-if="current">
  <h2>Luftdruck</h2>
  <div class="detail-item">
    <span>Luftdruck:</span>
    <span>{{ current.main.pressure }} hPa</span>
  </div>
</div>


    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const apiKey = '8198635183eda125f7fe682e16be92d1'
// Achtung: E-Mail noch verifizieren unter https://home.openweathermap.org/api_keys,
// sonst bleibt der Key inactive („Invalid API key“).

// States
const current = ref<any>(null)
const daily = ref<{ dt: number; max: number; min: number; weather: { icon: string } }[]>([])
const locationName = ref<string>('')
const error = ref<string>('')

// Helpers
const getWeekday = (dt: number) =>
  new Date(dt * 1000).toLocaleDateString('de-CH', { weekday: 'short' })

const getIconUrl = (icon: string) =>
  `https://openweathermap.org/img/wn/${icon}@2x.png`

const formatTime = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit'
  })

const getWindDir = (deg: number) => {
  const dirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

// Beim Mount: Standort holen + zwei Fetches
onMounted(() => {
  if (!navigator.geolocation) {
    error.value = 'Geolocation wird nicht unterstützt'
    return
  }

  navigator.geolocation.getCurrentPosition(
    async pos => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude

      try {
        // 1) aktuelles Wetter
        const urlWeather = `https://api.openweathermap.org/data/2.5/weather`
          + `?lat=${lat}&lon=${lon}`
          + `&units=metric&lang=de`
          + `&appid=${apiKey}`

        console.log('Wetter-URL:', urlWeather)
        const resCurrent = await fetch(urlWeather)
        if (!resCurrent.ok) {
          const e = await resCurrent.json().catch(() => ({}))
          throw new Error(`API-Fehler ${resCurrent.status}: ${e.message || resCurrent.statusText}`)
        }
        current.value = await resCurrent.json()

        // 2) 5-Tage/3h-Forecast
        const urlForecast = `https://api.openweathermap.org/data/2.5/forecast`
          + `?lat=${lat}&lon=${lon}`
          + `&units=metric&lang=de`
          + `&appid=${apiKey}`

        console.log('Forecast-URL:', urlForecast)
        const resFore = await fetch(urlForecast)
        if (!resFore.ok) {
          const e = await resFore.json().catch(() => ({}))
          throw new Error(`Forecast-Fehler ${resFore.status}: ${e.message || resFore.statusText}`)
        }
        const dataFore = await resFore.json()

        // aus den 3h-Daten Tages-Max/Min extrahieren
 const tagMap: Record<string, { dt: number; max: number; min: number; weather: { icon: string }; latestHour: number }> = {}

dataFore.list.forEach((item: any) => {
  const key = new Date(item.dt * 1000).toISOString().slice(0, 10)
  const hour = new Date(item.dt * 1000).getHours()

  if (!tagMap[key]) {
    tagMap[key] = {
      dt: item.dt,
      max: item.main.temp,
      min: item.main.temp,
      weather: { icon: item.weather[0].icon },
      latestHour: hour
    }
  } else {
    tagMap[key].max = Math.max(tagMap[key].max, item.main.temp)
    tagMap[key].min = Math.min(tagMap[key].min, item.main.temp)

    // Immer das ICON vom spätesten Zeitpunkt nehmen (z.B. 18 Uhr statt 03 Uhr)
    if (hour > tagMap[key].latestHour) {
      tagMap[key].weather.icon = item.weather[0].icon
      tagMap[key].latestHour = hour
    }
  }
})

daily.value = Object.values(tagMap)
  .map(day => ({
    dt: day.dt,
    max: day.max,
    min: day.min,
    weather: day.weather
  }))
  .slice(0, 5)


        // 3) Reverse-Geocoding für Ortsname
        const urlGeo = `https://api.openweathermap.org/geo/1.0/reverse`
          + `?lat=${lat}&lon=${lon}&limit=1`
          + `&appid=${apiKey}`

        console.log('Geo-URL:', urlGeo)
        const resGeo = await fetch(urlGeo)
        if (resGeo.ok) {
          const loc = await resGeo.json()
          locationName.value = `${loc[0].name}, ${loc[0].country}`
        } else {
          locationName.value = `${lat.toFixed(2)}, ${lon.toFixed(2)}`
        }

      } catch (e: any) {
        console.error(e)
        error.value = e.message || 'Unbekannter Fehler'
      }
    },
    geoErr => {
      console.error('Geoloc-Fehler:', geoErr)
      error.value = 'Standort konnte nicht ermittelt werden'
    }
  )
})

</script>

<style scoped>
/* Global */
/* Global */
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: linear-gradient(to bottom right, #f0f4f8, #d9e2ec);
  font-family: 'SF Pro Display', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  color: #333;
}

.dashboard-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Glass Navbar */



/* Widgets Grid */
main {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  padding: 1rem;
  justify-content: center;
}

.widget {
  background: rgba(255, 255, 255, 0.25); /* Glasiger Effekt: Weiße Farbe mit 25% Deckkraft */
  backdrop-filter: blur(20px); /* Stärkere Unschärfe */
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  border: 1px solid rgba(255, 255, 255, 0.3); /* Leichter, transparenter Rand */
}
.navbar {
  position: sticky;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 0 0 16px 16px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  background: rgba(255, 255, 255, 0.4);
  color: #1a1a1a;
}

.tab.router-link-exact-active {
  background: rgba(255, 255, 255, 0.5);
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

/* Mobile-Responsivität */

.widget:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.widget h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #444;
  text-align: center;
}

/* Aktuelles Wetter Widget */
.current-weather-widget {
  /* Für einen glasigen Effekt bei Farbverläufen kannst du die Transparenz in den Farben selbst anpassen */
  background: linear-gradient(135deg, rgba(106, 183, 255, 0.6), rgba(0, 122, 255, 0.6));
  color: white;
  grid-column: span 2;
  backdrop-filter: blur(20px); /* Auch hier Unschärfe anwenden */
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.current-weather-widget .temp {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
}

.current-weather-widget .desc {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
}

.current-weather-widget .location {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Wochenübersicht Widget */
.weekly-forecast-widget {
  grid-column: span 2;
  background: rgba(255, 255, 255, 0.25); /* Auch hier glasig machen */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.day-forecast {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.day-forecast:last-child {
  border-bottom: none;
}

/* Sonne-, Wind-, Luftfeuchtigkeits-Widgets */
.sun-times-widget,
.wind-widget,
.Luftfeuchtigkeits-widget,
.luftdruck-widget {
  min-height: 180px;
  padding: 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(240, 244, 255, 0.25));
  border-radius: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Jetzt in der Mitte */
  gap: 1rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.4);
}
.sun-times-widget:hover,
.wind-widget:hover,
.Luftfeuchtigkeits-widget:hover {
  transform: translateY(-6px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
}

.sun-times-widget h2,
.wind-widget h2,
.Luftfeuchtigkeits-widget h2,
.luftdruck-widget h2 {
  font-size: 1.2rem;
  color: #007aff;
  font-weight: 700;
  margin: 0;
}

.sun-time,
.detail-item {
  font-size: 1rem;
  color: #333;
  background: rgba(255, 255, 255, 0.3); /* Mehr Transparenz */
  padding: 0.6rem 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  width: 100%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03); /* Leichterer Schatten */
  border: 1px solid rgba(255, 255, 255, 0.4); /* Transparenter Rand */
}


/*
.luftdruck-widget {
  min-height: 180px;
  padding: 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(240, 244, 255, 0.25));
  border-radius: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.luftdruck-widget:hover {
  transform: translateY(-6px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
}

.luftdruck-widget h2 {
  font-size: 1.2rem;
  color: #007aff;
  font-weight: 700;
}
*/



/* Responsivität für kleinere Bildschirme */
@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    padding: 0 0.5rem;
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

}
.error-wrapper {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
}

.error {
  max-width: 600px;
  padding: 1.5rem 2rem;
  color: #a94442;
  background: rgba(255, 0, 0, 0.15);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 12px;
  font-size: 1.1rem;
  text-align: center;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}



</style>