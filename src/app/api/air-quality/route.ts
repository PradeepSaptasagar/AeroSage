
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(searchParams.get("latitude") ?? "18.5204");
    const longitude = Number(searchParams.get("longitude") ?? "73.8567");

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: "us_aqi,european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone",
      hourly: "us_aqi,pm10,pm2_5",
      forecast_days: "1",
      timezone: "auto",
    });

    const response = await fetch(`${BASE_URL}?${params}`, {
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Air quality provider is currently unavailable." },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to retrieve air quality data." },
      { status: 500 }
    );
  }
}
