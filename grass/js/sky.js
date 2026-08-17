/* ───────────────────────────────────────────────
    STYLIZED ATMOSPHERIC GRADIENT SKY DOME
    Creates a large inverted sky dome featuring a smooth
    directional gradient from a brilliant white/ice-blue sun hot spot
    down to vibrant sky blue at the horizon and deep cobalt blue at the zenith.
─────────────────────────────────────────────── */

let skyMesh = null;
let skyMaterial = null;

const skyUniforms = {
    uSunDir: { value: new THREE.Vector3(0, 0.44721, -0.89443) },
    uColorHotCore: { value: new THREE.Color(1.0, 1.0, 1.0) },     // Pure white sun core
    uColorHotGlow: { value: new THREE.Color(0.78, 0.93, 1.0) },   // Lighter ice blue hot spot (#c7edff)
    uColorSun: { value: new THREE.Color(0.58, 0.82, 0.98) },      // Light sky blue directional glow (#94d1fa)
    uColorHorizon: { value: new THREE.Color(0.35, 0.68, 0.92) },  // Vibrant horizon sky blue (#59adeb)
    uColorZenith: { value: new THREE.Color(0.06, 0.16, 0.42) },   // Deep cobalt / sapphire blue zenith (#0f296b)
    uTime: { value: 0.0 },
    uCloudColor: { value: new THREE.Color(0.96, 0.98, 1.0) },      // Bright fluffy white cloud body
    uCloudShadowColor: { value: new THREE.Color(0.38, 0.50, 0.70) },// Soft atmospheric cloud underside shadow
    uCloudCoverage: { value: 0.42 }                               // Cloud density threshold
};

/**
 * Initializes the sky dome sphere and custom shader material.
 */
function initSky() {
    if (skyMesh) return;

    const skyGeo = new THREE.SphereGeometry(14000, 32, 16);

    skyMaterial = new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        vertexShader: `
            varying vec3 vWorldPos;
            void main() {
                vWorldPos = position;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vWorldPos;
            uniform vec3 uSunDir;
            uniform vec3 uColorHotCore;
            uniform vec3 uColorHotGlow;
            uniform vec3 uColorSun;
            uniform vec3 uColorHorizon;
            uniform vec3 uColorZenith;
            uniform float uTime;
            uniform vec3 uCloudColor;
            uniform vec3 uCloudShadowColor;
            uniform float uCloudCoverage;

            // Fast GLSL 2D Hash & Noise
            vec2 hash2(vec2 p) {
                p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
                return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
            }

            float noise2D(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);

                return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                               dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                           mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                               dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
            }

            // 3-octave Fractional Brownian Motion (FBM)
            float fbm2D(vec2 p) {
                float val = 0.0;
                float amp = 0.5;
                for (int i = 0; i < 3; i++) {
                    val += amp * noise2D(p);
                    p *= 2.02;
                    amp *= 0.5;
                }
                return val;
            }

            void main() {
                vec3 dir = normalize(vWorldPos);

                // Vertical height factor: 0.0 at horizon, 1.0 at zenith
                float height = clamp(dir.y, 0.0, 1.0);

                // Alignment with sun/light source direction
                float sunAlignment = max(0.0, dot(dir, uSunDir));

                // Vertical sky gradient transition (horizon sky blue -> zenith cobalt blue)
                vec3 skyColor = mix(uColorHorizon, uColorZenith, pow(height, 0.7));

                // Directional light ambient glow (light sky blue)
                float sunAmbientGlow = pow(sunAlignment, 2.0);
                skyColor = mix(skyColor, uColorSun, sunAmbientGlow * 0.75);

                // Compressed Hot Spot: Lighter Ice Blue Halo
                float hotGlowFactor = pow(sunAlignment, 64.0);
                skyColor = mix(skyColor, uColorHotGlow, hotGlowFactor * 0.95);

                // Compressed Tight Pure White Sun Core Hot Spot
                float hotCoreFactor = pow(sunAlignment, 1024.0);
                skyColor = mix(skyColor, uColorHotCore, hotCoreFactor * 1.0);

                // ── Stylized Procedural Clouds Layer ──
                if (dir.y > 0.02) {
                    // Project direction onto horizontal sky ceiling plane for perspective
                    vec2 skyUV = dir.xz / (dir.y + 0.18);
                    
                    // Wind drift vector over time
                    vec2 windDir = vec2(0.008, 0.004) * uTime;
                    vec2 samplePos = skyUV * 2.5 + windDir;

                    // Sample FBM cloud density
                    float n = fbm2D(samplePos);
                    n = n * 0.5 + 0.5; // Map from [-0.5, 0.5] to [0.0, 1.0]

                    // Density thresholding for soft cloud edges
                    float cloudAlpha = smoothstep(uCloudCoverage, uCloudCoverage + 0.28, n);

                    // Fade out near horizon to avoid ground clipping or harsh cutoffs
                    float horizonFade = smoothstep(0.02, 0.22, dir.y);
                    cloudAlpha *= horizonFade;

                    if (cloudAlpha > 0.001) {
                        float cloudHeightFactor = smoothstep(uCloudCoverage + 0.05, uCloudCoverage + 0.35, n);
                        
                        // Base shading: Shadowed underside vs fluffy white body
                        vec3 cColor = mix(uCloudShadowColor, uCloudColor, cloudHeightFactor);

                        // Sun Silver Lining / Edge Rim lighting effect
                        float sunRim = pow(sunAlignment, 4.0) * (1.0 - cloudHeightFactor);
                        cColor = mix(cColor, uColorHotGlow, sunRim * 0.8);

                        // Sun direct core glow bleed through cloud edges
                        cColor = mix(cColor, uColorHotCore, pow(sunAlignment, 12.0) * 0.5);

                        // Composite clouds onto atmospheric sky gradient
                        skyColor = mix(skyColor, cColor, cloudAlpha * 0.88);
                    }
                }

                gl_FragColor = vec4(skyColor, 1.0);
            }
        `,
        side: THREE.BackSide,
        depthWrite: false
    });

    skyMesh = new THREE.Mesh(skyGeo, skyMaterial);
    skyMesh.renderOrder = -1000;
    scene.add(skyMesh);
}

/**
 * Updates sky dome position to follow camera and updates cloud animation time.
 */
function updateSky(dt, time) {
    if (!skyMesh) {
        initSky();
    }
    if (skyMesh) {
        if (typeof time === 'number') {
            skyUniforms.uTime.value = time;
        } else if (typeof clock !== 'undefined') {
            skyUniforms.uTime.value = clock.getElapsedTime();
        }

        if (camera) {
            skyMesh.position.copy(camera.position);
        }

        // Keep sun direction synced with directional light orientation
        if (typeof dirLight !== 'undefined') {
            const sunDir = new THREE.Vector3(0, 2500, -5000).normalize();
            skyUniforms.uSunDir.value.copy(sunDir);
        }
    }
}
