document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const igniteBtn = document.getElementById('ignite-btn');
    const jobDescriptionInput = document.getElementById('job-description');
    const masterResumeInput = document.getElementById('master-resume');
    const aggressionLevelInput = document.getElementById('aggression-level');
    const logsContainer = document.getElementById('agent-logs');
    const resumeDocument = document.getElementById('resume-document');
    const downloadPdfBtn = document.getElementById('download-pdf');
    const statusLabel = document.getElementById('sys-status');
    const portfolioModeToggle = document.getElementById('portfolio-mode');
    const portfolioStatus = document.getElementById('portfolio-status');

    // Portfolio Data Cache
    let portfolioData = null;

    // Portfolio Mode Handler
    portfolioModeToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
            log('Fetching portfolio data...', 'process');

            try {
                // Fetch and parse portfolio page
                const response = await fetch('/portfolio.html');
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Extract structured data
                const portfolioJSON = {
                    name: "Obi Batbileg",
                    title: "Design Technologist",
                    contact: {
                        email: "obi@craefto.com",
                        linkedin: "linkedin.com/in/obibatbileg",
                        portfolio: "obi-batbileg-portfolio.vercel.app",
                        location: "Sydney, AU"
                    },
                    experience: [
                        {
                            company: "CRAEFTO",
                            role: "Design Technologist",
                            period: "2024 — PRESENT",
                            bullets: [
                                "Built integrated studio combining brand systems, digital product development, and automation strategy",
                                "Architected technical infrastructure including analytics dashboards and AI-assisted workflows",
                                "Capstone project 'Zippy' applied AI to generate code from Figma designs"
                            ]
                        },
                        {
                            company: "APPLE",
                            role: "Product Specialist",
                            period: "2022 — PRESENT",
                            bullets: [
                                "Delivering tailored tech solutions for individual and business customers",
                                "Training fellow associates on existing and new practices"
                            ]
                        }
                    ],
                    projects: [
                        {
                            name: "Tactix",
                            tech: ["React 19", "Three.js", "Stockfish WASM", "WebSockets"],
                            description: "A cinematic 3D chess platform combining WebGL rendering engine, client-side Stockfish analysis, and event-driven real-time multiplayer stack"
                        },
                        {
                            name: "GlobFam",
                            tech: ["Next.js 15", "Supabase", "Resend", "Playwright"],
                            description: "Event-driven growth platform pairing high-performance acquisition with secure admin control plane"
                        },
                        {
                            name: "NUU",
                            tech: ["OpenAI GPT-4o", "pgvector", "React 19", "Three.js"],
                            description: "Retrieval-augmented rental discovery engine with hybrid vector similarity ranking"
                        },
                        {
                            name: "Craefto Lab",
                            tech: ["Next.js 14", "TypeScript", "Supabase RLS", "Multi-Agent"],
                            description: "Generative project-operations platform with dependency-graph multi-agent orchestration"
                        }
                    ],
                    skills: {
                        "Frontend": ["Three.js", "React Three Fiber", "GSAP", "GLSL Shaders", "Next.js"],
                        "Backend": ["Node.js", "Python/FastAPI", "Supabase", "PostgreSQL", "Redis"],
                        "Design": ["Figma", "Design Systems", "UI/UX Strategy", "Motion Design"],
                        "AI & Automation": ["n8n", "AI Agents", "RAG Pipelines", "LLM Orchestration"]
                    },
                    education: [
                        {
                            school: "Western Sydney University",
                            degree: "BIS Information Systems",
                            year: "2024"
                        },
                        {
                            school: "TAFE NSW",
                            degree: "Diploma IT",
                            year: "2021"
                        }
                    ]
                };

                portfolioData = portfolioJSON;

                // Auto-populate master resume field
                masterResumeInput.value = JSON.stringify(portfolioJSON, null, 2);
                masterResumeInput.setAttribute('readonly', 'true');
                masterResumeInput.style.opacity = '0.7';

                portfolioStatus.classList.remove('hidden');
                log('Portfolio data loaded successfully', 'success');

            } catch (err) {
                log('Failed to load portfolio data', 'error');
                console.error(err);
                e.target.checked = false;
            }

        } else {
            // Disable portfolio mode
            portfolioData = null;
            masterResumeInput.value = '';
            masterResumeInput.removeAttribute('readonly');
            masterResumeInput.style.opacity = '1';
            portfolioStatus.classList.add('hidden');
            log('Portfolio mode disabled', 'info');
        }
    });

    // Helper: Logger (Dev Mode)
    function log(message, type = 'info') {
        const line = document.createElement('div');
        line.className = 'log-entry';
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        line.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg ${type}">${message}</span>`;
        logsContainer.appendChild(line);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // Helper: Activate Node
    function activateNode(id) {
        document.querySelectorAll('.node').forEach(n => n.classList.remove('active'));
        const node = document.getElementById(id);
        if (node) node.classList.add('active');
    }

    // Helper: Build Executive Resume + Cover Letter
    function renderResume(data) {
        const { header, summary, skills, experience, education, projects, coverLetter } = data.resume;

        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Skills Grid - Original Format
        const skillsHTML = Object.entries(skills).map(([cat, list]) => `
            <div class="res-skill-row">
                <span class="res-skill-cat">${cat.toUpperCase()}:</span>
                <span>${list.join(', ')}</span>
            </div>
        `).join('');

        // Experience - Original Format
        const expHTML = experience.map(job => `
            <div class="res-job">
                <div class="res-job-header">
                    <div>
                        <span class="res-company">${job.company}</span> — <span class="res-role">${job.role}</span>
                    </div>
                    <span class="res-date">${job.period}</span>
                </div>
                <ul>
                    ${job.bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
            </div>
        `).join('');

        // Education - Original Format
        const eduHTML = education.map(edu => `
            <div class="res-job-header">
                <div><span class="res-company">${edu.school}</span></div>
                <span class="res-date">${edu.year}</span>
            </div>
            <div>${edu.degree}</div>
        `).join('');

        // Projects - Original Format
        const projHTML = projects ? projects.map(p => `
            <div class="res-job" style="margin-bottom:0.8rem">
                 <div class="res-job-header">
                    <span class="res-company">${p.name}</span>
                    <span class="res-date" style="font-size:0.75rem">${p.tech.join(' | ')}</span>
                </div>
                <div style="font-size:0.9rem; margin-top:0.2rem">${p.description}</div>
            </div>
        `).join('') : '';

        // Cover Letter (if generated by AI)
        const coverLetterHTML = coverLetter ? `
            <div class="cover-letter-page">
                <div class="cover-header">
                    <div class="cover-sender">
                        <div class="cover-sender-name">${header.name}</div>
                        <div>${header.contact.email}</div>
                        <div>${header.contact.location}</div>
                    </div>
                    <div class="cover-date">${today}</div>
                </div>
                
                <div class="cover-recipient">
                    <div class="cover-recipient-name">Hiring Manager</div>
                    <div>Talent Acquisition Team</div>
                </div>

                <div class="cover-salutation">Dear Hiring Team,</div>

                <div class="cover-body">
                    ${coverLetter.split('\n\n').map(para => `<p>${para}</p>`).join('')}
                </div>

                <div class="cover-closing">
                    <div>Sincerely,</div>
                    <div class="cover-signature">
                        <div class="cover-signature-name">${header.name}</div>
                    </div>
                </div>
            </div>
        ` : '';

        // FULL DOCUMENT: Cover Letter + Executive Resume
        resumeDocument.innerHTML = `
            ${coverLetterHTML}
            
            <div class="resume-page">
                <header class="res-header">
                    <h1 class="res-name">${header.name}</h1>
                    <span class="res-title">${header.title}</span>
                    <div class="res-contact">
                        <span>${header.contact.email}</span>
                        <span>${header.contact.linkedin}</span>
                        <span>${header.contact.location}</span>
                        <span>${header.contact.portfolio}</span>
                    </div>
                </header>

                <section class="res-section">
                    <p class="res-summary"><strong>Professional Summary:</strong> ${summary}</p>
                </section>

                <section class="res-section">
                    <div class="res-section-title">Technical Expertise</div>
                    <div class="res-skills-grid">
                        ${skillsHTML}
                    </div>
                </section>

                <section class="res-section">
                    <div class="res-section-title">Professional Experience</div>
                    ${expHTML}
                </section>

                ${projHTML ? `
                <section class="res-section">
                    <div class="res-section-title">Key Projects</div>
                    ${projHTML}
                </section>
                ` : ''}

                <section class="res-section">
                    <div class="res-section-title">Education</div>
                    ${eduHTML}
                </section>
            </div>
        `;

        resumeDocument.classList.remove('hidden');
    }

    // MAIN HANDLER
    igniteBtn.addEventListener('click', async () => {
        const jd = jobDescriptionInput.value.trim();
        const resume = masterResumeInput.value.trim();
        const aggression = aggressionLevelInput.value;
        const modelModel = document.getElementById('model-selector').value;

        if (!jd || !resume) {
            log('ERROR: Missing Inputs.', 'error');
            return;
        }

        // Reset UI
        document.querySelector('.agent-diagram').style.display = 'block';
        resumeDocument.classList.add('hidden');
        downloadPdfBtn.classList.add('disabled');
        statusLabel.textContent = 'PROCESSING';
        statusLabel.className = 'ctrl-value';

        logsContainer.innerHTML = '';
        log('═══════════════════════════════════════', 'info');
        log('WORKFLOW INITIALIZATION SEQUENCE', 'info');
        log('═══════════════════════════════════════', 'info');
        activateNode('node-input');

        try {
            // ═══ PHASE 1: INPUT VECTORIZATION ═══
            log('', 'info');
            log('→ PHASE 1: INPUT VECTORIZATION', 'process');
            log('  ├─ Parsing job description corpus...', 'info');
            await new Promise(r => setTimeout(r, 300));
            log('  ├─ Extracting requirements matrix (skills, experience, domain)', 'info');
            await new Promise(r => setTimeout(r, 300));
            log('  ├─ Tokenizing key phrases and competencies', 'info');
            await new Promise(r => setTimeout(r, 200));
            log('  └─ Vector embedding complete. Dimensionality: 768', 'success');

            // ═══ PHASE 2: GAP ANALYSIS ═══
            activateNode('node-analyze');
            log('', 'info');
            log('→ PHASE 2: COMPETENCY GAP ANALYSIS', 'process');
            log('  ├─ Loading candidate master profile...', 'info');
            await new Promise(r => setTimeout(r, 200));
            log('  ├─ Mapping career history to requirements', 'info');
            log(`  ├─ Strategy Mode: ${aggression.toUpperCase()}`, 'info');
            await new Promise(r => setTimeout(r, 300));
            log('  ├─ Identifying alignment opportunities', 'info');
            log('  ├─ Calculating semantic similarity scores', 'info');
            await new Promise(r => setTimeout(r, 200));
            log('  └─ Gap analysis matrix generated', 'success');

            // ═══ PHASE 3: STRATEGY SYNTHESIS ═══
            activateNode('node-strategy');
            log('', 'info');
            log('→ PHASE 3: NARRATIVE STRATEGY SYNTHESIS', 'process');
            const modelName = modelModel.includes('pro') ? 'Gemini 3.0 Pro (Reasoning)' : 'Gemini 3.0 Flash (Speed)';
            log(`  ├─ Initializing LLM: ${modelName}`, 'info');
            await new Promise(r => setTimeout(r, 200));
            log('  ├─ Constructing optimization prompt...', 'info');
            log('  ├─ Dispatching inference request to Gemini API', 'process');

            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobDescription: jd,
                    masterResume: resume,
                    aggressionLevel: aggression,
                    model: modelModel
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'API Connection Failed');
            }

            const result = await response.json();
            log('  ├─ Response received. Parsing strategic recommendations...', 'success');

            if (result.analysis) {
                log(`  ├─ Match Confidence Score: ${result.analysis.matchScore}%`, 'process');
            }

            log('  ├─ Extracting optimized bullet points', 'info');
            log('  ├─ Tailoring experience narratives', 'info');
            log('  └─ Strategy synthesis complete', 'success');

            // ═══ PHASE 4: ARTIFACT GENERATION ═══
            activateNode('node-synth');
            log('', 'info');
            log('→ PHASE 4: ARTIFACT GENERATION', 'process');
            log('  ├─ Compiling structured resume data...', 'info');
            await new Promise(r => setTimeout(r, 300));
            log('  ├─ Applying executive formatting templates', 'info');
            log('  ├─ Injecting optimized content into A4 layout', 'info');
            await new Promise(r => setTimeout(r, 200));
            log('  ├─ Rendering professional typography (Times New Roman / Helvetica)', 'info');
            log('  └─ Document generation complete', 'success');

            // Render
            renderResume(result);

            // ═══ WORKFLOW COMPLETE ═══
            document.querySelector('.agent-diagram').style.display = 'none';
            downloadPdfBtn.classList.remove('disabled');
            statusLabel.textContent = 'READY';
            statusLabel.className = 'ctrl-value ready';

            log('', 'info');
            log('═══════════════════════════════════════', 'success');
            log('✓ WORKFLOW COMPLETE - ARTIFACT READY', 'success');
            log('═══════════════════════════════════════', 'success');
            log('', 'info');
            log('System Status: EXPORT_ENABLED', 'info');

        } catch (err) {
            log('', 'error');
            log('✗ CRITICAL FAILURE IN WORKFLOW', 'error');
            log(`  Error: ${err.message}`, 'error');
            console.error(err);
            statusLabel.textContent = 'ERROR';
            statusLabel.className = 'ctrl-value';
        }
    });

    // --- UI CONTROLS --- //

    // Zoom Logic
    let currentScale = 0.85;
    const zoomLevelDisplay = document.getElementById('zoom-level');

    const updateZoom = () => {
        resumeDocument.style.transform = `scale(${currentScale})`;
        zoomLevelDisplay.textContent = `${Math.round(currentScale * 100)}%`;
    };

    document.getElementById('zoom-in').addEventListener('click', () => {
        if (currentScale < 1.5) {
            currentScale += 0.1;
            updateZoom();
        }
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        if (currentScale > 0.4) {
            currentScale -= 0.1;
            updateZoom();
        }
    });

    document.getElementById('fit-view').addEventListener('click', () => {
        currentScale = 0.85;
        updateZoom();
    });

    // PDF Export Logic (Scan & Save)
    downloadPdfBtn.addEventListener('click', () => {
        const scanBeam = document.getElementById('scan-beam');
        const element = document.getElementById('resume-document');

        if (downloadPdfBtn.classList.contains('disabled')) return;

        // 1. Scan Effect
        statusLabel.textContent = 'EXPORTING...';
        statusLabel.style.color = '#00FF9D';
        scanBeam.classList.add('scanning');

        setTimeout(() => {
            // 2. Prepare Capture
            const originalTransform = element.style.transform;
            const originalShadow = element.style.boxShadow;

            element.style.transform = 'none';
            element.style.boxShadow = 'none';
            element.style.margin = '0';

            const opt = {
                margin: 0,
                filename: 'Optimized_Resume.pdf',
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: { scale: 3, useCORS: true, letterRendering: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // 3. Generate
            html2pdf().set(opt).from(element).save().then(() => {
                // Restore
                element.style.transform = originalTransform;
                element.style.boxShadow = originalShadow;
                element.style.margin = '';

                scanBeam.classList.remove('scanning');
                statusLabel.textContent = 'READY';
                statusLabel.className = 'ctrl-value ready';

                log('PDF Export Complete', 'success');
            }).catch(err => {
                console.error(err);
                element.style.transform = originalTransform;
                element.style.boxShadow = originalShadow;
                element.style.margin = '';
                scanBeam.classList.remove('scanning');
                statusLabel.textContent = 'ERROR';
                statusLabel.className = 'ctrl-value';
                log('Export Failed', 'error');
            });

        }, 1500); // Wait for scan animation
    });

});
