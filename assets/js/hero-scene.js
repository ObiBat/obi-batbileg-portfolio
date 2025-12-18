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
    // NEURAL NETWORK - Living Brain Synapse Visualization (ENHANCED)
    // Complex multi-layer brain structure with cortex, neurons, glial cells
    // ═══════════════════════════════════════════════════════════════════

    function getNeuralNetwork(count) {
        const output = new Float32Array(count * 3);

        // ─────────────────────────────────────────────────────────────
        // NEURON CELL BODIES (Soma) - Central processing nodes
        // ─────────────────────────────────────────────────────────────
        const neuronCount = 55; // Increased for denser network
        const neurons = [];

        // Layer 1: Core neurons (deep brain) - tight cluster
        for (let n = 0; n < 20; n++) {
            const phi = Math.acos(1 - 2 * (n + 0.5) / 20);
            const theta = Math.PI * (1 + Math.sqrt(5)) * n;
            const radius = 1.2 + Math.sin(n * 0.9) * 0.5;

            neurons.push({
                x: radius * Math.sin(phi) * Math.cos(theta),
                y: radius * Math.sin(phi) * Math.sin(theta) * 0.6,
                z: radius * Math.cos(phi),
                size: 0.18 + Math.random() * 0.08,
                connections: [],
                firePhase: Math.random() * Math.PI * 2,
                layer: 'core'
            });
        }

        // Layer 2: Mid-brain neurons - medium spread
        for (let n = 0; n < 20; n++) {
            const phi = Math.acos(1 - 2 * (n + 0.5) / 20);
            const theta = Math.PI * (1 + Math.sqrt(5)) * n + 0.5;
            const radius = 2.2 + Math.sin(n * 0.7) * 0.8;

            neurons.push({
                x: radius * Math.sin(phi) * Math.cos(theta),
                y: radius * Math.sin(phi) * Math.sin(theta) * 0.7,
                z: radius * Math.cos(phi),
                size: 0.14 + Math.random() * 0.06,
                connections: [],
                firePhase: Math.random() * Math.PI * 2,
                layer: 'mid'
            });
        }

        // Layer 3: Cortex neurons - outer shell
        for (let n = 0; n < 15; n++) {
            const phi = Math.acos(1 - 2 * (n + 0.5) / 15);
            const theta = Math.PI * (1 + Math.sqrt(5)) * n + 1.0;
            const radius = 3.2 + Math.sin(n * 0.5) * 0.6;

            neurons.push({
                x: radius * Math.sin(phi) * Math.cos(theta),
                y: radius * Math.sin(phi) * Math.sin(theta) * 0.65,
                z: radius * Math.cos(phi),
                size: 0.12 + Math.random() * 0.05,
                connections: [],
                firePhase: Math.random() * Math.PI * 2,
                layer: 'cortex'
            });
        }

        // ─────────────────────────────────────────────────────────────
        // SYNAPSE CONNECTIONS - Find nearby neurons to connect
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < neuronCount; i++) {
            for (let j = i + 1; j < neuronCount; j++) {
                const dist = Math.sqrt(
                    (neurons[i].x - neurons[j].x) ** 2 +
                    (neurons[i].y - neurons[j].y) ** 2 +
                    (neurons[i].z - neurons[j].z) ** 2
                );
                // Core neurons connect more, cortex less
                const maxConnections = neurons[i].layer === 'core' ? 6 :
                    neurons[i].layer === 'mid' ? 4 : 3;
                const connectDist = neurons[i].layer === 'core' ? 2.5 : 3.0;

                if (dist < connectDist && neurons[i].connections.length < maxConnections) {
                    neurons[i].connections.push(j);
                }
            }
        }

        // Particle distribution
        const cortexCount = Math.floor(count * 0.10);       // Outer brain surface
        const somaCount = Math.floor(count * 0.10);         // Cell bodies
        const glialCount = Math.floor(count * 0.08);        // Support cells
        const dendriteCount = Math.floor(count * 0.22);     // Branching input
        const axonCount = Math.floor(count * 0.30);         // Connection pathways
        const synapseCount = Math.floor(count * 0.12);      // Firing junctions
        const signalCount = count - cortexCount - somaCount - glialCount - dendriteCount - axonCount - synapseCount;

        let idx = 0;

        // ─────────────────────────────────────────────────────────────
        // CORTEX SURFACE - Outer brain membrane with folds (sulci/gyri)
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < cortexCount; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * Math.PI * 2;
            const phi = v * Math.PI;

            // Brain-like radius with wrinkles
            const baseRadius = 3.8;
            const wrinkle = Math.sin(theta * 8 + phi * 6) * 0.15 +
                Math.sin(theta * 12 - phi * 4) * 0.08;
            const r = baseRadius + wrinkle;

            output[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.65;
            output[idx * 3 + 2] = r * Math.cos(phi);
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // SOMA - Glowing cell bodies with membrane detail
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < somaCount; i++) {
            const neuron = neurons[i % neuronCount];
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = neuron.size * (0.4 + Math.random() * 0.6);

            // Organic membrane with nucleus bulge
            const wobble = 1 + Math.sin(theta * 5 + phi * 3) * 0.12;
            const nucleusBulge = Math.exp(-phi * 2) * 0.15;

            output[idx * 3] = neuron.x + r * Math.sin(phi) * Math.cos(theta) * (wobble + nucleusBulge);
            output[idx * 3 + 1] = neuron.y + r * Math.sin(phi) * Math.sin(theta) * wobble;
            output[idx * 3 + 2] = neuron.z + r * Math.cos(phi) * wobble;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // GLIAL CELLS - Star-shaped support cells between neurons
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < glialCount; i++) {
            const neuronA = neurons[i % neuronCount];
            const neuronB = neurons[(i + 7) % neuronCount];

            // Position between neurons
            const t = 0.3 + Math.random() * 0.4;
            const baseX = neuronA.x + (neuronB.x - neuronA.x) * t;
            const baseY = neuronA.y + (neuronB.y - neuronA.y) * t;
            const baseZ = neuronA.z + (neuronB.z - neuronA.z) * t;

            // Star-like extensions
            const armAngle = (i / glialCount) * Math.PI * 6;
            const armLength = 0.2 + Math.random() * 0.15;

            output[idx * 3] = baseX + Math.cos(armAngle) * armLength;
            output[idx * 3 + 1] = baseY + Math.sin(armAngle * 0.5) * armLength * 0.5;
            output[idx * 3 + 2] = baseZ + Math.sin(armAngle) * armLength;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // DENDRITES - Fractal branching tree structures
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < dendriteCount; i++) {
            const neuron = neurons[i % neuronCount];
            const branchIdx = Math.floor((i / dendriteCount) * 8);
            const branchAngle = (branchIdx * 0.618) * Math.PI * 2;

            // Multi-level fractal depth
            const depth = Math.pow(Math.random(), 0.5);
            const branchLength = neuron.size * (2.5 + Math.random() * 2);

            // Primary direction with S-curve
            const curve1 = Math.sin(depth * 3 + branchAngle) * 0.5;
            const curve2 = Math.cos(depth * 5 + branchAngle * 0.7) * 0.3;

            const dx = Math.cos(branchAngle + curve1) * branchLength * depth;
            const dy = (Math.random() - 0.5) * branchLength * depth * 0.5 + depth * 0.4;
            const dz = Math.sin(branchAngle + curve2) * branchLength * depth;

            // Secondary branching
            const subBranch = Math.sin(depth * 15 + branchIdx * 2) * 0.2 * branchLength * depth;
            const tertiaryBranch = Math.cos(depth * 25) * 0.08 * branchLength * depth;

            output[idx * 3] = neuron.x + dx + subBranch * Math.cos(branchAngle * 3);
            output[idx * 3 + 1] = neuron.y + dy + tertiaryBranch;
            output[idx * 3 + 2] = neuron.z + dz + subBranch * Math.sin(branchAngle * 3);
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // AXONS - Long myelinated connection pathways
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < axonCount; i++) {
            const neuronIdx = i % neuronCount;
            const neuron = neurons[neuronIdx];

            if (neuron.connections.length > 0) {
                const targetIdx = neuron.connections[i % neuron.connections.length];
                const target = neurons[targetIdx];

                // Bezier curve with more pronounced arc
                const t = Math.random();
                const arcHeight = 0.3 + Math.random() * 0.3;
                const midPoint = {
                    x: (neuron.x + target.x) / 2 + (Math.random() - 0.5) * 0.6,
                    y: (neuron.y + target.y) / 2 + arcHeight,
                    z: (neuron.z + target.z) / 2 + (Math.random() - 0.5) * 0.6
                };

                // Cubic bezier for smoother curves
                const tt = t * t;
                const ttt = tt * t;
                const u = 1 - t;
                const uu = u * u;
                const uuu = uu * u;

                const x = uuu * neuron.x + 3 * uu * t * midPoint.x + 3 * u * tt * midPoint.x + ttt * target.x;
                const y = uuu * neuron.y + 3 * uu * t * midPoint.y + 3 * u * tt * midPoint.y + ttt * target.y;
                const z = uuu * neuron.z + 3 * uu * t * midPoint.z + 3 * u * tt * midPoint.z + ttt * target.z;

                // Myelin sheath nodes (Nodes of Ranvier spacing)
                const myelinPattern = Math.sin(t * 25) * 0.5 + 0.5;
                const thickness = (0.025 + myelinPattern * 0.015);
                const spiralAngle = t * Math.PI * 12;

                output[idx * 3] = x + Math.cos(spiralAngle) * thickness;
                output[idx * 3 + 1] = y + Math.sin(spiralAngle) * thickness * 0.5;
                output[idx * 3 + 2] = z + Math.sin(spiralAngle) * thickness;
            } else {
                // Isolated neuron - axon hillock
                const angle = Math.random() * Math.PI * 2;
                const length = neuron.size * (1.2 + Math.random() * 0.8);
                output[idx * 3] = neuron.x + Math.cos(angle) * length;
                output[idx * 3 + 1] = neuron.y - length * 0.4;
                output[idx * 3 + 2] = neuron.z + Math.sin(angle) * length;
            }
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // SYNAPSES - Glowing vesicle clusters at junctions
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < synapseCount; i++) {
            const neuronIdx = i % neuronCount;
            const neuron = neurons[neuronIdx];

            if (neuron.connections.length > 0) {
                const targetIdx = neuron.connections[i % neuron.connections.length];
                const target = neurons[targetIdx];

                // Synapse terminal
                const t = 0.88 + Math.random() * 0.12;
                const x = neuron.x + (target.x - neuron.x) * t;
                const y = neuron.y + (target.y - neuron.y) * t;
                const z = neuron.z + (target.z - neuron.z) * t;

                // Dense vesicle cluster
                const vesicleSpread = 0.1;
                const clusterDensity = Math.pow(Math.random(), 0.5);
                output[idx * 3] = x + (Math.random() - 0.5) * vesicleSpread * clusterDensity;
                output[idx * 3 + 1] = y + (Math.random() - 0.5) * vesicleSpread * clusterDensity;
                output[idx * 3 + 2] = z + (Math.random() - 0.5) * vesicleSpread * clusterDensity;
            } else {
                output[idx * 3] = neuron.x;
                output[idx * 3 + 1] = neuron.y;
                output[idx * 3 + 2] = neuron.z;
            }
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // ELECTRICAL SIGNALS - Action potentials with spark trails
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < signalCount; i++) {
            const neuronIdx = i % neuronCount;
            const neuron = neurons[neuronIdx];

            const signalPhase = (i / signalCount) * Math.PI * 2;
            const signalT = (Math.sin(signalPhase) + 1) / 2;

            if (neuron.connections.length > 0) {
                const targetIdx = neuron.connections[Math.floor(Math.random() * neuron.connections.length)];
                const target = neurons[targetIdx];

                // Signal position with spark scatter
                const sparkScatter = 0.05 * (1 - Math.abs(signalT - 0.5) * 2);
                output[idx * 3] = neuron.x + (target.x - neuron.x) * signalT + (Math.random() - 0.5) * sparkScatter;
                output[idx * 3 + 1] = neuron.y + (target.y - neuron.y) * signalT + (Math.random() - 0.5) * sparkScatter;
                output[idx * 3 + 2] = neuron.z + (target.z - neuron.z) * signalT + (Math.random() - 0.5) * sparkScatter;
            } else {
                output[idx * 3] = neuron.x + Math.cos(signalPhase) * neuron.size * 1.2;
                output[idx * 3 + 1] = neuron.y;
                output[idx * 3 + 2] = neuron.z + Math.sin(signalPhase) * neuron.size * 1.2;
            }
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

    // ═══════════════════════════════════════════════════════════════════
    // SINGULARITY - Black Hole / Wormhole with Gravitational Lensing
    // Event Horizon, Accretion Disk, Relativistic Jets, Warped Spacetime
    // ═══════════════════════════════════════════════════════════════════

    function getSingularity(count) {
        const output = new Float32Array(count * 3);

        // Particle distribution
        const eventHorizonCount = Math.floor(count * 0.08);   // Dark core sphere
        const accretionDiskCount = Math.floor(count * 0.35);  // Spinning matter disk
        const jetCount = Math.floor(count * 0.12);            // Relativistic polar jets
        const lensingRingCount = Math.floor(count * 0.18);    // Gravitational lensing arcs
        const wormholeCount = Math.floor(count * 0.15);       // Tunnel to elsewhere
        const debrisCount = count - eventHorizonCount - accretionDiskCount - jetCount - lensingRingCount - wormholeCount;

        let idx = 0;

        // ─────────────────────────────────────────────────────────────
        // EVENT HORIZON - The point of no return
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < eventHorizonCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 0.4 + Math.random() * 0.15; // Schwarzschild radius

            // Slight warping at the boundary
            const warp = 1 + Math.sin(theta * 8 + phi * 4) * 0.05;

            output[idx * 3] = r * Math.sin(phi) * Math.cos(theta) * warp;
            output[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * warp;
            output[idx * 3 + 2] = r * Math.cos(phi) * warp;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // ACCRETION DISK - Superheated spiraling matter
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < accretionDiskCount; i++) {
            const t = i / accretionDiskCount;
            const spiralAngle = t * Math.PI * 12 + Math.random() * 0.5; // Multiple wraps

            // Disk radius with density falloff
            const r = 0.8 + Math.pow(t, 0.7) * 3.5;

            // Disk height (thin but with some turbulence)
            const turbulence = Math.sin(spiralAngle * 3 + t * 20) * 0.1;
            const diskHeight = 0.08 * (1 - t * 0.5) + (Math.random() - 0.5) * 0.15 + turbulence;

            // Spiral density waves
            const densityWave = 1 + Math.sin(spiralAngle * 2 - t * 15) * 0.3;

            output[idx * 3] = Math.cos(spiralAngle) * r * densityWave;
            output[idx * 3 + 1] = diskHeight;
            output[idx * 3 + 2] = Math.sin(spiralAngle) * r * densityWave;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // RELATIVISTIC JETS - Polar matter ejection
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < jetCount; i++) {
            const t = Math.pow(Math.random(), 0.5); // More particles near base
            const pole = i % 2 === 0 ? 1 : -1; // Top and bottom jets

            // Jet height with conical spread
            const height = t * 5 * pole;
            const spread = t * 0.8; // Cone opens up

            // Helical structure in jets
            const helixAngle = t * Math.PI * 8 + (i / jetCount) * Math.PI * 2;
            const helixRadius = spread * (0.3 + Math.sin(t * 10) * 0.1);

            // Turbulent knots
            const knot = Math.sin(t * 30 + i) * 0.15 * t;

            output[idx * 3] = Math.cos(helixAngle) * helixRadius + knot;
            output[idx * 3 + 1] = height;
            output[idx * 3 + 2] = Math.sin(helixAngle) * helixRadius + knot;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // GRAVITATIONAL LENSING - Light bent around singularity
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < lensingRingCount; i++) {
            const ringIdx = Math.floor(i / (lensingRingCount / 3)); // 3 photon rings
            const t = (i % (lensingRingCount / 3)) / (lensingRingCount / 3);

            const ringRadius = 0.55 + ringIdx * 0.15; // Photon sphere layers
            const angle = t * Math.PI * 2;

            // Rings appear to wrap behind and around
            const tilt = Math.PI * 0.15 + ringIdx * 0.1;
            const wobble = Math.sin(angle * 6 + ringIdx) * 0.03;

            const x = Math.cos(angle) * ringRadius;
            const y = Math.sin(angle) * Math.sin(tilt) * ringRadius + wobble;
            const z = Math.sin(angle) * Math.cos(tilt) * ringRadius;

            output[idx * 3] = x;
            output[idx * 3 + 1] = y;
            output[idx * 3 + 2] = z;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // WORMHOLE TUNNEL - Gateway to another dimension
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < wormholeCount; i++) {
            const t = i / wormholeCount;
            const tunnelAngle = t * Math.PI * 16; // Many spirals down the tunnel

            // Tunnel extends behind the event horizon
            const depth = -t * 4 - 0.3; // Goes into negative Z

            // Tunnel radius narrows then expands (throat)
            const throatProfile = 0.3 + Math.pow(Math.abs(t - 0.3), 1.5) * 2;

            // Spacetime ripples
            const ripple = Math.sin(t * 20 + tunnelAngle) * 0.1;

            output[idx * 3] = Math.cos(tunnelAngle) * throatProfile * (1 + ripple);
            output[idx * 3 + 1] = Math.sin(tunnelAngle) * throatProfile * (1 + ripple);
            output[idx * 3 + 2] = depth;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // DEBRIS FIELD - Captured matter falling inward
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < debrisCount; i++) {
            const orbitAngle = Math.random() * Math.PI * 2;
            const orbitRadius = 1.5 + Math.random() * 3;
            const orbitTilt = (Math.random() - 0.5) * 0.4;

            // Elliptical deformed orbits
            const eccentricity = 0.3 + Math.random() * 0.4;
            const r = orbitRadius * (1 - eccentricity * eccentricity) /
                (1 + eccentricity * Math.cos(orbitAngle));

            output[idx * 3] = Math.cos(orbitAngle) * r;
            output[idx * 3 + 1] = Math.sin(orbitAngle) * orbitTilt * r;
            output[idx * 3 + 2] = Math.sin(orbitAngle) * r * 0.5;
            idx++;
        }

        return output;
    }

    // ═══════════════════════════════════════════════════════════════════
    // COSMOS - Enhanced Galaxy with Maximum Detail and Clarity
    // Spiral Arms, Star Nurseries, Dark Matter, Satellites, Supernovae
    // ═══════════════════════════════════════════════════════════════════

    function getCosmos(count) {
        const output = new Float32Array(count * 3);

        // SCALE MULTIPLIER for larger, clearer galaxy
        const SCALE = 1.3;

        // Enhanced multi-layer galaxy structure - MORE PARTICLES IN VISIBLE FEATURES
        const coreCount = Math.floor(count * 0.10);           // Bright core (increased)
        const bulgeCount = Math.floor(count * 0.12);          // Dense central bulge (increased)
        const spiralCount = Math.floor(count * 0.38);         // Spiral arms (MAIN - 38%!)
        const dustLaneCount = Math.floor(count * 0.06);       // Dark dust lanes
        const haloCount = Math.floor(count * 0.08);           // Dark matter halo (reduced)
        const nurseryCount = Math.floor(count * 0.10);        // Star forming regions 
        const satelliteCount = Math.floor(count * 0.06);      // Satellite dwarf galaxies
        const supernovaCount = Math.floor(count * 0.04);      // Supernova remnants
        const filamentCount = count - coreCount - bulgeCount - spiralCount - dustLaneCount - haloCount - nurseryCount - satelliteCount - supernovaCount;

        let idx = 0;
        const arms = 5; // 5 spiral arms for richness

        // ─────────────────────────────────────────────────────────────
        // GALACTIC CORE - Blazing central region with jets
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < coreCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = Math.pow(Math.random(), 0.5) * 0.4 * SCALE; // Brighter concentration

            // Core with mini-jets
            const jet = (i % 10 < 2) ? (Math.random() * 0.5 * SCALE) * (i % 2 === 0 ? 1 : -1) : 0;

            output[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3 + jet;
            output[idx * 3 + 2] = r * Math.cos(phi);
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // GALACTIC BULGE - Dense old star population (SCALED)
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < bulgeCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = (0.35 + Math.pow(Math.random(), 0.5) * 0.9) * SCALE;

            // Boxy/peanut shaped bulge
            const boxy = 1 + Math.sin(theta * 2) * 0.12;

            output[idx * 3] = r * Math.sin(phi) * Math.cos(theta) * boxy;
            output[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.45;
            output[idx * 3 + 2] = r * Math.cos(phi) * 0.85;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // SPIRAL ARMS - Sharp, well-defined logarithmic spirals
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < spiralCount; i++) {
            const t = i / spiralCount;
            const arm = i % arms;
            const armAngle = (arm / arms) * Math.PI * 2;

            // TIGHTER spiral with consistent tightness
            const spiralTightness = 0.25;
            const r = (0.6 + t * 4.5) * SCALE; // Scaled radius
            const theta = Math.log(r / SCALE) / spiralTightness + armAngle;

            // NARROWER arm width for sharper definition
            const armWidth = 0.08 + t * 0.20;

            // Strong clumping along arm center (like real galaxies)
            const armCenter = Math.pow(Math.cos((i % 50) / 50 * Math.PI), 4);
            const armOffset = (Math.random() - 0.5) * armWidth * (1 - armCenter * 0.6);

            // Perturbations for organic structure
            const perturbation = Math.sin(t * 20 + arm * 7) * 0.12 * t;

            // Very thin disk with gentle warp
            const warp = t > 0.75 ? Math.sin(theta * 2) * 0.15 * (t - 0.75) : 0;
            const height = ((Math.random() - 0.5) * (0.05 + t * 0.08) + warp) * SCALE;

            const finalR = r + (armOffset + perturbation) * SCALE;
            output[idx * 3] = Math.cos(theta) * finalR;
            output[idx * 3 + 1] = height;
            output[idx * 3 + 2] = Math.sin(theta) * finalR;
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // DUST LANES - Dark ribbons between spiral arms
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < dustLaneCount; i++) {
            const t = i / dustLaneCount;
            const arm = i % arms;
            const armAngle = (arm / arms) * Math.PI * 2 + Math.PI / arms; // Offset between arms

            const r = 1.0 + t * 4.0;
            const theta = Math.log(r) / 0.3 + armAngle;

            // Narrow dust lanes
            const laneWidth = 0.08 + t * 0.15;
            const offset = (Math.random() - 0.5) * laneWidth;

            output[idx * 3] = Math.cos(theta) * (r + offset);
            output[idx * 3 + 1] = (Math.random() - 0.5) * 0.05;
            output[idx * 3 + 2] = Math.sin(theta) * (r + offset);
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // DARK MATTER HALO - Vast invisible structure
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < haloCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            // NFW profile - extends very far
            const u = Math.random();
            const r = 4 + Math.pow(u, 0.35) * 6;

            output[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
            output[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.75;
            output[idx * 3 + 2] = r * Math.cos(phi);
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // STAR NURSERIES - Glowing HII regions along arms (SCALED)
        // ─────────────────────────────────────────────────────────────
        const nurseryPositions = [
            { r: 1.6 * SCALE, angle: 0.6, size: 0.35 * SCALE },
            { r: 2.3 * SCALE, angle: 1.8, size: 0.4 * SCALE },
            { r: 3.0 * SCALE, angle: 3.2, size: 0.45 * SCALE },
            { r: 1.4 * SCALE, angle: 4.5, size: 0.3 * SCALE },
            { r: 3.5 * SCALE, angle: 5.8, size: 0.5 * SCALE },
            { r: 2.0 * SCALE, angle: 2.5, size: 0.38 * SCALE },
            { r: 3.8 * SCALE, angle: 0.3, size: 0.42 * SCALE },
            { r: 2.6 * SCALE, angle: 4.0, size: 0.35 * SCALE }
        ];

        for (let i = 0; i < nurseryCount; i++) {
            const nursery = nurseryPositions[i % nurseryPositions.length];

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const clusterR = Math.pow(Math.random(), 0.6) * nursery.size;

            const baseX = Math.cos(nursery.angle) * nursery.r;
            const baseZ = Math.sin(nursery.angle) * nursery.r;

            output[idx * 3] = baseX + clusterR * Math.sin(phi) * Math.cos(theta);
            output[idx * 3 + 1] = clusterR * Math.sin(phi) * Math.sin(theta) * 0.35;
            output[idx * 3 + 2] = baseZ + clusterR * Math.cos(phi);
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // SATELLITE GALAXIES - Dwarf companions orbiting (SCALED)
        // ─────────────────────────────────────────────────────────────
        const satellites = [
            { x: 5.5 * SCALE, y: 1.2 * SCALE, z: 2.0 * SCALE, size: 0.6 * SCALE },
            { x: -4.0 * SCALE, y: -0.8 * SCALE, z: 4.5 * SCALE, size: 0.45 * SCALE },
            { x: 3.5 * SCALE, y: 0.5 * SCALE, z: -5.0 * SCALE, size: 0.5 * SCALE },
            { x: -6.0 * SCALE, y: 1.5 * SCALE, z: -2.0 * SCALE, size: 0.4 * SCALE }
        ];

        for (let i = 0; i < satelliteCount; i++) {
            const sat = satellites[i % satellites.length];

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = Math.pow(Math.random(), 0.5) * sat.size;

            output[idx * 3] = sat.x + r * Math.sin(phi) * Math.cos(theta);
            output[idx * 3 + 1] = sat.y + r * Math.sin(phi) * Math.sin(theta) * 0.6;
            output[idx * 3 + 2] = sat.z + r * Math.cos(phi);
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // SUPERNOVA REMNANTS - Expanding shells of brilliance
        // ─────────────────────────────────────────────────────────────
        const supernovae = [
            { r: 2.0, angle: 1.2, size: 0.25 },
            { r: 3.5, angle: 3.8, size: 0.3 },
            { r: 1.5, angle: 5.2, size: 0.2 }
        ];

        for (let i = 0; i < supernovaCount; i++) {
            const sn = supernovae[i % supernovae.length];

            // Expanding shell
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const shellR = sn.size * (0.8 + Math.random() * 0.4);

            const baseX = Math.cos(sn.angle) * sn.r;
            const baseZ = Math.sin(sn.angle) * sn.r;

            output[idx * 3] = baseX + shellR * Math.sin(phi) * Math.cos(theta);
            output[idx * 3 + 1] = shellR * Math.sin(phi) * Math.sin(theta);
            output[idx * 3 + 2] = baseZ + shellR * Math.cos(phi);
            idx++;
        }

        // ─────────────────────────────────────────────────────────────
        // COSMIC FILAMENTS - Large-scale structure web
        // ─────────────────────────────────────────────────────────────
        for (let i = 0; i < filamentCount; i++) {
            const filamentIdx = i % 10; // 10 major filaments
            const t = (i / filamentCount) * 10;

            const baseAngle = (filamentIdx / 10) * Math.PI * 2;
            const filamentR = 6 + t * 4; // Extended reach

            // Complex wave pattern
            const wave = Math.sin(t * 1.5 + filamentIdx * 0.7) * 1.0;
            const verticalWave = Math.cos(t * 2 + filamentIdx * 0.3) * 0.6;

            // Galaxy cluster nodes
            const node = Math.pow(Math.sin(t * 4), 10) * 0.8;

            output[idx * 3] = Math.cos(baseAngle + wave * 0.08) * (filamentR + node);
            output[idx * 3 + 1] = verticalWave + (Math.random() - 0.5) * 0.4;
            output[idx * 3 + 2] = Math.sin(baseAngle + wave * 0.08) * (filamentR + node);
            idx++;
        }

        return output;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CURATED PHASE GEOMETRIES - 4 MASTERPIECE SHAPES
    // Complete reimagination with intensified immersive motion
    // ═══════════════════════════════════════════════════════════════════

    const geometries = [
        // ═══════════════════════════════════════════════════════════════
        // Phase 0: NEURAL NETWORK - Intelligence, Connection, Cognition
        // Living brain visualization with firing synapses
        // ═══════════════════════════════════════════════════════════════
        {
            data: getNeuralNetwork(particlesCount),
            name: 'NEURAL',
            physics: {
                turbulence: 0.5,        // Electrical impulse chaos
                attraction: 0.08,       // Synaptic attraction
                orbit: 0.35,            // Gentle neural oscillation
                pulse: 0.30,            // Strong firing rhythm (EEG-like)
                spring: 0.06,           // Soft dendrite flexibility
                dampen: 0.96            // Smooth signal propagation
            }
        },

        // ═══════════════════════════════════════════════════════════════
        // Phase 1: DOUBLE HELIX - Life, Growth, Innovation, Blueprint
        // Enhanced DNA with base pairs and energy flow
        // ═══════════════════════════════════════════════════════════════
        {
            data: getTripleHelix(particlesCount, 2.2, 6),
            name: 'HELIX',
            physics: {
                turbulence: 0.28,       // Precise molecular vibration
                attraction: 0.10,       // Base pair bonding
                orbit: 0.45,            // Helical rotation (mesmerizing)
                pulse: 0.18,            // Life pulse rhythm
                spring: 0.12,           // Springy molecular tension
                dampen: 0.94            // Fluid viscosity
            }
        },

        // ═══════════════════════════════════════════════════════════════
        // Phase 2: SINGULARITY - Power, Transformation, Event Horizon
        // Black hole with accretion disk, jets, and wormhole
        // ═══════════════════════════════════════════════════════════════
        {
            data: getSingularity(particlesCount),
            name: 'SINGULARITY',
            physics: {
                turbulence: 1.8,        // Extreme gravitational chaos
                attraction: 0.25,       // Strong gravitational pull toward center
                orbit: 1.2,             // Intense orbital velocity
                pulse: 0.35,            // Violent pulsation
                spring: 0.02,           // Near-zero resistance (falling in)
                dampen: 0.82            // Low damping (high energy system)
            }
        },

        // ═══════════════════════════════════════════════════════════════
        // Phase 3: COSMOS - Creation, Infinity, Wonder, Grand Finale
        // Enhanced galaxy with maximum clarity and distinction
        // ═══════════════════════════════════════════════════════════════
        {
            data: getCosmos(particlesCount),
            name: 'COSMOS',
            physics: {
                turbulence: 0.40,       // Controlled galactic wind
                attraction: 0.06,       // Core attraction (spiral inward)
                orbit: 0.85,            // STRONG spiral rotation for clarity
                pulse: 0.22,            // Stellar breathing rhythm
                spring: 0.035,          // Soft but responsive
                dampen: 0.965           // Smooth, majestic motion
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
        { primary: new THREE.Color(0x00ddff), secondary: new THREE.Color(0x8855ff) }, // 0 NEURAL: Electric Cyan → Neural Purple
        { primary: new THREE.Color(0x00ff66), secondary: new THREE.Color(0x44ffaa) }, // 1 HELIX: DNA Green → Bio Mint
        { primary: new THREE.Color(0xff6600), secondary: new THREE.Color(0xff0044) }, // 2 SINGULARITY: Accretion Orange → Event Horizon Red
        {
            primary: new THREE.Color(0xffcc44),   // COSMOS: Golden core/star formation
            secondary: new THREE.Color(0xff66aa), // Pink/magenta nebula regions
            tertiary: new THREE.Color(0x44ddff)   // Cyan young stars
        }
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
        prevScroll += (currentScroll - prevScroll) * 0.15; // Faster response (was 0.08)

        // ─────────────────────────────────────────────────────────────
        // PHASE CALCULATION - Weighted Scroll Zones
        // More responsive transitions with reduced stickiness
        // ─────────────────────────────────────────────────────────────

        const numPhases = geometries.length - 1; // 3 transitions for 4 phases

        // Weighted scroll zones: COSMOS gets more time (30%) for full appreciation
        // NEURAL (25%), HELIX (20%), SINGULARITY (15%), COSMOS (30%) + Exit (10%)
        const phaseWeights = [0.25, 0.20, 0.15, 0.30]; // Core phases = 90%
        const phaseBreakpoints = [0, 0.25, 0.45, 0.60, 0.90]; // Last 10% for exit

        // Reduced scroll "stickiness" at phase boundaries for better sync
        let adjustedProgress = prevScroll;
        const checkpointPauses = [0.05, 0.05, 0.06]; // Reduced pause zones

        for (let cp = 0; cp < numPhases; cp++) {
            const checkpoint = phaseBreakpoints[cp + 1];
            const distToCheckpoint = Math.abs(adjustedProgress - checkpoint);
            const pauseZone = checkpointPauses[cp];

            if (distToCheckpoint < pauseZone) {
                // Lighter stickiness for more responsive feel
                const pauseStrength = 1 - (distToCheckpoint / pauseZone);
                const pauseIntensity = 0.15; // Even lighter for responsiveness
                adjustedProgress += (checkpoint - adjustedProgress) * pauseStrength * pauseIntensity;
            }
        }

        // ─────────────────────────────────────────────────────────────
        // SMOOTH EXIT TRANSITION (90-100% scroll progress)
        // Fade out and zoom for seamless transition to projects
        // ─────────────────────────────────────────────────────────────
        let exitProgress = 0;
        if (adjustedProgress > 0.90) {
            exitProgress = (adjustedProgress - 0.90) / 0.10; // 0 to 1
            // Clamp adjusted progress to keep COSMOS stable during exit
            adjustedProgress = 0.90;
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
        // INTENSIFIED APPRECIATION ZONES - Maximum peak clarity time
        // Each shape holds at 100% stability for 55-60% of phase
        // ─────────────────────────────────────────────────────────────

        // Per-phase appreciation - INTENSIFIED for masterpiece viewing
        const appreciationConfig = {
            0: { holdZone: 0.55, morphEase: 'smooth' },    // NEURAL: 55% hold - brain network clarity
            1: { holdZone: 0.55, morphEase: 'dramatic' },  // HELIX: 55% hold - DNA structure clarity
            2: { holdZone: 0.60, morphEase: 'explosive' }  // SINGULARITY: 60% hold - black hole clarity
        };

        const config = appreciationConfig[phaseIndex] || { holdZone: 0.60, morphEase: 'smooth' };
        const holdZone = config.holdZone;

        // Calculate morph progress within the transformation zone
        let morphProgress;
        if (phaseProgress <= holdZone) {
            // APPRECIATION ZONE: Shape is fully stable, no morphing
            morphProgress = 0;
        } else {
            // TRANSFORMATION ZONE: Smooth morph to next shape
            morphProgress = (phaseProgress - holdZone) / (1 - holdZone);
        }

        // ─────────────────────────────────────────────────────────────
        // PHASE-SPECIFIC EASING - Premium Transformation Curves
        // ─────────────────────────────────────────────────────────────

        // Ultra-smooth easing for premium feel
        const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
        const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

        let mix;
        switch (config.morphEase) {
            case 'smooth':
                // NEURAL → HELIX: Elegant dissolution
                // Slow start, graceful middle, soft landing
                mix = easeInOutSine(morphProgress);
                break;
            case 'dramatic':
                // HELIX → SINGULARITY: Gravitational collapse
                // Slow build-up then accelerating pull
                mix = easeInOutCubic(morphProgress);
                break;
            case 'explosive':
                // SINGULARITY → COSMOS: Big bang expansion
                // Fast burst then graceful settling
                mix = easeOutExpo(morphProgress);
                break;
            default:
                mix = easeInOutQuint(morphProgress);
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

        // ─────────────────────────────────────────────────────────────
        // SMOOTH EXIT TRANSITION EFFECTS
        // Fade out + zoom back for seamless transition to projects
        // ─────────────────────────────────────────────────────────────
        if (exitProgress > 0) {
            // Smooth easing for exit
            const exitEase = 1 - Math.pow(1 - exitProgress, 3); // easeOutCubic

            // Fade out particles
            const exitOpacity = 1 - exitEase * 0.9;
            particleMaterial.opacity = 0.85 * exitOpacity;
            wireframeMaterial.opacity = 0.4 * exitOpacity;
            lineMaterial.opacity = 0.25 * exitOpacity;

            // Zoom out and drift up
            const exitScale = 1 - exitEase * 0.3;
            const exitY = exitEase * 2; // Drift upward
            particleSystem.scale.setScalar(breathe * exitScale);
            wireframeSystem.scale.setScalar(breathe * exitScale);
            lineSystem.scale.setScalar(breathe * exitScale);

            particleSystem.position.y = exitY;
            wireframeSystem.position.y = exitY;
            lineSystem.position.y = exitY;
        } else {
            // Reset to normal when not in exit zone
            particleMaterial.opacity = 0.85;
            particleSystem.position.y = 0;
            wireframeSystem.position.y = 0;
            lineSystem.position.y = 0;
        }

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
