import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function initHeroScene() {
    const container = document.getElementById('hero-canvas-container');
    if (!container) return;

    // ═══════════════════════════════════════════════════════════════════
    // SCENE SETUP
    // ═══════════════════════════════════════════════════════════════════
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.025);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 7;
    camera.position.x = 0;

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ═══════════════════════════════════════════════════════════════════
    // NOISE FUNCTIONS - Advanced Curl Noise Implementation
    // ═══════════════════════════════════════════════════════════════════

    // Simplex-like noise approximation
    const permute = (x) => ((x * 34.0 + 1.0) * x) % 289.0;

    const noise3D = (x, y, z) => {
        const a = Math.sin(x * 1.2 + y * 0.9 + z * 1.5) * 0.5;
        const b = Math.sin(y * 1.8 + z * 1.1 + x * 0.7) * 0.5;
        const c = Math.sin(z * 1.4 + x * 1.6 + y * 0.8) * 0.5;
        return (a + b + c) / 1.5;
    };

    // Curl noise for fluid-like motion
    const curlNoise = (x, y, z, t) => {
        const eps = 0.0001;
        const n1 = noise3D(x, y + eps, z + t);
        const n2 = noise3D(x, y - eps, z + t);
        const n3 = noise3D(x, y, z + eps + t);
        const n4 = noise3D(x, y, z - eps + t);
        const n5 = noise3D(x + eps, y, z + t);
        const n6 = noise3D(x - eps, y, z + t);

        return {
            x: (n1 - n2) / (2 * eps) - (n3 - n4) / (2 * eps),
            y: (n3 - n4) / (2 * eps) - (n5 - n6) / (2 * eps),
            z: (n5 - n6) / (2 * eps) - (n1 - n2) / (2 * eps)
        };
    };

    // Fractional Brownian Motion for multi-scale turbulence
    const fbm = (x, y, z, octaves = 4) => {
        let value = 0;
        let amplitude = 0.5;
        let frequency = 1;
        for (let i = 0; i < octaves; i++) {
            value += amplitude * noise3D(x * frequency, y * frequency, z * frequency);
            amplitude *= 0.5;
            frequency *= 2;
        }
        return value;
    };

    // ═══════════════════════════════════════════════════════════════════
    // GEOMETRY SAMPLING
    // ═══════════════════════════════════════════════════════════════════

    function getVertices(geo, count) {
        const posAttribute = geo.attributes.position;
        const vertexCount = posAttribute.count;
        const output = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const index = Math.floor((i / count) * vertexCount);
            output[i * 3] = posAttribute.getX(index);
            output[i * 3 + 1] = posAttribute.getY(index);
            output[i * 3 + 2] = posAttribute.getZ(index);

            // Volume jitter
            const jitter = 0.03;
            output[i * 3] += (Math.random() - 0.5) * jitter;
            output[i * 3 + 1] += (Math.random() - 0.5) * jitter;
            output[i * 3 + 2] += (Math.random() - 0.5) * jitter;
        }
        return output;
    }

    // Generate scattered cloud (chaos state)
    function getScatteredCloud(count, radius = 4) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = radius * Math.cbrt(Math.random()); // Cubic root for uniform volume

            output[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            output[i * 3 + 2] = r * Math.cos(phi);
        }
        return output;
    }

    // ═══════════════════════════════════════════════════════════════════
    // PARTICLE SYSTEM CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════

    const particlesCount = 25000; // Dense cloud

    // ═══════════════════════════════════════════════════════════════════
    // JELLYFISH - Recognizable Ethereal Creatures with Maximum Detail
    // ═══════════════════════════════════════════════════════════════════

    function getJellyfish(count) {
        const output = new Float32Array(count * 3);

        // Fewer, smaller, well-spaced jellyfish for clear recognition
        const jellyfishCount = 12;
        const scale = 1.3;  // Larger scene for spacing

        // Generate well-spaced positions using golden angle
        const jellyfish = [];
        for (let j = 0; j < jellyfishCount; j++) {
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const angle = j * goldenAngle;
            const t = j / jellyfishCount;
            const radiusBase = 3 + t * 3.5;  // 3 to 6.5 units - wider spread
            const heightVar = (j % 3 - 1) * 2.8 + Math.sin(j * 1.3) * 1.2;
            const depthVar = Math.cos(j * 2.1) * 2.5;

            jellyfish.push({
                x: Math.cos(angle) * radiusBase,
                y: heightVar,
                z: depthVar + Math.sin(angle) * 1.8,
                size: 0.12 + Math.random() * 0.18,  // Smaller: 0.12 to 0.30
                phase: j * 0.5,  // Staggered animation
                pulseSpeed: 0.5 + Math.random() * 0.3
            });
        }

        // More particles on tentacles for recognizable jellyfish shape
        // 25% bell, 8% inner glow, 15% rim, 40% tentacles, 12% oral arms
        const bellOuterCount = Math.floor(count * 0.25);
        const bellInnerCount = Math.floor(count * 0.08);
        const rimCount = Math.floor(count * 0.15);
        const tentacleCount = Math.floor(count * 0.40);
        const oralArmCount = count - bellOuterCount - bellInnerCount - rimCount - tentacleCount;

        let idx = 0;

        // ─────────────────────────────────────────────────────────────
        // BELL OUTER MEMBRANE - Translucent dome surface
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < bellOuterCount; i++) {
            const jelly = jellyfish[i % jellyfishCount];

            const u = Math.random();
            const v = Math.random() * 0.65;  // Dome coverage

            const theta = u * Math.PI * 2;
            const phi = v * Math.PI;

            // Organic bell shape with wobble
            const wobble = 1 + Math.sin(theta * 6 + jelly.phase) * 0.03;
            const bellRadius = jelly.size * (0.9 + Math.sin(phi) * 0.25) * wobble;
            const bellHeight = jelly.size * 0.55;

            let x = Math.sin(phi) * Math.cos(theta) * bellRadius;
            let y = Math.cos(phi) * bellHeight + jelly.size * 0.2;
            let z = Math.sin(phi) * Math.sin(theta) * bellRadius;

            // Organic membrane ripples
            const ripple = Math.sin(theta * 12 + phi * 4) * 0.015 * jelly.size;
            x += ripple * Math.cos(theta);
            z += ripple * Math.sin(theta);

            output[idx * 3] = (jelly.x + x) * scale;
            output[idx * 3 + 1] = (jelly.y + y) * scale;
            output[idx * 3 + 2] = (jelly.z + z) * scale;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // BELL INNER GLOW - Bioluminescent core
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < bellInnerCount; i++) {
            const jelly = jellyfish[i % jellyfishCount];

            const u = Math.random();
            const v = Math.random() * 0.5;

            const theta = u * Math.PI * 2;
            const phi = v * Math.PI;

            // Smaller inner structure
            const innerRadius = jelly.size * 0.5 * (0.7 + Math.sin(phi) * 0.2);

            let x = Math.sin(phi) * Math.cos(theta) * innerRadius;
            let y = Math.cos(phi) * jelly.size * 0.35 + jelly.size * 0.15;
            let z = Math.sin(phi) * Math.sin(theta) * innerRadius;

            output[idx * 3] = (jelly.x + x) * scale;
            output[idx * 3 + 1] = (jelly.y + y) * scale;
            output[idx * 3 + 2] = (jelly.z + z) * scale;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // BELL RIM - Detailed scalloped edge
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < rimCount; i++) {
            const jelly = jellyfish[i % jellyfishCount];

            const theta = (i / rimCount) * Math.PI * 2 * jellyfishCount;
            const rimRadius = jelly.size * 0.85;

            // Scalloped edge pattern (8 lobes)
            const scallop = 1 + Math.sin(theta * 8) * 0.12;

            const x = Math.cos(theta) * rimRadius * scallop;
            const y = -jelly.size * 0.05 + Math.sin(theta * 8) * jelly.size * 0.03;
            const z = Math.sin(theta) * rimRadius * scallop;

            output[idx * 3] = (jelly.x + x) * scale;
            output[idx * 3 + 1] = (jelly.y + y) * scale;
            output[idx * 3 + 2] = (jelly.z + z) * scale;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // TENTACLES - Long, flowing, unmistakably jellyfish
        // ─────────────────────────────────────────────────────────────
        const tentaclesPerJelly = 16;  // Many visible tentacles

        for (let i = 0; i < tentacleCount; i++) {
            const jelly = jellyfish[i % jellyfishCount];

            const tentacleIdx = Math.floor((i / tentacleCount) * tentaclesPerJelly * jellyfishCount) % tentaclesPerJelly;
            const tentacleAngle = (tentacleIdx / tentaclesPerJelly) * Math.PI * 2;

            // Long flowing tentacles - key to jellyfish recognition
            const t = Math.pow(Math.random(), 0.5);  // Even distribution along length
            const tentacleLength = jelly.size * (3.5 + Math.random() * 2);  // Much longer: 3.5-5.5x size

            // Start at rim edge
            const startRadius = jelly.size * 0.85;
            const baseX = Math.cos(tentacleAngle) * startRadius;
            const baseZ = Math.sin(tentacleAngle) * startRadius;

            // Elegant S-curve wave motion
            const wave1 = Math.sin(t * Math.PI * 2.5 + tentacleAngle + jelly.phase) * 0.25 * jelly.size * (0.3 + t);
            const wave2 = Math.cos(t * Math.PI * 4 + tentacleAngle * 0.7) * 0.15 * jelly.size * t;
            const twist = Math.sin(t * 6 + jelly.phase * 2) * 0.12 * jelly.size * t;

            // Tentacle spreads gracefully as it descends
            const spread = 1 + t * 0.5;
            const thickness = 1 - t * 0.2;

            const x = (baseX * spread + wave1) * thickness;
            const y = -t * tentacleLength - jelly.size * 0.12;
            const z = (baseZ * spread + wave2 + twist) * thickness;

            output[idx * 3] = (jelly.x + x) * scale;
            output[idx * 3 + 1] = (jelly.y + y) * scale;
            output[idx * 3 + 2] = (jelly.z + z) * scale;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // ORAL ARMS - Frilly central appendages
        // ─────────────────────────────────────────────────────────────
        const oralArmsPerJelly = 4;

        for (let i = 0; i < oralArmCount; i++) {
            const jelly = jellyfish[i % jellyfishCount];

            const armIdx = i % oralArmsPerJelly;
            const armAngle = (armIdx / oralArmsPerJelly) * Math.PI * 2 + Math.PI / 4;

            const t = Math.random();
            const armLength = jelly.size * 0.8;

            // Central position with frilly motion
            const baseRadius = jelly.size * 0.15;
            const frill = Math.sin(t * 10 + armAngle + jelly.phase) * 0.1 * jelly.size;

            const x = Math.cos(armAngle) * (baseRadius + frill * (1 + t));
            const y = -t * armLength - jelly.size * 0.05;
            const z = Math.sin(armAngle) * (baseRadius + frill * (1 + t));

            output[idx * 3] = (jelly.x + x) * scale;
            output[idx * 3 + 1] = (jelly.y + y) * scale;
            output[idx * 3 + 2] = (jelly.z + z) * scale;
            idx++;
        }

        return output;
    }

    // Spiraling Galaxy with logarithmic arms and dust lanes (kept for potential use)
    function getSpiralGalaxy(count, arms = 6, radius = 3.5) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const arm = i % arms;
            const armAngle = (arm / arms) * Math.PI * 2;
            const spiralAngle = Math.log(1 + t * 3) * 6 + armAngle;
            const r = t * radius * (1 + Math.sin(spiralAngle * 3) * 0.15);
            const dustLane = Math.sin(spiralAngle * 5) * 0.3 * t;
            const height = (noise3D(t * 5, arm, 0) * 0.4 + dustLane) * (1 - t * 0.8);

            output[i * 3] = Math.cos(spiralAngle) * r;
            output[i * 3 + 1] = height;
            output[i * 3 + 2] = Math.sin(spiralAngle) * r;
        }
        return output;
    }

    // Klein Bottle - Non-orientable 4D surface projected to 3D
    function getKleinBottle(count, scale = 1.2) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const u = (i / count) * Math.PI * 2;
            const v = ((i * 7) % count / count) * Math.PI * 2;

            const r = 4 * (1 - Math.cos(u) / 2);
            let x, y, z;

            if (u < Math.PI) {
                x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(u) * Math.cos(v);
                y = 16 * Math.sin(u) + r * Math.sin(u) * Math.cos(v);
            } else {
                x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI);
                y = 16 * Math.sin(u);
            }
            z = r * Math.sin(v);

            output[i * 3] = x * scale * 0.08;
            output[i * 3 + 1] = (y - 8) * scale * 0.08;
            output[i * 3 + 2] = z * scale * 0.15;
        }
        return output;
    }

    // Superformula Organic - Gielis superformula for natural shapes
    function getSuperformula(count, m = 7, n1 = 0.2, n2 = 1.7, n3 = 1.7, a = 1, b = 1, radius = 2.5) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = ((i % Math.sqrt(count)) / Math.sqrt(count)) * Math.PI * 2;
            const phi = (Math.floor(i / Math.sqrt(count)) / Math.sqrt(count)) * Math.PI;

            // Superformula calculation
            const r1 = Math.pow(Math.pow(Math.abs(Math.cos(m * theta / 4) / a), n2) +
                Math.pow(Math.abs(Math.sin(m * theta / 4) / b), n3), -1 / n1);
            const r2 = Math.pow(Math.pow(Math.abs(Math.cos(m * phi / 4) / a), n2) +
                Math.pow(Math.abs(Math.sin(m * phi / 4) / b), n3), -1 / n1);

            const r = r1 * r2 * radius * (0.8 + Math.random() * 0.4);

            output[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            output[i * 3 + 2] = r * Math.cos(phi);
        }
        return output;
    }

    // Triple Helix DNA with binding proteins
    function getTripleHelix(count, radius = 1.8, height = 5) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 8;
            const y = (i / count - 0.5) * height;
            const strand = i % 3;
            const offset = strand * (Math.PI * 2 / 3);

            // Breathing radius
            const breathe = 1 + Math.sin(t * 0.5) * 0.15;
            const r = radius * breathe;

            // Add rungs/connections between strands
            const isRung = (i % 15) < 3;
            const rungRadius = isRung ? r * 0.3 : r;

            output[i * 3] = Math.cos(t + offset) * rungRadius;
            output[i * 3 + 1] = y + Math.sin(t * 3) * 0.1;
            output[i * 3 + 2] = Math.sin(t + offset) * rungRadius;
        }
        return output;
    }

    // Nova Explosion with shockwave rings
    function getNovaExplosion(count, radius = 3) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            // Multiple shockwave shells
            const shell = (i % 4) / 4;
            const shellRadius = radius * (0.5 + shell * 0.6);

            // Tendril formation with fractal branching
            const tendril = Math.pow(Math.sin(theta * 12 + phi * 8), 2) *
                Math.pow(Math.cos(theta * 7 - phi * 5), 2);
            const r = shellRadius * (0.7 + tendril * 0.8) * (0.8 + Math.random() * 0.4);

            output[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            output[i * 3 + 2] = r * Math.cos(phi);
        }
        return output;
    }

    // Hopf Fibration - 4D sphere fibers projected to 3D
    function getHopfFibration(count, scale = 2.5) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const fiber = (i % 50) / 50;
            const t = (Math.floor(i / 50) / (count / 50)) * Math.PI * 2;

            // Hopf coordinates
            const eta = fiber * Math.PI;
            const phi1 = t;
            const phi2 = t * 2 + fiber * Math.PI * 4;

            // Stereographic projection from S3 to R3
            const w = Math.cos(eta);
            const x = Math.sin(eta) * Math.cos(phi1);
            const y = Math.sin(eta) * Math.sin(phi1) * Math.cos(phi2);
            const z = Math.sin(eta) * Math.sin(phi1) * Math.sin(phi2);

            const proj = 1 / (1 - w + 0.01);

            output[i * 3] = x * proj * scale * 0.5;
            output[i * 3 + 1] = y * proj * scale * 0.5;
            output[i * 3 + 2] = z * proj * scale * 0.5;
        }
        return output;
    }

    // Tesseract with animated 4D rotation
    function getTesseract(count, size = 2) {
        const output = new Float32Array(count * 3);
        const vertices4D = [];

        // Generate 4D hypercube vertices
        for (let i = 0; i < 16; i++) {
            vertices4D.push([
                ((i >> 0) & 1) * 2 - 1,
                ((i >> 1) & 1) * 2 - 1,
                ((i >> 2) & 1) * 2 - 1,
                ((i >> 3) & 1) * 2 - 1
            ]);
        }

        for (let i = 0; i < count; i++) {
            const t = i / count;
            const v1Idx = i % 16;
            const v2Idx = (i + 1) % 16;
            const lerp = (i % 100) / 100;

            const v1 = vertices4D[v1Idx];
            const v2 = vertices4D[v2Idx];

            // Interpolate along edges
            const w = v1[3] + (v2[3] - v1[3]) * lerp;
            const x = v1[0] + (v2[0] - v1[0]) * lerp;
            const y = v1[1] + (v2[1] - v1[1]) * lerp;
            const z = v1[2] + (v2[2] - v1[2]) * lerp;

            // Perspective projection with 4D depth
            const perspective = 2.5 / (2.5 - w * 0.5);

            output[i * 3] = x * size * perspective + (Math.random() - 0.5) * 0.1;
            output[i * 3 + 1] = y * size * perspective + (Math.random() - 0.5) * 0.1;
            output[i * 3 + 2] = z * size * perspective + (Math.random() - 0.5) * 0.1;
        }
        return output;
    }

    // Blood Cells - Biconcave discs scattered across the viewport (immersive full-screen)
    function getBloodCells(count, spread = 5) {
        const output = new Float32Array(count * 3);
        const cellCount = 40; // Number of blood cells

        for (let i = 0; i < count; i++) {
            // Assign particle to a cell
            const cellIndex = i % cellCount;
            const particleInCell = Math.floor(i / cellCount);

            // Random cell position - spread across entire view
            const seed = cellIndex * 12345.6789;
            const cellX = (Math.sin(seed) * 0.5 + 0.5) * spread * 2 - spread;
            const cellY = (Math.cos(seed * 2) * 0.5 + 0.5) * spread * 1.5 - spread * 0.75;
            const cellZ = (Math.sin(seed * 3) * 0.5 + 0.5) * spread * 2 - spread;

            // Cell size varies
            const cellSize = 0.4 + Math.sin(seed * 4) * 0.2;

            // Create biconcave disc shape (blood cell shape)
            const theta = (particleInCell / (count / cellCount)) * Math.PI * 2;
            const r = cellSize * (0.3 + Math.random() * 0.7);

            // Biconcave profile - thinner in center, thicker at edges
            const radialDist = r / cellSize;
            const biconcaveHeight = cellSize * 0.15 * (1 - Math.pow(radialDist, 2)) *
                (radialDist > 0.3 ? 1 : -0.5); // Indented center

            // Slight random rotation per cell
            const tilt = Math.sin(seed * 5) * 0.5;

            const localX = Math.cos(theta) * r;
            const localY = biconcaveHeight + (Math.random() - 0.5) * 0.05;
            const localZ = Math.sin(theta) * r;

            // Apply cell tilt
            const rotatedY = localY * Math.cos(tilt) - localZ * Math.sin(tilt);
            const rotatedZ = localY * Math.sin(tilt) + localZ * Math.cos(tilt);

            output[i * 3] = cellX + localX;
            output[i * 3 + 1] = cellY + rotatedY;
            output[i * 3 + 2] = cellZ + rotatedZ;
        }
        return output;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CURATED PHASE GEOMETRIES - 4 Distinguished Shapes
    // ═══════════════════════════════════════════════════════════════════

    const geometries = [
        // Phase 0: Jellyfish - Ethereal creatures with brilliant motion
        {
            data: getJellyfish(particlesCount),
            name: 'JELLYFISH',
            physics: {
                turbulence: 0.4,        // Ocean current flow
                attraction: 0.06,       // Very gentle cursor following
                orbit: 0.55,            // Strong flowing tentacle motion
                pulse: 0.25,            // Pronounced swimming pulse rhythm
                spring: 0.04,           // Ultra-soft, gelatinous
                dampen: 0.975           // Smooth underwater viscosity
            }
        },

        // Phase 1: Triple Helix DNA - Innovation, growth, structure (EXTENDED EXPERIENCE)
        {
            data: getTripleHelix(particlesCount, 2.5, 7),  // Larger helix, more turns
            name: 'DNA',
            physics: {
                turbulence: 0.35,       // Organic molecular vibration
                attraction: 0.12,       // Gentle cursor following
                orbit: 0.5,             // Strong helical rotation for visual impact
                pulse: 0.22,            // Pronounced breathing (life pulse)
                spring: 0.14,           // Springy molecular bonds
                dampen: 0.94            // Smooth, mesmerizing motion
            }
        },

        // Phase 2: Nova Explosion - Creative energy, breakthrough moment
        {
            data: getNovaExplosion(particlesCount, 4),  // Larger radius
            name: 'NOVA',
            physics: {
                turbulence: 2.5,       // Maximum explosive chaos
                attraction: 0.03,      // Particles fly outward
                orbit: 0.8,            // Spinning shockwave
                pulse: 0.25,           // Intense pulsation
                spring: 0.03,          // Very loose, explosive
                dampen: 0.78           // High energy, less dampening
            }
        },

        // Phase 3: Blood Cells - Immersive microscopic finale (EXTENDED EXPERIENCE)
        {
            data: getBloodCells(particlesCount, 8),  // Even wider spread for immersion
            name: 'BLOODCELLS',
            physics: {
                turbulence: 0.45,       // Rich fluid dynamics
                attraction: 0.05,       // Very gentle flow
                orbit: 0.25,            // Organic tumbling
                pulse: 0.15,            // Strong heartbeat rhythm
                spring: 0.035,          // Ultra-soft, blood viscosity
                dampen: 0.975           // Deep immersion viscosity
            }
        }
    ];

    // ═══════════════════════════════════════════════════════════════════
    // WAVE PROPAGATION SYSTEM - Ripple effects during morphing
    // ═══════════════════════════════════════════════════════════════════

    const waveState = {
        center: { x: 0, y: 0, z: 0 },
        radius: 0,
        intensity: 0,
        active: false
    };

    function triggerMorphWave(progress) {
        waveState.center = { x: 0, y: 0, z: 0 };
        waveState.radius = 0;
        waveState.intensity = 1;
        waveState.active = true;
    }

    function updateWave(dt) {
        if (waveState.active) {
            waveState.radius += dt * 8;
            waveState.intensity *= 0.97;
            if (waveState.intensity < 0.01) {
                waveState.active = false;
            }
        }
    }

    function getWaveDisplacement(x, y, z, time) {
        if (!waveState.active) return { x: 0, y: 0, z: 0 };

        const dist = Math.sqrt(
            (x - waveState.center.x) ** 2 +
            (y - waveState.center.y) ** 2 +
            (z - waveState.center.z) ** 2
        );

        const waveFront = Math.abs(dist - waveState.radius);
        const waveEffect = Math.exp(-waveFront * 2) * waveState.intensity;
        const direction = dist > 0.01 ? {
            x: (x - waveState.center.x) / dist,
            y: (y - waveState.center.y) / dist,
            z: (z - waveState.center.z) / dist
        } : { x: 0, y: 1, z: 0 };

        const displacement = Math.sin(dist * 4 - time * 10) * waveEffect * 0.3;

        return {
            x: direction.x * displacement,
            y: direction.y * displacement,
            z: direction.z * displacement
        };
    }

    // Track phase changes for wave triggering  
    let lastPhaseIndex = 0;

    // ═══════════════════════════════════════════════════════════════════
    // PARTICLE ATTRIBUTES
    // ═══════════════════════════════════════════════════════════════════

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);
    const velocities = new Float32Array(particlesCount * 3); // For momentum
    const phases = new Float32Array(particlesCount); // Individual animation phase

    // Initialize with chaos state
    for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        positions[i3] = geometries[0].data[i3];
        positions[i3 + 1] = geometries[0].data[i3 + 1];
        positions[i3 + 2] = geometries[0].data[i3 + 2];

        sizes[i] = 0.8 + Math.random() * 0.4;
        phases[i] = Math.random() * Math.PI * 2;

        velocities[i3] = 0;
        velocities[i3 + 1] = 0;
        velocities[i3 + 2] = 0;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // ═══════════════════════════════════════════════════════════════════
    // PARTICLE MATERIAL - Custom Shader-like Texture
    // ═══════════════════════════════════════════════════════════════════

    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Create sophisticated glow texture
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.3, 'rgba(200, 220, 255, 0.5)');
    grad.addColorStop(0.6, 'rgba(100, 150, 255, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const dotTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.04,
        map: dotTexture,
        transparent: true,
        opacity: 0.85,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    particleSystem.position.x = 1.8;
    scene.add(particleSystem);

    // ═══════════════════════════════════════════════════════════════════
    // SYNCHRONIZED MORPHING WIREFRAME SYSTEM
    // ═══════════════════════════════════════════════════════════════════

    // Generate wireframe line geometries for each phase
    function createWireframePoints(geometry, density = 1000) {
        const posAttr = geometry.attributes.position;
        const indices = geometry.index ? geometry.index.array : null;
        const points = [];

        if (indices) {
            // Indexed geometry - extract edges
            for (let i = 0; i < indices.length; i += 3) {
                const a = indices[i], b = indices[i + 1], c = indices[i + 2];
                // Add points along each triangle edge
                for (let t = 0; t <= 1; t += 0.1) {
                    points.push(
                        posAttr.getX(a) + (posAttr.getX(b) - posAttr.getX(a)) * t,
                        posAttr.getY(a) + (posAttr.getY(b) - posAttr.getY(a)) * t,
                        posAttr.getZ(a) + (posAttr.getZ(b) - posAttr.getZ(a)) * t
                    );
                }
            }
        } else {
            // Non-indexed - sample vertices
            for (let i = 0; i < posAttr.count; i++) {
                points.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
            }
        }

        // Resample to target density
        const output = new Float32Array(density * 3);
        for (let i = 0; i < density; i++) {
            const srcIdx = Math.floor((i / density) * (points.length / 3)) * 3;
            output[i * 3] = points[srcIdx] || 0;
            output[i * 3 + 1] = points[srcIdx + 1] || 0;
            output[i * 3 + 2] = points[srcIdx + 2] || 0;
        }
        return output;
    }

    // Create spiral wireframe
    function createSpiralWireframe(count, arms = 5, radius = 3) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const arm = i % arms;
            const armAngle = (arm / arms) * Math.PI * 2;
            const spiralAngle = t * Math.PI * 6 + armAngle;
            const r = t * radius * 1.2;
            output[i * 3] = Math.cos(spiralAngle) * r;
            output[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
            output[i * 3 + 2] = Math.sin(spiralAngle) * r;
        }
        return output;
    }

    // Create helix wireframe 
    function createHelixWireframe(count, radius = 1.8, height = 5) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 8;
            const y = (i / count - 0.5) * height;
            const strand = i % 2;
            const offset = strand * Math.PI;
            output[i * 3] = Math.cos(t + offset) * radius;
            output[i * 3 + 1] = y;
            output[i * 3 + 2] = Math.sin(t + offset) * radius;
        }
        return output;
    }

    // Create explosion shell wireframe
    function createNovaWireframe(count, radius = 3) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = (i / count) * Math.PI * 2 * 8;
            const phi = Math.acos(2 * (i / count) - 1);
            const r = radius * (0.9 + Math.sin(theta * 3) * 0.2);
            output[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            output[i * 3 + 2] = r * Math.cos(phi);
        }
        return output;
    }

    // Create tesseract projection wireframe
    function createTesseractWireframe(count, size = 2) {
        const output = new Float32Array(count * 3);
        const vertices = [];
        // 4D hypercube vertices
        for (let w = -1; w <= 1; w += 2) {
            for (let x = -1; x <= 1; x += 2) {
                for (let y = -1; y <= 1; y += 2) {
                    for (let z = -1; z <= 1; z += 2) {
                        const perspective = 2 / (2 - w * 0.4);
                        vertices.push([x * size * perspective, y * size * perspective, z * size * perspective]);
                    }
                }
            }
        }
        // Create edges
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const v1 = vertices[Math.floor(t * vertices.length) % vertices.length];
            const v2 = vertices[(Math.floor(t * vertices.length) + 1) % vertices.length];
            const lerp = (i % 10) / 10;
            output[i * 3] = v1[0] + (v2[0] - v1[0]) * lerp;
            output[i * 3 + 1] = v1[1] + (v2[1] - v1[1]) * lerp;
            output[i * 3 + 2] = v1[2] + (v2[2] - v1[2]) * lerp;
        }
        return output;
    }

    // Create scattered cloud wireframe
    function createCloudWireframe(count, radius = 4) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = radius * 0.8;
            output[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            output[i * 3 + 2] = r * Math.cos(phi);
        }
        return output;
    }

    // Create Lorenz attractor wireframe
    function createLorenzWireframe(count, scale = 0.12) {
        const output = new Float32Array(count * 3);
        let x = 0.1, y = 0, z = 0;
        const sigma = 10, rho = 28, beta = 8 / 3;
        const dt = 0.01;

        for (let i = 0; i < count; i++) {
            const dx = sigma * (y - x) * dt;
            const dy = (x * (rho - z) - y) * dt;
            const dz = (x * y - beta * z) * dt;
            x += dx; y += dy; z += dz;

            output[i * 3] = x * scale;
            output[i * 3 + 1] = (z - 25) * scale;
            output[i * 3 + 2] = y * scale;
        }
        return output;
    }

    // Create Klein bottle wireframe
    function createKleinWireframe(count, scale = 1.2) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const u = (i / count) * Math.PI * 2;
            const v = ((i * 7) % count / count) * Math.PI * 2;

            const r = 4 * (1 - Math.cos(u) / 2);
            let x, y, z;

            if (u < Math.PI) {
                x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(u) * Math.cos(v);
                y = 16 * Math.sin(u) + r * Math.sin(u) * Math.cos(v);
            } else {
                x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI);
                y = 16 * Math.sin(u);
            }
            z = r * Math.sin(v);

            output[i * 3] = x * scale * 0.1;
            output[i * 3 + 1] = (y - 8) * scale * 0.1;
            output[i * 3 + 2] = z * scale * 0.18;
        }
        return output;
    }

    // Create Superformula wireframe
    function createSuperformulaWireframe(count, m = 7, radius = 2.8) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = ((i % 50) / 50) * Math.PI * 2;
            const phi = (Math.floor(i / 50) / (count / 50)) * Math.PI;

            const r1 = Math.pow(Math.pow(Math.abs(Math.cos(m * theta / 4)), 1.7) +
                Math.pow(Math.abs(Math.sin(m * theta / 4)), 1.7), -0.5);
            const r2 = Math.pow(Math.pow(Math.abs(Math.cos(m * phi / 4)), 1.7) +
                Math.pow(Math.abs(Math.sin(m * phi / 4)), 1.7), -0.5);

            const r = r1 * r2 * radius;

            output[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            output[i * 3 + 2] = r * Math.cos(phi);
        }
        return output;
    }

    // Create Hopf fibration wireframe
    function createHopfWireframe(count, scale = 2.5) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const fiber = (i % 40) / 40;
            const t = (Math.floor(i / 40) / (count / 40)) * Math.PI * 2;

            const eta = fiber * Math.PI;
            const phi1 = t;
            const phi2 = t * 2 + fiber * Math.PI * 4;

            const w = Math.cos(eta);
            const x = Math.sin(eta) * Math.cos(phi1);
            const y = Math.sin(eta) * Math.sin(phi1) * Math.cos(phi2);
            const z = Math.sin(eta) * Math.sin(phi1) * Math.sin(phi2);

            const proj = 1 / (1 - w + 0.01);

            output[i * 3] = x * proj * scale * 0.6;
            output[i * 3 + 1] = y * proj * scale * 0.6;
            output[i * 3 + 2] = z * proj * scale * 0.6;
        }
        return output;
    }

    // Create Hyper torus knot wireframe
    function createHyperKnotWireframe(count, R = 2.2, r = 0.7, p = 5, q = 8) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 2 * p;
            const phi = (i / count) * Math.PI * 2 * q;

            const x = (R + r * Math.cos(phi)) * Math.cos(t);
            const y = (R + r * Math.cos(phi)) * Math.sin(t);
            const z = r * Math.sin(phi);

            const secondary = Math.sin(t * 3 + phi * 2) * 0.25;

            output[i * 3] = x + secondary * Math.cos(t);
            output[i * 3 + 1] = z + Math.sin(t * 7) * 0.2;
            output[i * 3 + 2] = y + secondary * Math.sin(t);
        }
        return output;
    }

    // Create blood cells wireframe
    function createBloodCellsWireframe(count, spread = 6) {
        const output = new Float32Array(count * 3);
        const cellCount = 25;

        for (let i = 0; i < count; i++) {
            const cellIndex = i % cellCount;
            const particleInCell = Math.floor(i / cellCount);

            const seed = cellIndex * 12345.6789;
            const cellX = (Math.sin(seed) * 0.5 + 0.5) * spread * 2 - spread;
            const cellY = (Math.cos(seed * 2) * 0.5 + 0.5) * spread * 1.5 - spread * 0.75;
            const cellZ = (Math.sin(seed * 3) * 0.5 + 0.5) * spread * 2 - spread;

            const cellSize = 0.5 + Math.sin(seed * 4) * 0.25;
            const theta = (particleInCell / (count / cellCount)) * Math.PI * 2;
            const r = cellSize * 0.9;

            output[i * 3] = cellX + Math.cos(theta) * r;
            output[i * 3 + 1] = cellY + Math.sin(seed * 5) * 0.1;
            output[i * 3 + 2] = cellZ + Math.sin(theta) * r;
        }
        return output;
    }

    // Create jellyfish wireframe matching advanced particle geometry
    function createJellyfishWireframe(count) {
        const output = new Float32Array(count * 3);
        const scale = 1.0;

        // Match particle system positions
        const jellyfishCount = 10;
        const jellyfish = [];
        for (let j = 0; j < jellyfishCount; j++) {
            const angle = (j / jellyfishCount) * Math.PI * 2;
            const radiusVar = 2 + Math.sin(j * 1.5) * 1.5;
            jellyfish.push({
                x: Math.cos(angle) * radiusVar,
                y: Math.cos(j * 0.8) * 2,
                z: Math.sin(j * 2.1) * 1.5,
                size: 0.3 + Math.sin(j) * 0.15
            });
        }

        for (let i = 0; i < count; i++) {
            const jelly = jellyfish[i % jellyfishCount];
            const t = (i / count) * 6 % 1;
            const section = Math.floor((i / count) * 15) % 5;

            let x, y, z;

            if (section < 2) {
                // Bell outline
                const theta = t * Math.PI * 2;
                const wobble = 1 + Math.sin(theta * 8) * 0.08;
                x = Math.cos(theta) * jelly.size * 0.85 * wobble;
                y = jelly.size * 0.25 + Math.sin(theta * 4) * 0.02;
                z = Math.sin(theta) * jelly.size * 0.85 * wobble;
            } else if (section < 3) {
                // Inner bell
                const theta = t * Math.PI * 2;
                x = Math.cos(theta) * jelly.size * 0.4;
                y = jelly.size * 0.2;
                z = Math.sin(theta) * jelly.size * 0.4;
            } else {
                // Tentacles with waves
                const tentacleAngle = t * Math.PI * 2;
                const tentacleT = (i % 80) / 80;
                const wave = Math.sin(tentacleT * 5 + tentacleAngle) * 0.08 * jelly.size;
                x = Math.cos(tentacleAngle) * jelly.size * 0.7 + wave;
                y = -tentacleT * jelly.size * 1.8;
                z = Math.sin(tentacleAngle) * jelly.size * 0.7;
            }

            output[i * 3] = (jelly.x + x) * scale;
            output[i * 3 + 1] = (jelly.y + y) * scale;
            output[i * 3 + 2] = (jelly.z + z) * scale;
        }
        return output;
    }

    const wireframeDensity = 2000;

    // Phase-matched wireframe geometries (4 curated phases)
    const wireframePhases = [
        createJellyfishWireframe(wireframeDensity),                    // 0: Jellyfish
        createHelixWireframe(wireframeDensity, 2, 5.5),                // 1: DNA
        createNovaWireframe(wireframeDensity, 3.2),                    // 2: Nova
        createBloodCellsWireframe(wireframeDensity, 6)                 // 3: Blood Cells
    ];

    // Create morphing wireframe geometry
    const wireframeGeometry = new THREE.BufferGeometry();
    const wireframePositions = new Float32Array(wireframeDensity * 3);
    const wireframeColors = new Float32Array(wireframeDensity * 3);
    const wireframeVelocities = new Float32Array(wireframeDensity * 3); // For momentum/spring physics
    const wireframePhaseOffsets = new Float32Array(wireframeDensity); // Individual animation phases

    // Initialize with first phase
    for (let i = 0; i < wireframeDensity; i++) {
        const i3 = i * 3;
        wireframePositions[i3] = wireframePhases[0][i3];
        wireframePositions[i3 + 1] = wireframePhases[0][i3 + 1];
        wireframePositions[i3 + 2] = wireframePhases[0][i3 + 2];
        wireframeVelocities[i3] = 0;
        wireframeVelocities[i3 + 1] = 0;
        wireframeVelocities[i3 + 2] = 0;
        wireframePhaseOffsets[i] = Math.random() * Math.PI * 2;
    }

    wireframeGeometry.setAttribute('position', new THREE.BufferAttribute(wireframePositions, 3));
    wireframeGeometry.setAttribute('color', new THREE.BufferAttribute(wireframeColors, 3));

    const wireframeMaterial = new THREE.PointsMaterial({
        size: 0.015,
        transparent: true,
        opacity: 0.4,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    const wireframeSystem = new THREE.Points(wireframeGeometry, wireframeMaterial);
    wireframeSystem.position.x = 1.8;
    scene.add(wireframeSystem);

    // Create secondary fine-line structure using LineSegments
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(500 * 6); // 500 line segments
    const lineColors = new Float32Array(500 * 6);

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.25,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const lineSystem = new THREE.LineSegments(lineGeometry, lineMaterial);
    lineSystem.position.x = 1.8;
    scene.add(lineSystem);

    // ═══════════════════════════════════════════════════════════════════
    // ADVANCED CURSOR INTERACTION SYSTEM
    // ═══════════════════════════════════════════════════════════════════

    // Core cursor state
    let mouseX = 0, mouseY = 0;
    let mouseVelX = 0, mouseVelY = 0;
    let prevMouseX = 0, prevMouseY = 0;
    let targetRotX = 0, targetRotY = 0;
    let mouseNormX = 0, mouseNormY = 0;

    // Smooth cursor tracking (interpolated for fluid motion)
    let smoothMouseX = 0, smoothMouseY = 0;
    let smoothMouseNormX = 0, smoothMouseNormY = 0;

    // Cursor 3D world position
    let cursor3D = { x: 0, y: 0, z: 0 };
    let cursorVelocity = { x: 0, y: 0, z: 0 };

    // Cursor interaction modes
    const cursorState = {
        isActive: false,
        lastMoveTime: 0,
        idleTime: 0,
        speed: 0,
        acceleration: 0,
        prevSpeed: 0
    };

    // ─────────────────────────────────────────────────────────────────
    // RIPPLE SYSTEM - Emanating waves from cursor movement
    // ─────────────────────────────────────────────────────────────────
    const cursorRipples = [];
    const MAX_RIPPLES = 5;

    function createCursorRipple(x, y, z, intensity) {
        cursorRipples.push({
            x, y, z,
            radius: 0,
            maxRadius: 3 + intensity * 2,
            intensity: Math.min(1, intensity),
            life: 1.0,
            speed: 0.08 + intensity * 0.04
        });
        if (cursorRipples.length > MAX_RIPPLES) {
            cursorRipples.shift();
        }
    }

    function updateRipples(deltaTime) {
        for (let i = cursorRipples.length - 1; i >= 0; i--) {
            const ripple = cursorRipples[i];
            ripple.radius += ripple.speed;
            ripple.life -= 0.02;
            ripple.intensity *= 0.97;
            if (ripple.life <= 0) {
                cursorRipples.splice(i, 1);
            }
        }
    }

    function getRippleDisplacement(px, py, pz) {
        let dx = 0, dy = 0, dz = 0;
        for (const ripple of cursorRipples) {
            const dist = Math.sqrt(
                (px - ripple.x) ** 2 +
                (py - ripple.y) ** 2 +
                (pz - ripple.z) ** 2
            );
            const ringDist = Math.abs(dist - ripple.radius);
            if (ringDist < 0.8) {
                const waveStrength = (1 - ringDist / 0.8) * ripple.intensity * ripple.life;
                const angle = Math.atan2(py - ripple.y, px - ripple.x);
                const wave = Math.sin(ringDist * 10) * waveStrength * 0.15;
                dx += Math.cos(angle) * wave;
                dy += Math.sin(angle) * wave;
                dz += wave * 0.5;
            }
        }
        return { x: dx, y: dy, z: dz };
    }

    // ─────────────────────────────────────────────────────────────────
    // MAGNETIC FIELD - Cursor creates attractive/repulsive zones
    // ─────────────────────────────────────────────────────────────────
    function getMagneticField(px, py, pz, cursorX, cursorY, cursorZ, velocity) {
        const toX = cursorX - px;
        const toY = cursorY - py;
        const toZ = cursorZ - pz;
        const dist = Math.sqrt(toX * toX + toY * toY + toZ * toZ);

        if (dist < 0.1 || dist > 5) return { x: 0, y: 0, z: 0 };

        const normX = toX / dist;
        const normY = toY / dist;
        const normZ = toZ / dist;

        // Magnetic field strength (inverse square falloff)
        const fieldStrength = 1 / (1 + dist * dist) * 0.5;

        // Inner repulsion zone (push particles away when very close)
        const repulsionZone = 0.8;
        const attractionZone = 3;

        let force = 0;
        if (dist < repulsionZone) {
            // Strong repulsion - particles flee from cursor center
            force = -fieldStrength * (1 - dist / repulsionZone) * 3;
        } else if (dist < attractionZone) {
            // Attraction zone - gentle pull toward cursor
            force = fieldStrength * (1 - (dist - repulsionZone) / (attractionZone - repulsionZone));
        }

        // Velocity boost - faster cursor = stronger field
        const velocityMag = Math.sqrt(velocity.x ** 2 + velocity.y ** 2) * 30;
        force *= (1 + velocityMag);

        return {
            x: normX * force,
            y: normY * force,
            z: normZ * force * 0.3
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // VORTEX EFFECT - Swirling motion around cursor
    // ─────────────────────────────────────────────────────────────────
    function getVortexEffect(px, py, pz, cursorX, cursorY, cursorZ, time, velocity) {
        const toX = px - cursorX;
        const toY = py - cursorY;
        const dist = Math.sqrt(toX * toX + toY * toY);

        if (dist < 0.1 || dist > 4) return { x: 0, y: 0, z: 0 };

        // Vortex strength based on distance and cursor velocity
        const velocityMag = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        const vortexStrength = (1 / (1 + dist)) * velocityMag * 15;

        // Perpendicular direction (creates swirl)
        const perpX = -toY / dist;
        const perpY = toX / dist;

        // Spiral inward slightly
        const spiralFactor = 0.3;

        return {
            x: (perpX - toX / dist * spiralFactor) * vortexStrength * 0.08,
            y: (perpY - toY / dist * spiralFactor) * vortexStrength * 0.08,
            z: Math.sin(dist * 3 - time * 5) * vortexStrength * 0.02
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // DEPTH WARP - Cursor pushes particles in Z axis
    // ─────────────────────────────────────────────────────────────────
    function getDepthWarp(px, py, pz, cursorX, cursorY, velocity) {
        const toX = cursorX - px;
        const toY = cursorY - py;
        const dist2D = Math.sqrt(toX * toX + toY * toY);

        if (dist2D > 3) return 0;

        const velocityMag = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        const warpStrength = (1 - dist2D / 3) * velocityMag * 8;

        // Push away in Z based on proximity
        return -warpStrength * 0.1;
    }

    // ─────────────────────────────────────────────────────────────────
    // CLICK EXPLOSION EFFECT
    // ─────────────────────────────────────────────────────────────────
    let clickExplosion = null;

    function triggerClickExplosion(x, y, z) {
        clickExplosion = {
            x, y, z,
            radius: 0,
            maxRadius: 5,
            intensity: 1.5,
            life: 1.0
        };
    }

    function getClickExplosionForce(px, py, pz) {
        if (!clickExplosion || clickExplosion.life <= 0) return { x: 0, y: 0, z: 0 };

        const toX = px - clickExplosion.x;
        const toY = py - clickExplosion.y;
        const toZ = pz - clickExplosion.z;
        const dist = Math.sqrt(toX * toX + toY * toY + toZ * toZ);

        if (dist < 0.1 || dist > clickExplosion.radius + 0.5) return { x: 0, y: 0, z: 0 };

        const ringDist = Math.abs(dist - clickExplosion.radius);
        if (ringDist > 1) return { x: 0, y: 0, z: 0 };

        const explosionForce = (1 - ringDist) * clickExplosion.intensity * clickExplosion.life;
        const norm = dist > 0.1 ? 1 / dist : 0;

        return {
            x: toX * norm * explosionForce * 0.3,
            y: toY * norm * explosionForce * 0.3,
            z: toZ * norm * explosionForce * 0.2
        };
    }

    function updateClickExplosion() {
        if (clickExplosion) {
            clickExplosion.radius += 0.15;
            clickExplosion.life -= 0.025;
            clickExplosion.intensity *= 0.96;
            if (clickExplosion.life <= 0) clickExplosion = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // EVENT LISTENERS
    // ─────────────────────────────────────────────────────────────────
    let rippleAccumulator = 0;

    document.addEventListener('mousemove', (e) => {
        const newMouseX = (e.clientX - window.innerWidth / 2) * 0.0005;
        const newMouseY = (e.clientY - window.innerHeight / 2) * 0.0005;

        // Track velocity
        mouseVelX = newMouseX - prevMouseX;
        mouseVelY = newMouseY - prevMouseY;
        prevMouseX = mouseX;
        prevMouseY = mouseY;

        mouseX = newMouseX;
        mouseY = newMouseY;

        // Normalized coordinates
        mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseNormY = -(e.clientY / window.innerHeight) * 2 + 1;

        // Update cursor state
        cursorState.prevSpeed = cursorState.speed;
        cursorState.speed = Math.sqrt(mouseVelX ** 2 + mouseVelY ** 2);
        cursorState.acceleration = cursorState.speed - cursorState.prevSpeed;
        cursorState.lastMoveTime = performance.now();
        cursorState.isActive = true;

        // Create ripples on significant movement
        rippleAccumulator += cursorState.speed;
        if (rippleAccumulator > 0.003) {
            const cursor3DX = mouseNormX * 4;
            const cursor3DY = mouseNormY * 3;
            createCursorRipple(cursor3DX, cursor3DY, 0, cursorState.speed * 50);
            rippleAccumulator = 0;
        }
    });

    // Click creates explosion effect
    document.addEventListener('click', (e) => {
        const cursor3DX = mouseNormX * 4;
        const cursor3DY = mouseNormY * 3;
        triggerClickExplosion(cursor3DX, cursor3DY, 0);
    });

    // Track cursor idle state
    setInterval(() => {
        const now = performance.now();
        cursorState.idleTime = now - cursorState.lastMoveTime;
        if (cursorState.idleTime > 100) {
            cursorState.isActive = false;
        }
    }, 50);

    const updateTheme = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            particleMaterial.blending = THREE.AdditiveBlending;
            scene.fog.color.setHex(0x000000);
            // Wireframe: bright glow on dark background
            wireframeMaterial.blending = THREE.AdditiveBlending;
            wireframeMaterial.opacity = 0.5;
            lineMaterial.blending = THREE.AdditiveBlending;
            lineMaterial.opacity = 0.35;
        } else {
            particleMaterial.blending = THREE.NormalBlending;
            scene.fog.color.setHex(0xffffff);
            // Wireframe: solid contrast on light background
            wireframeMaterial.blending = THREE.NormalBlending;
            wireframeMaterial.opacity = 0.6;
            lineMaterial.blending = THREE.NormalBlending;
            lineMaterial.opacity = 0.4;
        }
    };
    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, { attributes: true });
    updateTheme();

    // ═══════════════════════════════════════════════════════════════════
    // EASING & INTERPOLATION
    // ═══════════════════════════════════════════════════════════════════

    const easeInOutQuint = (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
    const easeOutElastic = (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    };
    const easeInOutBack = (t) => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    };

    // ═══════════════════════════════════════════════════════════════════
    // COLOR PALETTES - 4 Distinct Phase Colors
    // ═══════════════════════════════════════════════════════════════════

    const palettes = [
        { primary: new THREE.Color(0x66ffee), secondary: new THREE.Color(0xaa88ff) }, // 0 JELLYFISH: Bioluminescent Teal → Purple
        { primary: new THREE.Color(0x00ff88), secondary: new THREE.Color(0x66ffcc) }, // 1 DNA: Emerald Green → Mint
        { primary: new THREE.Color(0xffaa00), secondary: new THREE.Color(0xff4400) }, // 2 Nova: Golden → Orange Fire
        { primary: new THREE.Color(0xcc2233), secondary: new THREE.Color(0xff4455) }  // 3 Blood Cells: Crimson Red → Arterial Red
    ];

    // ═══════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════════════════════════

    let time = 0;
    let currentScroll = 0;
    let prevScroll = 0;
    let scrollVelocity = 0;

    function animate() {
        requestAnimationFrame(animate);
        time += 0.006;

        // Calculate scroll velocity for momentum
        scrollVelocity = Math.abs(currentScroll - prevScroll);
        prevScroll += (currentScroll - prevScroll) * 0.08; // Smooth follow

        // ─────────────────────────────────────────────────────────────
        // PHASE CALCULATION - Weighted Scroll Zones
        // Extended time for Jellyfish appreciation and transformation
        // ─────────────────────────────────────────────────────────────

        const numPhases = geometries.length - 1; // 3 transitions for 4 phases

        // Weighted scroll zones: [Jellyfish→DNA, DNA→Nova, Nova→BloodCells]
        // Jellyfish (28%) for appreciation, DNA (35%), Blood Cells (37%)
        const phaseWeights = [0.28, 0.35, 0.37]; // Must sum to 1.0
        const phaseBreakpoints = [0, 0.28, 0.63, 1.0]; // Cumulative breakpoints

        // Add scroll "stickiness" at phase boundaries
        // Jellyfish gets extended pause for complex transformation appreciation
        let adjustedProgress = prevScroll;
        const checkpointPauses = [0.10, 0.10, 0.12]; // Jellyfish pause extended

        for (let cp = 0; cp < numPhases; cp++) {
            const checkpoint = phaseBreakpoints[cp + 1];
            const distToCheckpoint = Math.abs(adjustedProgress - checkpoint);
            const pauseZone = checkpointPauses[cp];

            if (distToCheckpoint < pauseZone) {
                // Slow down transition near checkpoints
                const pauseStrength = 1 - (distToCheckpoint / pauseZone);
                // DNA and Blood Cells get stronger pause
                const pauseIntensity = cp >= 1 ? 0.5 : 0.3;
                adjustedProgress += (checkpoint - adjustedProgress) * pauseStrength * pauseIntensity;
            }
        }

        // Extra "hold" at the end so Blood Cells fully resolves before project section
        if (adjustedProgress > 0.92) {
            const endHold = (adjustedProgress - 0.92) / 0.08;
            adjustedProgress = 0.92 + endHold * 0.08 * 0.6; // Slow down final 8%
        }

        // Map adjustedProgress to phaseIndex and phaseProgress using weighted zones
        let phaseIndex = 0;
        let phaseProgress = 0;

        for (let i = 0; i < numPhases; i++) {
            if (adjustedProgress >= phaseBreakpoints[i] && adjustedProgress < phaseBreakpoints[i + 1]) {
                phaseIndex = i;
                const zoneStart = phaseBreakpoints[i];
                const zoneEnd = phaseBreakpoints[i + 1];
                phaseProgress = (adjustedProgress - zoneStart) / (zoneEnd - zoneStart);
                break;
            }
        }

        // Clamp to valid range
        phaseIndex = Math.min(phaseIndex, numPhases - 1);
        phaseProgress = Math.max(0, Math.min(1, phaseProgress));

        const source = geometries[phaseIndex].data;
        const target = geometries[phaseIndex + 1].data;

        // ─────────────────────────────────────────────────────────────
        // PHASE-SPECIFIC EASING - Dramatic Variety
        // ─────────────────────────────────────────────────────────────

        let mix;
        switch (phaseIndex) {
            case 0: // JELLYFISH → DNA: Ethereal creatures morph into organic helix
                mix = easeOutElastic(Math.min(1, phaseProgress * 1.15));
                break;
            case 1: // DNA → Nova: Explosive fast release (structure to chaos)
                mix = Math.pow(phaseProgress, 0.4); // Very fast start, dramatic
                break;
            case 2: // Nova → Blood Cells: Organic settling (chaos to life)
                mix = easeInOutQuint(phaseProgress);
                break;
            default:
                mix = easeInOutQuint(phaseProgress);
        }

        // ─────────────────────────────────────────────────────────────
        // COLOR INTERPOLATION
        // ─────────────────────────────────────────────────────────────

        const currentPalette = palettes[phaseIndex];
        const nextPalette = palettes[Math.min(phaseIndex + 1, palettes.length - 1)];

        const activeColor = new THREE.Color().copy(currentPalette.primary).lerp(nextPalette.primary, mix);
        const secondaryColor = new THREE.Color().copy(currentPalette.secondary).lerp(nextPalette.secondary, mix);

        // ─────────────────────────────────────────────────────────────
        // PARTICLE PHYSICS WITH PHASE-SPECIFIC MODIFIERS
        // ─────────────────────────────────────────────────────────────

        const posArray = particleGeometry.attributes.position.array;
        const colArray = particleGeometry.attributes.color.array;

        // Get phase-specific physics parameters with interpolation
        const currentPhysics = geometries[phaseIndex].physics;
        const nextPhysics = geometries[Math.min(phaseIndex + 1, geometries.length - 1)].physics;

        // Interpolate physics parameters between phases
        const phyTurbulence = currentPhysics.turbulence + (nextPhysics.turbulence - currentPhysics.turbulence) * mix;
        const phyAttraction = currentPhysics.attraction + (nextPhysics.attraction - currentPhysics.attraction) * mix;
        const phyOrbit = currentPhysics.orbit + (nextPhysics.orbit - currentPhysics.orbit) * mix;
        const phyPulse = currentPhysics.pulse + (nextPhysics.pulse - currentPhysics.pulse) * mix;
        const phySpring = currentPhysics.spring + (nextPhysics.spring - currentPhysics.spring) * mix;
        const phyDampen = currentPhysics.dampen + (nextPhysics.dampen - currentPhysics.dampen) * mix;

        // Trigger wave on phase change
        if (phaseIndex !== lastPhaseIndex) {
            triggerMorphWave(phaseProgress);
            lastPhaseIndex = phaseIndex;
        }

        // Update wave propagation
        updateWave(0.016);

        // Update cursor interaction systems
        updateRipples(0.016);
        updateClickExplosion();

        // Turbulence intensity with phase modifier
        const turbulenceBase = 0.15 * phyTurbulence;
        const turbulenceTransition = Math.sin(phaseProgress * Math.PI) * 0.4 * phyTurbulence;
        const turbulenceIntensity = turbulenceBase + turbulenceTransition + scrollVelocity * 2;

        // Harmonic resonance frequency based on phase
        const harmonicFreq = 1 + phaseIndex * 0.3;

        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const phase = phases[i];

            // Target position with interpolation
            let tx = source[i3] + (target[i3] - source[i3]) * mix;
            let ty = source[i3 + 1] + (target[i3 + 1] - source[i3 + 1]) * mix;
            let tz = source[i3 + 2] + (target[i3 + 2] - source[i3 + 2]) * mix;

            // Wave displacement during transitions
            const wave = getWaveDisplacement(tx, ty, tz, time);
            tx += wave.x;
            ty += wave.y;
            tz += wave.z;

            // Curl noise for organic flow
            const curl = curlNoise(tx * 0.5, ty * 0.5, tz * 0.5, time * 0.5);

            // FBM for multi-scale detail
            const turbulence = fbm(tx + time * 0.2, ty + time * 0.15, tz + time * 0.1, 3);

            // Distance-based effects (particles further from center behave differently)
            const dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
            const distFactor = 1 - Math.min(1, dist / 4);

            // ═══════════════════════════════════════════════════════════
            // ADVANCED CURSOR INTERACTION FIELD
            // ═══════════════════════════════════════════════════════════

            // Smooth cursor position interpolation
            smoothMouseNormX += (mouseNormX - smoothMouseNormX) * 0.15;
            smoothMouseNormY += (mouseNormY - smoothMouseNormY) * 0.15;

            const cursorX = smoothMouseNormX * 4;
            const cursorY = smoothMouseNormY * 3;
            const cursorZ = 0;

            // Cursor velocity for dynamic effects
            const cursorVel = { x: mouseVelX, y: mouseVelY };

            // ─── MAGNETIC FIELD (attraction/repulsion) ───
            const magnetic = getMagneticField(tx, ty, tz, cursorX, cursorY, cursorZ, cursorVel);

            // ─── VORTEX SWIRL (particles spiral around cursor) ───
            const vortex = getVortexEffect(tx, ty, tz, cursorX, cursorY, cursorZ, time, cursorVel);

            // ─── CURSOR RIPPLES (wave displacement) ───
            const ripple = getRippleDisplacement(tx, ty, tz);

            // ─── DEPTH WARP (Z-axis push) ───
            const depthWarp = getDepthWarp(tx, ty, tz, cursorX, cursorY, cursorVel);

            // ─── CLICK EXPLOSION ───
            const explosion = getClickExplosionForce(tx, ty, tz);

            // Combined cursor effect with phase-specific strength
            const cursorEffect = {
                x: (magnetic.x + vortex.x + ripple.x + explosion.x) * phyAttraction * 3,
                y: (magnetic.y + vortex.y + ripple.y + explosion.y) * phyAttraction * 3,
                z: (magnetic.z + vortex.z + ripple.z + depthWarp + explosion.z) * phyAttraction * 2
            };

            // Orbital motion with phase-specific speed
            const orbitSpeed = (0.4 + distFactor * 0.6) * phyOrbit;
            const orbit = {
                x: Math.sin(time * orbitSpeed + phase) * 0.08 * dist,
                y: Math.cos(time * orbitSpeed * 1.3 + phase) * 0.08 * dist,
                z: Math.sin(time * orbitSpeed * 0.7 + phase + 1) * 0.08 * dist
            };

            // Breathing / pulsation with phase-specific intensity
            const pulse = Math.sin(time * 2.5 * harmonicFreq + dist * 2.5 + phase) * phyPulse;

            // Harmonic resonance layer - particles vibrate at phase-specific frequencies
            const harmonic = {
                x: Math.sin(time * harmonicFreq * 3 + phase * 2) * 0.02 * distFactor,
                y: Math.cos(time * harmonicFreq * 2.5 + phase * 3) * 0.02 * distFactor,
                z: Math.sin(time * harmonicFreq * 2 + phase) * 0.02 * distFactor
            };

            // Combine all movements
            const finalX = tx + curl.x * turbulenceIntensity + orbit.x + turbulence * 0.12 + pulse * tx + cursorEffect.x + harmonic.x;
            const finalY = ty + curl.y * turbulenceIntensity + orbit.y + turbulence * 0.12 + pulse * ty + cursorEffect.y + harmonic.y;
            const finalZ = tz + curl.z * turbulenceIntensity + orbit.z + turbulence * 0.12 + pulse * tz + cursorEffect.z + harmonic.z;

            // Apply with phase-specific spring physics
            velocities[i3] = velocities[i3] * phyDampen + (finalX - posArray[i3]) * phySpring;
            velocities[i3 + 1] = velocities[i3 + 1] * phyDampen + (finalY - posArray[i3 + 1]) * phySpring;
            velocities[i3 + 2] = velocities[i3 + 2] * phyDampen + (finalZ - posArray[i3 + 2]) * phySpring;

            posArray[i3] += velocities[i3];
            posArray[i3 + 1] += velocities[i3 + 1];
            posArray[i3 + 2] += velocities[i3 + 2];

            // ─────────────────────────────────────────────────────────
            // DYNAMIC COLORING
            // ─────────────────────────────────────────────────────────

            // Height-based gradient
            const heightFactor = (posArray[i3 + 1] + 3) / 6;

            // Distance bloom
            const distColor = Math.sin(dist * 2 - time * 3) * 0.2;

            // Velocity-based brightness
            const vel = Math.sqrt(velocities[i3] ** 2 + velocities[i3 + 1] ** 2 + velocities[i3 + 2] ** 2);
            const velocityBrightness = Math.min(1, vel * 5);

            // Final color
            const finalColor = new THREE.Color().copy(activeColor).lerp(secondaryColor, heightFactor);

            colArray[i3] = Math.max(0, Math.min(1, finalColor.r + distColor + velocityBrightness * 0.3));
            colArray[i3 + 1] = Math.max(0, Math.min(1, finalColor.g + distColor * 0.5 + velocityBrightness * 0.2));
            colArray[i3 + 2] = Math.max(0, Math.min(1, finalColor.b + distColor + velocityBrightness * 0.3));
        }

        particleGeometry.attributes.position.needsUpdate = true;
        particleGeometry.attributes.color.needsUpdate = true;

        // ─────────────────────────────────────────────────────────────
        // FULLY SYNCHRONIZED WIREFRAME PHYSICS
        // ─────────────────────────────────────────────────────────────

        // Mouse parallax with inertia
        targetRotX += (mouseY * 0.8 - targetRotX) * 0.02;
        targetRotY += (mouseX * 0.8 - targetRotY) * 0.02;

        // UNIFIED ROTATION - exact same rotation for perfect sync
        const baseRotation = 0.0008 + scrollVelocity * 0.5;
        particleSystem.rotation.y += baseRotation;
        particleSystem.rotation.x = targetRotX;

        // Wireframe rotates identically - no parallax offset for tighter sync
        wireframeSystem.rotation.y = particleSystem.rotation.y;
        wireframeSystem.rotation.x = particleSystem.rotation.x;

        lineSystem.rotation.y = particleSystem.rotation.y;
        lineSystem.rotation.x = particleSystem.rotation.x;

        // ═══════════════════════════════════════════════════════════
        // WIREFRAME WITH IDENTICAL PARTICLE PHYSICS
        // ═══════════════════════════════════════════════════════════

        const wfSource = wireframePhases[phaseIndex];
        const wfTarget = wireframePhases[Math.min(phaseIndex + 1, wireframePhases.length - 1)];
        const wfPosArray = wireframeGeometry.attributes.position.array;
        const wfColArray = wireframeGeometry.attributes.color.array;
        const linePosArray = lineGeometry.attributes.position.array;
        const lineColArray = lineGeometry.attributes.color.array;

        // Unified breathing scale - same as particles would experience
        const breathe = 1 + Math.sin(time * 2.5) * 0.03 + scrollVelocity * 0.2;
        wireframeSystem.scale.setScalar(breathe);
        lineSystem.scale.setScalar(breathe);
        particleSystem.scale.setScalar(breathe);

        // Apply IDENTICAL physics as particles using phase-specific modifiers
        for (let i = 0; i < wireframeDensity; i++) {
            const i3 = i * 3;
            const wfPhase = wireframePhaseOffsets[i];

            // Target position with same interpolation as particles
            let tx = wfSource[i3] + (wfTarget[i3] - wfSource[i3]) * mix;
            let ty = wfSource[i3 + 1] + (wfTarget[i3 + 1] - wfSource[i3 + 1]) * mix;
            let tz = wfSource[i3 + 2] + (wfTarget[i3 + 2] - wfSource[i3 + 2]) * mix;

            // Wave displacement - same as particles
            const wave = getWaveDisplacement(tx, ty, tz, time);
            tx += wave.x;
            ty += wave.y;
            tz += wave.z;

            // ═══ CURL NOISE - identical to particles ═══
            const curl = curlNoise(tx * 0.5, ty * 0.5, tz * 0.5, time * 0.5);

            // ═══ FBM TURBULENCE - identical to particles ═══
            const turbulence = fbm(tx + time * 0.2, ty + time * 0.15, tz + time * 0.1, 3);

            // Distance-based effects
            const dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
            const distFactor = 1 - Math.min(1, dist / 4);

            // ═══ MOUSE ATTRACTION with phase-specific strength ═══
            const mouseWorldX = mouseNormX * 4;
            const mouseWorldY = mouseNormY * 3;
            const mouseWorldZ = 0;

            const toMouseX = mouseWorldX - tx;
            const toMouseY = mouseWorldY - ty;
            const toMouseZ = mouseWorldZ - tz;
            const mouseDistance = Math.sqrt(toMouseX * toMouseX + toMouseY * toMouseY + toMouseZ * toMouseZ);

            const mouseInfluence = Math.max(0, 1 - mouseDistance / 5);
            const attractionStrength = phyAttraction * mouseInfluence;
            const mouseVelocityBoost = Math.abs(mouseVelX) + Math.abs(mouseVelY);

            const mouseEffect = {
                x: toMouseX * attractionStrength * (1 + mouseVelocityBoost * 50),
                y: toMouseY * attractionStrength * (1 + mouseVelocityBoost * 50),
                z: toMouseZ * attractionStrength * 0.3
            };

            // ═══ ORBITAL MOTION with phase-specific speed ═══
            const orbitSpeed = (0.4 + distFactor * 0.6) * phyOrbit;
            const orbit = {
                x: Math.sin(time * orbitSpeed + wfPhase) * 0.08 * dist,
                y: Math.cos(time * orbitSpeed * 1.3 + wfPhase) * 0.08 * dist,
                z: Math.sin(time * orbitSpeed * 0.7 + wfPhase + 1) * 0.08 * dist
            };

            // ═══ BREATHING PULSATION with phase-specific intensity ═══
            const pulse = Math.sin(time * 2.5 * harmonicFreq + dist * 2.5 + wfPhase) * phyPulse;

            // ═══ HARMONIC RESONANCE - same as particles ═══
            const harmonic = {
                x: Math.sin(time * harmonicFreq * 3 + wfPhase * 2) * 0.02 * distFactor,
                y: Math.cos(time * harmonicFreq * 2.5 + wfPhase * 3) * 0.02 * distFactor,
                z: Math.sin(time * harmonicFreq * 2 + wfPhase) * 0.02 * distFactor
            };

            // ═══ COMBINE ALL EFFECTS - identical formula to particles ═══
            const finalX = tx + curl.x * turbulenceIntensity + orbit.x + turbulence * 0.12 + pulse * tx + mouseEffect.x + harmonic.x;
            const finalY = ty + curl.y * turbulenceIntensity + orbit.y + turbulence * 0.12 + pulse * ty + mouseEffect.y + harmonic.y;
            const finalZ = tz + curl.z * turbulenceIntensity + orbit.z + turbulence * 0.12 + pulse * tz + mouseEffect.z + harmonic.z;

            // ═══ SPRING PHYSICS with phase-specific parameters ═══
            wireframeVelocities[i3] = wireframeVelocities[i3] * phyDampen + (finalX - wfPosArray[i3]) * phySpring;
            wireframeVelocities[i3 + 1] = wireframeVelocities[i3 + 1] * phyDampen + (finalY - wfPosArray[i3 + 1]) * phySpring;
            wireframeVelocities[i3 + 2] = wireframeVelocities[i3 + 2] * phyDampen + (finalZ - wfPosArray[i3 + 2]) * phySpring;

            wfPosArray[i3] += wireframeVelocities[i3];
            wfPosArray[i3 + 1] += wireframeVelocities[i3 + 1];
            wfPosArray[i3 + 2] += wireframeVelocities[i3 + 2];

            // ═══ VELOCITY-BASED COLOR BRIGHTNESS - identical to particles ═══
            const wfVel = Math.sqrt(
                wireframeVelocities[i3] ** 2 +
                wireframeVelocities[i3 + 1] ** 2 +
                wireframeVelocities[i3 + 2] ** 2
            );
            const wfVelocityBrightness = Math.min(1, wfVel * 5);

            // Height-based gradient - same as particles
            const heightFactor = (wfPosArray[i3 + 1] + 3) / 6;
            const distColor = Math.sin(dist * 2 - time * 3) * 0.2;

            // Final color with velocity brightness
            const wfColor = new THREE.Color().copy(activeColor).lerp(secondaryColor, heightFactor);

            wfColArray[i3] = Math.max(0, Math.min(1, wfColor.r + distColor + wfVelocityBrightness * 0.4));
            wfColArray[i3 + 1] = Math.max(0, Math.min(1, wfColor.g + distColor * 0.5 + wfVelocityBrightness * 0.3));
            wfColArray[i3 + 2] = Math.max(0, Math.min(1, wfColor.b + distColor + wfVelocityBrightness * 0.4));
        }

        // ═══════════════════════════════════════════════════════════
        // CROSS-SYSTEM CONNECTIONS - Link particles to wireframe
        // ═══════════════════════════════════════════════════════════

        let lineIdx = 0;
        const connectionThreshold = 0.6 + Math.sin(time * 1.5) * 0.3 + scrollVelocity * 2;
        const maxLines = 500;

        // Connect wireframe points to each other
        for (let i = 0; i < wireframeDensity && lineIdx < maxLines * 0.6; i += 3) {
            const i3 = i * 3;
            const x1 = wfPosArray[i3], y1 = wfPosArray[i3 + 1], z1 = wfPosArray[i3 + 2];

            // Dynamic neighbor selection based on phase
            const neighborOffset = Math.floor(2 + phaseIndex + Math.sin(time * 2 + i * 0.1) * 3);
            const j = (i + neighborOffset) % wireframeDensity;
            const j3 = j * 3;
            const x2 = wfPosArray[j3], y2 = wfPosArray[j3 + 1], z2 = wfPosArray[j3 + 2];

            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);

            if (dist < connectionThreshold && dist > 0.05) {
                const li = lineIdx * 6;
                linePosArray[li] = x1;
                linePosArray[li + 1] = y1;
                linePosArray[li + 2] = z1;
                linePosArray[li + 3] = x2;
                linePosArray[li + 4] = y2;
                linePosArray[li + 5] = z2;

                // Line intensity based on proximity and phase transition
                const intensity = (1 - dist / connectionThreshold) * (0.7 + Math.sin(phaseProgress * Math.PI) * 0.3);
                const lineColor = new THREE.Color().copy(activeColor).lerp(secondaryColor, dist / connectionThreshold);

                lineColArray[li] = lineColor.r * intensity;
                lineColArray[li + 1] = lineColor.g * intensity;
                lineColArray[li + 2] = lineColor.b * intensity;
                lineColArray[li + 3] = lineColor.r * intensity * 0.5;
                lineColArray[li + 4] = lineColor.g * intensity * 0.5;
                lineColArray[li + 5] = lineColor.b * intensity * 0.5;

                lineIdx++;
            }
        }

        // Connect wireframe to nearby particles for ultimate cohesion
        const particlePosArray = particleGeometry.attributes.position.array;
        for (let i = 0; i < wireframeDensity && lineIdx < maxLines; i += 8) {
            const i3 = i * 3;
            const wx = wfPosArray[i3], wy = wfPosArray[i3 + 1], wz = wfPosArray[i3 + 2];

            // Find corresponding particle (scaled index due to different counts)
            const pIdx = Math.floor((i / wireframeDensity) * particlesCount);
            const p3 = pIdx * 3;
            const px = particlePosArray[p3], py = particlePosArray[p3 + 1], pz = particlePosArray[p3 + 2];

            const dist = Math.sqrt((px - wx) ** 2 + (py - wy) ** 2 + (pz - wz) ** 2);

            if (dist < connectionThreshold * 1.5 && dist > 0.1) {
                const li = lineIdx * 6;
                linePosArray[li] = wx;
                linePosArray[li + 1] = wy;
                linePosArray[li + 2] = wz;
                linePosArray[li + 3] = px;
                linePosArray[li + 4] = py;
                linePosArray[li + 5] = pz;

                // Cross-connections are dimmer but add cohesion
                const crossIntensity = (1 - dist / (connectionThreshold * 1.5)) * 0.4;

                lineColArray[li] = secondaryColor.r * crossIntensity;
                lineColArray[li + 1] = secondaryColor.g * crossIntensity;
                lineColArray[li + 2] = secondaryColor.b * crossIntensity;
                lineColArray[li + 3] = activeColor.r * crossIntensity * 0.7;
                lineColArray[li + 4] = activeColor.g * crossIntensity * 0.7;
                lineColArray[li + 5] = activeColor.b * crossIntensity * 0.7;

                lineIdx++;
            }
        }

        wireframeGeometry.attributes.position.needsUpdate = true;
        wireframeGeometry.attributes.color.needsUpdate = true;
        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.color.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();
    console.log("🪼 4-PHASE MORPH: Jellyfish → DNA → Nova → Blood Cells | Ethereal to Organic");

    const updateScroll = (progress) => {
        currentScroll = progress;
    };

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { updateScroll };
}
