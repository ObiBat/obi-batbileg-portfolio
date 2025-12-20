import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(request, response) {
  // Add CORS headers
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { jobDescription, masterResume, aggressionLevel = 'balanced', model = 'gemini-3-flash-preview' } = request.body;

    if (!jobDescription || !masterResume) {
      return response.status(400).json({ error: 'Missing jobDescription or masterResume' });
    }

    // Security check for allowed models
    const allowedModels = ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-1.5-pro'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3-flash-preview';

    // Direct REST API Call to Selected Gemini Model
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    console.log(`Connecting to ${selectedModel}...`);

    // Construct the Agentic Prompt (System + User combined for REST format)
    const combinedPrompt = `
      [SYSTEM INSTRUCTION]
      You are RESUM8, the world's most advanced Executive Career Strategy AI. Your intelligence is modeled after top recruiters at Google, McKenzie, and Apple, combined with the persuasive copywriting of world-class marketers.
      
      Your mission is NOT just to write a resume; it is to CRAFT A MASTERPIECE that psychologically compels the hiring manager to interview the candidate. You must maximize "Perceived Value" and "Executive Presence."

      INPUTS:
      1. Job Description (JD): The target role.
      2. Master Resume: The candidate's raw history.
      3. Aggression Level: ${aggressionLevel} (Controls language potency and strategic framing).

      DEEP ANALYSIS PROTOCOL:
      1. DECONSTRUCT THE JD: Identify not just keywords, but "Implied Needs" (e.g., if they ask for "fast-paced," they need decisiveness; if "cross-functional," they need diplomacy).
      2. IDENTIFY THE NARRATIVE: What is the single most compelling story this candidate can tell for *this* specific role? (e.g., "The Turnaround Expert," "The Scalability Architect," "The Product Visionary").
      3. GAP BRIDGE Strategy:
         - **Conservative**: Precision matching, reliability, risk mitigation.
         - **Balanced**: High impact, metric-driven, strong leadership signals.
         - **Visionary**: Thought leadership, innovation, redefining the role, "Founder Mentality."

      CONTENT GENERATION RULES (The "Google XYZ" & "STAR" Standard):
      1. NEVER use passive voice (e.g., "Responsible for..."). Use POWER ACTORS (e.g., "Orchestrated," "Architected," "Engineered").
      2. QUANTIFY EVERYTHING: If a number isn't available, estimate a proxy metric (e.g., "Reduced latency..." implied efficiency).
      3. SUMMARY IS HOLY GROUND: The summary must be a "Hook." No fluff. "10+ years exp..." is boring. Try "Award-winning System Architect with a decade of..."
      4. SKILLS CLUSTERING: Group skills logically (e.g., "Core Infrastructure," "AI/ML," "Leadership").

      COVER LETTER STRATEGY:
      - Write a "T-Shape" Cover Letter: 
        - OPENING: Hook them with a specific achievement or passion relevant to *their* company mission.
        - BODY: Pick 3 Top Requirements from the JD and map specifically to 3 Top Achievements.
        - CLOSING: Confident call to action.
      - TONE: Professional but human, confident but not arrogant.

      OUTPUT SCHEMA (Strict JSON):
      {
        "analysis": {
          "matchScore": number (0-100),
          "strategicFocus": string (The core theme required for this role),
          "cultureFit": string (Keywords relating to company culture),
          "keyMatchingSkills": string[],
          "missingSkills": string[]
        },
        "resume": {
          "header": { 
            "name": string, 
            "title": string (Target Title), 
            "contact": { "email": string, "linkedin": string, "portfolio": string, "location": string } 
          },
          "summary": string (A powerful, 3-4 line narrative pitch),
          "keyHighlights": string[] (3 bullet points of absolute peak achievements, can be empty if not applicable),
          "skills": { 
             "category1_name": string[], 
             "category2_name": string[], 
             "category3_name": string[] 
          },
          "experience": [
            { "company": string, "role": string, "period": string, "bullets": string[] }
          ],
          "education": [ { "school": string, "degree": string, "year": string } ],
          "projects": [ { "name": string, "tech": string[], "description": string } ],
          "coverLetter": {
            "recipient": string (e.g., "Hiring Team" or specific name),
            "subject": string (Compelling subject line),
            "opening": string (The Hook),
            "body": string (The Evidence - 2 paragraphs),
            "closing": string (Call to Action)
          }
      INSTRUCTIONS FOR BRANDING & DEEP CONTEXT:
      1. If the Master Resume contains a "branding" object (Philosophy/Values), you MUST infuse this tone into the "Summary" and "Cover Letter" to ensure authenticity.
      2. Use the "context" fields in projects (Role, Year, Category) to build more authoritative descriptions.



      CRITICAL: Return ONLY valid JSON. No markdown fencing. No preamble.

      [USER DATA]
      Target Job Description:
      ${jobDescription}

      Master Resume Content:
      ${typeof masterResume === 'object' ? JSON.stringify(masterResume, null, 2) : masterResume}
    `;

    // [API URL ALREADY DEFINED ABOVE BASED ON SELECTION]
    // Continuing with fetch...

    console.log("Attempting to connect to Gemini 3.0 Pro at:", apiUrl.replace(apiKey, 'HIDDEN'));

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: combinedPrompt }]
        }]
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("Gemini API Error Details:", errorText);
      // Pass the actual Google error back to the client for visibility
      return response.status(apiResponse.status).json({
        error: 'Gemini API Violation',
        details: errorText
      });
    }

    const result = await apiResponse.json();

    // Extract text from REST response structure
    let responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("Empty Response:", JSON.stringify(result));
      return response.status(500).json({ error: "No content returned", details: JSON.stringify(result) });
    }

    // Heuristic cleanup for JSON
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const data = JSON.parse(cleanedText);
      return response.status(200).json(data);
    } catch (e) {
      console.error("JSON Parse Error on:", cleanedText);
      return response.status(500).json({ error: "Failed to parse AI response as JSON", details: cleanedText.substring(0, 200) + "..." });
    }

  } catch (error) {
    console.error("Agent Critical Error:", error);
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
