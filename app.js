const village = {
  name: "Софіївська Борщагівка",
  region: "Київська область",
  latitude: 50.4111405,
  longitude: 30.359975,
};

const weatherRefreshInterval = 10 * 60 * 1000;
const titleMarqueeInterval = 900;
const weatherClasses = [
  "clear", "partly-cloudy", "cloudy", "overcast", "drizzle", "rain",
  "heavy-rain", "storm", "snow", "heavy-snow", "fog", "wind",
  "strong-wind", "frost",
];
let titleMarqueeText = "PGDA";
let titleMarqueeIndex = 0;
let isWeatherLoading = false;

const elements = {
  favicon: document.querySelector("#favicon"),
  weekdayLabel: document.querySelector("#weekday-label"),
  dateLabel: document.querySelector("#date-label"),
  yearLabel: document.querySelector("#year-label"),
  liveHours: document.querySelector("#live-hours"),
  cityName: document.querySelector("#city-name"),
  temperature: document.querySelector("#temperature"),
  cardDate: document.querySelector("#card-date"),
  condition: document.querySelector("#condition"),
  dailyList: document.querySelector("#daily-list"),
  status: document.querySelector("#status"),
  installation: document.querySelector("#installation"),
};

const weatherCodes = {
  0: ["Ясно", "clear"],
  1: ["Переважно ясно", "partly-cloudy"],
  2: ["Мінлива хмарність", "partly-cloudy"],
  3: ["Суцільна хмарність", "overcast"],
  45: ["Туман", "fog"],
  48: ["Паморозь і туман", "frost"],
  51: ["Легка мряка", "drizzle"],
  53: ["Мряка", "drizzle"],
  55: ["Сильна мряка", "rain"],
  56: ["Крижана мряка", "frost"],
  57: ["Сильна крижана мряка", "frost"],
  61: ["Невеликий дощ", "rain"],
  63: ["Дощ", "rain"],
  65: ["Сильний дощ", "heavy-rain"],
  66: ["Крижаний дощ", "frost"],
  67: ["Сильний крижаний дощ", "frost"],
  71: ["Невеликий сніг", "snow"],
  73: ["Сніг", "snow"],
  75: ["Сильний сніг", "heavy-snow"],
  77: ["Сніжні зерна", "snow"],
  80: ["Короткий дощ", "rain"],
  81: ["Зливи", "heavy-rain"],
  82: ["Сильні зливи", "heavy-rain"],
  85: ["Снігові зливи", "snow"],
  86: ["Сильні снігові зливи", "heavy-snow"],
  95: ["Гроза", "storm"],
  96: ["Гроза з градом", "storm"],
  99: ["Сильна гроза з градом", "storm"],
};

const weekdays = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const months = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
];

function getWeatherLabel(code) {
  return weatherCodes[code] ?? ["Хмарно", "cloudy"];
}

function formatDate(date) {
  return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]}`;
}

function setStatus(message, isError = false) {
  if (!elements.status) return;
  elements.status.textContent = message;
  elements.status.classList.toggle("is-error", isError);
}

function updateLiveClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  elements.liveHours.textContent = `${hours}:${minutes}`;
  elements.weekdayLabel.textContent = weekdays[now.getDay()];
  elements.dateLabel.textContent = formatDate(now);
  elements.yearLabel.textContent = String(now.getFullYear());
}

function getFaviconArtwork(condition) {
  const icons = {
    clear: "☀", "partly-cloudy": "⛅", cloudy: "☁", overcast: "☁",
    drizzle: "🌧", rain: "🌧", "heavy-rain": "🌧", storm: "⛈",
    snow: "❄", "heavy-snow": "❄", fog: "≋", frost: "❄",
    wind: "≋", "strong-wind": "≋",
  };
  return icons[condition] ?? "☁";
}

function updateFavicon(condition) {
  const artwork = getFaviconArtwork(condition);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#242426"/><text x="32" y="42" text-anchor="middle" font-size="30" fill="#f2f1ee">${artwork}</text></svg>`;
  elements.favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function updatePageTitle(placeName, temperature, condition) {
  titleMarqueeText = `PGDA · ${placeName} · ${Math.round(temperature)}° · ${condition}`;
  titleMarqueeIndex = 0;
  document.title = titleMarqueeText;
}

function updateTitleMarquee() {
  if (titleMarqueeText.length <= 24) {
    document.title = titleMarqueeText;
    return;
  }
  const loop = `${titleMarqueeText}     `;
  const offset = titleMarqueeIndex % loop.length;
  document.title = `${loop.slice(offset)}${loop.slice(0, offset)}`;
  titleMarqueeIndex += 1;
}

async function fetchWeather(place) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error("Не вдалося завантажити прогноз.");
  return response.json();
}

function applyWeatherScene(condition) {
  weatherClasses.forEach((name) => document.body.classList.remove(`condition-${name}`));
  document.body.classList.add(`condition-${condition}`);
}

function renderDaily(daily) {
  const days = daily.time.slice(0, 5).map((time, index) => {
    const date = new Date(`${time}T12:00:00`);
    return {
      day: weekdays[date.getDay()],
      temp: Math.round(daily.temperature_2m_max[index]),
    };
  });

  elements.dailyList.innerHTML = days.map((item) => `
    <article class="day-chip">
      <span>${item.day}</span>
      <strong>${item.temp}°</strong>
    </article>
  `).join("");
}

function renderWeather(place, weather) {
  const [conditionLabel, conditionType] = getWeatherLabel(weather.current.weather_code);
  const temperature = Math.round(weather.current.temperature_2m);
  const currentDate = new Date(weather.current.time);

  elements.cityName.textContent = place.name;
  elements.temperature.textContent = `${temperature}°`;
  elements.cardDate.textContent = formatDate(currentDate);
  elements.condition.textContent = conditionLabel;

  applyWeatherScene(conditionType);
  updateFavicon(conditionType);
  updatePageTitle(place.name, temperature, conditionLabel);
  renderDaily(weather.daily);
}

function enableSubtleParallax() {
  if (!elements.installation || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 8;
    const y = (event.clientY / window.innerHeight - 0.5) * 6;
    elements.installation.style.setProperty("--scene-shift-x", `${x}px`);
    elements.installation.style.setProperty("--scene-shift-y", `${y}px`);
  }, { passive: true });
}

async function loadVillageWeather() {
  if (isWeatherLoading) return;
  isWeatherLoading = true;
  try {
    setStatus("Оновлюю актуальну погоду...");
    const weather = await fetchWeather(village);
    renderWeather(village, weather);
    setStatus("ugin");
  } catch (error) {
    setStatus(error.message || "Не вдалося оновити погоду.", true);
  } finally {
    isWeatherLoading = false;
  }
}

updateLiveClock();
enableSubtleParallax();
setInterval(updateLiveClock, 1000);
setInterval(updateTitleMarquee, titleMarqueeInterval);
loadVillageWeather();
setInterval(loadVillageWeather, weatherRefreshInterval);
