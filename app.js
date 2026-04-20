const village = {
  name: "Софіївська Борщагівка, Київська область, Україна",
  latitude: 50.4111405,
  longitude: 30.359975,
};

const weatherRefreshInterval = 10 * 60 * 1000;
const titleMarqueeInterval = 900;
let isWeatherLoading = false;
let titleMarqueeText = "PGDA";
let titleMarqueeIndex = 0;
const sunState = {
  sunrise: null,
  sunset: null,
};

const moonPhaseLabels = [
  "молодик",
  "молодий місяць",
  "перша чверть",
  "зростаючий місяць",
  "повня",
  "спадний місяць",
  "остання чверть",
  "старий місяць",
];

const elements = {
  favicon: document.querySelector("#favicon"),
  status: document.querySelector("#status"),
  cityName: document.querySelector("#city-name"),
  currentDate: document.querySelector("#current-date"),
  liveTime: document.querySelector("#live-time"),
  weatherVisual: document.querySelector("#weather-visual"),
  weatherPhoto: document.querySelector("#weather-photo"),
  weatherIcon: document.querySelector("#weather-icon"),
  temperature: document.querySelector("#temperature"),
  condition: document.querySelector("#condition"),
  wind: document.querySelector("#wind"),
  windArrow: document.querySelector("#wind-arrow"),
  windDirection: document.querySelector("#wind-direction"),
  humidity: document.querySelector("#humidity"),
  visibility: document.querySelector("#visibility"),
  pressure: document.querySelector("#pressure"),
  feelsLike: document.querySelector("#feels-like"),
  feelsLikeCard: document.querySelector("#feels-like-card"),
  uvIndex: document.querySelector("#uv-index"),
  uvLevel: document.querySelector("#uv-level"),
  uvTrackFill: document.querySelector("#uv-track-fill"),
  sunArc: document.querySelector("#sun-arc"),
  sunMarker: document.querySelector("#sun-marker"),
  sunPosition: document.querySelector("#sun-position"),
  sunrise: document.querySelector("#sunrise"),
  sunset: document.querySelector("#sunset"),
  airScore: document.querySelector("#air-score"),
  aqiProgress: document.querySelector("#aqi-progress"),
  aqiLevel: document.querySelector("#aqi-level"),
  aqiDescription: document.querySelector("#aqi-description"),
  aqiPm25: document.querySelector("#aqi-pm25"),
  aqiPm10: document.querySelector("#aqi-pm10"),
  aqiO3: document.querySelector("#aqi-o3"),
  aqiNo2: document.querySelector("#aqi-no2"),
  airComponents: document.querySelector("#air-components"),
  airQualityIndex: document.querySelector("#air-quality-index"),
  weatherAdvice: document.querySelector("#weather-advice"),
  weatherDetail: document.querySelector("#weather-detail"),
  hourlyList: document.querySelector("#hourly-list"),
  dailyList: document.querySelector("#daily-list"),
};

const weatherCodes = {
  0: ["Ясно", "☀"],
  1: ["Переважно ясно", "🌤"],
  2: ["Мінлива хмарність", "⛅"],
  3: ["Хмарно", "☁"],
  45: ["Туман", "🌫"],
  48: ["Паморозь і туман", "🌫"],
  51: ["Легка мряка", "🌦"],
  53: ["Мряка", "🌦"],
  55: ["Сильна мряка", "🌧"],
  56: ["Крижана мряка", "🌧"],
  57: ["Сильна крижана мряка", "🌧"],
  61: ["Невеликий дощ", "🌧"],
  63: ["Дощ", "🌧"],
  65: ["Сильний дощ", "🌧"],
  66: ["Крижаний дощ", "🌧"],
  67: ["Сильний крижаний дощ", "🌧"],
  71: ["Невеликий сніг", "🌨"],
  73: ["Сніг", "🌨"],
  75: ["Сильний сніг", "❄"],
  77: ["Сніжні зерна", "❄"],
  80: ["Короткий дощ", "🌦"],
  81: ["Зливи", "🌧"],
  82: ["Сильні зливи", "⛈"],
  85: ["Снігові зливи", "🌨"],
  86: ["Сильні снігові зливи", "❄"],
  95: ["Гроза", "⛈"],
  96: ["Гроза з градом", "⛈"],
  99: ["Сильна гроза з градом", "⛈"],
};

const rainyCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const cloudyCodes = new Set([1, 2, 3, 45, 48]);
const sunnyCodes = new Set([0]);
const foggyCodes = new Set([45, 48]);
const snowyCodes = new Set([71, 73, 75, 77, 85, 86]);
const stormyCodes = new Set([95, 96, 99]);
const weatherThemeClasses = [
  "weather-clear",
  "weather-mostly-clear",
  "weather-partly-cloudy",
  "weather-overcast",
  "weather-rainy",
  "weather-snowy",
  "weather-foggy",
  "weather-stormy",
];
const weatherConditionClasses = [
  "condition-sunny",
  "condition-cloudy",
  "condition-rain",
  "condition-snow",
  "condition-partly-cloudy",
  "condition-storm",
  "condition-windy",
  "condition-humid",
];

const weatherPhotos = {
  sunny: {
    src: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=500&q=80",
    alt: "Яскраве сонячне небо",
  },
  mostlySunny: {
    src: "https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&w=500&q=80",
    alt: "Сонце і легкі хмари",
    motion: "clouds",
  },
  partlyCloudy: {
    src: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=500&q=80",
    alt: "Мінлива хмарність у небі",
    motion: "clouds",
  },
  cloudy: {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Cloudy%20sky%20%28Unsplash%29.jpg?width=500",
    alt: "Щільні хмари в небі",
    motion: "clouds",
  },
  fog: {
    src: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?auto=format&fit=crop&w=500&q=80",
    alt: "Туманний пейзаж",
  },
  rain: {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Rain%20on%20window%20%28Unsplash%29.jpg?width=500",
    alt: "Краплі дощу на вікні",
  },
  snow: {
    src: "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=500&q=80",
    alt: "Снігова погода",
  },
  storm: {
    src: "https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=500&q=80",
    alt: "Грозове небо з блискавкою",
  },
};

const formatDate = new Intl.DateTimeFormat("uk-UA", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const formatHour = new Intl.DateTimeFormat("uk-UA", {
  hour: "2-digit",
  minute: "2-digit",
});

const formatShortDay = new Intl.DateTimeFormat("uk-UA", {
  weekday: "short",
});

const round = (value) => Math.round(value);

function updateLiveTime() {
  if (!elements.liveTime) return;

  elements.liveTime.textContent = new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function updateSunPosition(sunrise = sunState.sunrise, sunset = sunState.sunset) {
  if (!elements.sunArc || !elements.sunPosition || !sunrise || !sunset) return;

  sunState.sunrise = sunrise;
  sunState.sunset = sunset;

  const now = new Date();
  const dayLength = sunset.getTime() - sunrise.getTime();
  const rawProgress = dayLength > 0 ? (now.getTime() - sunrise.getTime()) / dayLength : 0;
  const progress = Math.max(0, Math.min(1, rawProgress));
  const angle = Math.PI * progress;
  const x = progress * 100;
  const y = 84 - Math.sin(angle) * 68;
  const isDaylight = rawProgress >= 0 && rawProgress <= 1;

  elements.sunArc.style.setProperty("--sun-x", `${x}%`);
  elements.sunArc.style.setProperty("--sun-y", `${y}%`);
  elements.sunArc.classList.toggle("is-night", !isDaylight);
  elements.sunArc.classList.toggle("is-before-sunrise", rawProgress < 0);
  elements.sunArc.classList.toggle("is-after-sunset", rawProgress > 1);
  elements.sunArc.dataset.moonPhase = getMoonPhase(now);

  if (rawProgress < 0) {
    elements.sunPosition.textContent = moonPhaseLabels[getMoonPhase(now)];
  } else if (rawProgress > 1) {
    elements.sunPosition.textContent = moonPhaseLabels[getMoonPhase(now)];
  } else {
    elements.sunPosition.textContent = `${Math.round(progress * 100)}% дня`;
  }
}

function getMoonPhase(date) {
  const synodicMonth = 29.530588853;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const daysSinceNewMoon = (date.getTime() - knownNewMoon) / 86400000;
  const phase = ((daysSinceNewMoon % synodicMonth) + synodicMonth) % synodicMonth;
  return Math.floor((phase / synodicMonth) * 8 + 0.5) % 8;
}

function getSunCycle(daily) {
  const now = new Date();
  const todaySunrise = daily.sunrise?.[0] ? new Date(daily.sunrise[0]) : null;
  const todaySunset = daily.sunset?.[0] ? new Date(daily.sunset[0]) : null;
  const tomorrowSunrise = daily.sunrise?.[1] ? new Date(daily.sunrise[1]) : null;
  const tomorrowSunset = daily.sunset?.[1] ? new Date(daily.sunset[1]) : null;

  if (todaySunset && tomorrowSunrise && tomorrowSunset && now.getTime() > todaySunset.getTime()) {
    return {
      sunrise: tomorrowSunrise,
      sunset: tomorrowSunset,
    };
  }

  return {
    sunrise: todaySunrise,
    sunset: todaySunset,
  };
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#9d2b22" : "";
}

function getWeatherLabel(code) {
  return weatherCodes[code] ?? ["Невідомі умови", "🌡"];
}

function getWeatherPhoto(code) {
  if (code === 0) return weatherPhotos.sunny;
  if (code === 1) return weatherPhotos.mostlySunny;
  if (code === 2) return weatherPhotos.partlyCloudy;
  if (code === 3) return weatherPhotos.cloudy;
  if (foggyCodes.has(code)) return weatherPhotos.fog;
  if (stormyCodes.has(code)) return weatherPhotos.storm;
  if (snowyCodes.has(code)) return weatherPhotos.snow;
  if (rainyCodes.has(code)) return weatherPhotos.rain;
  return weatherPhotos.cloudy;
}

function getWeatherCondition(code, current = {}) {
  if (stormyCodes.has(code)) return "storm";
  if (snowyCodes.has(code)) return "snow";
  if (rainyCodes.has(code)) return "rain";
  if ((current.wind_speed_10m ?? 0) >= 32) return "windy";
  if ((current.relative_humidity_2m ?? 0) >= 84) return "humid";
  if (code === 2) return "partly-cloudy";
  if (code === 1) return "partly-cloudy";
  if (code === 3 || foggyCodes.has(code)) return "cloudy";
  return "sunny";
}

function getFaviconArtwork(condition) {
  const icons = {
    sunny: { emoji: "☀️", bg: "#ffb703", glow: "#fff3b0" },
    "partly-cloudy": { emoji: "⛅", bg: "#38bdf8", glow: "#fef3c7" },
    cloudy: { emoji: "☁️", bg: "#64748b", glow: "#e2e8f0" },
    rain: { emoji: "🌧️", bg: "#0f766e", glow: "#67e8f9" },
    storm: { emoji: "⛈️", bg: "#312e81", glow: "#fde047" },
    snow: { emoji: "❄️", bg: "#93c5fd", glow: "#ffffff" },
    windy: { emoji: "💨", bg: "#0891b2", glow: "#cffafe" },
    humid: { emoji: "💧", bg: "#0369a1", glow: "#7dd3fc" },
  };

  return icons[condition] ?? icons.cloudy;
}

function updateFavicon(condition) {
  if (!elements.favicon) return;

  const { emoji, bg, glow } = getFaviconArtwork(condition);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="glow" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.95"/>
          <stop offset="55%" stop-color="${bg}" stop-opacity="0.82"/>
          <stop offset="100%" stop-color="#07101f"/>
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#glow)"/>
      <text x="32" y="43" text-anchor="middle" font-size="34" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
    </svg>
  `;

  elements.favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getShortPlaceName(placeName) {
  return placeName.split(",")[0].trim() || placeName;
}

function updatePageTitle(placeName, temperature, condition) {
  const city = getShortPlaceName(placeName);
  titleMarqueeText = `PGDA · ${city} · ${round(temperature)}° · ${condition}`;
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

function getWeatherSvg(condition) {
  const common = 'class="weather-svg" viewBox="0 0 64 64" role="img"';

  if (condition === "sunny") {
    return `
      <svg ${common} aria-label="Ясно">
        <defs>
          <radialGradient id="sun-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff7ad" />
            <stop offset="70%" stop-color="#ffcc00" />
            <stop offset="100%" stop-color="#ff9900" />
          </radialGradient>
          <filter id="sun-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g class="svg-sun-rays">
          ${Array.from({ length: 8 }, (_, i) => `<line x1="32" y1="8" x2="32" y2="2" transform="rotate(${i * 45} 32 32)" />`).join("")}
        </g>
        <circle class="svg-sun-core" cx="32" cy="32" r="16" fill="url(#sun-gradient)" filter="url(#sun-glow)" />
        <circle cx="28" cy="28" r="6" fill="rgba(255,255,255,0.42)" />
      </svg>`;
  }

  if (condition === "rain") {
    return `
      <svg ${common} aria-label="Дощ">
        <defs>
          <linearGradient id="cloud-rain-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#94a3b8" /><stop offset="100%" stop-color="#475569" />
          </linearGradient>
          <linearGradient id="drop-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#00ffff" /><stop offset="100%" stop-color="#0088aa" />
          </linearGradient>
        </defs>
        <g class="svg-cloud-bob">
          <ellipse cx="32" cy="22" rx="18" ry="12" fill="url(#cloud-rain-gradient)" />
          <ellipse cx="22" cy="26" rx="10" ry="8" fill="url(#cloud-rain-gradient)" />
          <ellipse cx="42" cy="26" rx="10" ry="8" fill="url(#cloud-rain-gradient)" />
          <ellipse cx="32" cy="28" rx="14" ry="8" fill="url(#cloud-rain-gradient)" />
        </g>
        ${[20, 28, 36, 44].map((x, i) => `<line class="svg-rain-drop" x1="${x}" y1="38" x2="${x - 2}" y2="50" style="animation-delay:${i * 0.16}s" />`).join("")}
      </svg>`;
  }

  if (condition === "storm") {
    return `
      <svg ${common} aria-label="Гроза">
        <defs><linearGradient id="storm-cloud" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#111827"/></linearGradient></defs>
        <g class="svg-storm-rumble">
          <ellipse cx="32" cy="20" rx="20" ry="14" fill="url(#storm-cloud)" />
          <ellipse cx="20" cy="24" rx="12" ry="10" fill="url(#storm-cloud)" />
          <ellipse cx="44" cy="24" rx="12" ry="10" fill="url(#storm-cloud)" />
          <ellipse cx="32" cy="28" rx="16" ry="10" fill="url(#storm-cloud)" />
        </g>
        <path class="svg-lightning" d="M32 34 L36 42 L33 42 L36 54 L28 44 L31 44 L28 34 Z" />
      </svg>`;
  }

  if (condition === "snow") {
    return `
      <svg ${common} aria-label="Сніг">
        <defs><linearGradient id="snow-cloud" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#94a3b8"/></linearGradient></defs>
        <g class="svg-cloud-bob"><ellipse cx="32" cy="20" rx="18" ry="12" fill="url(#snow-cloud)" /><ellipse cx="20" cy="24" rx="10" ry="8" fill="url(#snow-cloud)" /><ellipse cx="44" cy="24" rx="10" ry="8" fill="url(#snow-cloud)" /></g>
        ${[
          [20, 42, 0],
          [32, 38, 0.5],
          [44, 46, 0.2],
          [26, 50, 0.8],
          [38, 54, 0.3],
        ].map(([x, y, d]) => `<g class="svg-snowflake" style="animation-delay:${d}s; transform-origin:${x}px ${y}px"><circle cx="${x}" cy="${y}" r="2.5"/><line x1="${x - 3}" y1="${y}" x2="${x + 3}" y2="${y}"/><line x1="${x}" y1="${y - 3}" x2="${x}" y2="${y + 3}"/></g>`).join("")}
      </svg>`;
  }

  if (condition === "windy") {
    return `
      <svg ${common} aria-label="Вітер">
        ${[
          [20, 30, 0],
          [32, 40, 0.2],
          [44, 25, 0.4],
        ].map(([y, w, d]) => `<path class="svg-wind-line" d="M8 ${y} Q${8 + w / 2} ${y - 4} ${8 + w} ${y} Q${8 + w + 6} ${y + 4} ${8 + w + 4} ${y + 6}" style="animation-delay:${d}s" />`).join("")}
      </svg>`;
  }

  if (condition === "humid") {
    return `
      <svg ${common} aria-label="Волого">
        <defs><linearGradient id="droplet-gradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#00ffff"/><stop offset="100%" stop-color="#0088aa"/></linearGradient></defs>
        <path class="svg-droplet" d="M32 10 Q32 20 24 30 Q16 40 24 50 Q32 60 40 50 Q48 40 40 30 Q32 20 32 10" fill="url(#droplet-gradient)" />
        <ellipse cx="28" cy="38" rx="4" ry="6" fill="rgba(255,255,255,0.42)" />
      </svg>`;
  }

  if (condition === "partly-cloudy") {
    return `
      <svg ${common} aria-label="Мінлива хмарність">
        <defs>
          <radialGradient id="sun-pc-gradient" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff2a1"/><stop offset="100%" stop-color="#ffcc00"/></radialGradient>
          <linearGradient id="cloud-pc-gradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#94a3b8"/></linearGradient>
        </defs>
        <circle class="svg-sun-peek" cx="20" cy="20" r="12" fill="url(#sun-pc-gradient)" />
        <g class="svg-cloud-pass"><ellipse cx="38" cy="32" rx="18" ry="12" fill="url(#cloud-pc-gradient)" /><ellipse cx="26" cy="36" rx="10" ry="8" fill="url(#cloud-pc-gradient)" /><ellipse cx="48" cy="36" rx="10" ry="8" fill="url(#cloud-pc-gradient)" /><ellipse cx="38" cy="40" rx="14" ry="8" fill="url(#cloud-pc-gradient)" /></g>
      </svg>`;
  }

  return `
    <svg ${common} aria-label="Хмарно">
      <defs><linearGradient id="cloud-gradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#cbd5e1"/><stop offset="100%" stop-color="#64748b"/></linearGradient></defs>
      <g class="svg-cloud-drift"><ellipse cx="32" cy="28" rx="20" ry="14" fill="url(#cloud-gradient)" /><ellipse cx="18" cy="32" rx="12" ry="10" fill="url(#cloud-gradient)" /><ellipse cx="46" cy="32" rx="12" ry="10" fill="url(#cloud-gradient)" /><ellipse cx="32" cy="36" rx="16" ry="10" fill="url(#cloud-gradient)" /></g>
    </svg>`;
}

function getWindDirectionLabel(degrees = 0) {
  const directions = ["Пн", "Пн-Сх", "Сх", "Пд-Сх", "Пд", "Пд-Зх", "Зх", "Пн-Зх"];
  return directions[Math.round(degrees / 45) % directions.length];
}

function getUvLevel(uvIndex = 0) {
  if (uvIndex < 3) return "Низький";
  if (uvIndex < 6) return "Помірний";
  if (uvIndex < 8) return "Високий";
  if (uvIndex < 11) return "Дуже високий";
  return "Екстремальний";
}

function estimateVisibilityKm(current) {
  const code = current.weather_code;
  if (foggyCodes.has(code)) return 1.4;
  if (stormyCodes.has(code)) return 4.2;
  if (snowyCodes.has(code)) return 5.4;
  if (rainyCodes.has(code)) return 7.2;
  if (code === 3) return 8.5;
  if (code === 2) return 11.2;
  return 14.8;
}

function estimateAirQuality(current) {
  const humidity = current.relative_humidity_2m ?? 50;
  const wind = current.wind_speed_10m ?? 0;
  const weatherPenalty = rainyCodes.has(current.weather_code) ? -10 : stormyCodes.has(current.weather_code) ? -18 : 0;
  const score = 42 + Math.max(0, humidity - 55) * 0.2 - Math.min(wind, 30) * 0.35 + weatherPenalty;
  return Math.max(12, Math.min(88, Math.round(score)));
}

function getAqiLevel(aqi) {
  if (aqi <= 50) {
    return {
      label: "Добре",
      color: "#22c55e",
      description: "Якість повітря задовільна",
    };
  }
  if (aqi <= 100) {
    return {
      label: "Помірно",
      color: "#eab308",
      description: "Прийнятно для більшості людей",
    };
  }
  if (aqi <= 150) {
    return {
      label: "Для чутливих",
      color: "#f97316",
      description: "Може впливати на чутливі групи",
    };
  }
  if (aqi <= 200) {
    return {
      label: "Шкідливо",
      color: "#ef4444",
      description: "Можливий вплив на здоров'я",
    };
  }
  return {
    label: "Небезпечно",
    color: "#a855f7",
    description: "Надзвичайні умови",
  };
}

function estimateAirComponents(aqi) {
  return {
    pm25: Math.round(aqi * 0.3),
    pm10: Math.round(aqi * 0.5),
    o3: 68,
    no2: Math.round(aqi * 0.35),
  };
}

function renderAirQuality(aqi) {
  const level = getAqiLevel(aqi);
  const components = estimateAirComponents(aqi);
  const circumference = 2 * Math.PI * 42;
  const percentage = Math.min((aqi / 300) * 100, 100);

  elements.airQualityIndex.textContent = aqi;
  elements.airScore.style.setProperty("--aqi-color", level.color);
  elements.aqiProgress.style.strokeDasharray = circumference;
  elements.aqiProgress.style.strokeDashoffset = circumference - (percentage / 100) * circumference;
  elements.aqiLevel.textContent = level.label;
  elements.aqiLevel.style.color = level.color;
  elements.aqiLevel.style.backgroundColor = `${level.color}22`;
  elements.aqiDescription.textContent = level.description;
  elements.aqiPm25.textContent = components.pm25;
  elements.aqiPm10.textContent = components.pm10;
  elements.aqiO3.textContent = components.o3;
  elements.aqiNo2.textContent = components.no2;
}

function getWeatherTheme(code) {
  if (stormyCodes.has(code)) return "weather-stormy";
  if (snowyCodes.has(code)) return "weather-snowy";
  if (rainyCodes.has(code)) return "weather-rainy";
  if (foggyCodes.has(code)) return "weather-foggy";
  if (code === 3) return "weather-overcast";
  if (code === 2) return "weather-partly-cloudy";
  if (code === 1) return "weather-mostly-clear";
  if (sunnyCodes.has(code)) return "weather-clear";
  return "weather-overcast";
}

function setWeatherTheme(code) {
  document.body.classList.remove(...weatherThemeClasses);
  document.body.classList.remove(...weatherConditionClasses);
  document.body.classList.add(getWeatherTheme(code));
}

function getAdvice(current, daily) {
  const weatherCode = current.weather_code;
  const maxTemp = daily.temperature_2m_max[0];
  const minTemp = daily.temperature_2m_min[0];
  const wind = current.wind_speed_10m;
  const rainLikely = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);
  const snowLikely = [71, 73, 75, 77, 85, 86].includes(weatherCode);

  if (rainLikely) {
    return [
      "Парасоля сьогодні має шанс стати героєм.",
      `Температура від ${round(minTemp)}° до ${round(maxTemp)}°, можливі опади. Взуття з запасом сухості буде мудрим ходом.`,
    ];
  }

  if (snowLikely) {
    return [
      "Схоже на день для теплого шару і обережних кроків.",
      `Очікується від ${round(minTemp)}° до ${round(maxTemp)}°. Якщо виходиш надовго, рукавички не образяться, що їх взяли.`,
    ];
  }

  if (wind >= 35) {
    return [
      "Вітер сьогодні грає першу скрипку.",
      `Пориви можуть бути відчутними: близько ${round(wind)} км/год. Легка куртка або щось із капюшоном буде доречним.`,
    ];
  }

  if (maxTemp >= 26) {
    return [
      "День просить води, тіні й трохи сонцезахисту.",
      `Максимум близько ${round(maxTemp)}°. Якщо плануєш прогулянку, краще не забути пляшку води.`,
    ];
  }

  if (minTemp <= 6) {
    return [
      "Ранок може вкусити за ніс.",
      `Температура опуститься до ${round(minTemp)}°. Теплий шар зверху сьогодні працює як маленька страховка.`,
    ];
  }

  return [
    "Погода виглядає доволі дружньо.",
    `Очікується від ${round(minTemp)}° до ${round(maxTemp)}°. Можна планувати день без великих погодних сюрпризів.`,
  ];
}

async function fetchWeather(place) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover",
    hourly: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error("Не вдалося завантажити прогноз.");

  return response.json();
}

function renderWeather(place, weather) {
  const [condition, icon] = getWeatherLabel(weather.current.weather_code);
  const photo = getWeatherPhoto(weather.current.weather_code);
  const weatherCondition = getWeatherCondition(weather.current.weather_code, weather.current);
  const [adviceTitle, adviceDetail] = getAdvice(weather.current, weather.daily);
  const windDirection = weather.current.wind_direction_10m ?? 0;
  const uvIndex = weather.daily.uv_index_max?.[0] ?? 0;
  const airQuality = estimateAirQuality(weather.current);

  setWeatherTheme(weather.current.weather_code);
  document.body.classList.add(`condition-${weatherCondition}`);
  updateFavicon(weatherCondition);
  updatePageTitle(place.name, weather.current.temperature_2m, condition);
  elements.cityName.textContent = place.name;
  elements.currentDate.textContent = formatDate.format(new Date(weather.current.time));
  elements.weatherIcon.innerHTML = getWeatherSvg(weatherCondition);
  elements.weatherPhoto.hidden = true;
  elements.weatherPhoto.removeAttribute("src");
  elements.weatherPhoto.alt = "";
  elements.weatherVisual.classList.remove("has-photo", "cloud-motion");

  elements.temperature.textContent = `${round(weather.current.temperature_2m)}°`;
  elements.condition.textContent = condition;
  elements.wind.textContent = `${round(weather.current.wind_speed_10m)} км/год`;
  elements.windDirection.textContent = `${getWindDirectionLabel(windDirection)} вітер`;
  elements.windArrow.style.transform = `rotate(${windDirection + 180}deg)`;
  elements.humidity.textContent = `${weather.current.relative_humidity_2m}%`;
  elements.visibility.textContent = `${estimateVisibilityKm(weather.current).toFixed(1)} км`;
  elements.pressure.textContent = `${round(weather.current.pressure_msl ?? 1013)} hPa`;
  elements.feelsLike.textContent = `${round(weather.current.apparent_temperature)}°`;
  elements.feelsLikeCard.textContent = `${round(weather.current.apparent_temperature)}°`;
  elements.uvIndex.textContent = Math.round(uvIndex);
  elements.uvLevel.textContent = getUvLevel(uvIndex);
  elements.uvTrackFill.style.width = `${Math.min(100, Math.round((uvIndex / 11) * 100))}%`;
  const { sunrise, sunset } = getSunCycle(weather.daily);
  elements.sunrise.textContent = sunrise ? formatHour.format(sunrise) : "--:--";
  elements.sunset.textContent = sunset ? formatHour.format(sunset) : "--:--";
  updateSunPosition(sunrise, sunset);
  renderAirQuality(airQuality);
  elements.weatherAdvice.textContent = adviceTitle;
  elements.weatherDetail.textContent = adviceDetail;

  renderHourly(weather.hourly);
  renderDaily(weather.daily);
}

function renderHourly(hourly) {
  const now = Date.now();
  const nextHours = hourly.time
    .map((time, index) => ({
      time: new Date(time),
      temperature: hourly.temperature_2m[index],
      code: hourly.weather_code[index],
    }))
    .filter((item) => item.time.getTime() >= now)
    .slice(0, 12);

  elements.hourlyList.innerHTML = nextHours
    .map((item) => {
      const [, icon] = getWeatherLabel(item.code);
      return `
        <article class="hour-card">
          <span>${formatHour.format(item.time)}</span>
          <em aria-hidden="true">${icon}</em>
          <strong>${round(item.temperature)}°</strong>
        </article>
      `;
    })
    .join("");
}

function renderDaily(daily) {
  const minWeekTemp = Math.min(...daily.temperature_2m_min);
  const maxWeekTemp = Math.max(...daily.temperature_2m_max);

  elements.dailyList.innerHTML = daily.time
    .map((time, index) => {
      const [condition, icon] = getWeatherLabel(daily.weather_code[index]);
      const min = round(daily.temperature_2m_min[index]);
      const max = round(daily.temperature_2m_max[index]);
      const fill = Math.max(12, Math.round(((max - minWeekTemp) / Math.max(1, maxWeekTemp - minWeekTemp)) * 100));
      return `
        <article class="day-card">
          <strong>${index === 0 ? "Сьогодні" : formatShortDay.format(new Date(time))}</strong>
          <span aria-hidden="true">${icon}</span>
          <span class="day-condition">${condition}</span>
          <div class="bar"><i style="--fill: ${fill}%"></i></div>
          <div class="temps">${min}° / ${max}°</div>
        </article>
      `;
    })
    .join("");
}

async function loadVillageWeather() {
  if (isWeatherLoading) return;

  isWeatherLoading = true;

  try {
    setStatus("Оновлюю прогноз для Софіївської Борщагівки...");
    const weather = await fetchWeather(village);
    renderWeather(village, weather);
    setStatus(`Оновлено для Софіївської Борщагівки. Наступне автооновлення приблизно за 10 хв.`);
  } catch (error) {
    setStatus(error.message || "Не вдалося оновити погоду для Софіївської Борщагівки.", true);
  } finally {
    isWeatherLoading = false;
  }
}

elements.airComponents.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const isSelected = button.classList.contains("is-selected");
  elements.airComponents.querySelectorAll("button").forEach((item) => item.classList.remove("is-selected"));
  if (!isSelected) button.classList.add("is-selected");
});

updateLiveTime();
setInterval(updateLiveTime, 1000);
setInterval(() => updateSunPosition(), 60 * 1000);
setInterval(updateTitleMarquee, titleMarqueeInterval);
loadVillageWeather();
setInterval(loadVillageWeather, weatherRefreshInterval);
