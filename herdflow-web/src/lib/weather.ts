// WEBSITE — herdflow-web/src/lib/weather.ts
// OpenWeatherMap's classic Current Weather + 5 Day/3 Hour Forecast APIs
// (data/2.5/weather, data/2.5/forecast) -- NOT the One Call API 3.0.
// Deliberately chosen: One Call 3.0 requires a credit card on file even
// though it stays free under 1,000 calls/day; these classic endpoints need
// no card at all and are free up to 1,000,000 calls/month, which is what
// the user explicitly chose given how much they cared about zero payment
// risk. Also NOT SAWS/AfriGIS -- the official SA source requires a paid
// commercial subscription, a business relationship this code can't
// establish.
//
// Commercial use is explicitly permitted under OpenWeatherMap's free-tier
// license (ODbL), CONDITIONAL on visible attribution -- "Weather data
// provided by OpenWeather" linked to openweathermap.org, shown on-screen
// wherever this data appears. That's not decorative copy, it's the actual
// license term that makes free commercial use legal, so `attribution`/
// `attributionUrl` below must actually be rendered by every screen that
// shows this data (see herdflow-app WeatherScreen.tsx / HomeScreen.tsx).
//
// The 5-day/3-hour forecast is aggregated into daily buckets here (min/max
// temp, a midday-representative condition, max precipitation chance, and
// summed rain) since the mobile app wants one row per day, not 40 raw
// 3-hour entries.
import { env } from "@/lib/env";

const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

export const WEATHER_ATTRIBUTION = "Weather data provided by OpenWeather";
export const WEATHER_ATTRIBUTION_URL = "https://openweathermap.org/";

export const WEATHER_DISCLAIMER =
  `${WEATHER_ATTRIBUTION} (${WEATHER_ATTRIBUTION_URL}) -- not the SA Weather Service (SAWS); ` +
  "SAWS access requires a paid commercial subscription. Use as a general guide, not for " +
  "severe-weather decisions; consult SAWS/local advisories for official warnings.";

export interface WeatherDay {
  date: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
  icon: string;
  precipitationChance: number;
  rainMm: number | null;
}

export interface WeatherResult {
  current: {
    tempC: number;
    condition: string;
    icon: string;
    humidity: number;
    windKph: number;
  };
  daily: WeatherDay[];
  disclaimer: string;
  attribution: string;
  attributionUrl: string;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherResult | null> {
  if (!env.WEATHER_API_KEY) {
    console.error("[getWeather] WEATHER_API_KEY is not configured -- set it in Render's env vars");
    return null;
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${CURRENT_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${env.WEATHER_API_KEY}`),
      fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${env.WEATHER_API_KEY}`),
    ]);
    if (!currentRes.ok || !forecastRes.ok) {
      const [currentBody, forecastBody] = await Promise.all([
        currentRes.text().catch(() => ""),
        forecastRes.text().catch(() => ""),
      ]);
      console.error("[getWeather] OpenWeatherMap request failed", {
        currentStatus: currentRes.status,
        currentBody,
        forecastStatus: forecastRes.status,
        forecastBody,
      });
      return null;
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    // Bucket the 3-hourly list (up to 40 entries / 5 days) by calendar date.
    const byDate = new Map<string, any[]>();
    for (const entry of forecast.list ?? []) {
      const date = new Date(entry.dt * 1000).toISOString().slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(entry);
    }

    const daily: WeatherDay[] = [...byDate.entries()].map(([date, entries]) => {
      // The entry closest to midday is the most representative single
      // "condition" for the day (rather than whichever 3-hour slot happens
      // to be first/last).
      const midday = entries.reduce((best, e) => {
        const hour = new Date(e.dt * 1000).getUTCHours();
        const bestHour = new Date(best.dt * 1000).getUTCHours();
        return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? e : best;
      }, entries[0]);

      const totalRain = entries.reduce((sum, e) => sum + (e.rain?.["3h"] ?? 0), 0);

      return {
        date,
        minTemp: Math.round(Math.min(...entries.map((e) => e.main.temp_min))),
        maxTemp: Math.round(Math.max(...entries.map((e) => e.main.temp_max))),
        condition: midday.weather?.[0]?.main ?? "Unknown",
        icon: midday.weather?.[0]?.icon ?? "01d",
        precipitationChance: Math.round(Math.max(...entries.map((e) => e.pop ?? 0)) * 100),
        rainMm: totalRain > 0 ? Math.round(totalRain) : null,
      };
    });

    return {
      current: {
        tempC: Math.round(current.main.temp),
        condition: current.weather?.[0]?.main ?? "Unknown",
        icon: current.weather?.[0]?.icon ?? "01d",
        humidity: current.main.humidity,
        windKph: Math.round((current.wind?.speed ?? 0) * 3.6),
      },
      daily,
      disclaimer: WEATHER_DISCLAIMER,
      attribution: WEATHER_ATTRIBUTION,
      attributionUrl: WEATHER_ATTRIBUTION_URL,
    };
  } catch (err) {
    console.error("[getWeather]", err);
    return null;
  }
}
