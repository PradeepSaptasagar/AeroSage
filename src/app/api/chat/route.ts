
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-lite";

const SYSTEM_INSTRUCTION = `
You are AeroSage, an intelligent urban air quality assistant.

Your responsibilities:
- Explain AQI, PM2.5, PM10, NO2, ozone and pollution exposure.
- Give practical, personalized activity and air-quality suggestions.
- Explain risks in clear, accessible language.
- Use dashboard readings when they are provided.
- Never invent live AQI readings or claim to access sensors.

Health and safety rules:
- Provide general educational guidance, not medical diagnoses.
- Distinguish current readings from 24-hour averages.
- Never compare different averaging periods without explaining the difference.
- Do not guarantee that masks eliminate pollution exposure.
- Explain that N95/FFP2 protection depends on proper fit.
- When AQI is unhealthy for sensitive groups, recommend indoor
  exercise as the safer alternative.
- Do not automatically describe outdoor walking as safe.
- Encourage people with respiratory or cardiovascular conditions
  to follow their healthcare professional's advice.

Keep responses helpful, structured and concise.
`;

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error
  ) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length > 2000) {
      return NextResponse.json(
        { error: "Enter a message of up to 2000 characters." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Allow one retry for temporary Gemini service errors.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await ai.models.generateContent({
          model: MODEL,
          contents: message,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.4,
            maxOutputTokens: 800,
          },
        });

        const reply = result.text?.trim();

        if (!reply) {
          return NextResponse.json(
            { error: "No response was generated. Please try again." },
            { status: 502 }
          );
        }

        return NextResponse.json({ reply });
      } catch (error) {
        const status = getErrorStatus(error);

        console.error("Gemini request failed:", {
          status,
          attempt: attempt + 1,
        });

        const temporaryError =
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503;

        if (temporaryError && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        if (temporaryError) {
          return NextResponse.json(
            {
              error:
                "AeroSage AI is experiencing high demand. Please try again shortly.",
            },
            { status: 503 }
          );
        }

        return NextResponse.json(
          {
            error:
              "AeroSage could not complete your request. Please try again.",
          },
          { status: status && status >= 400 ? status : 502 }
        );
      }
    }

    return NextResponse.json(
      { error: "Please try again shortly." },
      { status: 503 }
    );
  } catch (error) {
    console.error("AeroSage API error:", error);

    return NextResponse.json(
      { error: "Invalid request. Please try again." },
      { status: 400 }
    );
  }
}
