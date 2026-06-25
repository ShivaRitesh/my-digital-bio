// Register Chroma Key (Green Screen) Shader Component in A-Frame
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerShader('chromakey', {
    schema: {
      src: {type: 'map'},
      color: {type: 'color', default: '0.1 0.7 0.15'}, // Target green key color
      similarity: {type: 'number', default: 0.38},    // Tolerance threshold
      smoothness: {type: 'number', default: 0.08}     // Feathering boundary
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D src;
      uniform vec3 color;
      uniform float similarity;
      uniform float smoothness;
      void main() {
        vec4 textureColor = texture2D(src, vUv);
        float distance = distance(textureColor.rgb, color);
        float alpha = smoothstep(similarity, similarity + smoothness, distance);
        gl_FragColor = vec4(textureColor.rgb, textureColor.a * alpha);
      }
    `
  });
}

// Select DOM Elements
const bootScreen = document.getElementById('bootScreen');
const bootBtn = document.getElementById('bootBtn');
const bootTerminal = document.getElementById('bootTerminal');
const cardPortal = document.getElementById('cardPortal');
const cardInner = document.getElementById('cardInner');
const cardPerspective = document.querySelector('.card-perspective');
const zoomSlider = document.getElementById('zoomSlider');
const launchArBtn = document.getElementById('launchArBtn');
const arOverlay = document.getElementById('arOverlay');
const exitArBtn = document.getElementById('exitArBtn');

let speechSynth = window.speechSynthesis;
let audioCtx = null;

// --- 1. Dynamic Mechanical Keyboard Sound Synthesis ---
const initAudio = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  } catch (err) {
    console.warn("AudioContext failed to initialize:", err);
  }
};

const playKeyboardClick = (isSpaceOrEnd = false) => {
  try {
    if (!audioCtx) return;
    
    // Make sure AudioContext is running
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    
    if (isSpaceOrEnd) {
      // Lower pitched sound for spaces/ends
      osc.frequency.setValueAtTime(550 + Math.random() * 150, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);
    } else {
      // High-pitched mechanical clicking sound
      osc.frequency.setValueAtTime(1400 + Math.random() * 450, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.015);
    }
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + (isSpaceOrEnd ? 0.035 : 0.018));
  } catch (err) {
    console.warn("Keyboard click audio failed to play:", err);
  }
};

// --- 2. Mobile-Only Hacking Boot Sequence ---
const isMobileViewport = window.innerWidth < 768;

const terminalText = [
  "SYS.BOOT: Initializing decrypter module...",
  "SYS.BOOT: Connecting to AI central matrix [SECURE]",
  "SYS.BOOT: Bypassing user clearance protocols... [OK]",
  "SYS.BOOT: Decrypting Ritesh biometric signature...",
  "SYS.BOOT: Authentication: VERIFIED.",
  "SYS.BOOT: Loading 3D Holographic viewports...",
  "SYS.BOOT: Secure portal online. Welcome, Master of AI."
];

let lineIndex = 0;
let charIndex = 0;

const typeTerminal = () => {
  if (lineIndex < terminalText.length) {
    const currentLine = terminalText[lineIndex];
    if (charIndex === 0 && lineIndex > 0) {
      bootTerminal.innerHTML += "\n";
    }
    
    // Print character
    bootTerminal.innerHTML += currentLine[charIndex];
    bootTerminal.scrollTop = bootTerminal.scrollHeight;
    
    // Play synthesized mechanical typing click
    playKeyboardClick(currentLine[charIndex] === ' ' || charIndex === currentLine.length - 1);
    
    charIndex++;
    if (charIndex < currentLine.length) {
      setTimeout(typeTerminal, 20 + Math.random() * 25);
    } else {
      charIndex = 0;
      lineIndex++;
      setTimeout(typeTerminal, 250);
    }
  } else {
    // Typing complete: Fade out boot screen
    setTimeout(() => {
      bootScreen.classList.add('fade-out');
    }, 600);
  }
};

if (!isMobileViewport) {
  // Desktop mode: Hide hacking terminal instantly
  bootScreen.style.display = 'none';
} else {
  // Mobile mode: Await click trigger to run sequence with click audio
  bootBtn.addEventListener('click', () => {
    initAudio();
    bootBtn.disabled = true;
    bootBtn.textContent = "DECRYPTING...";
    bootTerminal.innerHTML = "";
    typeTerminal();
  });
}

// --- 3. 3D Card Flip Mechanism ---
cardInner.addEventListener('click', (e) => {
  // Ignore flip if user clicks inside the launch AR button
  if (e.target.closest('#launchArBtn')) return;
  cardInner.classList.toggle('flipped');
});

// --- 4. Hardware Accelerated Card Zooming ("Like Butter") ---
let zoomScale = 1.0;

const updateCardZoom = () => {
  cardPerspective.style.transform = `scale(${zoomScale})`;
};

// Slider Input
zoomSlider.addEventListener('input', (e) => {
  zoomScale = parseFloat(e.target.value);
  updateCardZoom();
});

// Mouse Scroll Wheel Zoom on Portal
cardPortal.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomScale += e.deltaY * -0.001;
  zoomScale = Math.max(0.4, Math.min(1.8, zoomScale));
  zoomSlider.value = zoomScale;
  updateCardZoom();
}, { passive: false });

// Mobile Touch Pinch-to-Zoom
let initialTouchDist = 0;
cardPortal.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    initialTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
});

cardPortal.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && initialTouchDist > 0) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const factor = dist / initialTouchDist;
    
    // Scale zoom exponentially with minor dampening
    zoomScale = Math.max(0.4, Math.min(1.8, zoomScale * (1 + (factor - 1) * 0.1)));
    zoomSlider.value = zoomScale;
    updateCardZoom();
    initialTouchDist = dist;
  }
}, { passive: true });

cardPortal.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) {
    initialTouchDist = 0;
  }
});

// --- 5. Fullscreen WebAR Dynamic Injection ---
launchArBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // Avoid flipping the card
  
  // Show full overlay
  arOverlay.style.display = 'block';
  
  // Inject A-Frame scene markup
  const sceneHTML = `
    <a-scene embedded vr-mode-ui="enabled: false" arjs="sourceType: webcam; debugUIEnabled: false;">
      <a-assets>
        <video id="presenterVideo" loop crossorigin="anonymous" playsinline webkit-playsinline src="https://assets.mixkit.co/videos/preview/mixkit-woman-explaining-something-on-green-screen-39987-large.mp4"></video>
      </a-assets>
      <a-marker preset="hiro">
        <a-video src="#presenterVideo" id="arPresenter" position="0 0.8 0" rotation="-90 0 0" width="1.25" height="1.65" material="shader: chromakey; color: 0.1 0.7 0.15; similarity: 0.38; smoothness: 0.08;"></a-video>
        <a-ring color="#ff0033" radius-inner="0.6" radius-outer="0.65" rotation="-90 0 0" position="0 0.01 0"></a-ring>
        <a-ring color="#ffaa00" radius-inner="0.45" radius-outer="0.48" rotation="-90 0 0" position="0 0.02 0" animation="property: rotation; to: -90 360 0; loop: true; dur: 6000; easing: linear;"></a-ring>
      </a-marker>
      <a-entity camera></a-entity>
    </a-scene>
  `;
  
  const sceneContainer = document.createElement('div');
  sceneContainer.id = 'dynamicArScene';
  sceneContainer.innerHTML = sceneHTML;
  arOverlay.appendChild(sceneContainer);
  
  // Speak audio announcement explaining AR operation
  if (speechSynth) {
    speechSynth.cancel();
    const announcement = new SpeechSynthesisUtterance(
      "Holographic system online. Please point your camera at the Hiro marker on the back of your physical card to project the virtual AI assistant."
    );
    announcement.pitch = 1.25;
    announcement.rate = 1.0;
    
    // Choose female voice if possible
    const voices = speechSynth.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('zira') || 
      v.name.toLowerCase().includes('samantha')
    );
    if (femaleVoice) announcement.voice = femaleVoice;
    
    speechSynth.speak(announcement);
  }
  
  // Play presenter video
  setTimeout(() => {
    const video = document.getElementById('presenterVideo');
    if (video) {
      video.play().catch(err => console.warn("Video playback blocked:", err));
    }
  }, 1000);
});

// Close AR mode
exitArBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  
  // Cancel speech
  if (speechSynth) {
    speechSynth.cancel();
  }
  
  // Destroy A-Frame elements to stop camera feeds and conserve power
  const dynamicArScene = document.getElementById('dynamicArScene');
  if (dynamicArScene) {
    dynamicArScene.remove();
  }
  
  // Hide overlay container
  arOverlay.style.display = 'none';
});
