const village = {
  name: "Софіївська Борщагівка",
  region: "Київська область",
  latitude: 50.4111405,
  longitude: 30.359975,
};

const weatherRefreshInterval = 10 * 60 * 1000;
const titleMarqueeInterval = 900;
let titleMarqueeText = "PGDA";
let titleMarqueeIndex = 0;
let isWeatherLoading = false;

const elements = {
  favicon: document.querySelector("#favicon"),
  weekdayLabel: document.querySelector("#weekday-label"),
  dateLabel: document.querySelector("#date-label"),
  yearLabel: document.querySelector("#year-label"),
  liveHours: document.querySelector("#live-hours"),
  liveMeridiem: document.querySelector("#live-meridiem"),
  cityName: document.querySelector("#city-name"),
  regionLabel: document.querySelector("#region-label"),
  temperature: document.querySelector("#temperature"),
  cardDate: document.querySelector("#card-date"),
  condition: document.querySelector("#condition"),
  dailyList: document.querySelector("#daily-list"),
  status: document.querySelector("#status"),
  sunDisk: document.querySelector("#sun-disk"),
  rainLayer: document.querySelector("#rain-layer"),
};

const weatherCodes = {
  0: ["Ясно", "sunny"],
  1: ["Переважно ясно", "partly-cloudy"],
  2: ["Мінлива хмарність", "partly-cloudy"],
  3: ["Хмарно", "cloudy"],
  45: ["Туман", "cloudy"],
  48: ["Паморозь і туман", "cloudy"],
  51: ["Легка мряка", "rain"],
  53: ["Мряка", "rain"],
  55: ["Сильна мряка", "rain"],
  56: ["Крижана мряка", "rain"],
  57: ["Сильна крижана мряка", "rain"],
  61: ["Невеликий дощ", "rain"],
  63: ["Дощ", "rain"],
  65: ["Сильний дощ", "rain"],
  66: ["Крижаний дощ", "rain"],
  67: ["Сильний крижаний дощ", "rain"],
  71: ["Невеликий сніг", "snow"],
  73: ["Сніг", "snow"],
  75: ["Сильний сніг", "snow"],
  77: ["Сніжні зерна", "snow"],
  80: ["Короткий дощ", "rain"],
  81: ["Зливи", "rain"],
  82: ["Сильні зливи", "storm"],
  85: ["Снігові зливи", "snow"],
  86: ["Сильні снігові зливи", "snow"],
  95: ["Гроза", "storm"],
  96: ["Гроза з градом", "storm"],
  99: ["Сильна гроза з градом", "storm"],
};

const titleDateFormatter = new Intl.DateTimeFormat("uk-UA", {
  weekday: "short",
  day: "2-digit",
  month: "long",
});

const cardDateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "long",
});

const weekDayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

function getWeatherLabel(code) {
  return weatherCodes[code] ?? ["Невідомо", "cloudy"];
}

function setStatus(message, isError = false) {
  if (!elements.status) return;
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#8e3b32" : "rgba(31, 31, 34, 0.36)";
}

function updateLiveClock() {
  const now = new Date();
  const hours24 = now.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, "0");

  elements.liveHours.textContent = `${String(hours12).padStart(2, "0")}:${minutes}`;
  elements.liveMeridiem.textContent = hours24 >= 12 ? "PM" : "AM";
  elements.weekdayLabel.textContent = titleDateFormatter.format(now).split(",")[0] || "---";
  elements.dateLabel.textContent = cardDateFormatter.format(now);
  elements.yearLabel.textContent = String(now.getFullYear());
}

function getShortPlaceName(placeName) {
  return placeName.split(",")[0].trim() || placeName;
}

function getFaviconArtwork(condition) {
  const icons = {
    sunny: "☀️",
    "partly-cloudy": "⛅",
    cloudy: "☁️",
    rain: "🌧️",
    storm: "⛈️",
    snow: "❄️",
  };

  return icons[condition] ?? "☁️";
}

function updateFavicon(condition) {
  const emoji = getFaviconArtwork(condition);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#27272a"/>
          <stop offset="100%" stop-color="#141416"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#g)"/>
      <text x="32" y="42" text-anchor="middle" font-size="30">${emoji}</text>
    </svg>
  `;
  elements.favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function updatePageTitle(placeName, temperature, condition) {
  const city = getShortPlaceName(placeName);
  titleMarqueeText = `PGDA · ${city} · ${Math.round(temperature)}° · ${condition}`;
  titleMarqueeIndex = 0;
  document.title = titleMarqueeText;
}

function updateTitleMarquee() {
  if (titleMarqueeText.length <= 24) {
    document.title = titleMarqueeText;
    return;
  }

  const spacer = "     ";
  const loop = `${titleMarqueeText}${spacer}`;
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
  if (!response.ok) {
    throw new Error("Не вдалося завантажити прогноз.");
  }

  return response.json();
}

function applyWeatherScene(condition) {
  document.body.classList.remove(
    "condition-sunny",
    "condition-partly-cloudy",
    "condition-cloudy",
    "condition-rain",
    "condition-storm",
    "condition-snow"
  );
  document.body.classList.add(`condition-${condition}`);
}

function renderDaily(daily) {
  const days = daily.time.slice(0, 5).map((time, index) => ({
    day: weekDayFormatter.format(new Date(time)),
    temp: Math.round(daily.temperature_2m_max[index]),
  }));

  elements.dailyList.innerHTML = days
    .map(
      (item) => `
        <article class="day-chip">
          <span>${item.day}</span>
          <strong>${item.temp}°</strong>
        </article>
      `
    )
    .join("");
}

function renderWeather(place, weather) {
  const [conditionLabel, conditionType] = getWeatherLabel(weather.current.weather_code);
  const temperature = Math.round(weather.current.temperature_2m);
  const currentDate = new Date(weather.current.time);

  elements.cityName.textContent = place.name;
  elements.regionLabel.textContent = place.region;
  elements.temperature.textContent = `${temperature}°`;
  elements.cardDate.textContent = cardDateFormatter.format(currentDate);
  elements.condition.textContent = conditionLabel;

  applyWeatherScene(conditionType);
  updateFavicon(conditionType);
  updatePageTitle(place.name, temperature, conditionLabel);
  renderDaily(weather.daily);
}

async function loadVillageWeather() {
  if (isWeatherLoading) return;
  isWeatherLoading = true;

  try {
    setStatus("Оновлюю прогноз для Софіївської Борщагівки...");
    const weather = await fetchWeather(village);
    renderWeather(village, weather);
    setStatus("Оновлено. Наступне автооновлення приблизно за 10 хв.");
  } catch (error) {
    setStatus(error.message || "Не вдалося оновити погоду.", true);
  } finally {
    isWeatherLoading = false;
  }
}

updateLiveClock();
setInterval(updateLiveClock, 1000);
setInterval(updateTitleMarquee, titleMarqueeInterval);
loadVillageWeather();
setInterval(loadVillageWeather, weatherRefreshInterval);
