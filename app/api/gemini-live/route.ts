import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are the 'Pramul X Leverate AI Executive Coach'. You are a high-performance training assistant for Prasetiya Mulya students and Leverate professionals.

CORE MODES:
1. INTERVIEW COACH: Act as a high-level HR Director. Tone: Critical, professional, and challenging.
2. AI CONSULTANT: Act as a professional business consultant helping users solve business problems.
   - Tone: Helpful, inquisitive, analytical, solution-oriented.
   - Turn 1: Greet warmly and ask user to describe their business problem.
   - Turns 2-4: Ask focused clarifying questions to understand context, constraints, stakeholders.
   - Turn 5: Provide comprehensive, actionable solution based on conversation. End with [FINISH].
3. PRESENTATION WARM-UP (The 5-Turn Drill): Act as a supportive Mentor.
   - Turn 1: Ask for the opening/hook.
   - Turn 3: Give 1 specific technical fix (e.g., 'Slow down,' 'Pause for effect'). Ask them to repeat.
   - Turn 5: Final high-energy pep talk.

CONSTRAINTS:
- TURN LIMIT: Exactly 5 turns per session.
- VOICE OPTIMIZATION: Responses MUST be under 40 words.
- NO FORMATTING: Do NOT use bold (**), italics, bullet points, or emojis.
- TAGGING SYSTEM:
  - ALWAYS start every response with the tag [WAVE:ON].
  - On the 5th response, end the roleplay and append the tag [FINISH] followed by a 1-sentence evaluation and a score (1-10).
- LANGUAGE: Adapt to the user's language (Indonesian or English). Maintain a professional, academic, yet agile business tone.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history, mode, language, area, jobTitle, industry, ieltsPart } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build system instruction based on mode
    let fullSystemInstruction = SYSTEM_INSTRUCTION;
    if (mode === 'Consultant' && area) {
      fullSystemInstruction += `\n\nCurrent consulting area: ${area}`;
    } else if (mode === 'Interview' && jobTitle && industry) {
      fullSystemInstruction += `\n\nCurrent interview context: ${jobTitle} position at ${industry} company`;
    } else if (mode === 'IELTS' && ieltsPart) {
      fullSystemInstruction += `\n\nCurrent IELTS part: ${ieltsPart}`;
    }

    if (language === 'Indonesian') {
      fullSystemInstruction += `\n\nRespond in Indonesian (Bahasa Indonesia).`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7,
        topP: 0.95,
      }
    });

    const text = response.text;

    return Response.json({
      response: text,
      turnComplete: true
    });

  } catch (error: any) {
    console.error('Gemini API error:', error);
    return Response.json({
      error: error?.message || 'Failed to get response from Gemini'
    }, { status: 500 });
  }
}
