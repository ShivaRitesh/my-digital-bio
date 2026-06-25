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
const subtitlesBox = document.getElementById('subtitlesBox');

// WebAR A-Frame elements
const presenterVideo = document.getElementById('presenterVideo');
const arPresenter = document.getElementById('arPresenter');

// Ritesh's Full Biography Speech Text
const bioSpeechText = "Hello! Welcome to Ritesh's WebAR experience. Ritesh is a Master of AI who specializes in bringing complex code, intelligent agentic workflows, and immersive augmented reality projects into reality. He possesses advanced capabilities in building custom LLM agents, training computer vision systems, and architecting full-stack software. If you can imagine it, he can bring it to life!";

// State Variables
let speechSynth = window.speechSynthesis;
let currentUtterance = null;
let selectedVoice = null;
let isSystemBooted = false;

// Terminal simulation logger
const logBoot = (text, delay) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      bootTerminal.innerHTML += `<br>SYS.BOOT: ${text}`;
      bootTerminal.scrollTop = bootTerminal.scrollHeight;
      resolve();
    }, delay);
  });
};

// Hook Boot Button (User tap establishes audio context and camera links)
bootBtn.addEventListener('click', async () => {
  if (isSystemBooted) return;
  bootBtn.disabled = true;
  bootBtn.textContent = "ESTABLISHING LINK...";

  await logBoot("Acquiring device camera feed...", 200);
  await logBoot("Compiling green-screen chroma key WebGL shaders...", 200);
  
  // Warm up video to bypass browser autoplay blocks
  try {
    presenterVideo.play().then(() => {
      presenterVideo.pause();
    });
  } catch (err) {
    console.warn("Video warmup blocked or failed:", err);
  }

  await logBoot("Initializing voice synthesis module...", 200);
  loadVoices();
  await logBoot("Hologram synchronized. Access Granted.", 100);

  // Fade out boot screen
  setTimeout(() => {
    bootScreen.classList.add('fade-out');
    isSystemBooted = true;
    
    // Automatically start biography briefing
    speakText(bioSpeechText);
  }, 400);
});

// --- 1. Web Speech Synthesis Voice Selector ---
const loadVoices = () => {
  if (!speechSynth) return;
  const voices = speechSynth.getVoices();
  
  // Prioritize high-quality female voices
  const femaleKeywords = ['female', 'google uk english female', 'zira', 'samantha', 'hazel', 'victoria', 'premium', 'en-'];
  let bestVoice = null;
  
  for (const keyword of femaleKeywords) {
    bestVoice = voices.find(v => v.name.toLowerCase().includes(keyword) && v.lang.startsWith('en'));
    if (bestVoice) break;
  }
  
  selectedVoice = bestVoice || voices.find(v => v.lang.startsWith('en')) || voices[0];
};

loadVoices();
if (speechSynth && speechSynth.onvoiceschanged !== undefined) {
  speechSynth.onvoiceschanged = loadVoices;
}

// --- 2. Speech Playback & Video Sync ---
const speakText = (text) => {
  if (!speechSynth) {
    subtitlesBox.textContent = "Voice synthesis not supported on this browser.";
    return;
  }
  
  speechSynth.cancel();
  stopVisualTalking();

  currentUtterance = new SpeechSynthesisUtterance(text);
  if (selectedVoice) {
    currentUtterance.voice = selectedVoice;
  }
  
  // Configure cute virtual assistant tone
  currentUtterance.pitch = 1.25; 
  currentUtterance.rate = 0.95;  
  
  currentUtterance.onstart = () => {
    startVisualTalking(text);
  };
  
  currentUtterance.onend = () => {
    stopVisualTalking();
  };
  
  currentUtterance.onerror = () => {
    stopVisualTalking();
  };
  
  // Sync word boundaries to trigger micro jitter shakes on A-Frame video entity
  currentUtterance.onboundary = (e) => {
    if (e.name === 'word') {
      const widthFactor = 1.25;
      const heightFactor = 1.65;
      
      // Jitter rotation and scale during words to simulate lip sync / active talking
      if (arPresenter) {
        arPresenter.setAttribute('width', widthFactor * (Math.random() * 0.05 + 0.98));
        arPresenter.setAttribute('height', heightFactor * (Math.random() * 0.05 + 0.98));
        
        setTimeout(() => {
          arPresenter.setAttribute('width', widthFactor);
          arPresenter.setAttribute('height', heightFactor);
        }, 80);
      }
    }
  };

  speechSynth.speak(currentUtterance);
};

const startVisualTalking = (text) => {
  subtitlesBox.textContent = text;
  subtitlesBox.classList.add('visible');
  
  // Play the green-screen presenter video when speaking
  if (presenterVideo) {
    presenterVideo.play().catch(e => console.warn("Video playback blocked:", e));
  }
};

const stopVisualTalking = () => {
  // Pause the green-screen presenter video when silent
  if (presenterVideo) {
    presenterVideo.pause();
  }
  
  setTimeout(() => {
    if (!speechSynth.speaking) {
      subtitlesBox.classList.remove('visible');
      subtitlesBox.textContent = "Point camera at AR Target (Hiro pattern) to project briefing.";
      subtitlesBox.classList.add('visible');
    }
  }, 4000);
};
