# PROMTP: Build the "ResuM8" Agentic Workflow Engine

## Context
You are an expert Full-Stack AI Engineer and Design Technologist. You are working on a high-end portfolio website (`portfolio.html` + Vercel) that already features premium "Interstellar" aesthetics (dark mode, glassmorphism, GSAP animations).

## Objective
Create a **complex backend feature** and a **distinct UI page** that functions as an **Agentic Resume Architect** (codenamed "ResuM8" or similar). This feature will take the user's "Master Resume" and a specific "Job Description" (JD) as input, and use **Google Gemini 1.5 Pro** to generate a highly optimized, engineered, and tailored resume.

## Core Requirements

### 1. Architecture & Backend (The Engine)
*   **Infrastructure**: Leverage Vercel Serverless Functions (`/api/agent/optimize`).
*   **Model**: Integrate Google Gemini 1.5 Pro API.
*   **Logic**:
    *   **Context Ingestion**: Read the `master_resume` (text/pdf content) and `job_description`.
    *   **Chain of Thought (CoT)**: multiple passes:
        1.  *Deconstruction*: Analyze JD for hard/soft skills, culture fit, and keywords.
        2.  *Gap Analysis*: Match Master Resume against JD. identify strength/weakness.
        3.  *Strategy*: Decide which projects from the Master Resume to highlight, which bullets to rephrase for impact (Action -> Result metrics).
        4.  *Synthesis*: Generate the final JSON structure for the resume.
*   **Performance**: Streaming responses if possible, or progress updates (e.g., "Analyzing JD...", "Optimizing Experience Section...").

### 2. Frontend Interface (The Dashboard)
*   **New Page**: Create a new standalone page (e.g., `/agent.html` or `/resume-engine.html`).
*   **Design System**: Inherit the "Interstellar" theme (Dark grays, neon accents, IBM Plex Mono).
*   **UX Flow**:
    *   **Input Zone**: A dedicated area to paste/upload the "Target Job Description".
    *   **Control Panel**: Toggles for "Aggression Level" (e.g., "Conservative Match" vs "Creative Visionary").
    *   **Live Terminal**: A visual "Terminal" window showing the Agent's "Thought Process" in real-time (as pseudo-logs) to sell the "Engineering Masterpiece" vibe.
    *   **Output Canvas**: A real-time preview of the generated resume that looks like a high-end document. HTML-based but exportable to PDF.
*   **Interactivity**: Draggable sections, editable fields (if the user wants to tweak the AI output).

### 3. "Engineering Masterpiece" Qualities
*   **Visuals**: Use `framer-motion` or GSAP for smooth transitions. The UI should feel like a sci-fi HUD or a IDE.
*   **Branding**: The generated resume itself should look distinct—modern, clean, minimal, suitable for FAANG/High-growth tech roles.
*   **Employability**: The AI instruction must prioritize specific metrics (e.g., "Improved latency by 20%").

## Implementation Steps

### Phase 1: Setup & Backend
1.  Initialize a `api/` directory for Vercel functions (Node.js).
2.  Create `api/generate.js` to handle the Gemini API call.
3.  Implement the prompt engineering strategy within the system prompt for Gemini (Persona: "Top-tier Tech Recruiter & Engineering Director").

### Phase 2: Frontend "Agent Interface"
1.  Create `resume-engine.html` duplicating the `portfolio.html` head/style setup.
2.  Build the split-screen layout: Inputs (Left) | Visualization/Output (Right).
3.  Implement the "Agent Live Log" visual component (scrolling text, status indicators).

### Phase 3: Resume Rendering
1.  Create a CSS-based print stylesheet so the HTML output parses perfectly to A4 PDF.
2.  Design the "High-Level Engineering Resume" template (Header, Skills Matrix, Experience with Metric-focus).

## Deliverables
*   `api/optimize.js` (Serverless Function)
*   `resume-engine.html` (The Interface)
*   `assets/js/resume-engine.js` (Client logic)
*   `assets/css/resume.css` (Specific printable styles)

## Immediate Action
Generate the code for the **Serverless Function** first, then the **HTML Structure** for the Agent Page. Be bold with the design.
