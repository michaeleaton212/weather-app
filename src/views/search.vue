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
      <!-- Wetter Suchbereich -->
      <section class="weather-search glass">
        <h1 class="title">Stadt suchen</h1>

        <div class="input-group glass">
          <input
            type="text"
            v-model="stadt"
            @keyup.enter="wetterHolen"
            placeholder="Stadt eingeben"
            class="input"
          />
        </div>

        <button class="btn glass-btn" @click="wetterHolen">
          Wetter anzeigen
        </button>

        <div id="wetter" class="result glass">
          <div v-if="wetter" class="weather-info">
            <h2>{{ wetter.name }}, {{ wetter.sys.country }}</h2>
            <img :src="iconUrl(wetter.weather[0].icon)" alt="Wetter Icon" class="icon">
            <p class="desc"><strong>{{ wetter.weather[0].description }}</strong></p>
            <p>Temperatur: {{ Math.round(wetter.main.temp) }}°C</p>
            <p>Luftfeuchtigkeit: {{ wetter.main.humidity }}%</p>
            <p>Wind: {{ wetter.wind.speed }} m/s</p>
          </div>
          <div v-if="error" class="error">{{ error }}</div>
        </div>
      </section>

      <!-- Getrennter Vorhersagebereich -->
      <section class="forecast-box glass" v-if="daily.length">
        <h2>5-Tage-Vorhersage</h2>
        <div class="week-forecast">
          <div
            class="day-forecast"
            v-for="(day, i) in daily"
            :key="i"
          >
            <span class="day">{{ getWeekday(day.date) }}</span>
            <img :src="iconUrl(day.icon)" alt="Icon" class="icon-small">
            <span class="temp-range">
              {{ Math.round(day.max) }}°C<br><small>/ {{ Math.round(day.min) }}°C</small>
            </span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'

const stadt  = ref('')
const wetter = ref(null)
const daily  = ref([])
const error  = ref('')

const apiKey = '8198635183eda125f7fe682e16be92d1'

const iconUrl = icon => `https://openweathermap.org/img/wn/${icon}@2x.png`
const getWeekday = dt => new Date(dt * 1000)
  .toLocaleDateString('de-CH', { weekday: 'short' })

const wetterHolen = async () => {
  error.value = ''
  wetter.value = null
  daily.value = []

  if (!stadt.value.trim()) {
    error.value = 'Bitte eine Stadt eingeben'
    return
  }

  try {
    const resNow = await fetch(
      `https://api.openweathermap.org/data/2.5/weather`
      + `?q=${encodeURIComponent(stadt.value)}`
      + `&units=metric&lang=de&appid=${apiKey}`
    )
    if (!resNow.ok) throw new Error('Stadt nicht gefunden')
    const dataNow = await resNow.json()
    wetter.value = dataNow
    localStorage.setItem('lastWeather', JSON.stringify(dataNow))

    const resFc = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast`
      + `?q=${encodeURIComponent(stadt.value)}`
      + `&units=metric&lang=de&appid=${apiKey}`
    )
    if (!resFc.ok) throw new Error('Forecast nicht verfügbar')
    const dataFc = await resFc.json()

    const mapDays = {}
    dataFc.list.forEach(entry => {
      const [dateStr] = entry.dt_txt.split(' ')
      if (!mapDays[dateStr]) {
        mapDays[dateStr] = {
          date: entry.dt,
          min: entry.main.temp_min,
          max: entry.main.temp_max,
          icon: entry.weather[0].icon
        }
      } else {
        mapDays[dateStr].min = Math.min(mapDays[dateStr].min, entry.main.temp_min)
        mapDays[dateStr].max = Math.max(mapDays[dateStr].max, entry.main.temp_max)
      }
    })

    daily.value = Object.values(mapDays).slice(0, 5)
    localStorage.setItem('lastDaily', JSON.stringify(daily.value))

  } catch (e) {
    error.value = e.message
  }
}

onMounted(() => {
  const savedWeather = localStorage.getItem('lastWeather')
  if (savedWeather) {
    wetter.value = JSON.parse(savedWeather)
  }

  const savedDaily = localStorage.getItem('lastDaily')
  if (savedDaily) {
    daily.value = JSON.parse(savedDaily)
  }
})
</script>

<style scoped>
/* Global */
* {
  box-sizing: border-box;
}
html, body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: linear-gradient(to bottom right, #f0f4f8, #d9e2ec);
  font-family: 'SF Pro Display', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  color: #333;
}

/* App Wrapper */


/* Glass (allgemein) */
.glass {
  background: rgba(255, 255, 255, 0.25); /* More transparent for a stronger glass effect */
  backdrop-filter: blur(20px); /* Increased blur for more pronounced glass */
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4); /* Softer, more transparent border */
  border-radius: 0 0 16px 16px; /* This border-radius will be overridden for input-group.glass */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); /* Slightly more prominent shadow for depth */
}

/* Input-Group mit abgerundeten Ecken rundum */
.input-group.glass {
  border-radius: 16px;
  margin-bottom: 1rem;
  overflow: hidden;
  width: 366px;
}

/* Input füllt den runden Container */
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0;
  font-size: 1rem;
  outline: none;
  background: rgba(255, 255, 255, 0.4); /* Transparent input background */
  color: #333; /* Ensure text remains readable */
}

/* Navbar exakt wie im Dashboard */
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
/* Weather Search Section */
.weather-search {
  width: 100%;
  max-width: 400px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* These properties are now handled by the shared .glass class below */
  /* background-color: #f0f0f0; */
  /* border-radius: 0.5rem; */
  overflow: hidden;
}
.title {
  font-size: 2rem;
  color: #333;
  margin-bottom: 1rem;
}
.btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  text-align: center;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background: rgba(0, 122, 255, 0.7); /* Transparent blue button */
  color: white;
  transition: background 0.3s ease;
}
.btn:hover {
  background: rgba(0, 122, 255, 0.8); /* Slightly less transparent on hover */
}
.result {
  width: 100%;
  text-align: center;
}
.icon {
  width: 80px;
  height: 80px;
  margin: 1rem 0;
}
.desc {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
.error {
  max-width: 500px;
  margin: 1rem auto;
  padding: 1rem 1.5rem;
  color: #a94442;
  background: rgba(255, 0, 0, 0.15);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 12px;
  font-size: 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}


/* Horizontale Forecast-Box */
.forecast-box {
  width: 100%;
  max-width: 500px;
  margin: 1rem auto 0;
  text-align: center;
}
.forecast-box .week-forecast {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 0.1rem;
  margin-top: 1rem;
  overflow-x: auto;
}
.forecast-box .day-forecast {
  flex: 0 0 auto;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.3); /* Transparent background for each day */
  backdrop-filter: blur(10px); /* Add blur for consistent glass effect */
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4); /* Light transparent border */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* Softer shadow */
}
.forecast-box .icon-small {
  width: 40px;
  height: 40px;
  margin: 0.5rem 0;
}
.forecast-box .day {
  font-weight: 600;
}
.forecast-box .temp-range {
  font-size: 0.9rem;
  line-height: 1.2;
}
/*  Hover Search */

.forecast-box:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease, box-shadow 0.3s ease;

}
.weather-search:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

}
.day-forecast:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

}


/* Responsive Anpassungen */
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
/* Applying the .glass styles to weather-search and forecast-box directly */
.weather-search,
.forecast-box {
  border-radius: 16px;
  overflow: hidden;
  padding: 1rem;
  margin-bottom: 1.5rem;
  /* Moved these from .glass to specifically target these elements */
  background: rgba(255, 255, 255, 0.25); /* Adjusted for specific elements */
  backdrop-filter: blur(20px); /* Adjusted for specific elements */
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4); /* Adjusted for specific elements */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); /* Adjusted for specific elements */
}

.weather-search {
  margin-top: 2rem;
}

.forecast-box {
  margin-top: 1rem;
}
</style>
