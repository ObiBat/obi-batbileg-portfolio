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

    // Style State
    let styleState = {
        template: 'executive',
        accentColor: '#00FF9D',
        headingFont: "'Outfit', sans-serif",
        bodyFont: "'Outfit', sans-serif",
        fontScale: 100,
        sectionSpacing: 100,
        marginSize: 'normal'
    };

    // ===========================================
    // MODE TABS SYSTEM
    // ===========================================
    const modeTabs = document.querySelectorAll('.mode-tab');
    const panelContents = document.querySelectorAll('.panel-content');

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
        const { header, summary, keyHighlights, skills, experience, education, projects, coverLetter } = data.resume;
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Skills Grid
        const skillsHTML = Object.entries(skills).map(([cat, list]) => `
            <div class="res-skill-row" data-editable="skill-${cat}">
                <span class="res-skill-cat">${cat.replace(/_/g, ' ').toUpperCase()}:</span>
                <span>${Array.isArray(list) ? list.join(', ') : list}</span>
            </div>
        `).join('');

        // Key Highlights (Executive Summary Addition)
        const highlightsHTML = (keyHighlights && keyHighlights.length > 0) ? `
            <div class="res-highlights" data-editable="highlights">
                <ul>
                    ${keyHighlights.map(h => `<li>${h}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        // Experience
        const expHTML = experience.map((job, i) => `
            <div class="res-job" data-editable="experience-${i}">
                <div class="res-job-header">
                    <div>
                        <span class="res-company">${job.company}</span> <span class="res-divider">|</span> <span class="res-role">${job.role}</span>
                    </div>
                    <span class="res-date">${job.period}</span>
                </div>
                <ul>
                    ${job.bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
            </div>
        `).join('');

        // Education
        const eduHTML = education.map((edu, i) => `
            <div class="res-job-header" data-editable="education-${i}">
                <div><span class="res-company">${edu.school}</span></div>
                <span class="res-date">${edu.year}</span>
            </div>
            <div class="res-degree">${edu.degree}</div>
        `).join('');

        // Projects
        const projHTML = projects ? projects.map((p, i) => `
            <div class="res-job" style="margin-bottom:0.8rem" data-editable="project-${i}">
                <div class="res-job-header">
                    <span class="res-company">${p.name}</span>
                    <span class="res-date" style="font-size:0.75rem">${p.tech.join(' | ')}</span>
                </div>
                <div style="font-size:0.9rem; margin-top:0.2rem">${p.description}</div>
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

            const bodyContent = (typeof body === 'string' && body.includes('\n\n')) || (typeof body === 'string' && !isObj)
                ? body.split('\n\n').map(p => `<p>${p}</p>`).join('')
                : `<p>${body}</p>`;

            coverLetterHTML = `
            <div class="cover-letter-page" data-editable="cover-letter">
                <div class="cover-header">
                    <div class="cover-sender">
                        <div class="cover-sender-name">${header.name}</div>
                        <div>${header.contact.email} • ${header.contact.location}</div>
                        <div>${header.contact.linkedin}</div>
                        <div class="cover-portfolio-link">${header.contact.portfolio || ''}</div>
                    </div>
                    <div class="cover-date">${today}</div>
                </div>
                
                <div class="cover-recipient">
                    <div class="cover-recipient-name">${recipient}</div>
                    <div class="cover-recipient-role">Talent Acquisition Team</div>
                </div>

                <div class="cover-subject"><strong>RE: ${subject}</strong></div>

                <div class="cover-salutation">Dear ${recipient.split(' ')[0] || "Hiring Team"},</div>

                <div class="cover-body">
                    ${opening ? `<p class="cover-opening"><strong>${opening}</strong></p>` : ''}
                    ${bodyContent}
                </div>

                <div class="cover-closing">
                    <div>${closing}</div>
                    <div class="cover-signature">
                        <div class="cover-signature-name">${header.name}</div>
                    </div>
                </div>
            </div>`;
        }

        // FULL DOCUMENT
        resumeDocument.innerHTML = `
            ${coverLetterHTML}
            
            <div class="resume-page">
                <header class="res-header" data-editable="header">
                    <h1 class="res-name">${header.name}</h1>
                    <span class="res-title">${header.title}</span>
                    <div class="res-contact">
                        <span>${header.contact.email}</span>
                        <span class="res-separator">•</span>
                        <span>${header.contact.linkedin}</span>
                        <span class="res-separator">•</span>
                        <span>${header.contact.location}</span>
                    </div>
                </header>

                <section class="res-section" data-editable="summary">
                    <div class="res-summary">${summary}</div>
                </section>

                ${highlightsHTML}

                <section class="res-section" data-editable="skills">
                    <div class="res-section-title">Core Competencies & Technical Skills</div>
                    <div class="res-skills-grid">
                        ${skillsHTML}
                    </div>
                </section>

                <section class="res-section" data-editable="experience">
                    <div class="res-section-title">Professional Experience</div>
                    ${expHTML}
                </section>

                ${projHTML ? `
                <section class="res-section" data-editable="projects">
                    <div class="res-section-title">Key Projects & Innovation</div>
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
            const modelName = modelModel.includes('pro') ? 'Gemini 3.0 Pro' : 'Gemini 3.0 Flash';
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

            log('', 'info');
            log('═══════════════════════════════════════', 'success');
            log('✓ WORKFLOW COMPLETE - EDITOR READY', 'success');
            log('═══════════════════════════════════════', 'success');
            log('', 'info');
            log('Switch to EDIT tab to customize content', 'info');

        } catch (err) {
            log('', 'error');
            log('✗ CRITICAL FAILURE IN WORKFLOW', 'error');
            log(`  Error: ${err.message}`, 'error');
            console.error(err);
            statusLabel.textContent = 'ERROR';
            statusLabel.className = 'ctrl-value';
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
    // EDIT MODE TOGGLE
    // ===========================================
    const toggleEditBtn = document.getElementById('toggle-edit-mode');

    toggleEditBtn.addEventListener('click', () => {
        isEditMode = !isEditMode;
        resumeDocument.contentEditable = isEditMode;
        resumeDocument.classList.toggle('editing', isEditMode);
        toggleEditBtn.classList.toggle('active', isEditMode);

        log(isEditMode ? 'Edit mode enabled - Click on content to edit' : 'Edit mode disabled', 'info');
    });

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
                formHTML = data.education.map((edu, i) => `
                    <div class="education-block" data-index="${i}">
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
                    </div>
                `).join('<hr style="border-color: #333; margin: 1rem 0;">');
                break;
        }

        modalContent.innerHTML = formHTML;
        modal.classList.remove('hidden');
        modal.dataset.section = section;

        // Add form styles
        addFormStyles();
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
                });
                break;
        }

        renderResume(currentResumeData);
        modal.classList.add('hidden');
        log(`${section.charAt(0).toUpperCase() + section.slice(1)} updated`, 'success');
    });

    // ===========================================
    // STYLE PANEL CONTROLS
    // ===========================================

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

    // Color Selection
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            styleState.accentColor = swatch.dataset.color;
            applyStyles();
            log(`Accent: ${swatch.dataset.color}`, 'info');
        });
    });

    // Typography Controls
    document.getElementById('heading-font').addEventListener('change', (e) => {
        styleState.headingFont = e.target.value;
        applyStyles();
    });

    document.getElementById('body-font').addEventListener('change', (e) => {
        styleState.bodyFont = e.target.value;
        applyStyles();
    });

    document.getElementById('font-scale').addEventListener('input', (e) => {
        styleState.fontScale = parseInt(e.target.value);
        document.getElementById('font-scale-value').textContent = `${styleState.fontScale}%`;
        applyStyles();
    });

    // Spacing Controls
    document.getElementById('section-spacing').addEventListener('input', (e) => {
        styleState.sectionSpacing = parseInt(e.target.value);
        applyStyles();
    });

    document.getElementById('margin-size').addEventListener('change', (e) => {
        styleState.marginSize = e.target.value;
        applyStyles();
    });

    // Apply Styles Function
    function applyStyles() {
        if (!resumeDocument) return;

        // Font scale
        const scale = styleState.fontScale / 100;
        resumeDocument.style.fontSize = `${10 * scale}pt`;

        // Accent color (apply to highlights)
        document.documentElement.style.setProperty('--resume-accent', styleState.accentColor);

        // Section spacing
        const spacingScale = styleState.sectionSpacing / 100;
        resumeDocument.querySelectorAll('.res-section').forEach(section => {
            section.style.marginBottom = `${1.8 * spacingScale}rem`;
        });

        // Margin sizes
        const margins = {
            'compact': '15mm 18mm',
            'normal': '22mm 25mm',
            'wide': '28mm 30mm'
        };
        resumeDocument.style.padding = margins[styleState.marginSize];

        // Heading font
        resumeDocument.querySelectorAll('.res-name, .res-section-title, .res-company').forEach(el => {
            el.style.fontFamily = styleState.headingFont;
        });

        // Body font
        resumeDocument.querySelectorAll('.res-summary, .res-role, li').forEach(el => {
            el.style.fontFamily = styleState.bodyFont;
        });
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
    // FUTURE EXPORT PLACEHOLDER
    // ===========================================
    document.getElementById('future-export').addEventListener('click', () => {
        log('PDF Export coming soon! Modern library integration planned.', 'info');
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

    // ===========================================
    // ATS ANALYSIS SYSTEM
    // ===========================================
    const commonKeywords = [
        'leadership', 'management', 'project', 'team', 'strategy', 'development',
        'analysis', 'implementation', 'optimization', 'collaboration', 'communication',
        'problem-solving', 'innovation', 'agile', 'scrum', 'javascript', 'react',
        'python', 'sql', 'aws', 'cloud', 'devops', 'api', 'testing', 'deployment'
    ];

    document.getElementById('run-ats-analysis').addEventListener('click', () => {
        if (!currentResumeData) {
            log('Generate a resume first', 'error');
            return;
        }

        log('Running ATS analysis...', 'process');

        const resumeText = resumeDocument.innerText.toLowerCase();
        const jobText = jobDescriptionInput.value.toLowerCase();

        // Extract keywords from job description
        const jobWords = jobText.match(/\b[a-z]{4,}\b/g) || [];
        const uniqueJobWords = [...new Set(jobWords)].filter(w =>
            commonKeywords.includes(w) || jobWords.filter(x => x === w).length > 1
        );

        // Check which keywords are found
        const foundKeywords = [];
        const missingKeywords = [];

        uniqueJobWords.slice(0, 15).forEach(keyword => {
            if (resumeText.includes(keyword)) {
                foundKeywords.push(keyword);
            } else {
                missingKeywords.push(keyword);
            }
        });

        // Calculate scores
        const keywordScore = uniqueJobWords.length > 0
            ? Math.round((foundKeywords.length / uniqueJobWords.length) * 100)
            : 50;

        const bulletCount = (resumeText.match(/•|▪|◦|-\s/g) || []).length;
        const hasQuantifiables = /\d+%|\$\d+|\d+\+|\d+x/g.test(resumeText);
        const formatScore = Math.min(100, 60 + bulletCount * 2 + (hasQuantifiables ? 20 : 0));

        const skillCategories = currentResumeData.resume.skills ? Object.keys(currentResumeData.resume.skills).length : 0;
        const skillsScore = Math.min(100, skillCategories * 25);

        const overallScore = Math.round((keywordScore + formatScore + skillsScore) / 3);

        // Update UI
        updateATSDisplay(overallScore, keywordScore, skillsScore, formatScore);
        displayKeywords(foundKeywords, missingKeywords);
        updateDocumentStats();

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
        // Simulate AI response for now (would connect to actual API)
        await new Promise(r => setTimeout(r, 800));

        const prompts = {
            improve: `More impactful version: ${text.charAt(0).toUpperCase() + text.slice(1)}`,
            quantify: text.replace(/improved|increased|reduced/gi, match =>
                `${match} by 35%`),
            shorten: text.split(' ').slice(0, Math.ceil(text.split(' ').length * 0.6)).join(' '),
            expand: `${text}. This initiative demonstrated strong leadership and delivered measurable results.`
        };

        return prompts[action] || text;
    }

    document.getElementById('apply-rewrite')?.addEventListener('click', () => {
        if (!selectedTextRange || !popupRewritten.textContent) return;

        saveToHistory();

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(selectedTextRange);

        document.execCommand('insertText', false, popupRewritten.textContent);

        aiPopup.classList.add('hidden');
        log('Text rewritten successfully', 'success');
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

    document.getElementById('export-json')?.addEventListener('click', () => {
        if (!currentResumeData) {
            log('No resume to export', 'error');
            return;
        }

        const blob = new Blob([JSON.stringify(currentResumeData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume-data.json';
        a.click();
        URL.revokeObjectURL(url);

        log('Resume exported as JSON', 'success');
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
