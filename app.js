const village = {
  name: "Дім",
  region: "Київська область",
  latitude: 50.4111405,
  longitude: 30.359975,
};

const weatherRefreshInterval = 10 * 60 * 1000;
const titleMarqueeInterval = 900;
const themeRefreshInterval = 30 * 1000;
const themeStorageKey = "pgda-theme-override";
const weatherTimezone = "Europe/Kyiv";
const weatherClasses = [
  "clear", "partly-cloudy", "variable-cloudy", "cloudy", "overcast", "drizzle", "rain",
  "light-rain", "short-rain", "heavy-rain", "storm", "snow", "heavy-snow", "fog", "wind",
  "strong-wind", "frost", "hot",
];
let titleMarqueeText = "PGDA";
let titleMarqueeIndex = 0;
let isWeatherLoading = false;
let weatherData = null;
let selectedDayIndex = 0;
let todayDayIndex = 0;
let weatherTransitionTimer = null;
let solarSchedule = null;
let activeTheme = "day";

const elements = {
  favicon: document.querySelector("#favicon"),
  themeColor: document.querySelector("#theme-color"),
  themeToggle: document.querySelector("#theme-toggle"),
  weekdayLabel: document.querySelector("#weekday-label"),
  dateLabel: document.querySelector("#date-label"),
  liveHours: document.querySelector("#live-hours"),
  cityName: document.querySelector("#city-name"),
  temperature: document.querySelector("#temperature"),
  cardDate: document.querySelector("#card-date"),
  condition: document.querySelector("#condition"),
  dailyList: document.querySelector("#daily-list"),
  status: document.querySelector("#status"),
  installation: document.querySelector("#installation"),
  weatherCard: document.querySelector(".weather-card"),
  cardSurface: document.querySelector(".card-surface"),
  artworkMotion: document.querySelector("#artwork-motion"),
  weatherVisual: document.querySelector("#weather-visual"),
  forecastCard: document.querySelector("#daily-forecast"),
  forecastToggle: document.querySelector("#forecast-toggle"),
  forecastClose: document.querySelector("#forecast-close"),
};

const weatherCodes = {
  0: ["Ясно", "clear"],
  1: ["Переважно ясно", "partly-cloudy"],
  2: ["Мінлива хмарність", "variable-cloudy"],
  3: ["Суцільна хмарність", "overcast"],
  45: ["Туман", "fog"],
  48: ["Паморозь і туман", "frost"],
  51: ["Легка мряка", "drizzle"],
  53: ["Мряка", "drizzle"],
  55: ["Сильна мряка", "rain"],
  56: ["Крижана мряка", "frost"],
  57: ["Сильна крижана мряка", "frost"],
  61: ["Невеликий дощ", "light-rain"],
  63: ["Дощ", "rain"],
  65: ["Сильний дощ", "heavy-rain"],
  66: ["Крижаний дощ", "frost"],
  67: ["Сильний крижаний дощ", "frost"],
  71: ["Невеликий сніг", "snow"],
  73: ["Сніг", "snow"],
  75: ["Сильний сніг", "heavy-snow"],
  77: ["Сніжні зерна", "snow"],
  80: ["Короткий дощ", "short-rain"],
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

function updateDateLockup(date) {
  elements.weekdayLabel.textContent = weekdays[date.getDay()];
  elements.dateLabel.textContent = formatDate(date);
}

function updateLiveClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  elements.liveHours.textContent = `${hours}:${minutes}`;
  if (!weatherData) updateDateLockup(now);
}

function readThemeOverride() {
  try {
    const saved = JSON.parse(localStorage.getItem(themeStorageKey));
    if (!saved || !["day", "night"].includes(saved.theme) || !Number.isFinite(saved.expiresAt)) {
      return null;
    }
    if (Date.now() >= saved.expiresAt) {
      localStorage.removeItem(themeStorageKey);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

function saveThemeOverride(theme, expiresAt) {
  try {
    localStorage.setItem(themeStorageKey, JSON.stringify({ theme, expiresAt }));
  } catch {
    // The theme still works when storage is unavailable.
  }
}

function parseSolarTime(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getFallbackSolarSchedule(now = new Date()) {
  const sunrise = new Date(now);
  sunrise.setHours(5, 0, 0, 0);
  const sunset = new Date(now);
  sunset.setHours(21, 0, 0, 0);
  const nextSunrise = new Date(sunrise);
  nextSunrise.setDate(nextSunrise.getDate() + 1);
  return { sunrise, sunset, nextSunrise };
}

function updateSolarSchedule(weather) {
  const daily = weather?.daily;
  if (!daily?.time?.length || !daily.sunrise?.length || !daily.sunset?.length) {
    solarSchedule = getFallbackSolarSchedule();
    return;
  }

  const todayKey = getLocalDateParts(new Date()).date;
  let index = daily.time.indexOf(todayKey);
  if (index < 0) index = Math.max(0, todayDayIndex);

  const sunrise = parseSolarTime(daily.sunrise[index]);
  const sunset = parseSolarTime(daily.sunset[index]);
  const nextSunrise = parseSolarTime(daily.sunrise[index + 1]);
  solarSchedule = sunrise && sunset
    ? { sunrise, sunset, nextSunrise: nextSunrise || getFallbackSolarSchedule().nextSunrise }
    : getFallbackSolarSchedule();
}

function getAutoTheme(now = new Date()) {
  const schedule = solarSchedule || getFallbackSolarSchedule(now);
  return now < schedule.sunrise || now >= schedule.sunset ? "night" : "day";
}

function getNextSolarBoundary(now = new Date()) {
  const schedule = solarSchedule || getFallbackSolarSchedule(now);
  if (now < schedule.sunrise) return schedule.sunrise;
  if (now < schedule.sunset) return schedule.sunset;
  return schedule.nextSunrise || getFallbackSolarSchedule(now).nextSunrise;
}

function applyTheme(theme) {
  activeTheme = theme;
  document.documentElement.dataset.theme = theme;
  elements.themeToggle?.setAttribute("aria-pressed", String(theme === "night"));
  elements.themeToggle?.setAttribute(
    "aria-label",
    theme === "night" ? "Увімкнути денну тему" : "Увімкнути нічну тему"
  );
  if (elements.themeColor) {
    elements.themeColor.content = theme === "night" ? "#090e16" : "#e7e4df";
  }
}

function syncTheme() {
  const override = readThemeOverride();
  applyTheme(override?.theme || getAutoTheme());
}

function toggleTheme() {
  const nextTheme = activeTheme === "night" ? "day" : "night";
  saveThemeOverride(nextTheme, getNextSolarBoundary().getTime());
  applyTheme(nextTheme);
}

function getFaviconArtwork(condition) {
  const icons = {
    clear: "☀", "partly-cloudy": "⛅", "variable-cloudy": "☁", cloudy: "☁", overcast: "☁",
    drizzle: "🌧", "light-rain": "🌧", "short-rain": "🌧", rain: "🌧", "heavy-rain": "🌧", storm: "⛈",
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

function getLocalDateParts(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: weatherTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  };
}

function getMetSymbol(point, periods = ["next_1_hours", "next_6_hours", "next_12_hours"]) {
  for (const period of periods) {
    const symbol = point?.data?.[period]?.summary?.symbol_code;
    if (symbol) return symbol;
  }
  return "cloudy";
}

function metSymbolToWeatherCode(symbolCode) {
  const symbol = String(symbolCode || "cloudy").replace(/_(day|night|polartwilight)$/, "");

  if (symbol.includes("thunder")) return symbol.includes("hail") ? 96 : 95;
  if (symbol.includes("fog")) return 45;
  if (symbol.includes("clearsky")) return 0;
  if (symbol.includes("partlycloudy")) return 2;
  if (symbol.includes("fair")) return 1;
  if (symbol === "cloudy") return 3;
  if (symbol.includes("heavyrainshowers")) return 82;
  if (symbol.includes("lightrainshowers")) return 80;
  if (symbol.includes("rainshowers")) return 81;
  if (symbol.includes("heavyrain")) return 65;
  if (symbol.includes("lightrain")) return 61;
  if (symbol.includes("rain")) return 63;
  if (symbol.includes("heavysnowshowers")) return 86;
  if (symbol.includes("lightsnowshowers")) return 85;
  if (symbol.includes("snowshowers")) return 85;
  if (symbol.includes("heavysnow")) return 75;
  if (symbol.includes("lightsnow")) return 71;
  if (symbol.includes("snow") || symbol.includes("sleet")) return 73;
  return 3;
}

function normalizeMetWeather(payload) {
  const timeseries = payload?.properties?.timeseries;
  if (!Array.isArray(timeseries) || timeseries.length === 0) {
    throw new Error("MET Norway повернув порожній прогноз.");
  }

  const currentPoint = timeseries.find((point) =>
    Number.isFinite(point?.data?.instant?.details?.air_temperature)
  );
  if (!currentPoint) throw new Error("MET Norway не повернув актуальну температуру.");

  const days = new Map();
  timeseries.forEach((point) => {
    const temperature = point?.data?.instant?.details?.air_temperature;
    if (!Number.isFinite(temperature)) return;

    const local = getLocalDateParts(point.time);
    if (!days.has(local.date)) days.set(local.date, []);
    days.get(local.date).push({
      hour: local.hour,
      point,
      temperature,
      symbol: getMetSymbol(point, ["next_6_hours", "next_1_hours", "next_12_hours"]),
    });
  });

  const dailyEntries = [...days.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, points]) => {
      const representative = [...points].sort((a, b) =>
        Math.abs(a.hour - 12) - Math.abs(b.hour - 12)
      )[0];

      return {
        date,
        temperature: Math.max(...points.map((point) => point.temperature)),
        weatherCode: metSymbolToWeatherCode(representative.symbol),
      };
    });

  const currentLocal = getLocalDateParts(currentPoint.time);
  return {
    source: "met.no",
    current: {
      time: currentLocal.date,
      temperature_2m: currentPoint.data.instant.details.air_temperature,
      weather_code: metSymbolToWeatherCode(getMetSymbol(currentPoint)),
    },
    daily: {
      time: dailyEntries.map((entry) => entry.date),
      weather_code: dailyEntries.map((entry) => entry.weatherCode),
      temperature_2m_max: dailyEntries.map((entry) => entry.temperature),
    },
  };
}

async function fetchMetWeather(place) {
  const url = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
  url.search = new URLSearchParams({
    lat: place.latitude.toFixed(4),
    lon: place.longitude.toFixed(4),
  });

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`MET Norway: HTTP ${response.status}`);
  return normalizeMetWeather(await response.json());
}

async function fetchOpenMeteoWeather(place) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
    past_days: "1",
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error("Не вдалося завантажити прогноз.");
  const weather = await response.json();
  weather.source = "open-meteo-fallback";
  return weather;
}

async function fetchSolarTimes(place) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    daily: "sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
    past_days: "1",
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error("Не вдалося завантажити час сходу й заходу.");
  return response.json();
}

function attachSolarTimes(weather, solarData) {
  if (!weather?.daily?.time || !solarData?.daily?.time) return weather;
  const solarByDate = new Map(solarData.daily.time.map((date, index) => [date, {
    sunrise: solarData.daily.sunrise[index],
    sunset: solarData.daily.sunset[index],
  }]));

  weather.daily.sunrise = weather.daily.time.map((date) => solarByDate.get(date)?.sunrise || null);
  weather.daily.sunset = weather.daily.time.map((date) => solarByDate.get(date)?.sunset || null);
  return weather;
}

async function fetchWeather(place) {
  try {
    const [weather, solarData] = await Promise.all([
      fetchMetWeather(place),
      fetchSolarTimes(place).catch(() => null),
    ]);
    return attachSolarTimes(weather, solarData);
  } catch (error) {
    console.warn("MET Norway недоступний, використовую резервне джерело.", error);
    return fetchOpenMeteoWeather(place);
  }
}

function applyWeatherScene(condition, temperature) {
  weatherClasses.forEach((name) => document.body.classList.remove(`condition-${name}`));
  document.body.classList.add(`condition-${condition}`);
  if (temperature >= 25) document.body.classList.add("condition-hot");

  const animatedLayers = [elements.weatherCard, elements.cardSurface, elements.artworkMotion, elements.weatherVisual].filter(Boolean);
  animatedLayers.forEach((layer) => layer.classList.remove("is-weather-shifting"));
  void elements.cardSurface?.offsetWidth;
  animatedLayers.forEach((layer) => layer.classList.add("is-weather-shifting"));

  window.clearTimeout(weatherTransitionTimer);
  weatherTransitionTimer = window.setTimeout(() => {
    animatedLayers.forEach((layer) => layer.classList.remove("is-weather-shifting"));
  }, 950);
}

function renderDaily(daily) {
  const firstForecastIndex = todayDayIndex + 1;
  const days = daily.time.slice(firstForecastIndex, firstForecastIndex + 5).map((time, offset) => {
    const index = firstForecastIndex + offset;
    const date = new Date(`${time}T12:00:00`);
    return {
      index,
      day: weekdays[date.getDay()],
      high: Math.round(daily.temperature_2m_max[index]),
      isSelected: index === selectedDayIndex,
    };
  });

  elements.dailyList.innerHTML = days.map((item) => `
    <button
      class="day-chip${item.isSelected ? " is-selected" : ""}"
      type="button"
      data-day-index="${item.index}"
      aria-label="Показати прогноз на ${item.day}, ${item.high} градусів"
    >
      <span>${item.day}</span>
      <strong>${item.high}°</strong>
    </button>
  `).join("");
}

function selectForecastDay(event) {
  const dayButton = event.target.closest("[data-day-index]");
  if (!dayButton || !elements.dailyList.contains(dayButton)) return;

  const nextIndex = Number(dayButton.dataset.dayIndex);
  if (!Number.isInteger(nextIndex) || !weatherData?.daily.time[nextIndex]) return;

  selectedDayIndex = nextIndex;
  renderSelectedDay();
}

function toggleForecast() {
  setForecastVisibility(elements.forecastCard.classList.contains("is-hidden"));
}

function setForecastVisibility(isVisible) {
  elements.forecastCard.classList.toggle("is-hidden", !isVisible);
  elements.forecastToggle.setAttribute("aria-expanded", String(isVisible));
  elements.forecastToggle.setAttribute(
    "aria-label",
    isVisible ? "Сховати прогноз на наступні дні" : "Показати прогноз на наступні дні"
  );
}

function closeForecastAndShowToday() {
  if (weatherData) {
    selectedDayIndex = todayDayIndex;
    renderSelectedDay();
  }
  setForecastVisibility(false);
}

function renderSelectedDay() {
  if (!weatherData) return;

  const isToday = selectedDayIndex === todayDayIndex;
  const weatherCode = isToday
    ? weatherData.current.weather_code
    : weatherData.daily.weather_code[selectedDayIndex];
  const temperature = isToday
    ? Math.round(weatherData.current.temperature_2m)
    : Math.round(weatherData.daily.temperature_2m_max[selectedDayIndex]);
  const dateValue = weatherData.daily.time[selectedDayIndex];
  const selectedDate = new Date(`${dateValue}T12:00:00`);
  const [conditionLabel, conditionType] = getWeatherLabel(weatherCode);

  elements.temperature.textContent = `${temperature}°`;
  elements.cardDate.textContent = formatDate(selectedDate);
  elements.condition.textContent = conditionLabel;
  updateDateLockup(selectedDate);

  applyWeatherScene(conditionType, temperature);
  updateFavicon(conditionType);
  updatePageTitle(village.name, temperature, conditionLabel);
  renderDaily(weatherData.daily);
}

function renderWeather(place, weather) {
  const previouslySelectedDate = weatherData?.daily.time[selectedDayIndex];
  weatherData = weather;
  document.body.dataset.weatherSource = weather.source || "unknown";
  todayDayIndex = weather.daily.time.indexOf(weather.current.time.slice(0, 10));
  if (todayDayIndex < 0) todayDayIndex = 1;
  updateSolarSchedule(weather);
  syncTheme();

  const preservedIndex = previouslySelectedDate
    ? weather.daily.time.indexOf(previouslySelectedDate)
    : -1;
  selectedDayIndex = preservedIndex >= 0 ? preservedIndex : todayDayIndex;

  elements.cityName.textContent = place.name;
  renderSelectedDay();
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
syncTheme();
enableSubtleParallax();
elements.themeToggle.addEventListener("click", toggleTheme);
elements.dailyList.addEventListener("click", selectForecastDay);
elements.forecastToggle.addEventListener("click", toggleForecast);
elements.forecastClose.addEventListener("click", closeForecastAndShowToday);
setInterval(updateLiveClock, 1000);
setInterval(updateTitleMarquee, titleMarqueeInterval);
setInterval(syncTheme, themeRefreshInterval);
loadVillageWeather();
setInterval(loadVillageWeather, weatherRefreshInterval);
