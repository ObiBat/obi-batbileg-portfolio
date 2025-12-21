import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(request, response) {
    // CORS
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { text, action, context } = request.body;

        if (!text || !action) {
            return response.status(400).json({ error: 'Missing text or action' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

        let prompt = "";

        switch (action) {
            case 'rewrite':
                prompt = `Act as a professional executive resume writer. Rewrite the following resume content to be more impactful, professional, and action-oriented. Maintain the core meaning but improve the phrasing.\n\nContent: "${text}"`;
                break;
            case 'quantify':
                prompt = `Act as a professional resume writer. The user provided the following text. Add plausible, realistic placeholder metrics (percentages, dollar amounts, time savings) to make it result-oriented. Mark the added metrics with brackets like [X%] so the user knows to edit them.\n\nContent: "${text}"`;
                break;
            case 'shorten':
                prompt = `Act as a professional editor. Concisely summarize the following text for a resume, removing fluff and keeping only the strongest points. Keep it under 75% of the original length.\n\nContent: "${text}"`;
                break;
            case 'expand':
                prompt = `Act as a professional resume writer. Expand on the following point by adding context about "how" and "why" this was achieved, implying strong leadership and technical competence. Assume a senior level role.\n\nContent: "${text}"`;
                break;
            case 'tone_professional':
                prompt = `Rewrite the following text to sound extremely professional, corporate, and polished.\n\nContent: "${text}"`;
                break;
            case 'tone_confident':
                prompt = `Rewrite the following text to sound bold, confident, and authoritative (using strong action verbs).\n\nContent: "${text}"`;
                break;
            case 'tone_creative':
                prompt = `Rewrite the following text to sound innovative, design-forward, and visionary.\n\nContent: "${text}"`;
                break;
            case 'fix_grammar':
                prompt = `Fix any grammar, spelling, or punctuation errors in the following text. Do not change the style, just correct the mechanics.\n\nContent: "${text}"`;
                break;
            default:
                prompt = `Improve the following resume text:\n\n"${text}"`;
        }

        if (context) {
            prompt += `\n\nContext/Role: ${context}`;
        }

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return response.status(200).json({ result: responseText.trim() });

    } catch (error) {
        console.error("AI Generation Error:", error);
        return response.status(500).json({ error: 'AI Generation Failed', details: error.message });
    }
}
