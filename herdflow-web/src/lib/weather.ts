// WEBSITE — herdflow-web/src/lib/weather.ts
// OpenWeatherMap (self-serve, free tier: 1,000 calls/day) rather than
// SAWS/AfriGIS -- the official SA source requires a paid commercial
// subscription (only a 50-credits/day, 60-day evaluation pilot exists
// without one), a business relationship this code can't establish. This is
// the realistic, honest substitute, not silently passed off as the same
// thing.
//
// Deliberately does NOT aggregate "last 7 days of rainfall" -- that needs
// OpenWeatherMap's separate historical/time-machine endpoint, one paid call
// per day requested (7 calls for a week), which is expensive per farmer per
// screen-load. What matters more for a grazing decision anyway is the
// forecast, which the daily forecast's `pop`/`rain` fields already cover in
// a single call.
import { env } from "@/lib/env";

const BASE_URL = "https://api.openweathermap.org/data/3.0/onecall";

export const WEATHER_DISCLAIMER =
  "Forecast data from OpenWeatherMap, not the SA Weather Service (SAWS) -- " +
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
}

export async function getWeather(lat: number, lon: number): Promise<WeatherResult | null> {
  if (!env.WEATHER_API_KEY) return null;

  try {
    const url = `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly,alerts&appid=${env.WEATHER_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    return {
      current: {
        tempC: Math.round(data.current.temp),
        condition: data.current.weather?.[0]?.main ?? "Unknown",
        icon: data.current.weather?.[0]?.icon ?? "01d",
        humidity: data.current.humidity,
        windKph: Math.round((data.current.wind_speed ?? 0) * 3.6),
      },
      daily: (data.daily ?? []).slice(0, 7).map((d: any) => ({
        date: new Date(d.dt * 1000).toISOString().slice(0, 10),
        minTemp: Math.round(d.temp.min),
        maxTemp: Math.round(d.temp.max),
        condition: d.weather?.[0]?.main ?? "Unknown",
        icon: d.weather?.[0]?.icon ?? "01d",
        precipitationChance: Math.round((d.pop ?? 0) * 100),
        rainMm: d.rain != null ? Math.round(d.rain) : null,
      })),
      disclaimer: WEATHER_DISCLAIMER,
    };
  } catch (err) {
    console.error("[getWeather]", err);
    return null;
  }
}
