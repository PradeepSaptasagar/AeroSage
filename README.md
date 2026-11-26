
# AeroSage 🌍
### AI-Powered Urban Air Quality Assistant

### 🌐 Live Demo

**[Launch AeroSage – Live Application](https://aero-sage-cyan.vercel.app/)**

**[GitHub Repository](https://github.com/PradeepSaptasagar/AeroSage)**

Breathe smarter. Live healthier.

AeroSage is an AI-powered urban air quality assistant that helps people understand local air pollution, interpret pollutant levels, and make informed everyday decisions to reduce exposure.

It combines live air-quality data from Open-Meteo with Google's Gemini AI to provide location-aware insights, practical recommendations, and conversational assistance.

## ✨ Features

- **Live Air Quality Dashboard:** View AQI and pollutant concentrations for supported cities.
- **Multi-City Support:** Explore air quality across Pune, Mumbai, Delhi, Bengaluru, Hyderabad, and Chennai.
- **Pollutant Insights:** Understand PM2.5, PM10, NO₂, and ozone levels.
- **Hourly AQI Trends:** Explore changes in air quality throughout the day.
- **AI Air Quality Assistant:** Ask questions and receive contextual guidance using Google Gemini.
- **Personalized Recommendations:** Get practical suggestions for indoor protection and outdoor activities.
- **Responsive Interface:** Access the dashboard across desktop and mobile devices.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Framework | Next.js 16, React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI Integration | Google Gemini API |
| Air Quality Data | Open-Meteo Air Quality API |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |

## 🏗️ Architecture

```text
User
 |
 v
AeroSage Dashboard (Next.js)
 |
 +----> Air Quality API Route
 |          |
 |          v
 |      Open-Meteo API
 |
 +----> AI Chat API Route
            |
            v
        Google Gemini API
            |
            v
     Contextual AI Guidance
```

API keys are accessed server-side and are not exposed in browser code.

## 🚀 Getting Started

### Prerequisites

- Node.js 20.9 or later
- npm
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/PradeepSaptasagar/AeroSage.git
cd AeroSage
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).

Never commit `.env.local` or share your API key publicly.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If port 3000 is occupied, use:

```bash
npm run dev -- -p 3001
```

### 5. Production build

```bash
npm run lint
npm run build
```

## 🔌 Data and AI Integrations

### Open-Meteo Air Quality API

AeroSage retrieves air-quality information through the Open-Meteo Air Quality API, including AQI and pollutant concentrations.

Data availability and timestamps depend on the upstream provider. These values should not be interpreted as direct measurements from a physical monitoring station.

### Google Gemini API

The AI assistant uses Google's Gemini API to interpret the supplied air-quality context and generate practical recommendations.

The Gemini API key is stored in a server-side environment variable and is not included in the client application.

## 🔐 Security

- API credentials are stored in environment variables.
- `.env.local` is excluded from Git.
- AI requests are handled through a server-side API route.
- The application provides informational guidance, not medical diagnosis or emergency advice.

## ⚠️ Disclaimer

Air-quality information may be based on provider models, estimates, or forecasts and can differ from measurements at a specific location.

AeroSage is an informational tool. Follow official local health advisories, particularly during severe pollution events.

## 👨‍💻 Author

**Pradeep Saptasagar**

- GitHub: [@PradeepSaptasagar](https://github.com/PradeepSaptasagar)

## 📄 License

This project is developed as part of the Hack2Skill PromptWars Challenge 6.
