/**
 * Main Application Logic
 * Handles global state, cursor, and initialization of sub-modules.
 */

// We will use ES modules, so we can import when we split files further.
// For now, this acts as the orchestrator.

document.addEventListener('DOMContentLoaded', () => {
    console.log("Main.js: DOM Content Loaded. Initializing...");
    initLoader();
    // initCursor(); // Removed for stability
    initTheme();
    initMagneticButtons();

    // Failsafe: Clear any inline cursor styles that might remain
    document.body.style.cursor = '';
    document.documentElement.style.cursor = '';
});

/* --- Loader --- */
function initLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        const hideLoader = () => {
            setTimeout(() => {
                loader.classList.add('hidden');
                document.body.classList.add('loaded');
            }, 800);
        };

        if (document.readyState === 'complete') {
            hideLoader();
        } else {
            window.addEventListener('load', hideLoader);
        }
    }
}



/* --- Case Study System --- */

// Case Study Data Store
const projectData = {
    "tactix": {
        id: "001",
        title: "Tactix",
        category: "REAL-TIME ENGINE",
        tagline: "A high-fidelity WebGL chess system combining client-side engine compute, event-driven real-time multiplayer, and a resilient serverless generative coaching API.",
        links: { live: "https://tactix.run", repo: "#" }, // Repo hidden if private
        stats: [
            { label: "Architecture", value: "Multi-runtime" },
            { label: "Complexity", value: "High" },
            { label: "Type", value: "Monorepo" }
        ],
        technical_story: {
            challenge: "Deliver AAA-grade 3D rendering and deterministic chess rules while supporting low-latency multiplayer over unreliable networks and keeping LLM-based coaching reliable under serverless time limits.",
            solution: "Built a performance-budgeted R3F/WebGL pipeline (adaptive DPR), a state-machine-driven WebSocket protocol with reconnection semantics, and a strict JSON-schema AI exam-report endpoint with retries/timeouts.",
            outcome: "Guaranteed bounded responsiveness: multiplayer heartbeat + 2-minute reconnection window, AI exam reports constrained to 30s envelope, and dynamic render scaling."
        },
        architecture: {
            diagram_description: "React/R3F Client (WebGL) -> WebSocket Service (Railway) -> Serverless Function (AI) -> Supabase (Postgres).",
            stack_breakdown: [
                { layer: "Frontend", tech: "React 19, TypeScript, Three.js (R3F)", details: "WebGL scene orchestration with adaptive DPR and conditional post-processing." },
                { layer: "Real-time", tech: "Node.js, WebSockets (ws)", details: "Event-driven room protocol, authoritative validation, and reconnection handling." },
                { layer: "Compute", tech: "Stockfish.js (WASM)", details: "Client-side UCI worker wrapper with ELO tuning and time-bounded fallbacks." },
                { layer: "Data", tech: "Supabase (Postgres), RLS", details: "Profiles, game history, and session analytics deduplication." }
            ]
        },
        key_features: [
            { title: "Client-Side Engine Compute", desc: "WASM-based Stockfish worker with multi-parameter difficulty envelopes and deterministic heuristic fallbacks." },
            { title: "Event-Driven Multiplayer", desc: "Message-driven state machine dealing with room orchestration, authoritative validation, and zombie-connection cleanup." },
            { title: "Generative Exam Reports", desc: "Strict JSON-schema AI pipeline with retry strategies and deterministic degradation on timeout." }
        ]
    },
    "globfam": {
        id: "002",
        title: "GlobFam",
        category: "GROWTH ENGINE",
        tagline: "A performance-governed, event-driven growth system built on Next.js App Router with Supabase-backed ingestion and automated Core Web Vitals enforcement.",
        links: { live: "https://globfam.io", repo: "#" },
        stats: [
            { label: "Lighthouse", value: "Perf ≥ 90" },
            { label: "CWV", value: "LCP ≤ 2.5s" },
            { label: "Type", value: "Full-Stack" }
        ],
        technical_story: {
            challenge: "Delivering a premium motion-heavy experience while enforcing strict Core Web Vitals budgets and building a secure waitlist ingestion plane.",
            solution: "Implemented an event-driven signup pipeline (dedupe → persist → deliver) via Route Handlers, secured admin surfaces with SSR sessions, and embedded performance governance via CI gates.",
            outcome: "Shipped a minimal route footprint (≈24kB), reduced unnecessary re-renders by ~60%, and enforced performance thresholds automatically in CI."
        },
        architecture: {
            diagram_description: "Client (Next.js) -> Route Handlers -> Supabase (Postgres) -> Resend (Email).",
            stack_breakdown: [
                { layer: "Frontend", tech: "Next.js 15, Tailwind v4, Framer Motion", details: "Dynamic imports + Suspense boundaries; scroll UX normalized with Lenis." },
                { layer: "Backend", tech: "Route Handlers, Supabase", details: "API-first ingestion with idempotency and protected admin endpoints." },
                { layer: "Governance", tech: "Lighthouse CI, Playwright", details: "CI assertions for minimum scores and interaction stability." }
            ]
        },
        artifacts: [
            "assets/img/projects/globfam/design-system.webp",
            "assets/img/projects/globfam/mobile-mockup.webp"
        ],
        key_features: [
            { title: "Event-Driven Ingestion", desc: "Server-side pipeline validating input, enforcing idempotency, and emitting transactional emails asynchronously." },
            { title: "Performance Governance", desc: "LCI and Playwright tests treating performance and layout stability as build-breaking constraints." },
            { title: "Hardened Admin Plane", desc: "SSR session layer enforcing auth at the middleware boundary for defense-in-depth." }
        ]
    },
    "nuu": {
        id: "003",
        title: "NUU",
        category: "GENAI SEARCH",
        tagline: "A generative, retrieval-augmented property matching system ranking listings via hybrid vector retrieval + deterministic scoring.",
        links: { live: "https://nuu.agency/", repo: "#" },
        stats: [
            { label: "Search", value: "Hybrid RAG" },
            { label: "Complexity", value: "High" },
            { label: "Runtime", value: "Edge" }
        ],
        technical_story: {
            challenge: "Make GPT-driven natural-language search reliable and explainable while keeping query-time performance bounded.",
            solution: "Enforced structured JSON extraction for preferences, pruned candidates via pgvector, then applied a deterministic multi-factor scoring model.",
            outcome: "Bounded query-time complexity to fixed-size candidate sets (top-100 semantic) while delivering explainable, stable rankings."
        },
        architecture: {
            diagram_description: "Client -> Serverless API -> OpenAI + Supabase (pgvector) -> Ranking Engine.",
            stack_breakdown: [
                { layer: "Frontend", tech: "React 19, Vite, Tailwind", details: "Stateful conversational UI with progressive disclosure and 3D hero elements." },
                { layer: "AI Backend", tech: "Node/TS, OpenAI, pgvector", details: "LLM preference extraction + hybrid retrieval pipeline (vector + sql)." },
                { layer: "Data", tech: "Supabase, JSONB + GIN", details: "Listings stored with flexible features; 1536-dim embeddings for semantic search." }
            ]
        },
        key_features: [
            { title: "Deterministic Interface", desc: "Forcing LLMs to emit strict JSON schemas to convert probabilistic language into typed filters." },
            { title: "Hybrid Ranking", desc: "Blending vector similarity boosting with hard constraints (budget, geo-distance) for reliability." },
            { title: "Vectorized ETL", desc: "Pipeline transforming raw listings into canonical embeddings independent of query latency." }
        ]
    },
    "craefto": {
        id: "004",
        title: "Craefto Lab",
        category: "GENERATIVE OPS",
        tagline: "Event-driven operating system turning bookings into AI-generated project handbooks and workflow automation.",
        links: { live: "https://craefto.com", repo: "#" },
        stats: [
            { label: "API Routes", value: "56" },
            { label: "AI Modules", value: "8" },
            { label: "DB", value: "RLS-Hardened" }
        ],
        technical_story: {
            challenge: "Converting ambiguous client intake into structured project artifacts while keeping integrations resilient.",
            solution: "Implemented dependency-aware multi-agent orchestration with retries/backoff; persisted outputs to Postgres governed by RLS and triggers.",
            outcome: "End-to-end flows generate full handbooks and persist 15–30 tasks per project with automatic provisioning."
        },
        architecture: {
            diagram_description: "Client -> Route Handlers -> Supabase (RLS) -> Multi-Agent Orchestration -> Integrations.",
            stack_breakdown: [
                { layer: "Frontend", tech: "Next.js 14, React 18", details: "Hybrid rendering with lightweight state management and prefetch-driven UX." },
                { layer: "Backend", tech: "Route Handlers, Supabase", details: "Typed APIs with pagination, relational selects, and session-aware routes." },
                { layer: "Generative", tech: "OpenAI JSON Mode", details: "Dependency-graph orchestration with validation and synthesis." }
            ]
        },
        key_features: [
            { title: "Multi-Agent Orchestration", desc: "Workflow engine executing specialized agents based on explicit dependency graphs." },
            { title: "Database Automation", desc: "Strict RLS policies and triggers for side-effect management and activity logging." },
            { title: "Resilient Integrations", desc: "Best-effort pipelines for Notion/Email that don't block core transaction paths." }
        ]
    },
    "artisan": {
        id: "005",
        title: "Artisan",
        category: "WORKFORCE OPS",
        tagline: "Edge-authenticated, type-safe workforce operations system built as a Turborepo monorepo with a shared Postgres kernel.",
        links: { live: "#", repo: "#" },
        stats: [
            { label: "Type", value: "Monorepo" },
            { label: "Auth", value: "Edge Middleware" },
            { label: "Schema", value: "Prisma Shared" }
        ],
        technical_story: {
            challenge: "Shipping web + mobile surfaces while keeping auth, domain rules, and data integrity consistent.",
            solution: "Centralized the domain into a shared Prisma/Postgres kernel, enforced edge auth via middleware, and used API-first Route Handlers.",
            outcome: "Eliminated duplication via single schema + generated client, enabling end-to-end typed workflows."
        },
        architecture: {
            diagram_description: "Web/Mobile -> Edge Auth (Clerk) -> Service Layer -> Shared Prisma Client -> Postgres.",
            stack_breakdown: [
                { layer: "Frontend", tech: "Next.js App Router, Expo", details: "Server-rendered admin dashboard + cross-platform mobile app." },
                { layer: "Data Kernel", tech: "Prisma, Postgres", details: "Single source-of-truth schema with explicit workflow enums." },
                { layer: "Infrastructure", tech: "Turborepo", details: "Monorepo orchestration and shared UI/logic packages." }
            ]
        },
        key_features: [
            { title: "Shared Domain Kernel", desc: "Prisma schema with centralized enums preventing model drift across apps." },
            { title: "Edge Authentication", desc: "Clerk middleware enforcing auth gates before any DB access occurs." },
            { title: "Atomic Operations", desc: "Nested writes and transactional boundaries for timesheet/issue lifecycles." }
        ]
    },
    "pitch": {
        id: "006",
        title: "Templates Deck",
        category: "INTERACTIVE DECK",
        tagline: "Event-driven, animation-orchestrated single-page deck fusing data-viz with persisted theming.",
        links: { live: "#", repo: "#" },
        stats: [
            { label: "Runtime", value: "Static SPA" },
            { label: "State", value: "Event-Driven" },
            { label: "Perf", value: "Zero-Latency" }
        ],
        technical_story: {
            challenge: "Delivering a deck-like narrative with chart-heavy content and motion transitions without backend latency.",
            solution: "Implemented an event-driven UI state machine with Framer Motion orchestration and a class-based dark-mode engine.",
            outcome: "Zero backend dependency navigation with deterministic transitions and fully client-contained experience."
        },
        architecture: {
            diagram_description: "Browse -> React SPA -> Framer Motion -> Recharts -> LocalStorage.",
            stack_breakdown: [
                { layer: "Frontend", tech: "React 19, Framer Motion", details: "Single-component feature surface with explicit state boundaries." },
                { layer: "Visualization", tech: "Recharts", details: "Responsive charts with custom tooltip renderers and theme adaptation." },
                { layer: "System", tech: "LocalStorage, Tailwind", details: "Persisted theme engine and atomic styling architecture." }
            ]
        },
        key_features: [
            { title: "Transition Orchestration", desc: "AnimatePresence-driven page lifecycle for seamless section swapping." },
            { title: "Persisted Theming", desc: "Class-based dark mode engine with cross-session storage sync." },
            { title: "Resilient UX", desc: "Progressive enhancement for clipboard actions and adaptive chart scaling." }
        ]
    }
};

// Elements
const csOverlay = document.getElementById('case-study-overlay');
const csCloseBtn = document.getElementById('cs-close-btn');

// Open Case Study
function openCaseStudy(projectId) {
    console.log(`Attempting to open case study for: ${projectId}`);

    const data = projectData[projectId];
    if (!data) {
        return console.warn(`Project ID ${projectId} not found.`);
    }

    // Lazy fetch overlay to ensure it exists
    const overlay = document.getElementById('case-study-overlay');
    if (!overlay) {
        return console.error('Overlay element not found');
    }

    // Populate Hero
    const idEl = document.getElementById('cs-id');
    if (idEl) idEl.textContent = `${data.id} — ${data.category}`;

    const dateEl = document.getElementById('cs-date');
    if (dateEl) dateEl.textContent = "2025"; // Defaulting year

    const titleEl = document.getElementById('cs-title');
    if (titleEl) titleEl.textContent = data.title;

    const taglineEl = document.getElementById('cs-tagline');
    if (taglineEl) taglineEl.textContent = data.tagline;

    const liveBtn = document.getElementById('cs-live-link');
    const repoBtn = document.getElementById('cs-repo-link');

    if (data.links.live && data.links.live !== "#") {
        if (liveBtn) {
            liveBtn.href = data.links.live;
            liveBtn.style.display = 'inline-flex';
        }
    } else {
        if (liveBtn) liveBtn.style.display = 'none';
    }

    if (data.links.repo && data.links.repo !== "#") {
        if (repoBtn) {
            repoBtn.href = data.links.repo;
            repoBtn.style.display = 'inline-flex';
        }
    } else {
        if (repoBtn) repoBtn.style.display = 'none';
    }

    // Stats
    const statsContainer = document.getElementById('cs-stats-grid');
    if (statsContainer) {
        statsContainer.innerHTML = data.stats.map(stat => `
            <div class="cs-stat-item">
                <h4>${stat.label}</h4>
                <p>${stat.value}</p>
            </div>
        `).join('');
    }

    // Narrative (Challenge / Solution)
    const challengeEl = document.getElementById('cs-challenge');
    if (challengeEl) challengeEl.textContent = data.technical_story.challenge;

    const solutionEl = document.getElementById('cs-solution');
    if (solutionEl) solutionEl.textContent = `${data.technical_story.solution} \n\nOUTCOME: ${data.technical_story.outcome}`;

    // Tech Architecture (Dynamic Layers)
    // We strictly map the first 3 layers to the 3 columns for layout consistency, or loop if we change HTML
    // Current HTML has 3 uls: frontend, backend, infra. We will try to map loosely or just clear/rebuild.

    // Better approach: Rebuild the whole tech grid content dynamically based on data
    const techGrid = document.querySelector('.cs-tech-grid');
    if (techGrid && data.architecture.stack_breakdown) {
        techGrid.innerHTML = data.architecture.stack_breakdown.map(layer => `
            <div class="cs-tech-col">
                <h4 style="border-bottom: 2px solid var(--gray-200); padding-bottom: 0.5rem; margin-bottom: 1rem;">${layer.layer}</h4>
                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--gray-500); margin-bottom: 0.5rem;">${layer.tech}</div>
                <p style="font-size: 0.9rem; color: var(--gray-600); line-height: 1.5;">${layer.details}</p>
            </div>
        `).join('');
    }

    // Design Showcase (Gallery)
    const galleryContainer = document.getElementById('cs-gallery');
    if (galleryContainer) {
        if (data.artifacts && data.artifacts.length > 0) {
            galleryContainer.innerHTML = data.artifacts.map(src => `
                <div class="cs-gallery-item">
                    <img src="${src}" alt="${data.title} Artifact" loading="lazy" style="width: 100%; height: auto; border: 1px solid var(--gray-200);">
                </div>
            `).join('');
        } else {
            galleryContainer.innerHTML = `
                <div class="cs-gallery-placeholder">
                    <span>AWAITING DESIGN ARTIFACTS</span>
                </div>
            `;
        }
    }

    // Key Features Deep Dive (Injecting a new section for this if it doesn't exist, or appending/modifying Narrative)
    // Let's create a 'Deep Dive' section below narrative if it's not already there.
    // For now, we will assume standard layout.

    // Show Overlay
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset scroll position to top
    overlay.scrollTop = 0;
    const csContent = overlay.querySelector('.cs-content');
    if (csContent) {
        csContent.scrollTop = 0;
    }

    console.log('Case Study Opened Successfully');
}

// Close Case Study
function closeCaseStudy() {
    const overlay = document.getElementById('case-study-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none'; // Force hide
    }
    document.body.style.overflow = '';
}

// Event Listeners
if (csCloseBtn) csCloseBtn.addEventListener('click', closeCaseStudy);

// Global Project Click Handler
document.addEventListener('click', (e) => {
    // Check for button or immediate parent (for icon support if added later)
    const btn = e.target.closest('a');
    console.log('Click detected on:', e.target);
    if (btn) console.log('Button found:', btn, 'Data ID:', btn.dataset.id);

    if (btn && btn.dataset.id && projectData[btn.dataset.id]) {
        e.preventDefault();
        console.log('Opening case study for:', btn.dataset.id);
        openCaseStudy(btn.dataset.id);
    } else {
        if (btn) console.warn('Button clicked but no matching project data found for ID:', btn.dataset.id);
    }
});


/* --- Theme System --- */
/* --- Theme System --- */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');

    // Load saved theme immediately to prevent flash
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

/* --- Magnetic Buttons --- */
function initMagneticButtons() {
    // Basic magnetic effect using simple translation
    // In full implementation, we will use GSAP for smoother physics
    const magnets = document.querySelectorAll('.btn-primary, .nav-cta, .theme-toggle');

    magnets.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0px, 0px)';
        });
    });
}
