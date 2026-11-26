
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Cloud,
  HeartPulse,
  Leaf,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Navigation,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Wind,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AirData = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    us_aqi: number | null;
    european_aqi: number | null;
    pm10: number | null;
    pm2_5: number | null;
    nitrogen_dioxide: number | null;
    ozone: number | null;
  };
  hourly: {
    time: string[];
    us_aqi: (number | null)[];
    pm10: (number | null)[];
    pm2_5: (number | null)[];
  };
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type LocationOption = {
  name: string;
  latitude: number;
  longitude: number;
};

const LOCATIONS: LocationOption[] = [
  { name: "Pune, India", latitude: 18.5204, longitude: 73.8567 },
  { name: "Mumbai, India", latitude: 19.076, longitude: 72.8777 },
  { name: "Delhi, India", latitude: 28.6139, longitude: 77.209 },
  { name: "Bengaluru, India", latitude: 12.9716, longitude: 77.5946 },
  { name: "Hyderabad, India", latitude: 17.385, longitude: 78.4867 },
  { name: "Chennai, India", latitude: 13.0827, longitude: 80.2707 },
];

function getAQIInfo(aqi: number | null) {
  if (aqi === null) {
    return {
      label: "Unavailable",
      description: "Air quality data is not available.",
      color: "#94A3B8",
      className: "neutral",
      advice: "Try refreshing the air quality data.",
    };
  }

  if (aqi <= 50) {
    return {
      label: "Good",
      description: "Air quality is satisfactory.",
      color: "#34C98B",
      className: "good",
      advice: "Enjoy your usual outdoor activities.",
    };
  }

  if (aqi <= 100) {
    return {
      label: "Moderate",
      description: "Air quality is acceptable for most people.",
      color: "#D7B84C",
      className: "moderate",
      advice: "Unusually sensitive people may consider reducing prolonged outdoor exertion.",
    };
  }

  if (aqi <= 150) {
    return {
      label: "Unhealthy for Sensitive Groups",
      description: "Sensitive groups may experience health effects.",
      color: "#F39A48",
      className: "sensitive",
      advice: "People with asthma or other respiratory or heart conditions, children and older adults should reduce prolonged or heavy outdoor exertion.",
    };
  }

  if (aqi <= 200) {
    return {
      label: "Unhealthy",
      description: "Some members of the general public may experience effects.",
      color: "#E66B70",
      className: "unhealthy",
      advice: "Consider reducing prolonged or heavy outdoor exertion.",
    };
  }

  if (aqi <= 300) {
    return {
      label: "Very Unhealthy",
      description: "Health alert: risk of health effects is increased.",
      color: "#B783D9",
      className: "very-unhealthy",
      advice: "Avoid prolonged outdoor exertion and follow local health guidance.",
    };
  }

  return {
    label: "Hazardous",
    description: "Health warning: everyone may experience serious effects.",
    color: "#A75B64",
    className: "hazardous",
    advice: "Avoid outdoor exertion and follow local public-health instructions.",
  };
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(1);
}

function formatHour(time: string) {
  return new Date(time).toLocaleTimeString("en-IN", {
    hour: "numeric",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export default function Home() {
  const [location, setLocation] = useState<LocationOption>(LOCATIONS[0]);
  const [airData, setAirData] = useState<AirData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I'm AeroSage, your air-quality companion. Ask me about AQI, pollution exposure, outdoor activities or practical ways to protect your air quality.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const fetchAirQuality = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const params = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
        });

        const response = await fetch(`/api/air-quality?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Unable to retrieve air-quality data.");
        }

        const data: AirData = await response.json();
        setAirData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [location]
  );

  useEffect(() => {
    fetchAirQuality();
  }, [fetchAirQuality]);

  const aqi = airData?.current?.us_aqi ?? null;
  const aqiInfo = getAQIInfo(aqi);

  const chartData = useMemo(() => {
    if (!airData?.hourly) return [];

    return airData.hourly.time.map((time, index) => ({
      time: formatHour(time),
      aqi: airData.hourly.us_aqi[index],
      pm25: airData.hourly.pm2_5[index],
      pm10: airData.hourly.pm10[index],
    }));
  }, [airData]);

  const sendMessage = async (customQuestion?: string) => {
    const text = (customQuestion ?? question).trim();

    if (!text || chatLoading) return;

    const userMessage: ChatMessage = { role: "user", text };
    const conversation = [...messages, userMessage];

    setMessages(conversation);
    setQuestion("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Current dashboard context:
Location: ${location.name}
US AQI: ${aqi ?? "Unavailable"}
PM2.5: ${formatNumber(airData?.current?.pm2_5)} μg/m³
PM10: ${formatNumber(airData?.current?.pm10)} μg/m³
Nitrogen dioxide: ${formatNumber(airData?.current?.nitrogen_dioxide)} μg/m³
Ozone: ${formatNumber(airData?.current?.ozone)} μg/m³

User question: ${text}

Use this supplied data as context. Do not claim that it is a live sensor measurement. Give practical, concise, evidence-aware guidance.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The AI assistant could not respond.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.reply || "I couldn't generate a response.",
        },
      ]);
    } catch (err) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            err instanceof Error
              ? err.message
              : "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const currentTime = airData?.current?.time
  ? new Date(airData.current.time).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: airData.timezone || "Asia/Kolkata",
    })
  : "Waiting for data";

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="AeroSage home">
          <span className="brand-icon">
            <Wind size={23} />
          </span>
          <span>
            <strong>AeroSage</strong>
            <small>URBAN AIR INTELLIGENCE</small>
          </span>
        </a>

        <nav className="desktop-nav">
          <a className="active" href="#overview">Overview</a>
          <a href="#insights">Insights</a>
          <a href="#recommendations">Recommendations</a>
        </nav>

        <div className="header-actions">
          <span className="live-indicator">
            <span className="live-dot" /> LIVE DATA
          </span>
          <button
            className="icon-button"
            onClick={() => fetchAirQuality(true)}
            disabled={refreshing}
            aria-label="Refresh air quality"
          >
            <RefreshCw size={17} className={refreshing ? "spin" : ""} />
          </button>
        </div>
      </header>

      <div className="dashboard">
        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              YOUR PERSONAL AIR QUALITY COMPANION
            </div>
            <h1>Breathe smarter.<br /><span>Live healthier.</span></h1>
            <p className="welcome-copy">
              Understand the air around you and make better everyday decisions.
            </p>
          </div>

          <div className="location-control">
            <label htmlFor="location-select">YOUR LOCATION</label>
            <div className="select-wrap">
              <MapPin size={17} />
              <select
                id="location-select"
                value={location.name}
                onChange={(event) => {
                  const selected = LOCATIONS.find(
                    (item) => item.name === event.target.value
                  );
                  if (selected) setLocation(selected);
                }}
              >
                {LOCATIONS.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <Cloud size={18} />
            {error}
            <button onClick={() => fetchAirQuality(true)}>Try again</button>
          </div>
        )}

        <section id="overview" className="overview-grid">
          <article className="aqi-card panel">
            <div className="card-heading">
              <div>
                <span className="section-label">AIR QUALITY INDEX</span>
                <h2>Today&apos;s air quality</h2>
              </div>
              <span className="icon-tile"><Wind size={20} /></span>
            </div>

            {loading ? (
              <div className="loading-block">
                <LoaderCircle className="spin" size={30} />
                <span>Loading air quality...</span>
              </div>
            ) : (
              <>
                <div className="aqi-main">
                  <div>
                    <div className="aqi-number" style={{ color: aqiInfo.color }}>
                      {aqi ?? "—"}
                    </div>
                    <span className={`aqi-status ${aqiInfo.className}`}>
                      {aqiInfo.label}
                    </span>
                  </div>
                  <div className="aqi-gauge">
                    <div
                      className="gauge-ring"
                      style={{
                        background: `conic-gradient(${aqiInfo.color} ${
                          Math.min(Math.max(aqi ?? 0, 0), 500) / 5
                        }%, #263746 0)`,
                      }}
                    >
                      <div className="gauge-inner">
                        <Wind size={28} />
                        <span>US AQI</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="aqi-description">{aqiInfo.description}</p>
                <div className="advice-strip">
                  <ShieldCheck size={19} />
                  <span>{aqiInfo.advice}</span>
                </div>
              </>
            )}
            <div className="card-foot">
              <span><MapPin size={14} /> {location.name}</span>
              <span>US AQI scale</span>
            </div>
          </article>

          <article className="pollutants-card panel">
            <div className="card-heading">
              <div>
                <span className="section-label">POLLUTANT MONITOR</span>
                <h2>What&apos;s in the air?</h2>
              </div>
              <span className="icon-tile"><Activity size={20} /></span>
            </div>

            <div className="pollutant-grid">
              <div className="pollutant-item">
                <div className="pollutant-icon purple"><Cloud size={18} /></div>
                <span className="pollutant-name">PM2.5</span>
                <strong>{loading ? "—" : formatNumber(airData?.current.pm2_5)}</strong>
                <small>μg/m³</small>
              </div>
              <div className="pollutant-item">
                <div className="pollutant-icon blue"><Wind size={18} /></div>
                <span className="pollutant-name">PM10</span>
                <strong>{loading ? "—" : formatNumber(airData?.current.pm10)}</strong>
                <small>μg/m³</small>
              </div>
              <div className="pollutant-item">
                <div className="pollutant-icon orange"><Activity size={18} /></div>
                <span className="pollutant-name">NO₂</span>
                <strong>{loading ? "—" : formatNumber(airData?.current.nitrogen_dioxide)}</strong>
                <small>μg/m³</small>
              </div>
              <div className="pollutant-item">
                <div className="pollutant-icon green"><Sun size={18} /></div>
                <span className="pollutant-name">Ozone</span>
                <strong>{loading ? "—" : formatNumber(airData?.current.ozone)}</strong>
                <small>μg/m³</small>
              </div>
            </div>

            <div className="european-aqi">
              <span>European AQI</span>
              <strong>{loading ? "—" : airData?.current.european_aqi ?? "—"}</strong>
            </div>
          </article>
        </section>

        <section id="insights" className="chart-section panel">
          <div className="section-top">
            <div>
              <span className="section-label">POLLUTION TRENDS</span>
              <h2>Air quality throughout the day</h2>
              <p>Hourly US AQI forecast for {location.name}</p>
            </div>
            <span className="chart-tag"><Activity size={14} /> HOURLY AQI</span>
          </div>

          <div className="chart-container">
            {loading ? (
              <div className="loading-block">
                <LoaderCircle className="spin" size={28} />
                Loading chart...
              </div>
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#55D6B0" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#55D6B0" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#263746" strokeDasharray="4 5" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#8397A8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fill: "#8397A8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#172633",
                      border: "1px solid #314858",
                      borderRadius: 12,
                      color: "#F0F5F7",
                    }}
                    formatter={(value) => [value ?? "—", "US AQI"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke="#55D6B0"
                    strokeWidth={2.5}
                    fill="url(#aqiGradient)"
                    connectNulls
                    dot={false}
                    activeDot={{ r: 5, fill: "#55D6B0", stroke: "#172633", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No hourly forecast is available.</div>
            )}
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot" /> US AQI</span>
            <span>Lower values indicate cleaner air</span>
          </div>
        </section>

        <section id="recommendations" className="bottom-grid">
          <article className="recommendation-card panel">
            <div className="card-heading">
              <div>
                <span className="section-label">YOUR DAILY GUIDANCE</span>
                <h2>Make healthier choices</h2>
              </div>
              <span className="icon-tile"><HeartPulse size={20} /></span>
            </div>

            <div className="recommendation-list">
              <div className="recommendation-item">
                <span className="recommendation-icon orange"><Navigation size={18} /></span>
                <div>
                  <strong>Outdoor activities</strong>
                  <p>{aqiInfo.advice}</p>
                </div>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-icon green"><Leaf size={18} /></span>
                <div>
                  <strong>Indoor air quality</strong>
                  <p>Keep windows closed during periods of elevated outdoor pollution. Use suitable filtration if available.</p>
                </div>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-icon blue"><ShieldCheck size={18} /></span>
                <div>
                  <strong>Personal protection</strong>
                  <p>People in sensitive groups should follow local health advice and monitor symptoms.</p>
                </div>
              </div>
            </div>
            <button className="text-action" onClick={() => setChatOpen(true)}>
              Ask AeroSage for personalized guidance <ArrowUpRight size={16} />
            </button>
          </article>

          <article className="ai-promo panel">
            <div className="ai-orb"><Sparkles size={30} /></div>
            <span className="section-label">YOUR AI COMPANION</span>
            <h2>Meet your personal<br /><span>Air Quality Copilot.</span></h2>
            <p>
              Get clear answers, understand pollution risks and explore practical
              ways to make your daily routine healthier.
            </p>
            <button className="primary-button" onClick={() => setChatOpen(true)}>
              <MessageCircle size={17} /> Chat with AeroSage <ArrowUpRight size={16} />
            </button>
            <div className="ai-caption">
              <span className="live-dot" /> Powered by Google Gemini
            </div>
          </article>
        </section>

        <footer className="footer">
          <a className="footer-brand" href="#"><Wind size={17} /> AeroSage</a>
          <span>Air-quality estimates powered by Open-Meteo</span>
          <span>AI assistance powered by Gemini</span>
        </footer>

        <div className="data-note">
          <ShieldCheck size={14} />
          <span>
            Provider-generated air-quality estimates, not direct local sensor
            readings. AQI guidance is informational and not medical advice.
          </span>
          <span>Provider time: {currentTime}</span>
        </div>
      </div>

      <button
        className="chat-fab"
        onClick={() => setChatOpen(true)}
        aria-label="Open AeroSage AI assistant"
      >
        <Sparkles size={21} />
        <span>Ask AeroSage</span>
      </button>

      {chatOpen && (
        <div className="chat-overlay" role="presentation" onClick={() => setChatOpen(false)}>
          <section
            className="chat-panel"
            role="dialog"
            aria-modal="true"
            aria-label="AeroSage AI assistant"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="chat-header">
              <div className="chat-brand">
                <span className="chat-avatar"><Bot size={21} /></span>
                <div>
                  <strong>AeroSage AI</strong>
                  <small><span className="live-dot" /> Gemini-powered assistant</small>
                </div>
              </div>
              <button
                className="icon-button"
                onClick={() => setChatOpen(false)}
                aria-label="Close assistant"
              >
                <X size={19} />
              </button>
            </div>

            <div className="chat-context">
              <MapPin size={14} /> {location.name}
              <span>·</span>
              US AQI: {aqi ?? "Unavailable"}
            </div>

            <div className="chat-messages" aria-live="polite">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  {message.role === "assistant" && (
                    <span className="message-avatar"><Sparkles size={15} /></span>
                  )}
                  <div className="message-bubble">{message.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="message assistant">
                  <span className="message-avatar"><Sparkles size={15} /></span>
                  <div className="message-bubble typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            <div className="suggestion-chips">
              <button onClick={() => sendMessage("Is it safe to exercise outdoors right now?")}>
                Outdoor exercise?
              </button>
              <button onClick={() => sendMessage("How can I reduce PM2.5 exposure indoors?")}>
                Indoor protection
              </button>
            </div>

            <form
              className="chat-input-row"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about your air quality..."
                aria-label="Ask AeroSage a question"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={!question.trim() || chatLoading}
                aria-label="Send message"
              >
                {chatLoading ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}
              </button>
            </form>
            <p className="chat-disclaimer">
              AI-generated guidance is informational, not a medical diagnosis.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}

