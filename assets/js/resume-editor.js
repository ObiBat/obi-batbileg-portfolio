/**
 * ============================================
 * RESUM8 STUDIO - Advanced Resume Editor
 * Full-featured Resume Playground & Generator
 * ============================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===========================================
    // DOM ELEMENT REFERENCES
    // ===========================================
    const appContainer = document.getElementById('app-container');
    const igniteBtn = document.getElementById('ignite-btn');
    const jobDescriptionInput = document.getElementById('job-description');
    const masterResumeInput = document.getElementById('master-resume');
    const aggressionLevelInput = document.getElementById('aggression-level');
    const logsContainer = document.getElementById('agent-logs');
    const resumeDocument = document.getElementById('resume-document');
    const statusLabel = document.getElementById('sys-status');
    const portfolioModeToggle = document.getElementById('portfolio-mode');
    const portfolioStatus = document.getElementById('portfolio-status');
    const consoleSection = document.getElementById('console-section');
    const consoleToggle = document.getElementById('console-toggle');
    const agentDiagram = document.getElementById('agent-diagram');
    const inlineToolbar = document.getElementById('inline-toolbar');
    const historyCount = document.getElementById('history-count');

    // ===========================================
    // STATE MANAGEMENT
    // ===========================================
    let portfolioData = null;
    let currentScale = 0.85;
    let isEditMode = false;
    let currentResumeData = null;
    let undoStack = [];
    let redoStack = [];
    const MAX_HISTORY = 50;



    // Style State (Compact defaults for single-page fit)
    let styleState = {
        template: 'executive',
        fontSystem: 'tech-modern',
        accentColor: '#00FF9D',
        headingFont: "'Outfit', sans-serif",
        bodyFont: "'Inter', sans-serif",
        fontScale: 95,
        lineHeight: 140,
        headerSpacing: 80,
        sectionSpacing: 80,
        bulletSpacing: 80,
        marginSize: 'compact'
    };

    // ===========================================
    // MODE TABS SYSTEM (UPDATED FOR RAIL)
    // ===========================================
    const modeTabs = document.querySelectorAll('.rail-btn');
    const panelContents = document.querySelectorAll('.panel-content');
    const panelTitle = document.getElementById('panel-title');

    const MODE_TITLES = {
        'generate': 'GENERATION_ENGINE',
        'edit': 'EDITOR_CORE',
        'style': 'AESTHETICS_LAB',
        'analyze': 'INTELLIGENCE_UNIT'
    };

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.mode;

            // Update tab states
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding panel
            panelContents.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `${mode}-panel`) {
                    panel.classList.add('active');
                }
            });

            // Update Title
            if (panelTitle && MODE_TITLES[mode]) {
                panelTitle.textContent = MODE_TITLES[mode];
            }

            log(`Switched to ${mode.toUpperCase()} mode`, 'info');
        });
    });

    // ===========================================
    // CONSOLE TOGGLE
    // ===========================================
    consoleToggle.addEventListener('click', () => {
        consoleSection.classList.toggle('collapsed');
    });

    // ===========================================
    // MOBILE DRAWER NAVIGATION
    // ===========================================
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const drawerBackdrop = document.getElementById('drawer-backdrop');
    const sidebarRail = document.querySelector('.sidebar-rail');

    function openMobileDrawer() {
        sidebarRail?.classList.add('open');
        drawerBackdrop?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileDrawer() {
        sidebarRail?.classList.remove('open');
        drawerBackdrop?.classList.remove('active');
        document.body.style.overflow = '';
    }

    mobileMenuToggle?.addEventListener('click', () => {
        if (sidebarRail?.classList.contains('open')) {
            closeMobileDrawer();
        } else {
            openMobileDrawer();
        }
    });

    drawerBackdrop?.addEventListener('click', closeMobileDrawer);

    // Close drawer when a nav button is clicked (mobile)
    document.querySelectorAll('.rail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                closeMobileDrawer();
            }
        });
    });

    // ===========================================
    // EXPAND/COLLAPSE EDITOR
    // ===========================================
    const expandBtn = document.getElementById('expand-editor-btn');
    const sidebarToggleBar = document.getElementById('sidebar-toggle-bar');

    function toggleSidebar() {
        appContainer.classList.toggle('editor-expanded');
        const isExpanded = appContainer.classList.contains('editor-expanded');

        log(isExpanded ? 'Editor expanded to fullscreen' : 'Editor restored', 'info');

        // Update icon state if needed
        if (sidebarToggleBar) {
            sidebarToggleBar.style.color = isExpanded ? '#00FF9D' : '';
            sidebarToggleBar.style.borderColor = isExpanded ? '#00FF9D' : '#333';
        }
    }

    if (expandBtn) expandBtn.addEventListener('click', toggleSidebar);
    if (sidebarToggleBar) sidebarToggleBar.addEventListener('click', toggleSidebar);

    // ===========================================
    // LOGGING SYSTEM
    // ===========================================
    function log(message, type = 'info') {
        const line = document.createElement('div');
        line.className = 'log-entry';
        const time = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        line.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg ${type}">${message}</span>`;
        logsContainer.appendChild(line);
        logsContainer.scrollTop = logsContainer.scrollHeight;

        // Expand console on important messages
        if (type === 'error' || type === 'success') {
            consoleSection.classList.remove('collapsed');
        }
    }

    // ===========================================
    // NODE ACTIVATION
    // ===========================================
    function activateNode(id) {
        document.querySelectorAll('.node').forEach(n => n.classList.remove('active'));
        const node = document.getElementById(id);
        if (node) node.classList.add('active');
    }

    // ===========================================
    // HISTORY MANAGEMENT (Undo/Redo)
    // ===========================================
    function saveToHistory() {
        if (!currentResumeData) return;

        undoStack.push(JSON.stringify(currentResumeData));
        if (undoStack.length > MAX_HISTORY) {
            undoStack.shift();
        }
        redoStack = []; // Clear redo on new action
        updateHistoryUI();
    }

    function undo() {
        if (undoStack.length === 0) return;

        redoStack.push(JSON.stringify(currentResumeData));
        currentResumeData = JSON.parse(undoStack.pop());
        renderResume(currentResumeData);
        updateHistoryUI();
        log('Undo applied', 'info');
    }

    function redo() {
        if (redoStack.length === 0) return;

        undoStack.push(JSON.stringify(currentResumeData));
        currentResumeData = JSON.parse(redoStack.pop());
        renderResume(currentResumeData);
        updateHistoryUI();
        log('Redo applied', 'info');
    }

    function updateHistoryUI() {
        historyCount.textContent = `${undoStack.length} / ${MAX_HISTORY}`;
        document.getElementById('undo-btn').disabled = undoStack.length === 0;
        document.getElementById('redo-btn').disabled = redoStack.length === 0;
    }

    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        }
    });

    // ===========================================
    // PORTFOLIO MODE
    // ===========================================
    portfolioModeToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
            log('Fetching portfolio data...', 'process');

            try {
                // Fetch and Parse portfolio.html (Force fresh load)
                const response = await fetch(`portfolio.html?t=${Date.now()}`);
                const htmlText = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');

                log('Parsing portfolio contexts...', 'info');

                // 1. EXTRACT DATA LAYERS

                // Projects (Skip intro item)
                const projects = Array.from(doc.querySelectorAll('.project-item')).slice(1).map(item => {
                    return {
                        name: item.querySelector('.project-heading')?.textContent.trim(),
                        tech: Array.from(item.querySelectorAll('.tech-tag')).map(t => t.textContent.trim()),
                        description: item.querySelector('.project-info p')?.textContent.trim(),
                        context: {
                            role: item.querySelectorAll('.project-meta span')[0]?.textContent.trim(),
                            year: item.querySelectorAll('.project-meta span')[1]?.textContent.trim(),
                            category: item.querySelector('.project-number')?.textContent.trim()
                        }
                    };
                }).filter(p => p.name);

                // Experience
                const experience = Array.from(doc.querySelectorAll('#experience .journey-row')).map(row => {
                    return {
                        company: row.querySelector('.journey-company')?.textContent.trim(),
                        role: row.querySelector('.journey-role')?.textContent.trim(),
                        period: row.querySelector('.journey-time')?.textContent.trim(),
                        bullets: Array.from(row.querySelectorAll('ul li')).map(li => li.textContent.trim().replace(/^\+\s*/, ''))
                    };
                });

                // Skills / Capabilities
                const skills = {};
                doc.querySelectorAll('.capability-card').forEach(card => {
                    const catHeader = card.querySelector('.cap-header span:nth-child(2)')?.textContent.trim() || "General";
                    // Normalize category names for JSON (e.g. "SYSTEM ARCHITECTURE" -> "System_Architecture")
                    const catKey = catHeader
                        .toLowerCase()
                        .split(' ')
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                        .join('_');

                    const tags = Array.from(card.querySelectorAll('.cap-tag')).map(t => t.textContent.trim());
                    skills[catKey] = tags;
                });

                // Education
                const education = Array.from(doc.querySelectorAll('#education .journey-row')).map(row => {
                    return {
                        school: row.querySelector('.journey-company')?.textContent.trim(),
                        degree: row.querySelector('.journey-role')?.textContent.trim(),
                        year: row.querySelector('.journey-time')?.textContent.trim()
                    };
                });

                // Branding / Summary
                const summary = doc.querySelector('.hero-description').textContent.trim();
                const title = doc.querySelector('title').textContent.split('—')[1].trim();

                // Construct Deep Context Object
                const portfolioJSON = {
                    resume: {
                        header: {
                            name: "Obi Batbileg",
                            title: title,
                            contact: {
                                email: "obi@craefto.com",
                                linkedin: "linkedin.com/in/obibatbileg",
                                portfolio: "obibatbileg.com",
                                location: "Sydney, AU"
                            }
                        },
                        summary: summary,
                        branding: {
                            philosophy: summary,
                            values: Object.keys(skills).map(k => k.replace(/_/g, ' '))
                        },
                        skills: skills,
                        experience: experience,
                        education: education,
                        projects: projects
                    }
                };

                portfolioData = portfolioJSON;
                masterResumeInput.value = JSON.stringify(portfolioJSON, null, 2);
                masterResumeInput.setAttribute('readonly', 'true');
                masterResumeInput.style.opacity = '0.7';

                portfolioStatus.classList.remove('hidden');
                log('Full Portfolio Context Loaded', 'success');
                log(`✓ Synced: ${projects.length} Projects, ${education.length} Edu, ${Object.keys(skills).length} Skills`, 'info');


            } catch (err) {
                log('Failed to load portfolio context', 'error');
                console.error(err);
                e.target.checked = false;
            }

        } else {
            portfolioData = null;
            masterResumeInput.value = '';
            masterResumeInput.removeAttribute('readonly');
            masterResumeInput.style.opacity = '1';
            portfolioStatus.classList.add('hidden');
            log('Portfolio mode disabled', 'info');
        }
    });

    // ===========================================
    // RESUME RENDERER
    // ===========================================
    function renderResume(data) {
        // Resume data from data.resume, coverLetter is now a sibling
        const { header, summary, keyHighlights, skills, experience, education, projects } = data.resume;
        const coverLetter = data.coverLetter; // Separate from resume object
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Skills Grid
        const skillsHTML = Object.entries(skills).map(([cat, list]) => `
            <div class="res-skill-row" data-editable="skill-${cat}">
                <span class="res-skill-cat">${cat.replace(/_/g, ' ').toUpperCase()}</span>
                <span class="res-skill-list">${Array.isArray(list) ? list.join(', ') : list}</span>
            </div>
        `).join('');

        // Key Highlights (Executive Summary Addition)
        // Parse markdown: **text** → <strong>text</strong>
        const parseMarkdown = (text) => {
            return text
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                .replace(/__([^_]+)__/g, '<strong>$1</strong>')
                .replace(/_([^_]+)_/g, '<em>$1</em>');
        };

        const highlightsHTML = (keyHighlights && keyHighlights.length > 0) ? `
            <section class="res-section" data-editable="highlights">
                <div class="res-section-title">Key Highlights</div>
                <ul class="res-highlights-list">
                    ${keyHighlights.map(h => `<li>${parseMarkdown(h)}</li>`).join('')}
                </ul>
            </section>
        ` : '';

        // Experience (Formal Letter Style - matches Cover Letter blocks)
        const expHTML = experience.map((job, i) => `
            <div class="res-job" data-editable="experience-${i}">
                <div class="res-job-header">
                    <div class="res-job-main">
                        <span class="res-company">${job.company}</span>
                        <span class="res-role">${job.role}</span>
                    </div>
                    <span class="res-date">${job.period}</span>
                </div>
                <ul>
                    ${job.bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
            </div>
        `).join('');

        // Education (Same formal style)
        const eduHTML = education.map((edu, i) => `
            <div class="res-job" data-editable="education-${i}">
                <div class="res-job-header">
                    <div class="res-job-main">
                        <span class="res-company">${edu.school}</span>
                        <span class="res-role">${edu.degree}</span>
                    </div>
                    <span class="res-date">${edu.year}</span>
                </div>
                ${edu.description ? `<p class="edu-description">${edu.description}</p>` : ''}
            </div>
        `).join('');

        // Projects (Consistent style)
        const projHTML = projects ? projects.map((p, i) => `
            <div class="res-job" data-editable="project-${i}">
                <div class="res-job-header">
                    <div class="res-job-main">
                        <span class="res-company">${p.name}</span>
                        <span class="res-role">${p.tech.join(' • ')}</span>
                    </div>
                </div>
                <p class="edu-description">${p.description}</p>
            </div>
        `).join('') : '';

        // Cover Letter Rendering (Enhanced)
        let coverLetterHTML = '';
        if (coverLetter) {
            const isObj = typeof coverLetter === 'object';
            const recipient = isObj ? coverLetter.recipient : "Hiring Manager";
            const subject = isObj ? coverLetter.subject : `Application for ${header.title}`;
            const opening = isObj ? coverLetter.opening : "";
            const body = isObj ? coverLetter.body : coverLetter;
            const closing = isObj ? coverLetter.closing : "Sincerely,";

            // Helper to strip markdown artifacts
            const cleanMarkdown = (text) => text.replace(/\*\*|__|\*|_/g, '');

            const cleanBody = cleanMarkdown(body);
            const cleanOpening = cleanMarkdown(opening);

            const bodyContent = (typeof cleanBody === 'string' && cleanBody.includes('\n\n')) || (typeof cleanBody === 'string' && !isObj)
                ? cleanBody.split('\n\n').map(p => `<p class="cover-paragraph">${p}</p>`).join('')
                : `<p class="cover-paragraph">${cleanBody}</p>`;

            coverLetterHTML = `
            <div class="cover-letter-page">
                <!-- MODERN HEADER LAYOUT -->
                <div class="cover-header-modern" data-editable="cover-header">
                    <div class="header-left">
                        <div class="cover-sender-name">${header.name}</div>
                        <div class="cover-sender-title">${header.title}</div>
                    </div>
                    <div class="header-right">
                        <div>${header.contact.email}</div>
                        <div>${header.contact.linkedin}</div>
                        <div>${header.contact.location}</div>
                        <div class="cover-meta-date">${today}</div>
                    </div>
                </div>

                <div class="cover-divider"></div>
                
                <div class="cover-recipient-block" data-editable="cover-recipient">
                    <div class="cover-recipient-label">TO:</div>
                    <div>
                        <div class="cover-recipient-name">${recipient}</div>
                        <div class="cover-recipient-role">Talent Acquisition Team</div>
                    </div>
                </div>

                <div class="cover-subject-block" data-editable="cover-subject">
                    <span class="subject-label">SUBJECT:</span>
                    <span class="subject-text">${subject.replace(/RE:\s*/i, '')}</span>
                </div>

                <div class="cover-salutation">Dear ${recipient.split(' ')[0] || "Hiring Team"},</div>

                <div class="cover-body" data-editable="cover-body">
                    ${cleanOpening ? `<p class="cover-opening cover-paragraph"><strong>${cleanOpening}</strong></p>` : ''}
                    ${bodyContent}
                </div>

                <div class="cover-closing" data-editable="cover-closing">
                    <div class="closing-text">${closing}</div>
                    <div class="signature-block">
                        <div class="handwritten-signature">${header.name}</div>
                        <div class="printed-name">${header.name}</div>
                    </div>
                </div>
            </div>`;
        }

        // FULL DOCUMENT
        resumeDocument.innerHTML = `
            ${coverLetterHTML}
            
            <div class="resume-page">
                <header class="res-header" data-editable="header">
                    <div class="header-left">
                        <h1 class="res-name">${header.name}</h1>
                        <span class="res-title">${header.title}</span>
                    </div>
                    <div class="header-right">
                        <div>${header.contact.email}</div>
                        <div>${header.contact.linkedin}</div>
                        <div>${header.contact.location}</div>
                        ${header.contact.portfolio ? `<div>${header.contact.portfolio}</div>` : ''}
                    </div>
                </header>

                <div class="res-divider"></div>

                <section class="res-section" data-editable="summary">
                    <div class="res-section-title">Professional Summary</div>
                    <div class="res-summary">${summary}</div>
                </section>

                ${highlightsHTML}

                <section class="res-section" data-editable="skills">
                    <div class="res-section-title">Technical Skills</div>
                    <div class="res-skills-grid">
                        ${skillsHTML}
                    </div>
                </section>

                <section class="res-section force-page-break" data-editable="experience">
                    <div class="res-section-title">Experience</div>
                    ${expHTML}
                </section>

                ${projHTML ? `
                <section class="res-section force-page-break" data-editable="projects">
                    <div class="res-section-title">Projects</div>
                    ${projHTML}
                </section>
                ` : ''}

                <section class="res-section" data-editable="education">
                    <div class="res-section-title">Education</div>
                    ${eduHTML}
                </section>
            </div>
        `;

        resumeDocument.classList.remove('hidden');
        agentDiagram.style.display = 'none';

        // Apply current styles
        applyStyles();
    }

    // ===========================================
    // MAIN WORKFLOW HANDLER
    // ===========================================
    igniteBtn.addEventListener('click', async () => {
        const jd = jobDescriptionInput.value.trim();
        const resume = masterResumeInput.value.trim();
        const aggression = aggressionLevelInput.value;
        const modelModel = document.getElementById('model-selector').value;

        if (!jd || !resume) {
            log('ERROR: Missing Inputs.', 'error');
            return;
        }

        // BTN STATE: Processing
        igniteBtn.classList.add('processing');
        igniteBtn.textContent = 'PROCESSING...';
        igniteBtn.disabled = true;

        // Reset UI
        agentDiagram.style.display = 'block';
        resumeDocument.classList.add('hidden');
        statusLabel.textContent = 'PROCESSING';
        statusLabel.className = 'ctrl-value';

        logsContainer.innerHTML = '';
        log('═══════════════════════════════════════', 'info');
        log('WORKFLOW INITIALIZATION SEQUENCE', 'info');
        log('═══════════════════════════════════════', 'info');
        activateNode('node-input');

        try {
            // PHASE 1: INPUT VECTORIZATION
            log('', 'info');
            log('→ PHASE 1: INPUT VECTORIZATION', 'process');
            log('  ├─ Parsing job description corpus...', 'info');
            await new Promise(r => setTimeout(r, 300));
            log('  ├─ Extracting requirements matrix', 'info');
            await new Promise(r => setTimeout(r, 300));
            log('  └─ Vector embedding complete', 'success');

            // PHASE 2: GAP ANALYSIS
            activateNode('node-analyze');
            log('', 'info');
            log('→ PHASE 2: COMPETENCY GAP ANALYSIS', 'process');
            log('  ├─ Loading candidate master profile...', 'info');
            await new Promise(r => setTimeout(r, 200));
            log(`  ├─ Strategy Mode: ${aggression.toUpperCase()}`, 'info');
            await new Promise(r => setTimeout(r, 300));
            log('  └─ Gap analysis matrix generated', 'success');

            // PHASE 3: STRATEGY SYNTHESIS
            activateNode('node-strategy');
            log('', 'info');
            log('→ PHASE 3: NARRATIVE STRATEGY SYNTHESIS', 'process');
            const modelName = modelModel.includes('pro') ? 'Gemini 2.0 Pro' : 'Gemini 2.0 Flash'; // Updated to 2.0
            log(`  ├─ Initializing LLM: ${modelName}`, 'info');
            await new Promise(r => setTimeout(r, 200));
            log('  ├─ Dispatching inference request...', 'process');

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
            log('  ├─ Response received', 'success');

            if (result.analysis) {
                log(`  ├─ Match Score: ${result.analysis.matchScore}%`, 'process');
            }
            log('  └─ Strategy synthesis complete', 'success');

            // PHASE 4: ARTIFACT GENERATION
            activateNode('node-synth');
            log('', 'info');
            log('→ PHASE 4: ARTIFACT GENERATION', 'process');
            log('  ├─ Compiling structured resume data...', 'info');
            await new Promise(r => setTimeout(r, 300));
            log('  └─ Document generation complete', 'success');

            // Store data and render
            currentResumeData = result;
            saveToHistory();
            renderResume(result);

            // WORKFLOW COMPLETE
            statusLabel.textContent = 'READY';
            statusLabel.className = 'ctrl-value ready';

            // BTN STATE: Success
            igniteBtn.classList.remove('processing');
            igniteBtn.classList.add('success');
            igniteBtn.textContent = '✓ SUCCESS';

            setTimeout(() => {
                igniteBtn.classList.remove('success');
                igniteBtn.textContent = 'INITIALIZE_WORKFLOW()';
                igniteBtn.disabled = false;
            }, 3000);

            log('', 'info');
            log('═══════════════════════════════════════', 'success');
            log('✓ WORKFLOW COMPLETE - EDITOR READY', 'success');
            log('═══════════════════════════════════════', 'success');
            log('', 'info');
            log('Switch to EDIT tab to customize content', 'info');

            // Automatically switch to editor tab for better UX
            if (window.innerWidth <= 1024) {
                // On mobile, scrolling to preview might be better
                document.getElementById('preview-stage').scrollIntoView({ behavior: 'smooth' });
            }

        } catch (err) {
            log('', 'error');
            log('✗ CRITICAL FAILURE IN WORKFLOW', 'error');
            log(`  Error: ${err.message}`, 'error');
            console.error(err);
            statusLabel.textContent = 'ERROR';
            statusLabel.className = 'ctrl-value';

            // BTN STATE: Error
            igniteBtn.classList.remove('processing');
            igniteBtn.textContent = 'FAILED - RETRY';
            igniteBtn.disabled = false;
        }
    });

    // ===========================================
    // ZOOM CONTROLS
    // ===========================================
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
        if (currentScale > 0.3) {
            currentScale -= 0.1;
            updateZoom();
        }
    });

    document.getElementById('fit-view').addEventListener('click', () => {
        currentScale = 0.85;
        updateZoom();
    });

    // ===========================================
    // EDIT MODE TOGGLE (Enhanced Feedback)
    // ===========================================
    const toggleEditBtn = document.getElementById('toggle-edit-mode');
    // statusLabel is already declared at top of file

    function updateEditModeUI() {
        // Update button appearance
        toggleEditBtn.classList.toggle('active', isEditMode);
        toggleEditBtn.innerHTML = isEditMode
            ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>EDITING`
            : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>EDIT`;

        // Update status indicator
        if (statusLabel) {
            if (isEditMode) {
                statusLabel.textContent = 'EDITING';
                statusLabel.className = 'ctrl-value editing';
            } else {
                statusLabel.textContent = 'READY';
                statusLabel.className = 'ctrl-value ready';
            }
        }

        // Update resume document styling
        resumeDocument.classList.toggle('editing', isEditMode);

        // Add/remove edit mode indicator on viewport
        const viewport = document.getElementById('preview-viewport');
        viewport?.classList.toggle('edit-mode-active', isEditMode);
    }

    toggleEditBtn.addEventListener('click', () => {
        isEditMode = !isEditMode;
        resumeDocument.contentEditable = isEditMode;

        updateEditModeUI();

        if (isEditMode) {
            log('✏️ EDIT MODE ENABLED - Click anywhere on the document to edit', 'success');
            log('  ├─ Select text to see formatting toolbar', 'info');
            log('  ├─ Drag spacing handles (═) to adjust vertical gaps', 'info');
            log('  └─ Changes are auto-saved to history', 'info');
            initSpacingHandles(); // Add draggable spacing handles
        } else {
            saveToHistory(); // Save any pending changes
            removeSpacingHandles(); // Clean up handles
            log('📄 Edit mode disabled - Document locked', 'info');
        }
    });

    // ===========================================
    // VERTICAL SPACING HANDLES (Drag to Resize)
    // ===========================================
    let activeHandle = null;
    let startY = 0;
    let startMargin = 0;
    let spacingTooltip = null;

    function initSpacingHandles() {
        // Remove any existing handles first
        removeSpacingHandles();

        // Create tooltip for showing values
        spacingTooltip = document.createElement('div');
        spacingTooltip.className = 'spacing-tooltip';
        spacingTooltip.style.cssText = `
            position: fixed;
            background: #000;
            color: #00FF9D;
            font-family: var(--font-mono, monospace);
            font-size: 10px;
            padding: 4px 8px;
            border-radius: 3px;
            pointer-events: none;
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(spacingTooltip);

        // Find all section/job elements that can have spacing adjusted
        const spacingTargets = resumeDocument.querySelectorAll(`
            .res-header,
            .res-divider,
            .res-section,
            .res-job,
            .res-highlights-list,
            .cover-header-modern,
            .cover-divider,
            .cover-recipient-block,
            .cover-subject-block,
            .cover-body,
            .cover-closing
        `);

        spacingTargets.forEach((target, index) => {
            // Create handle element
            const handle = document.createElement('div');
            handle.className = 'spacing-handle';
            handle.dataset.index = index;
            handle.innerHTML = '═══';
            handle.style.cssText = `
                position: absolute;
                left: 0;
                right: 0;
                bottom: -4px;
                height: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: ns-resize;
                color: rgba(0, 255, 157, 0.4);
                font-size: 8px;
                letter-spacing: 2px;
                opacity: 0;
                transition: opacity 0.2s, color 0.2s;
                z-index: 100;
                user-select: none;
            `;

            // Make target relative for handle positioning
            const computedStyle = window.getComputedStyle(target);
            if (computedStyle.position === 'static') {
                target.style.position = 'relative';
            }

            // Add hover effects
            target.addEventListener('mouseenter', () => {
                if (isEditMode) handle.style.opacity = '1';
            });
            target.addEventListener('mouseleave', () => {
                if (!activeHandle) handle.style.opacity = '0';
            });

            // Drag start
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                activeHandle = { element: target, handle };
                startY = e.clientY;
                startMargin = parseInt(window.getComputedStyle(target).marginBottom) || 0;
                handle.style.color = '#00FF9D';
                handle.style.opacity = '1';
                document.body.style.cursor = 'ns-resize';

                // Show tooltip
                updateSpacingTooltip(e.clientX, e.clientY, startMargin);
            });

            target.appendChild(handle);
        });

        // Global mouse move
        document.addEventListener('mousemove', handleSpacingDrag);
        document.addEventListener('mouseup', handleSpacingDragEnd);
    }

    function handleSpacingDrag(e) {
        if (!activeHandle) return;

        const deltaY = e.clientY - startY;
        // Allow extreme negative margins (-50px) for maximum compression, max 200px
        const newMargin = Math.max(-50, Math.min(200, startMargin + deltaY));
        activeHandle.element.style.marginBottom = `${newMargin}px`;

        // Update tooltip with visual indicator for negative values
        updateSpacingTooltip(e.clientX, e.clientY, newMargin);
    }

    function handleSpacingDragEnd() {
        if (!activeHandle) return;

        activeHandle.handle.style.color = 'rgba(0, 255, 157, 0.4)';
        activeHandle.handle.style.opacity = '0';
        document.body.style.cursor = '';
        activeHandle = null;

        // Hide tooltip
        if (spacingTooltip) spacingTooltip.style.display = 'none';

        // Save changes
        saveToHistory();
    }

    function updateSpacingTooltip(x, y, value) {
        if (!spacingTooltip) return;
        spacingTooltip.textContent = `${Math.round(value)}px`;
        spacingTooltip.style.left = `${x + 15}px`;
        spacingTooltip.style.top = `${y - 10}px`;
        spacingTooltip.style.display = 'block';
    }

    function removeSpacingHandles() {
        // Remove all handles
        document.querySelectorAll('.spacing-handle').forEach(h => h.remove());

        // Remove tooltip
        if (spacingTooltip) {
            spacingTooltip.remove();
            spacingTooltip = null;
        }

        // Remove event listeners
        document.removeEventListener('mousemove', handleSpacingDrag);
        document.removeEventListener('mouseup', handleSpacingDragEnd);
    }

    // ===========================================
    // INLINE EDITING TOOLBAR
    // ===========================================
    document.addEventListener('selectionchange', () => {
        if (!isEditMode) {
            inlineToolbar.classList.add('hidden');
            return;
        }

        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.isCollapsed) {
            inlineToolbar.classList.add('hidden');
            return;
        }

        // Check if selection is within resume document
        const range = selection.getRangeAt(0);
        if (!resumeDocument.contains(range.commonAncestorContainer)) {
            inlineToolbar.classList.add('hidden');
            return;
        }

        // Position toolbar
        const rect = range.getBoundingClientRect();
        inlineToolbar.style.left = `${rect.left + rect.width / 2 - 100}px`;
        inlineToolbar.style.top = `${rect.top - 50}px`;
        inlineToolbar.classList.remove('hidden');
    });

    // Toolbar commands
    inlineToolbar.querySelectorAll('button[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            document.execCommand(command, false, null);
            saveToHistory();
        });
    });

    // ===========================================
    // DRAG & DROP SECTION REORDERING
    // ===========================================
    const sectionList = document.getElementById('section-list');
    let draggedItem = null;

    sectionList.querySelectorAll('.section-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
            document.querySelectorAll('.section-item').forEach(i => i.classList.remove('drag-over'));
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (item !== draggedItem) {
                item.classList.add('drag-over');
            }
        });

        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (item !== draggedItem) {
                const allItems = [...sectionList.querySelectorAll('.section-item')];
                const draggedIndex = allItems.indexOf(draggedItem);
                const targetIndex = allItems.indexOf(item);

                if (draggedIndex < targetIndex) {
                    item.after(draggedItem);
                } else {
                    item.before(draggedItem);
                }

                log('Section order updated', 'info');
                // TODO: Apply section order to resume render
            }
        });
    });

    // Section Edit Buttons
    document.querySelectorAll('.section-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.closest('.section-item').dataset.section;
            openSectionEditor(section);
        });
    });

    // ===========================================
    // SECTION EDITOR MODAL
    // ===========================================
    const modal = document.getElementById('section-editor-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const closeModal = document.getElementById('close-modal');
    const applyChanges = document.getElementById('apply-changes');

    function openSectionEditor(section) {
        if (!currentResumeData) {
            log('Generate a resume first before editing', 'error');
            return;
        }

        modalTitle.textContent = `Edit ${section.charAt(0).toUpperCase() + section.slice(1)}`;

        // Generate form based on section
        let formHTML = '';
        const data = currentResumeData.resume;

        switch (section) {
            case 'header':
                formHTML = `
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" id="edit-name" value="${data.header.name}" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="edit-title" value="${data.header.title}" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="edit-email" value="${data.header.contact.email}" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>LinkedIn</label>
                        <input type="text" id="edit-linkedin" value="${data.header.contact.linkedin}" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Portfolio</label>
                        <input type="text" id="edit-portfolio" value="${data.header.contact.portfolio}" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="edit-location" value="${data.header.contact.location}" class="form-input">
                    </div>
                `;
                break;
            case 'summary':
                formHTML = `
                    <div class="form-group">
                        <label>Professional Summary</label>
                        <textarea id="edit-summary" class="form-textarea">${data.summary}</textarea>
                    </div>
                `;
                break;
            case 'skills':
                formHTML = Object.entries(data.skills).map(([cat, skills]) => `
                    <div class="form-group">
                        <label>${cat}</label>
                        <input type="text" data-category="${cat}" value="${skills.join(', ')}" class="form-input skill-input">
                    </div>
                `).join('');
                break;
            case 'experience':
                formHTML = data.experience.map((exp, i) => `
                    <div class="experience-block" data-index="${i}">
                        <div class="form-group">
                            <label>Company</label>
                            <input type="text" data-field="company" value="${exp.company}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <input type="text" data-field="role" value="${exp.role}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Period</label>
                            <input type="text" data-field="period" value="${exp.period}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Achievements (one per line)</label>
                            <textarea data-field="bullets" class="form-textarea">${exp.bullets.join('\n')}</textarea>
                        </div>
                    </div>
                `).join('<hr style="border-color: #333; margin: 1rem 0;">');
                break;
            case 'projects':
                formHTML = (data.projects || []).map((proj, i) => `
                    <div class="project-block" data-index="${i}">
                        <div class="form-group">
                            <label>Project Name</label>
                            <input type="text" data-field="name" value="${proj.name}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Technologies (comma separated)</label>
                            <input type="text" data-field="tech" value="${proj.tech.join(', ')}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea data-field="description" class="form-textarea">${proj.description}</textarea>
                        </div>
                    </div>
                `).join('<hr style="border-color: #333; margin: 1rem 0;">');
                break;
            case 'education':
                formHTML = data.education.map((edu, index) => `
                    <div class="education-block" data-index="${index}">
                        <div class="form-group">
                            <label>School</label>
                            <input type="text" data-field="school" value="${edu.school}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Degree</label>
                            <input type="text" data-field="degree" value="${edu.degree}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Year</label>
                            <input type="text" data-field="year" value="${edu.year}" class="form-input">
                        </div>
                        <div class="form-group">
                             <div style="display:flex; justify-content:space-between; align-items:center;">
                                <label>Description (Optional context)</label>
                                ${aiBtn(`edu-desc-${index}`)}
                            </div>
                            <textarea data-field="description" id="edu-desc-${index}" class="form-textarea" style="height:80px">${edu.description || ''}</textarea>
                        </div>
                    </div>
                `).join('<hr style="border-color: #333; margin: 1rem 0;">');
                break;
        }

        modalContent.innerHTML = formHTML;
        modal.classList.remove('hidden');
        modal.dataset.section = section;

        // Add form styles
        addFormStyles();

        // Attach AI Button Listeners
        document.querySelectorAll('.mini-ai-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                const targetInput = document.getElementById(targetId);
                if (targetInput) {
                    popupOriginal.textContent = targetInput.value;
                    aiPopup.classList.remove('hidden');
                    document.querySelector('.rewritten-text').classList.add('hidden');
                    aiPopup.dataset.targetId = targetId;
                }
            });
        });
    }

    function addFormStyles() {
        if (document.getElementById('form-styles')) return;

        const style = document.createElement('style');
        style.id = 'form-styles';
        style.textContent = `
            .form-group {
                margin-bottom: 1rem;
            }
            .form-group label {
                display: block;
                color: #999;
                font-size: 0.75rem;
                margin-bottom: 0.4rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .form-input, .form-textarea {
                width: 100%;
                background: #1a1a1a;
                border: 1px solid #333;
                color: #fff;
                padding: 10px 12px;
                font-family: var(--font-mono);
                font-size: 0.85rem;
                border-radius: 6px;
                transition: border-color 0.2s;
            }
            .form-input:focus, .form-textarea:focus {
                border-color: #00FF9D;
                outline: none;
            }
            .form-textarea {
                min-height: 100px;
                resize: vertical;
            }
        `;
        document.head.appendChild(style);
    }

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    applyChanges.addEventListener('click', () => {
        const section = modal.dataset.section;
        saveToHistory();

        switch (section) {
            case 'header':
                currentResumeData.resume.header.name = document.getElementById('edit-name').value;
                currentResumeData.resume.header.title = document.getElementById('edit-title').value;
                currentResumeData.resume.header.contact.email = document.getElementById('edit-email').value;
                currentResumeData.resume.header.contact.linkedin = document.getElementById('edit-linkedin').value;
                currentResumeData.resume.header.contact.portfolio = document.getElementById('edit-portfolio').value;
                currentResumeData.resume.header.contact.location = document.getElementById('edit-location').value;
                break;
            case 'summary':
                currentResumeData.resume.summary = document.getElementById('edit-summary').value;
                break;
            case 'skills':
                document.querySelectorAll('.skill-input').forEach(input => {
                    const cat = input.dataset.category;
                    currentResumeData.resume.skills[cat] = input.value.split(',').map(s => s.trim());
                });
                break;
            case 'experience':
                document.querySelectorAll('.experience-block').forEach(block => {
                    const i = parseInt(block.dataset.index);
                    currentResumeData.resume.experience[i].company = block.querySelector('[data-field="company"]').value;
                    currentResumeData.resume.experience[i].role = block.querySelector('[data-field="role"]').value;
                    currentResumeData.resume.experience[i].period = block.querySelector('[data-field="period"]').value;
                    currentResumeData.resume.experience[i].bullets = block.querySelector('[data-field="bullets"]').value.split('\n').filter(b => b.trim());
                });
                break;
            case 'projects':
                document.querySelectorAll('.project-block').forEach(block => {
                    const i = parseInt(block.dataset.index);
                    currentResumeData.resume.projects[i].name = block.querySelector('[data-field="name"]').value;
                    currentResumeData.resume.projects[i].tech = block.querySelector('[data-field="tech"]').value.split(',').map(t => t.trim());
                    currentResumeData.resume.projects[i].description = block.querySelector('[data-field="description"]').value;
                });
                break;
            case 'education':
                document.querySelectorAll('.education-block').forEach(block => {
                    const i = parseInt(block.dataset.index);
                    currentResumeData.resume.education[i].school = block.querySelector('[data-field="school"]').value;
                    currentResumeData.resume.education[i].degree = block.querySelector('[data-field="degree"]').value;
                    currentResumeData.resume.education[i].year = block.querySelector('[data-field="year"]').value;
                    currentResumeData.resume.education[i].description = block.querySelector('[data-field="description"]').value;
                });
                break;
        }

        renderResume(currentResumeData);
        modal.classList.add('hidden');
        log(`${section.charAt(0).toUpperCase() + section.slice(1)} updated`, 'success');
    });

    // ===========================================
    // STYLE PANEL CONTROLS (V3 - Professional)
    // ===========================================

    // Professional Font Systems (curated pairings)
    const FONT_SYSTEMS = {
        'tech-modern': {
            name: 'Tech Modern',
            headingFont: "'Outfit', sans-serif",
            bodyFont: "'Inter', sans-serif"
        },
        'executive': {
            name: 'Executive',
            headingFont: "Georgia, serif",
            bodyFont: "Helvetica, Arial, sans-serif"
        },
        'classic': {
            name: 'Classic Editorial',
            headingFont: "'Times New Roman', serif",
            bodyFont: "Georgia, serif"
        },
        'minimal': {
            name: 'Minimal',
            headingFont: "'Inter', sans-serif",
            bodyFont: "'Inter', sans-serif"
        },
        'bold': {
            name: 'Bold Statement',
            headingFont: "'Space Grotesk', sans-serif",
            bodyFont: "'Outfit', sans-serif"
        },
        'custom': {
            name: 'Custom',
            headingFont: null, // Use manual selection
            bodyFont: null
        }
    };

    // Default style state (COMPACT by default for single-page fit)
    const DEFAULT_STYLE_STATE = {
        template: 'executive',
        fontSystem: 'tech-modern',
        accentColor: '#00FF9D',
        headingFont: "'Outfit', sans-serif",
        bodyFont: "'Inter', sans-serif",
        fontScale: 95,
        lineHeight: 140,
        headerSpacing: 80,
        sectionSpacing: 80,
        bulletSpacing: 80,
        marginSize: 'compact'
    };

    // Quick Presets (Ultra-compact to Spacious)
    const QUICK_PRESETS = {
        compact: {
            fontScale: 85,
            lineHeight: 125,
            headerSpacing: 60,
            sectionSpacing: 60,
            bulletSpacing: 60,
            marginSize: 'tight'
        },
        standard: {
            fontScale: 95,
            lineHeight: 140,
            headerSpacing: 80,
            sectionSpacing: 80,
            bulletSpacing: 80,
            marginSize: 'compact'
        },
        spacious: {
            fontScale: 105,
            lineHeight: 160,
            headerSpacing: 120,
            sectionSpacing: 120,
            bulletSpacing: 110,
            marginSize: 'normal'
        }
    };

    // Font System Selection
    document.querySelectorAll('.font-system-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const system = btn.dataset.system;
            const fontConfig = FONT_SYSTEMS[system];

            if (fontConfig) {
                styleState.fontSystem = system;

                // Update active state
                document.querySelectorAll('.font-system-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show/hide manual controls
                const manualControls = document.getElementById('manual-font-controls');
                if (system === 'custom') {
                    manualControls?.classList.remove('hidden');
                    // Use current manual selections
                } else {
                    manualControls?.classList.add('hidden');
                    // Apply system fonts
                    styleState.headingFont = fontConfig.headingFont;
                    styleState.bodyFont = fontConfig.bodyFont;

                    // Update manual dropdowns for reference
                    const headingSelect = document.getElementById('heading-font');
                    const bodySelect = document.getElementById('body-font');
                    if (headingSelect) headingSelect.value = fontConfig.headingFont;
                    if (bodySelect) bodySelect.value = fontConfig.bodyFont;
                }

                applyStyles();
                log(`Font System: ${fontConfig.name}`, 'success');
            }
        });
    });

    // Quick Preset Selection
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            const settings = QUICK_PRESETS[preset];

            if (settings) {
                // Apply preset values to styleState
                Object.assign(styleState, settings);

                // Update UI controls to reflect new values
                document.getElementById('font-scale').value = settings.fontScale;
                document.getElementById('font-scale-value').textContent = `${settings.fontScale}%`;
                document.getElementById('line-height').value = settings.lineHeight;
                document.getElementById('line-height-value').textContent = (settings.lineHeight / 100).toFixed(1);
                document.getElementById('header-spacing').value = settings.headerSpacing;
                document.getElementById('header-spacing-value').textContent = `${settings.headerSpacing}%`;
                document.getElementById('section-spacing').value = settings.sectionSpacing;
                document.getElementById('section-spacing-value').textContent = `${settings.sectionSpacing}%`;
                document.getElementById('bullet-spacing').value = settings.bulletSpacing;
                document.getElementById('bullet-spacing-value').textContent = `${settings.bulletSpacing}%`;
                document.getElementById('margin-size').value = settings.marginSize;

                // Update active state
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                applyStyles();
                log(`Applied ${preset.toUpperCase()} preset`, 'success');
            }
        });
    });

    // Template Selection
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            styleState.template = card.dataset.template;
            applyStyles();
            log(`Template: ${card.dataset.template}`, 'info');
        });
    });

    // Color Selection (Preset Swatches)
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            styleState.accentColor = swatch.dataset.color;

            // Sync custom picker
            document.getElementById('custom-color-picker').value = swatch.dataset.color;
            document.getElementById('color-hex-display').textContent = swatch.dataset.color.toUpperCase();

            applyStyles();
            log(`Accent: ${swatch.dataset.color}`, 'info');
        });
    });

    // Custom Color Picker
    document.getElementById('custom-color-picker')?.addEventListener('input', (e) => {
        const color = e.target.value;
        styleState.accentColor = color;
        document.getElementById('color-hex-display').textContent = color.toUpperCase();

        // Deselect preset swatches
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));

        applyStyles();
    });

    // Typography Controls
    document.getElementById('heading-font')?.addEventListener('change', (e) => {
        styleState.headingFont = e.target.value;
        applyStyles();
    });

    document.getElementById('body-font')?.addEventListener('change', (e) => {
        styleState.bodyFont = e.target.value;
        applyStyles();
    });

    document.getElementById('font-scale')?.addEventListener('input', (e) => {
        styleState.fontScale = parseInt(e.target.value);
        document.getElementById('font-scale-value').textContent = `${styleState.fontScale}%`;
        applyStyles();
    });

    // Line Height Control
    document.getElementById('line-height')?.addEventListener('input', (e) => {
        styleState.lineHeight = parseInt(e.target.value);
        document.getElementById('line-height-value').textContent = (styleState.lineHeight / 100).toFixed(1);
        applyStyles();
    });

    // Spacing Controls
    document.getElementById('header-spacing')?.addEventListener('input', (e) => {
        styleState.headerSpacing = parseInt(e.target.value);
        document.getElementById('header-spacing-value').textContent = `${styleState.headerSpacing}%`;
        applyStyles();
    });

    document.getElementById('bullet-spacing')?.addEventListener('input', (e) => {
        styleState.bulletSpacing = parseInt(e.target.value);
        document.getElementById('bullet-spacing-value').textContent = `${styleState.bulletSpacing}%`;
        applyStyles();
    });

    document.getElementById('margin-size')?.addEventListener('change', (e) => {
        styleState.marginSize = e.target.value;
        applyStyles();
    });

    // Component-specific spacing controls
    const componentSpacingControls = ['summary', 'highlights', 'skills', 'experience', 'projects', 'education'];

    // Sync slider with section margin
    function updateComponentSpacing(component, value) {
        const input = document.getElementById(`${component}-spacing`);
        const display = document.getElementById(`${component}-spacing-value`);
        const section = document.querySelector(`[data-editable="${component}"]`);

        if (input) input.value = value;
        if (display) display.textContent = `${value}px`;
        if (section) section.style.marginBottom = `${value}px`;
    }

    componentSpacingControls.forEach(component => {
        const input = document.getElementById(`${component}-spacing`);
        const display = document.getElementById(`${component}-spacing-value`);

        if (input && display) {
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                display.textContent = `${value}px`;
                const section = document.querySelector(`[data-editable="${component}"]`);
                if (section) {
                    section.style.marginBottom = `${value}px`;
                }
            });
        }
    });

    // ===========================================
    // DRAG SPACING HANDLES (Visual in Edit Mode)
    // ===========================================
    function injectSpacingHandles() {
        // Only inject in edit mode
        if (!resumeDocument?.classList.contains('editing')) return;

        // Target sections with data-editable
        const sections = resumeDocument.querySelectorAll('[data-editable]');

        sections.forEach(section => {
            // Skip if already has handles
            if (section.querySelector('.spacing-handle')) return;

            // Make section position relative for absolute handles
            section.style.position = 'relative';

            // Create top handle (controls margin-top)
            const topHandle = document.createElement('div');
            topHandle.className = 'spacing-handle spacing-handle-top';
            topHandle.dataset.direction = 'top';
            section.appendChild(topHandle);

            // Create bottom handle (controls margin-bottom)
            const bottomHandle = document.createElement('div');
            bottomHandle.className = 'spacing-handle spacing-handle-bottom';
            bottomHandle.dataset.direction = 'bottom';
            section.appendChild(bottomHandle);

            // Add drag functionality
            [topHandle, bottomHandle].forEach(handle => {
                let startY = 0;
                let startMargin = 0;
                let tooltip = null;

                handle.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    startY = e.clientY;
                    const direction = handle.dataset.direction;
                    const computedStyle = window.getComputedStyle(section);
                    startMargin = parseInt(computedStyle[direction === 'top' ? 'marginTop' : 'marginBottom']) || 0;

                    handle.classList.add('active');

                    // Create tooltip
                    tooltip = document.createElement('div');
                    tooltip.className = 'spacing-tooltip';
                    document.body.appendChild(tooltip);

                    const onMove = (moveE) => {
                        const deltaY = moveE.clientY - startY;
                        let newMargin = direction === 'top'
                            ? startMargin + deltaY
                            : startMargin - deltaY;

                        // Clamp to -800 to 100
                        newMargin = Math.max(-800, Math.min(100, newMargin));

                        if (direction === 'top') {
                            section.style.marginTop = `${newMargin}px`;
                        } else {
                            section.style.marginBottom = `${newMargin}px`;

                            // Sync with slider if this is a main component
                            const editableType = section.dataset.editable;
                            if (componentSpacingControls.includes(editableType)) {
                                const input = document.getElementById(`${editableType}-spacing`);
                                const display = document.getElementById(`${editableType}-spacing-value`);
                                if (input) input.value = newMargin;
                                if (display) display.textContent = `${newMargin}px`;
                            }
                        }

                        // Update tooltip
                        tooltip.textContent = `${newMargin}px`;
                        tooltip.style.left = `${moveE.clientX + 15}px`;
                        tooltip.style.top = `${moveE.clientY - 10}px`;
                    };

                    const onUp = () => {
                        handle.classList.remove('active');
                        if (tooltip) tooltip.remove();
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                    };

                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });
            });
        });
    }

    // Inject handles when entering edit mode
    const originalEditToggle = document.querySelector('.rail-btn[data-mode="edit"]');
    if (originalEditToggle) {
        originalEditToggle.addEventListener('click', () => {
            setTimeout(injectSpacingHandles, 100);
        });
    }

    // Also inject when resume renders
    const originalRenderResume = window.renderResume;
    if (typeof originalRenderResume === 'function') {
        window.renderResume = function (...args) {
            originalRenderResume.apply(this, args);
            setTimeout(injectSpacingHandles, 100);
        };
    }

    // Reset Styles Button (Enhanced)
    document.getElementById('reset-styles')?.addEventListener('click', () => {
        // Reset to defaults
        Object.assign(styleState, DEFAULT_STYLE_STATE);

        // Update all UI controls (compact defaults)
        document.getElementById('font-scale').value = 95;
        document.getElementById('font-scale-value').textContent = '95%';
        document.getElementById('line-height').value = 140;
        document.getElementById('line-height-value').textContent = '1.4';
        document.getElementById('header-spacing').value = 80;
        document.getElementById('header-spacing-value').textContent = '80%';
        document.getElementById('bullet-spacing').value = 80;
        document.getElementById('bullet-spacing-value').textContent = '80%';
        document.getElementById('margin-size').value = 'compact';

        // Reset component spacing
        ['summary', 'highlights', 'skills', 'experience', 'projects', 'education'].forEach(comp => {
            const input = document.getElementById(`${comp}-spacing`);
            const display = document.getElementById(`${comp}-spacing-value`);
            const section = document.querySelector(`[data-editable="${comp}"]`);
            if (input) input.value = 10;
            if (display) display.textContent = '10px';
            if (section) section.style.marginBottom = '';
        });
        document.getElementById('heading-font').value = "'Outfit', sans-serif";
        document.getElementById('body-font').value = "'Inter', sans-serif";
        document.getElementById('custom-color-picker').value = '#00FF9D';
        document.getElementById('color-hex-display').textContent = '#00FF9D';

        // Reset template cards
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
        document.querySelector('.template-card[data-template="executive"]')?.classList.add('active');

        // Reset color swatches
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        document.querySelector('.color-swatch[data-color="#00FF9D"]')?.classList.add('active');

        // Reset preset buttons
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.preset-btn[data-preset="standard"]')?.classList.add('active');

        // Reset font system
        document.querySelectorAll('.font-system-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.font-system-btn[data-system="tech-modern"]')?.classList.add('active');
        document.getElementById('manual-font-controls')?.classList.add('hidden');

        applyStyles();
        log('Styles reset to defaults', 'success');
    });

    // ===========================================
    // PAGINATION ENGINE (Multi-Page Logic)
    // ===========================================
    function repaginate() {
        // 1. Reset: Consolidate everything into the first page
        const pages = document.querySelectorAll('.resume-page');
        if (pages.length > 1) {
            const firstPage = pages[0];
            for (let i = 1; i < pages.length; i++) {
                while (pages[i].firstChild) {
                    firstPage.appendChild(pages[i].firstChild);
                }
                pages[i].remove();
            }
        }

        const pageOne = document.querySelector('.resume-page');
        if (!pageOne) return;

        const PAGE_HEIGHT = 1122;
        const MARGIN_BOTTOM = 60;
        const MAX_H = PAGE_HEIGHT - MARGIN_BOTTOM;

        let currentPage = pageOne;
        const children = Array.from(pageOne.children);

        const createPage = () => {
            const newPage = document.createElement('div');
            newPage.className = pageOne.className;
            newPage.style.cssText = pageOne.style.cssText;
            resumeDocument.appendChild(newPage);
            return newPage;
        };

        children.forEach((child, index) => {
            // 1. Force Page Break Check
            if (child.classList.contains('force-page-break') && index > 0) {
                currentPage = createPage();
                currentPage.appendChild(child);
                return;
            }

            // 2. Overflow Check
            // Always move to currentPage to check valid height
            if (currentPage !== pageOne) {
                currentPage.appendChild(child);
            }

            const childBottom = child.offsetTop + child.offsetHeight;
            if (childBottom > MAX_H) {
                // Move to new page (if strict overflow and not the only item)
                if (currentPage.children.length > 1) {
                    currentPage = createPage();
                    currentPage.appendChild(child);
                }
            }
        });

        log(`Paginated into ${document.querySelectorAll('.resume-page').length} pages`, 'info');
    }

    // Apply Styles Function (AESTHETICS LAB CORE)
    function applyStyles() {
        if (!resumeDocument) return;

        // 1. GLOBAL VARIABLES (Fonts, Colors, Scaling)
        const root = document.documentElement;

        // Font Scale (Base rem/em sizing)
        const scale = styleState.fontScale / 100;
        resumeDocument.style.fontSize = `${10 * scale}pt`;

        // Accent Color
        root.style.setProperty('--resume-accent', styleState.accentColor);

        // Spacing Scales
        const headerScale = (styleState.headerSpacing || 100) / 100;
        const sectionScale = (styleState.sectionSpacing || 100) / 100;
        const bulletScale = (styleState.bulletSpacing || 100) / 100;

        root.style.setProperty('--res-header-scale', headerScale);
        root.style.setProperty('--res-gap-scale', sectionScale);
        root.style.setProperty('--res-bullet-scale', bulletScale);

        // Line Height
        const lineHeightValue = (styleState.lineHeight || 150) / 100;
        root.style.setProperty('--res-line-height', lineHeightValue);

        // Fonts (Sanitize quotes just in case)
        styleState.headingFont = styleState.headingFont.replace(/"/g, "'");
        styleState.bodyFont = styleState.bodyFont.replace(/"/g, "'");

        root.style.setProperty('--res-font-header', styleState.headingFont);
        root.style.setProperty('--res-font-body', styleState.bodyFont);

        // 2. TEMPLATE APPLICATION
        const pages = document.querySelectorAll('.resume-page, .cover-letter-page');
        const templates = ['executive', 'modern', 'minimal', 'creative'];

        pages.forEach(page => {
            // Reset templates
            templates.forEach(t => page.classList.remove(`template-${t}`));
            // Apply current
            page.classList.add(`template-${styleState.template || 'executive'}`);

            // Apply Margins (All 4 sides identical)
            const margins = {
                'tight': '12mm',
                'compact': '15mm',
                'normal': '20mm',
                'wide': '25mm',
                'spacious': '30mm'
            };
            page.style.padding = margins[styleState.marginSize];

            // Force Fonts (CSS Variables handle most, but explicit override helps fallback)
            page.style.fontFamily = styleState.bodyFont;

            // Update Headers explicitly if needed
            const headers = page.querySelectorAll('.res-name, .res-section-title, .res-company, .res-header-modern, .cover-header-modern');
            headers.forEach(h => h.style.fontFamily = styleState.headingFont);
        });

        // Run pagination after styles settle
        setTimeout(repaginate, 50);

        log(`Applied Style: ${styleState.template ? styleState.template.toUpperCase() : 'DEFAULT'}`, 'success');
    }

    // ===========================================
    // QUICK ACTION BUTTONS
    // ===========================================
    document.getElementById('add-experience').addEventListener('click', () => {
        if (!currentResumeData) {
            log('Generate a resume first', 'error');
            return;
        }
        saveToHistory();
        currentResumeData.resume.experience.push({
            company: "New Company",
            role: "Your Role",
            period: "2024 — Present",
            bullets: ["Describe your achievement here"]
        });
        renderResume(currentResumeData);
        log('Added new experience entry', 'success');
    });

    document.getElementById('add-project').addEventListener('click', () => {
        if (!currentResumeData) {
            log('Generate a resume first', 'error');
            return;
        }
        saveToHistory();
        if (!currentResumeData.resume.projects) {
            currentResumeData.resume.projects = [];
        }
        currentResumeData.resume.projects.push({
            name: "New Project",
            tech: ["Technology"],
            description: "Describe your project here"
        });
        renderResume(currentResumeData);
        log('Added new project entry', 'success');
    });

    document.getElementById('add-skill').addEventListener('click', () => {
        if (!currentResumeData) {
            log('Generate a resume first', 'error');
            return;
        }
        const category = prompt('Enter skill category name:');
        if (category) {
            saveToHistory();
            currentResumeData.resume.skills[category] = ["Skill 1", "Skill 2"];
            renderResume(currentResumeData);
            log(`Added skill category: ${category}`, 'success');
        }
    });

    // ===========================================
    // PROFESSIONAL EXPORT SYSTEM
    // ===========================================

    // Export Dropdown Toggle
    const exportDropdown = document.getElementById('export-dropdown');
    const exportToggle = document.getElementById('export-toggle');

    exportToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        exportDropdown.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!exportDropdown?.contains(e.target)) {
            exportDropdown?.classList.remove('open');
        }
    });

    // Helper: Get candidate name for filename
    function getExportFilename(extension) {
        const name = currentResumeData?.resume?.header?.name || 'Resume';
        const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const date = new Date().toISOString().split('T')[0];
        return `${cleanName}_${date}.${extension}`;
    }

    // ===========================================
    // PDF EXPORT (Direct - Reliable)
    // ===========================================
    document.getElementById('export-pdf')?.addEventListener('click', async () => {
        if (!currentResumeData) {
            log('No resume to export', 'error');
            return;
        }

        const btn = document.getElementById('export-pdf');
        btn.classList.add('loading');
        log('📄 Generating PDF...', 'process');
        exportDropdown.classList.remove('open');

        try {
            const element = document.getElementById('resume-document');
            await document.fonts.ready;

            const opt = {
                margin: [0, 0, 0, 0],
                filename: getExportFilename('pdf'),
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: -window.scrollY },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'avoid-all' }
            };

            await html2pdf().set(opt).from(element).save();

            btn.classList.remove('loading');
            btn.classList.add('success');
            log('✓ PDF exported successfully!', 'success');
            setTimeout(() => btn.classList.remove('success'), 2000);
        } catch (err) {
            console.error('PDF Export Error:', err);
            log(`PDF Export failed: ${err.message}`, 'error');
            btn.classList.remove('loading');
        }
    });

    // ===========================================
    // WORD EXPORT (docx.js - Full Document)
    // ===========================================
    document.getElementById('export-word')?.addEventListener('click', async () => {
        if (!currentResumeData) {
            log('No resume to export', 'error');
            return;
        }

        const btn = document.getElementById('export-word');
        btn.classList.add('loading');
        log('📝 Generating Word document...', 'process');
        exportDropdown.classList.remove('open');

        try {
            const { Document, Packer, Paragraph, TextRun, PageBreak, BorderStyle } = docx;
            const data = currentResumeData.resume;
            const cover = currentResumeData.coverLetter;

            // Font configuration - Match Preview Styling
            const FONTS = {
                heading: 'Outfit',      // Same as preview headers
                body: 'Inter',          // Same as preview body
                mono: 'IBM Plex Mono'   // Same as preview monospace
            };

            // Build Resume Section
            const resumeContent = [];

            // Name
            resumeContent.push(new Paragraph({
                children: [new TextRun({
                    text: data.header.name.toUpperCase(),
                    bold: true,
                    size: 44,
                    font: FONTS.heading
                })],
                spacing: { after: 80 }
            }));

            // Title
            resumeContent.push(new Paragraph({
                children: [new TextRun({
                    text: data.header.title,
                    size: 24,
                    color: '555555',
                    font: FONTS.body
                })],
                spacing: { after: 160 }
            }));

            // Contact
            const contact = [data.header.contact.email, data.header.contact.linkedin, data.header.contact.location].filter(Boolean).join('  •  ');
            resumeContent.push(new Paragraph({
                children: [new TextRun({ text: contact, size: 18, color: '666666', font: FONTS.mono })],
                spacing: { after: 300 }
            }));

            // Divider
            resumeContent.push(new Paragraph({
                border: { bottom: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 8 } },
                spacing: { after: 300 }
            }));

            // Summary
            resumeContent.push(new Paragraph({
                children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 20, color: '888888', font: FONTS.heading })],
                spacing: { after: 160 }
            }));
            resumeContent.push(new Paragraph({
                children: [new TextRun({ text: data.summary, size: 22, font: FONTS.body })],
                spacing: { after: 300 }
            }));

            // Skills
            if (data.skills && Object.keys(data.skills).length > 0) {
                resumeContent.push(new Paragraph({
                    children: [new TextRun({ text: 'SKILLS', bold: true, size: 20, color: '888888', font: FONTS.heading })],
                    spacing: { before: 160, after: 160 }
                }));
                Object.entries(data.skills).forEach(([cat, skills]) => {
                    const list = Array.isArray(skills) ? skills.join(', ') : skills;
                    resumeContent.push(new Paragraph({
                        children: [
                            new TextRun({ text: `${cat.replace(/_/g, ' ').toUpperCase()}: `, bold: true, size: 20, font: FONTS.body }),
                            new TextRun({ text: list, size: 20, font: FONTS.body })
                        ],
                        spacing: { after: 80 }
                    }));
                });
            }

            // Experience
            if (data.experience?.length > 0) {
                resumeContent.push(new Paragraph({
                    children: [new TextRun({ text: 'EXPERIENCE', bold: true, size: 20, color: '888888', font: FONTS.heading })],
                    spacing: { before: 300, after: 160 }
                }));
                data.experience.forEach(job => {
                    resumeContent.push(new Paragraph({
                        children: [
                            new TextRun({ text: job.company, bold: true, size: 22, font: FONTS.body }),
                            new TextRun({ text: `  |  ${job.period}`, size: 18, color: '888888', font: FONTS.mono })
                        ]
                    }));
                    resumeContent.push(new Paragraph({
                        children: [new TextRun({ text: job.role, italics: true, size: 20, color: '555555', font: FONTS.body })],
                        spacing: { after: 100 }
                    }));
                    job.bullets?.forEach(b => {
                        resumeContent.push(new Paragraph({
                            children: [new TextRun({ text: `• ${b}`, size: 20, font: FONTS.body })],
                            indent: { left: 300 },
                            spacing: { after: 60 }
                        }));
                    });
                    resumeContent.push(new Paragraph({ spacing: { after: 160 } }));
                });
            }

            // Education
            if (data.education?.length > 0) {
                resumeContent.push(new Paragraph({
                    children: [new TextRun({ text: 'EDUCATION', bold: true, size: 20, color: '888888', font: FONTS.heading })],
                    spacing: { before: 160, after: 160 }
                }));
                data.education.forEach(edu => {
                    resumeContent.push(new Paragraph({
                        children: [
                            new TextRun({ text: edu.school, bold: true, size: 22, font: FONTS.body }),
                            new TextRun({ text: `  |  ${edu.year}`, size: 18, color: '888888', font: FONTS.mono })
                        ]
                    }));
                    resumeContent.push(new Paragraph({
                        children: [new TextRun({ text: edu.degree, size: 20, font: FONTS.body })],
                        spacing: { after: 160 }
                    }));
                });
            }

            // Build Cover Letter Section (if exists)
            const coverContent = [];
            if (cover) {
                // Page break before cover letter
                coverContent.push(new Paragraph({ children: [new PageBreak()] }));

                // Header
                coverContent.push(new Paragraph({
                    children: [new TextRun({ text: cover.header?.name?.toUpperCase() || data.header.name.toUpperCase(), bold: true, size: 44, font: FONTS.heading })],
                    spacing: { after: 80 }
                }));
                coverContent.push(new Paragraph({
                    children: [new TextRun({ text: cover.header?.title || data.header.title, size: 24, color: '555555', font: FONTS.body })],
                    spacing: { after: 300 }
                }));

                // Divider
                coverContent.push(new Paragraph({
                    border: { bottom: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 8 } },
                    spacing: { after: 300 }
                }));

                // Recipient
                if (cover.recipient) {
                    coverContent.push(new Paragraph({
                        children: [new TextRun({ text: cover.recipient.name, bold: true, size: 22, font: FONTS.body })],
                        spacing: { after: 40 }
                    }));
                    coverContent.push(new Paragraph({
                        children: [new TextRun({ text: cover.recipient.title || '', size: 20, color: '555555', font: FONTS.body })],
                        spacing: { after: 40 }
                    }));
                    coverContent.push(new Paragraph({
                        children: [new TextRun({ text: cover.recipient.company || '', size: 20, font: FONTS.body })],
                        spacing: { after: 200 }
                    }));
                }

                // Subject
                if (cover.subject) {
                    coverContent.push(new Paragraph({
                        children: [new TextRun({ text: `RE: ${cover.subject}`, bold: true, size: 22, font: FONTS.body })],
                        spacing: { after: 300 }
                    }));
                }

                // Body paragraphs
                if (cover.body) {
                    // Handle body as string or array
                    const bodyParagraphs = Array.isArray(cover.body) ? cover.body : [cover.body];
                    bodyParagraphs.forEach(para => {
                        if (para && typeof para === 'string') {
                            coverContent.push(new Paragraph({
                                children: [new TextRun({ text: para, size: 22, font: FONTS.body })],
                                spacing: { after: 200 }
                            }));
                        }
                    });
                }

                // Closing
                coverContent.push(new Paragraph({ spacing: { after: 300 } }));
                coverContent.push(new Paragraph({
                    children: [new TextRun({ text: cover.closing || 'Best regards,', size: 22, font: FONTS.body })],
                    spacing: { after: 100 }
                }));
                coverContent.push(new Paragraph({
                    children: [new TextRun({ text: data.header.name, bold: true, size: 22, font: FONTS.body })]
                }));
            }

            // Create document with both sections
            const doc = new Document({
                sections: [{
                    properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
                    children: [...resumeContent, ...coverContent]
                }]
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, getExportFilename('docx'));

            btn.classList.remove('loading');
            btn.classList.add('success');
            log('✓ Word document exported (Resume + Cover Letter)', 'success');
            setTimeout(() => btn.classList.remove('success'), 2000);
        } catch (err) {
            console.error('Word Export Error:', err);
            log(`Word Export failed: ${err.message}`, 'error');
            btn.classList.remove('loading');
        }
    });

    // ===========================================
    // JSON EXPORT (Data Backup)
    // ===========================================
    document.getElementById('export-json')?.addEventListener('click', () => {
        if (!currentResumeData) {
            log('No resume to export', 'error');
            return;
        }

        const btn = document.getElementById('export-json');
        btn.classList.add('loading');
        exportDropdown.classList.remove('open');

        try {
            const json = JSON.stringify(currentResumeData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = getExportFilename('json');
            a.click();
            URL.revokeObjectURL(url);

            btn.classList.remove('loading');
            btn.classList.add('success');
            log('✓ JSON data exported successfully!', 'success');

            setTimeout(() => btn.classList.remove('success'), 2000);
        } catch (err) {
            log(`JSON Export failed: ${err.message}`, 'error');
            btn.classList.remove('loading');
        }
    });

    // ===========================================
    // COPY TO CLIPBOARD
    // ===========================================
    document.getElementById('copy-clipboard').addEventListener('click', () => {
        if (!currentResumeData) {
            log('No resume to copy', 'error');
            return;
        }

        const text = resumeDocument.innerText;
        navigator.clipboard.writeText(text).then(() => {
            log('Resume copied to clipboard!', 'success');
        }).catch(() => {
            log('Failed to copy to clipboard', 'error');
        });
    });

    // ===========================================
    // PRINT RESUME
    // ===========================================
    document.getElementById('print-resume').addEventListener('click', () => {
        if (!currentResumeData) {
            log('No resume to print', 'error');
            return;
        }
        log('Opening print dialog...', 'info');
        window.print();
    });

    // ===========================================
    // ACTION VERBS SYSTEM
    // ===========================================
    const allActionVerbs = [
        'Spearheaded', 'Architected', 'Engineered', 'Orchestrated', 'Transformed',
        'Optimized', 'Pioneered', 'Accelerated', 'Streamlined', 'Revolutionized',
        'Championed', 'Cultivated', 'Devised', 'Elevated', 'Formulated',
        'Generated', 'Implemented', 'Launched', 'Maximized', 'Negotiated',
        'Overhauled', 'Propelled', 'Revitalized', 'Secured', 'Unified',
        'Automated', 'Consolidated', 'Delivered', 'Established', 'Facilitated',
        'Grew', 'Improved', 'Led', 'Mentored', 'Navigated',
        'Outperformed', 'Partnered', 'Reduced', 'Scaled', 'Tripled'
    ];

    const actionVerbsContainer = document.getElementById('action-verbs');
    const refreshVerbsBtn = document.getElementById('refresh-verbs');

    function displayRandomVerbs() {
        const shuffled = [...allActionVerbs].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 8);

        actionVerbsContainer.innerHTML = selected.map(verb =>
            `<span class="verb-tag" data-verb="${verb}">${verb}</span>`
        ).join('');

        // Re-attach click handlers
        actionVerbsContainer.querySelectorAll('.verb-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                navigator.clipboard.writeText(tag.dataset.verb);
                log(`Copied "${tag.dataset.verb}" to clipboard`, 'success');
            });
        });
    }

    refreshVerbsBtn.addEventListener('click', displayRandomVerbs);

    // ATS ANALYSIS SYSTEM (V2 - Intelligence Upgrade)
    // ===========================================

    // Expanded keyword dictionary with synonyms
    const keywordSynonyms = {
        'javascript': ['js', 'ecmascript', 'es6', 'es2015'],
        'typescript': ['ts'],
        'python': ['py', 'python3'],
        'machine learning': ['ml', 'deep learning', 'neural network', 'ai'],
        'artificial intelligence': ['ai', 'machine learning', 'ml'],
        'project management': ['pm', 'project manager', 'scrum master'],
        'react': ['reactjs', 'react.js'],
        'node': ['nodejs', 'node.js'],
        'amazon web services': ['aws', 'ec2', 's3', 'lambda'],
        'google cloud': ['gcp', 'google cloud platform'],
        'database': ['db', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql'],
        'api': ['rest', 'restful', 'graphql', 'endpoints'],
        'continuous integration': ['ci', 'ci/cd', 'jenkins', 'github actions'],
        'user experience': ['ux', 'ui/ux'],
        'user interface': ['ui', 'frontend', 'front-end']
    };

    // Common stopwords to filter out
    const stopwords = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out',
        'has', 'have', 'been', 'being', 'will', 'with', 'this', 'that', 'from', 'they', 'would', 'there', 'their',
        'what', 'about', 'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'people', 'into', 'year',
        'your', 'good', 'some', 'could', 'them', 'than', 'then', 'look', 'only', 'come', 'over', 'such', 'also',
        'back', 'after', 'work', 'first', 'well', 'even', 'want', 'because', 'these', 'give', 'most', 'working',
        'ability', 'strong', 'experience', 'looking', 'join', 'role', 'position', 'company', 'team', 'must', 'etc'
    ]);

    // Power action verbs for resume scoring
    const powerVerbs = [
        'achieved', 'accelerated', 'architected', 'automated', 'built', 'created', 'delivered', 'designed',
        'developed', 'drove', 'engineered', 'established', 'executed', 'generated', 'grew', 'implemented',
        'improved', 'increased', 'initiated', 'innovated', 'launched', 'led', 'managed', 'optimized',
        'orchestrated', 'pioneered', 'reduced', 'redesigned', 'scaled', 'spearheaded', 'streamlined',
        'transformed', 'tripled', 'doubled'
    ];

    function extractKeyPhrases(text) {
        const cleanText = text.toLowerCase().replace(/[^\w\s-]/g, ' ');
        const words = cleanText.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));

        // Single words (unigrams)
        const unigrams = [...new Set(words)];

        // Two-word phrases (bigrams) - important for tech terms
        const bigrams = [];
        for (let i = 0; i < words.length - 1; i++) {
            const phrase = `${words[i]} ${words[i + 1]}`;
            if (!stopwords.has(words[i]) && !stopwords.has(words[i + 1])) {
                bigrams.push(phrase);
            }
        }

        // Count frequency to identify important terms
        const freqMap = {};
        words.forEach(w => { freqMap[w] = (freqMap[w] || 0) + 1; });

        // Important terms: high frequency OR technical-looking (contains numbers, hyphens)
        const importantTerms = unigrams.filter(w =>
            freqMap[w] >= 2 ||
            /\d/.test(w) ||
            w.includes('-') ||
            w.length > 6
        );

        return { unigrams: importantTerms, bigrams: [...new Set(bigrams)] };
    }

    function checkKeywordMatch(resumeText, keyword) {
        const lowerResume = resumeText.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();

        // Direct match
        if (lowerResume.includes(lowerKeyword)) return true;

        // Check synonyms
        for (const [term, synonyms] of Object.entries(keywordSynonyms)) {
            if (lowerKeyword === term || synonyms.includes(lowerKeyword)) {
                // Check if resume has the term or any synonym
                if (lowerResume.includes(term)) return true;
                if (synonyms.some(syn => lowerResume.includes(syn))) return true;
            }
        }

        return false;
    }

    document.getElementById('run-ats-analysis').addEventListener('click', () => {
        if (!currentResumeData) {
            log('Generate a resume first', 'error');
            return;
        }

        log('Running intelligent ATS analysis...', 'process');

        const resumeText = resumeDocument.innerText;
        const jobText = jobDescriptionInput.value;

        if (!jobText.trim()) {
            log('Job description required for accurate analysis', 'error');
            return;
        }

        // 1. KEYWORD ANALYSIS (Improved)
        const jdPhrases = extractKeyPhrases(jobText);
        const allJdKeywords = [...jdPhrases.unigrams.slice(0, 20), ...jdPhrases.bigrams.slice(0, 10)];

        const foundKeywords = [];
        const missingKeywords = [];

        allJdKeywords.forEach(keyword => {
            if (checkKeywordMatch(resumeText, keyword)) {
                foundKeywords.push(keyword);
            } else {
                missingKeywords.push(keyword);
            }
        });

        const keywordScore = allJdKeywords.length > 0
            ? Math.round((foundKeywords.length / allJdKeywords.length) * 100)
            : 50;

        // 2. SKILLS COVERAGE (Actually compares to JD)
        const resumeSkills = currentResumeData.resume.skills
            ? Object.values(currentResumeData.resume.skills).flat().map(s => s.toLowerCase())
            : [];

        // Extract skill-like terms from JD (nouns, tech terms)
        const jdSkillTerms = jdPhrases.unigrams.filter(w =>
            w.length > 3 &&
            !['years', 'experience', 'work', 'team', 'role'].includes(w)
        ).slice(0, 15);

        let matchedSkills = 0;
        jdSkillTerms.forEach(skill => {
            if (resumeSkills.some(rs => rs.includes(skill) || skill.includes(rs))) {
                matchedSkills++;
            }
        });

        const skillsScore = jdSkillTerms.length > 0
            ? Math.round((matchedSkills / jdSkillTerms.length) * 100)
            : (resumeSkills.length > 10 ? 80 : 60);

        // 3. FORMAT SCORE (More comprehensive)
        const bulletCount = (resumeText.match(/•|▪|◦|–\s/g) || []).length;
        const hasQuantifiables = (resumeText.match(/\d+%|\$[\d,]+|\d+\+|\d+x|\d+ million|\d+ users/gi) || []).length;
        const actionVerbCount = powerVerbs.filter(v => resumeText.toLowerCase().includes(v)).length;
        const sectionCount = resumeDocument.querySelectorAll('.res-section').length;
        const wordCount = resumeText.trim().split(/\s+/).length;

        // Scoring components
        let formatScore = 40; // Base
        formatScore += Math.min(20, bulletCount * 1.5);  // Up to 20 for bullets (13+ bullets)
        formatScore += Math.min(15, hasQuantifiables * 5); // Up to 15 for metrics (3+ metrics)
        formatScore += Math.min(15, actionVerbCount * 2);  // Up to 15 for action verbs (7+ verbs)
        formatScore += Math.min(10, sectionCount * 2);     // Up to 10 for structure

        // Penalty for too short or too long
        if (wordCount < 300) formatScore -= 15;
        else if (wordCount > 800) formatScore += 5; // Comprehensive is good

        formatScore = Math.max(0, Math.min(100, Math.round(formatScore)));

        // 4. OVERALL SCORE (Weighted)
        // Keywords are most important for ATS, then skills, then format
        const overallScore = Math.round(
            (keywordScore * 0.45) +
            (skillsScore * 0.35) +
            (formatScore * 0.20)
        );

        // Update UI
        updateATSDisplay(overallScore, keywordScore, skillsScore, formatScore);
        displayKeywords(foundKeywords, missingKeywords);
        updateDocumentStats();

        // Detailed logging
        log(`Keywords: ${foundKeywords.length}/${allJdKeywords.length} matched`, 'info');
        log(`Skills: ${matchedSkills}/${jdSkillTerms.length} covered`, 'info');
        log(`Format: ${bulletCount} bullets, ${hasQuantifiables} metrics, ${actionVerbCount} power verbs`, 'info');
        log(`ATS Score: ${overallScore}%`, overallScore >= 70 ? 'success' : 'process');
    });

    function updateATSDisplay(overall, keywords, skills, format) {
        const scoreNumber = document.getElementById('ats-score-number');
        const ringProgress = document.getElementById('ring-progress');
        const atsBadge = document.getElementById('ats-badge');

        // Animate score
        scoreNumber.textContent = overall;

        // Update ring (circumference is 283)
        const offset = 283 - (283 * overall / 100);
        ringProgress.style.strokeDashoffset = offset;

        // Update badge
        atsBadge.className = 'ats-badge';
        if (overall >= 85) {
            atsBadge.classList.add('excellent');
            atsBadge.textContent = 'EXCELLENT';
        } else if (overall >= 70) {
            atsBadge.classList.add('good');
            atsBadge.textContent = 'GOOD';
        } else if (overall >= 50) {
            atsBadge.classList.add('fair');
            atsBadge.textContent = 'FAIR';
        } else {
            atsBadge.classList.add('poor');
            atsBadge.textContent = 'NEEDS WORK';
        }

        // Update breakdown bars
        document.getElementById('keywords-bar').style.width = `${keywords}%`;
        document.getElementById('keywords-pct').textContent = `${keywords}%`;

        document.getElementById('skills-bar').style.width = `${skills}%`;
        document.getElementById('skills-pct').textContent = `${skills}%`;

        document.getElementById('format-bar').style.width = `${format}%`;
        document.getElementById('format-pct').textContent = `${format}%`;
    }

    function displayKeywords(found, missing) {
        const foundContainer = document.getElementById('found-keywords');
        const missingContainer = document.getElementById('missing-keywords');

        foundContainer.innerHTML = found.map(k =>
            `<span class="tag found">${k}</span>`
        ).join('') || '<span style="color:#666;font-size:0.7rem">No matches found</span>';

        missingContainer.innerHTML = missing.map(k =>
            `<span class="tag missing" title="Click to add">${k}</span>`
        ).join('') || '<span style="color:#666;font-size:0.7rem">All keywords covered!</span>';
    }

    // ===========================================
    // DOCUMENT STATISTICS
    // ===========================================
    function updateDocumentStats() {
        if (!resumeDocument) return;

        const text = resumeDocument.innerText;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const chars = text.replace(/\s/g, '').length;
        const bullets = (text.match(/•|▪|◦/g) || []).length;
        const sections = resumeDocument.querySelectorAll('.res-section').length;

        document.getElementById('stat-words').textContent = words.length;
        document.getElementById('stat-chars').textContent = chars;
        document.getElementById('stat-bullets').textContent = bullets;
        document.getElementById('stat-sections').textContent = sections;

        // Calculate reading level (simplified Flesch-Kincaid)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const avgWordsPerSentence = words.length / Math.max(1, sentences);

        let readingLevel = 'Professional';
        if (avgWordsPerSentence > 25) readingLevel = 'Complex';
        else if (avgWordsPerSentence < 12) readingLevel = 'Simple';

        document.getElementById('reading-level').textContent = readingLevel;
    }

    // ===========================================
    // AI REWRITE POPUP
    // ===========================================
    const aiPopup = document.getElementById('ai-rewrite-popup');
    const closeAiPopup = document.getElementById('close-ai-popup');
    const popupOriginal = document.getElementById('popup-original');
    const popupRewritten = document.getElementById('popup-rewritten');
    const aiLoading = document.getElementById('ai-loading');
    let selectedTextRange = null;

    document.getElementById('inline-ai-rewrite')?.addEventListener('click', () => {
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.isCollapsed) {
            log('Select text first', 'error');
            return;
        }

        selectedTextRange = selection.getRangeAt(0).cloneRange();
        const selectedText = selection.toString().trim();

        if (selectedText.length < 5) {
            log('Select more text', 'error');
            return;
        }

        popupOriginal.textContent = selectedText;
        aiPopup.classList.remove('hidden');
        document.querySelector('.rewritten-text').classList.add('hidden');
        document.querySelector('.ai-popup-actions').classList.add('hidden');
    });

    closeAiPopup?.addEventListener('click', () => {
        aiPopup.classList.add('hidden');
    });

    // AI Option buttons
    document.querySelectorAll('.ai-option-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const action = btn.dataset.action;
            const originalText = popupOriginal.textContent;

            aiLoading.classList.remove('hidden');

            try {
                const rewritten = await aiRewriteText(originalText, action);
                popupRewritten.textContent = rewritten;
                document.querySelector('.rewritten-text').classList.remove('hidden');
                document.querySelector('.ai-popup-actions').classList.remove('hidden');
            } catch (err) {
                log('AI rewrite failed', 'error');
            } finally {
                aiLoading.classList.add('hidden');
            }
        });
    });

    async function aiRewriteText(text, action) {
        try {
            const response = await fetch('/api/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    action: action,
                    context: currentResumeData ? currentResumeData.resume.header.title : "Professional"
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();
            return data.result.replace(/^"|"$/g, ''); // Clean quotes if present
        } catch (error) {
            console.error(error);
            log('AI Service Unavailable. Check API Key.', 'error');
            // Fallback for demo/offline
            const prompts = {
                improve: `More impactful version: ${text.charAt(0).toUpperCase() + text.slice(1)}`,
                quantify: text.replace(/improved|increased|reduced/gi, match => `${match} by 35%`),
                shorten: text.split(' ').slice(0, Math.ceil(text.split(' ').length * 0.6)).join(' '),
                expand: `${text}. This initiative demonstrated strong leadership and technical expertise.`
            };
            return prompts[action] || text;
        }
    }

    document.getElementById('apply-rewrite')?.addEventListener('click', () => {
        const newText = popupRewritten.textContent;
        if (!newText) return;

        saveToHistory();

        // Mode 1: Form Input (Brainstorming)
        if (aiPopup.dataset.targetId) {
            const input = document.getElementById(aiPopup.dataset.targetId);
            if (input) {
                input.value = newText;
                log('Applied AI suggestions to form', 'success');
            }
            aiPopup.dataset.targetId = ''; // Clear target
        }
        // Mode 2: Inline Text Selection
        else if (selectedTextRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(selectedTextRange);
            document.execCommand('insertText', false, newText);
            log('Text rewritten successfully', 'success');
        }

        aiPopup.classList.add('hidden');
    });

    document.getElementById('regenerate-rewrite')?.addEventListener('click', () => {
        document.querySelector('.ai-option-btn[data-action="improve"]')?.click();
    });

    // ===========================================
    // AI SUGGESTIONS
    // ===========================================
    document.getElementById('get-suggestions')?.addEventListener('click', async () => {
        if (!currentResumeData) {
            log('Generate a resume first', 'error');
            return;
        }

        const container = document.getElementById('ai-suggestions');
        container.innerHTML = '<div class="ai-loading"><div class="loading-spinner"></div><span>Generating suggestions...</span></div>';

        await new Promise(r => setTimeout(r, 1200));

        const suggestions = [
            'Consider adding quantifiable metrics to your experience bullets (e.g., "increased by 25%")',
            'Your skills section could benefit from more industry-specific keywords',
            'Add a brief project outcome statement to demonstrate impact',
            'Consider using more action verbs like "Spearheaded", "Orchestrated", or "Pioneered"'
        ];

        container.innerHTML = suggestions.map(s =>
            `<div class="suggestion-item"><p>${s}</p></div>`
        ).join('');

        log('AI suggestions generated', 'success');
    });

    // ===========================================
    // SAVE / LOAD SYSTEM
    // ===========================================
    const STORAGE_KEY = 'resum8_saved_versions';

    function getSavedVersions() {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    }

    function saveVersion(name, data) {
        const versions = getSavedVersions();
        versions.unshift({
            name: name || `Version ${versions.length + 1}`,
            date: new Date().toISOString(),
            data: data
        });

        // Keep only last 10 versions
        if (versions.length > 10) versions.pop();

        localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
        updateVersionsList();
    }

    function updateVersionsList() {
        const container = document.getElementById('saved-versions');
        const versions = getSavedVersions();

        if (versions.length === 0) {
            container.innerHTML = '<div style="color:#666;font-size:0.7rem;text-align:center;padding:8px">No saved versions</div>';
            return;
        }

        container.innerHTML = versions.map((v, i) => `
            <div class="version-item" data-index="${i}">
                <div>
                    <span class="version-name">${v.name}</span>
                    <span class="version-date">${new Date(v.date).toLocaleDateString()}</span>
                </div>
                <div class="version-actions">
                    <button class="load-version" data-index="${i}">Load</button>
                    <button class="delete delete-version" data-index="${i}">×</button>
                </div>
            </div>
        `).join('');

        // Attach handlers
        container.querySelectorAll('.load-version').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                const version = versions[idx];
                currentResumeData = version.data;
                renderResume(currentResumeData);
                log(`Loaded: ${version.name}`, 'success');
            });
        });

        container.querySelectorAll('.delete-version').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                versions.splice(idx, 1);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
                updateVersionsList();
                log('Version deleted', 'info');
            });
        });
    }

    document.getElementById('save-resume')?.addEventListener('click', () => {
        if (!currentResumeData) {
            log('No resume to save', 'error');
            return;
        }

        const name = document.getElementById('version-name').value.trim() ||
            `Resume ${new Date().toLocaleDateString()}`;

        saveVersion(name, currentResumeData);
        document.getElementById('version-name').value = '';
        log(`Saved: ${name}`, 'success');
    });

    document.getElementById('load-resume')?.addEventListener('click', () => {
        const versions = getSavedVersions();
        if (versions.length === 0) {
            log('No saved versions to load', 'error');
            return;
        }

        // Load most recent
        currentResumeData = versions[0].data;
        renderResume(currentResumeData);
        log('Loaded most recent version', 'success');
    });

    // ===========================================
    // INITIALIZATION
    // ===========================================
    log('RESUM8 Studio initialized', 'success');
    log('Select GENERATE tab to create a resume', 'info');
    updateHistoryUI();
    displayRandomVerbs();
    updateVersionsList();
});
