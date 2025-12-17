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
    // CUSTOM PARAMETRIC GEOMETRY GENERATORS
    // ═══════════════════════════════════════════════════════════════════

    // Spiraling Galaxy - particles spiral outward
    function getSpiralGalaxy(count, arms = 5, radius = 3) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const arm = i % arms;
            const armAngle = (arm / arms) * Math.PI * 2;
            const spiralAngle = t * Math.PI * 8 + armAngle;
            const r = t * radius + Math.random() * 0.3;
            const height = (Math.random() - 0.5) * 0.5 * (1 - t);

            output[i * 3] = Math.cos(spiralAngle) * r;
            output[i * 3 + 1] = height;
            output[i * 3 + 2] = Math.sin(spiralAngle) * r;
        }
        return output;
    }

    // Morphing Blob - organic undulating form
    function getMorphBlob(count, radius = 2.2) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const noise = 1 + Math.sin(theta * 5) * 0.3 + Math.cos(phi * 7) * 0.2;
            const r = radius * noise * Math.cbrt(Math.random());

            output[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            output[i * 3 + 2] = r * Math.cos(phi);
        }
        return output;
    }

    // Double Helix DNA - intertwined spirals
    function getDoubleHelix(count, radius = 1.5, height = 4) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 6;
            const y = (i / count - 0.5) * height;
            const strand = i % 2;
            const offset = strand * Math.PI;
            const jitter = Math.random() * 0.15;

            output[i * 3] = Math.cos(t + offset) * (radius + jitter);
            output[i * 3 + 1] = y;
            output[i * 3 + 2] = Math.sin(t + offset) * (radius + jitter);
        }
        return output;
    }

    // Nova Explosion - expanding shell with tendrils
    function getNovaExplosion(count, radius = 2.5) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const tendril = Math.pow(Math.sin(theta * 8 + phi * 6), 2);
            const r = radius * (0.8 + tendril * 0.6) * (0.7 + Math.random() * 0.3);

            output[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            output[i * 3 + 2] = r * Math.cos(phi);
        }
        return output;
    }

    // Tesseract projection - 4D hypercube shadow
    function getTesseract(count, size = 2) {
        const output = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const edge = i % 32;
            const t = Math.random();
            // Project 4D hypercube vertices
            const w = (edge % 2) * 2 - 1;
            const x = ((edge >> 1) % 2) * 2 - 1;
            const y = ((edge >> 2) % 2) * 2 - 1;
            const z = ((edge >> 3) % 2) * 2 - 1;
            // Perspective projection from 4D
            const perspective = 2 / (2 - w * 0.3);

            output[i * 3] = x * size * perspective + (Math.random() - 0.5) * 0.2;
            output[i * 3 + 1] = y * size * perspective + (Math.random() - 0.5) * 0.2;
            output[i * 3 + 2] = z * size * perspective + (Math.random() - 0.5) * 0.2;
        }
        return output;
    }

    // Phase Geometries - 8 distinct immersive morphological states
    const geometries = [
        // Phase 0: Scattered Chaos (Initial State)
        { data: getScatteredCloud(particlesCount, 5), name: 'CHAOS' },

        // Phase 1: Spiraling Galaxy (Cosmic Formation)
        { data: getSpiralGalaxy(particlesCount, 6, 3.5), name: 'GALAXY' },

        // Phase 2: Crystalline Icosahedron (Order Emerges)
        { data: getVertices(new THREE.IcosahedronGeometry(2.5, 15), particlesCount), name: 'CRYSTAL' },

        // Phase 3: Morphing Blob (Organic Life)
        { data: getMorphBlob(particlesCount, 2.5), name: 'BLOB' },

        // Phase 4: Double Helix DNA (Genetic Code)
        { data: getDoubleHelix(particlesCount, 1.8, 5), name: 'DNA' },

        // Phase 5: Nova Explosion (Energy Release)
        { data: getNovaExplosion(particlesCount, 3), name: 'NOVA' },

        // Phase 6: Tesseract (4D Transcendence)
        { data: getTesseract(particlesCount, 2), name: 'TESSERACT' },

        // Phase 7: Final Hyperknot (Ultimate Complexity)
        { data: getVertices(new THREE.TorusKnotGeometry(1.8, 0.35, 500, 80, 7, 11), particlesCount), name: 'HYPERKNOT' }
    ];

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
    // SECONDARY STRUCTURES - Orbital Rings & Cage
    // ═══════════════════════════════════════════════════════════════════

    // Inner cage
    const cageGeo = new THREE.IcosahedronGeometry(2.6, 1);
    const cageMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.02,
        blending: THREE.AdditiveBlending
    });
    const cage = new THREE.Mesh(cageGeo, cageMaterial);
    cage.position.x = 1.8;
    scene.add(cage);

    // Orbital rings
    const rings = [];
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        wireframe: true,
        transparent: true,
        opacity: 0.03,
        blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.TorusGeometry(2.5 + i * 0.4, 0.02, 8, 64);
        const ring = new THREE.Mesh(ringGeo, ringMaterial);
        ring.position.x = 1.8;
        ring.rotation.x = Math.PI / 2 + (i * Math.PI / 6);
        ring.rotation.z = i * Math.PI / 4;
        rings.push(ring);
        scene.add(ring);
    }

    // ═══════════════════════════════════════════════════════════════════
    // INTERACTION & THEME
    // ═══════════════════════════════════════════════════════════════════

    let mouseX = 0, mouseY = 0;
    let mouseVelX = 0, mouseVelY = 0;
    let prevMouseX = 0, prevMouseY = 0;
    let targetRotX = 0, targetRotY = 0;
    let mouseNormX = 0, mouseNormY = 0; // Normalized -1 to 1

    document.addEventListener('mousemove', (e) => {
        const newMouseX = (e.clientX - window.innerWidth / 2) * 0.0005;
        const newMouseY = (e.clientY - window.innerHeight / 2) * 0.0005;

        // Track velocity for reactive effects
        mouseVelX = newMouseX - prevMouseX;
        mouseVelY = newMouseY - prevMouseY;
        prevMouseX = mouseX;
        prevMouseY = mouseY;

        mouseX = newMouseX;
        mouseY = newMouseY;

        // Normalized coordinates for attraction/repulsion field
        mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseNormY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const updateTheme = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            particleMaterial.blending = THREE.AdditiveBlending;
            scene.fog.color.setHex(0x000000);
        } else {
            particleMaterial.blending = THREE.NormalBlending;
            scene.fog.color.setHex(0xffffff);
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
    // COLOR PALETTES
    // ═══════════════════════════════════════════════════════════════════

    const palettes = [
        { primary: new THREE.Color(0x555555), secondary: new THREE.Color(0x777777) }, // 0 Chaos: Void Grey
        { primary: new THREE.Color(0x8866ff), secondary: new THREE.Color(0xff66aa) }, // 1 Galaxy: Cosmic Purple
        { primary: new THREE.Color(0x00ccff), secondary: new THREE.Color(0x00ffee) }, // 2 Crystal: Cyan Ice
        { primary: new THREE.Color(0x22ff88), secondary: new THREE.Color(0x88ffcc) }, // 3 Blob: Organic Green
        { primary: new THREE.Color(0xff3366), secondary: new THREE.Color(0xff9944) }, // 4 DNA: Genetic Red
        { primary: new THREE.Color(0xffaa00), secondary: new THREE.Color(0xffff66) }, // 5 Nova: Solar Gold
        { primary: new THREE.Color(0xaa44ff), secondary: new THREE.Color(0x44ffff) }, // 6 Tesseract: 4D Violet
        { primary: new THREE.Color(0xffffff), secondary: new THREE.Color(0xccddff) }  // 7 Hyperknot: Pure White
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
        // PHASE CALCULATION
        // ─────────────────────────────────────────────────────────────

        const numPhases = geometries.length - 1;
        const scaledProgress = prevScroll * numPhases;
        const phaseIndex = Math.min(Math.floor(scaledProgress), numPhases - 1);
        const phaseProgress = scaledProgress - phaseIndex;

        const source = geometries[phaseIndex].data;
        const target = geometries[phaseIndex + 1].data;

        // Different easing per phase for dramatic variety
        let mix;
        switch (phaseIndex) {
            case 0: // Chaos → Galaxy: Elastic emergence
                mix = easeOutElastic(Math.min(1, phaseProgress * 1.1));
                break;
            case 1: // Galaxy → Crystal: Smooth crystallization
                mix = easeInOutQuint(phaseProgress);
                break;
            case 2: // Crystal → Blob: Melting organic
                mix = easeInOutBack(phaseProgress);
                break;
            case 3: // Blob → DNA: Springy formation
                mix = easeOutElastic(Math.min(1, phaseProgress * 1.15));
                break;
            case 4: // DNA → Nova: Explosive release
                mix = Math.pow(phaseProgress, 0.5); // Fast start, slow end
                break;
            case 5: // Nova → Tesseract: Dimensional shift
                mix = easeInOutBack(phaseProgress);
                break;
            case 6: // Tesseract → Hyperknot: Final transcendence
                mix = easeOutElastic(Math.min(1, phaseProgress * 1.2));
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
        // PARTICLE PHYSICS
        // ─────────────────────────────────────────────────────────────

        const posArray = particleGeometry.attributes.position.array;
        const colArray = particleGeometry.attributes.color.array;

        // Turbulence intensity peaks during transitions
        const turbulenceBase = 0.15;
        const turbulenceTransition = Math.sin(phaseProgress * Math.PI) * 0.4;
        const turbulenceIntensity = turbulenceBase + turbulenceTransition + scrollVelocity * 2;

        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const phase = phases[i];

            // Target position with interpolation
            let tx = source[i3] + (target[i3] - source[i3]) * mix;
            let ty = source[i3 + 1] + (target[i3 + 1] - source[i3 + 1]) * mix;
            let tz = source[i3 + 2] + (target[i3 + 2] - source[i3 + 2]) * mix;

            // Curl noise for organic flow
            const curl = curlNoise(tx * 0.5, ty * 0.5, tz * 0.5, time * 0.5);

            // FBM for multi-scale detail
            const turbulence = fbm(tx + time * 0.2, ty + time * 0.15, tz + time * 0.1, 3);

            // Distance-based effects (particles further from center behave differently)
            const dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
            const distFactor = 1 - Math.min(1, dist / 4);

            // ═══════════════════════════════════════════════════════════
            // MOUSE ATTRACTION FIELD - Creates interactive push/pull
            // ═══════════════════════════════════════════════════════════
            const mouseWorldX = mouseNormX * 4; // Map to 3D space
            const mouseWorldY = mouseNormY * 3;
            const mouseWorldZ = 0;

            const toMouseX = mouseWorldX - tx;
            const toMouseY = mouseWorldY - ty;
            const toMouseZ = mouseWorldZ - tz;
            const mouseDistance = Math.sqrt(toMouseX * toMouseX + toMouseY * toMouseY + toMouseZ * toMouseZ);

            // Attraction falls off with distance, repulsion when very close
            const mouseInfluence = Math.max(0, 1 - mouseDistance / 5);
            const attractionStrength = 0.15 * mouseInfluence;
            const mouseVelocityBoost = Math.abs(mouseVelX) + Math.abs(mouseVelY);

            const mouseEffect = {
                x: toMouseX * attractionStrength * (1 + mouseVelocityBoost * 50),
                y: toMouseY * attractionStrength * (1 + mouseVelocityBoost * 50),
                z: toMouseZ * attractionStrength * 0.3
            };

            // Orbital motion layer - intensified
            const orbitSpeed = 0.4 + distFactor * 0.6;
            const orbit = {
                x: Math.sin(time * orbitSpeed + phase) * 0.08 * dist,
                y: Math.cos(time * orbitSpeed * 1.3 + phase) * 0.08 * dist,
                z: Math.sin(time * orbitSpeed * 0.7 + phase + 1) * 0.08 * dist
            };

            // Breathing / pulsation - enhanced
            const pulse = Math.sin(time * 2.5 + dist * 2.5 + phase) * 0.05;

            // Combine all movements including mouse interaction
            const finalX = tx + curl.x * turbulenceIntensity + orbit.x + turbulence * 0.12 + pulse * tx + mouseEffect.x;
            const finalY = ty + curl.y * turbulenceIntensity + orbit.y + turbulence * 0.12 + pulse * ty + mouseEffect.y;
            const finalZ = tz + curl.z * turbulenceIntensity + orbit.z + turbulence * 0.12 + pulse * tz + mouseEffect.z;

            // Apply with momentum (spring physics)
            const springStrength = 0.08;
            const dampening = 0.92;

            velocities[i3] = velocities[i3] * dampening + (finalX - posArray[i3]) * springStrength;
            velocities[i3 + 1] = velocities[i3 + 1] * dampening + (finalY - posArray[i3 + 1]) * springStrength;
            velocities[i3 + 2] = velocities[i3 + 2] * dampening + (finalZ - posArray[i3 + 2]) * springStrength;

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
        // STRUCTURE ANIMATIONS
        // ─────────────────────────────────────────────────────────────

        // Mouse parallax with inertia
        targetRotX += (mouseY * 0.8 - targetRotX) * 0.02;
        targetRotY += (mouseX * 0.8 - targetRotY) * 0.02;

        // Main system rotation
        particleSystem.rotation.y += 0.0008 + scrollVelocity * 0.5;
        particleSystem.rotation.x = targetRotX;

        // Cage counter-rotation
        cage.rotation.y -= 0.001;
        cage.rotation.x = Math.sin(time * 0.3) * 0.1;
        cage.scale.setScalar(1 + Math.sin(time * 0.5) * 0.03 + scrollVelocity);

        // Orbital rings animation
        rings.forEach((ring, i) => {
            ring.rotation.x += 0.002 * (i + 1);
            ring.rotation.z += 0.001 * (i + 1) * (i % 2 ? 1 : -1);
            ring.material.opacity = 0.02 + Math.sin(time + i) * 0.01;
        });

        renderer.render(scene, camera);
    }

    animate();
    console.log("🌌 Immersive Particle System v2.0: 8 PHASES ACTIVATED");

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
