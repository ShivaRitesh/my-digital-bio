// Register Chroma Key (Green Screen) Shader Component in A-Frame
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerShader('chromakey', {
    schema: {
      src: {type: 'map'},
      color: {type: 'color', default: '0.1 0.7 0.15'}, // Target green key color
      similarity: {type: 'number', default: 0.38},    // Tolerance thresh
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
const camStatus = document.getElementById('camStatus');
const qrInput = document.getElementById('qrInput');
const qrcodeContainer = document.getElementById('qrcode');
const waForm = document.getElementById('waForm');
const waMsg = document.getElementById('waMsg');
const vcardBtn = document.getElementById('vcardBtn');
const shareBtn = document.getElementById('shareBtn');
const voiceSyncBtn = document.getElementById('voiceSyncBtn');
const subtitlesBox = document.getElementById('subtitlesBox');
const avatarWrapper = document.getElementById('avatarWrapper');
const hologramStage = document.getElementById('hologramStage');
const visualizerCanvas = document.getElementById('visualizerCanvas');

// Video Presenter element
const presenterVideo = document.getElementById('presenterVideo');
const arPresenter = document.getElementById('arPresenter');

// Card Flipping & Depth Slider
const cardInner = document.getElementById('cardInner');
const flipCardBtn = document.getElementById('flipCardBtn');
const depthSlider = document.getElementById('depthSlider');

// Test Target Modal Elements
const showMarkerBtn = document.getElementById('showMarkerBtn');
const markerPanel = document.getElementById('markerPanel');
const closeMarkerBtn = document.getElementById('closeMarkerBtn');

// Visualizer context
const vCtx = visualizerCanvas.getContext('2d');

// Q&A Answers Data Map (Briefing about Ritesh)
const answers = {
  welcome: "Holographic link initialized. System online. Hello! I am Ritesh's virtual AI assistant. Tap any briefing module to command projection.",
  intro: "Ritesh is a Master of AI who specializes in bringing complex code, intelligent agentic workflows, and immersive AR projects into reality. He bridges physical and digital spaces to build next-generation applications.",
  capabilities: "As a Master of AI, Ritesh excels at designing autonomous LLM agents, training computer vision systems, building augmented reality viewports, and architecting full-stack web software. There is practically nothing he cannot bring to life!",
  contact: "Connecting with Ritesh is simple. Click the WhatsApp or Instagram buttons at the bottom of the HUD to talk to him directly, or scan the QR code to save his contact card. Let's build something extraordinary together!"
};

// State Variables
let speechSynth = window.speechSynthesis;
let currentUtterance = null;
let selectedVoice = null;
let isAudioEnabled = true;
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

// Hook Boot Button (User interaction unlocks speech and video playback)
bootBtn.addEventListener('click', async () => {
  if (isSystemBooted) return;
  bootBtn.disabled = true;
  bootBtn.textContent = "ESTABLISHING LINK...";

  await logBoot("Initializing WebAR camera capture interface...", 200);
  
  // AR.js captures camera automatically. We set HUD online status.
  camStatus.innerHTML = "CAMERA: <span>ONLINE</span>";
  camStatus.style.color = "var(--neon-green)";

  await logBoot("Loading green-screen video rendering matrix...", 200);
  
  // Warm up and play/pause video to bypass browser autoplay blocks
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
    
    // Play welcome greeting
    speakText(answers.welcome);
  }, 400);
});

// --- 1. Web Speech Synthesis Voice Selector ---
const loadVoices = () => {
  if (!speechSynth) return;
  const voices = speechSynth.getVoices();
  
  // Prioritize cute female assistant voices
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
  
  if (!isAudioEnabled) {
    subtitlesBox.textContent = text;
    subtitlesBox.classList.add('visible');
    return;
  }

  currentUtterance = new SpeechSynthesisUtterance(text);
  if (selectedVoice) {
    currentUtterance.voice = selectedVoice;
  }
  
  // Cute, high-pitched voice presets
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
      const depthScale = parseFloat(depthSlider.value);
      const widthFactor = 1.2 * depthScale;
      const heightFactor = 1.6 * depthScale;
      
      // Jitter rotation and scale during words
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
  hologramStage.classList.add('is-talking');
  avatarWrapper.classList.add('is-talking-avatar');
  subtitlesBox.textContent = text;
  subtitlesBox.classList.add('visible');
  
  // Play the green-screen presenter video when speaking
  if (presenterVideo) {
    presenterVideo.play().catch(e => console.warn("Video playback blocked:", e));
  }
};

const stopVisualTalking = () => {
  hologramStage.classList.remove('is-talking');
  avatarWrapper.classList.remove('is-talking-avatar');
  
  // Pause the green-screen presenter video when silent
  if (presenterVideo) {
    presenterVideo.pause();
  }
  
  setTimeout(() => {
    if (!speechSynth.speaking) {
      subtitlesBox.classList.remove('visible');
    }
  }, 3000);
};

// --- 3. 3D Card Flip Mechanism ---
const toggleCardFlip = (e) => {
  if (e) e.stopPropagation();
  cardInner.classList.toggle('flipped');
};

cardInner.addEventListener('click', toggleCardFlip);
flipCardBtn.addEventListener('click', toggleCardFlip);


// --- 4. WebAR Hologram Depth Control (Scale Video Plane) ---
depthSlider.addEventListener('input', (e) => {
  const depth = parseFloat(e.target.value);
  if (arPresenter) {
    // Modify width and height of <a-video> plane in A-Frame in real time
    arPresenter.setAttribute('width', 1.2 * depth);
    arPresenter.setAttribute('height', 1.6 * depth);
    // Push/pull Y coordinate height offset based on depth scale
    arPresenter.setAttribute('position', `0 ${0.8 * depth} 0`);
  }
});


// --- 5. Interactive Q&A HUD Commands ---
const qaGrid = document.getElementById('qaGrid');
const qaButtons = qaGrid.querySelectorAll('.qa-hud-btn');

qaButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (!isSystemBooted) return;
    qaButtons.forEach(b => b.classList.remove('active'));
    
    const targetBtn = e.currentTarget;
    targetBtn.classList.add('active');
    
    const key = targetBtn.getAttribute('data-question');
    if (answers[key]) {
      speakText(answers[key]);
    }
  });
});


// --- 6. Speech Audio Visualizer Canvas Renderer ---
const resizeVisualizer = () => {
  const rect = visualizerCanvas.getBoundingClientRect();
  visualizerCanvas.width = rect.width;
  visualizerCanvas.height = rect.height;
};
resizeVisualizer();
window.addEventListener('resize', resizeVisualizer);

const drawVisualizer = () => {
  vCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
  
  const isSpeaking = hologramStage.classList.contains('is-talking');
  const barCount = 20;
  const barWidth = visualizerCanvas.width / barCount;
  
  for (let i = 0; i < barCount; i++) {
    let height = 2;
    if (isSpeaking) {
      height = Math.random() * (visualizerCanvas.height - 4) + 2;
    }
    
    const x = i * barWidth;
    const y = (visualizerCanvas.height - height) / 2;
    
    vCtx.fillStyle = 'var(--neon-red)';
    vCtx.shadowBlur = 4;
    vCtx.shadowColor = 'var(--neon-red)';
    
    vCtx.fillRect(x + 2, y, barWidth - 4, height);
  }
  
  requestAnimationFrame(drawVisualizer);
};
drawVisualizer();


// --- 7. Printable Test Target Modal Controls ---
showMarkerBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  markerPanel.classList.add('visible');
});

closeMarkerBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  markerPanel.classList.remove('visible');
});


// --- 8. Dynamic QR Code HUD Widget ---
let currentQR = new QRCode(qrcodeContainer, {
  text: qrInput.value,
  width: 70,
  height: 70,
  colorDark: "#030205",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H
});

qrInput.addEventListener('input', (e) => {
  const value = e.target.value.trim();
  if (value) {
    currentQR.clear();
    currentQR.makeCode(value);
  }
});


// --- 9. Mini WhatsApp Direct Form ---
waForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const baseNumber = "919044448686";
  const messageText = waMsg.value.trim();
  if (messageText) {
    const encoded = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${baseNumber}?text=${encoded}`;
    window.open(waUrl, '_blank');
  }
});


// --- 10. Dynamic VCard (.vcf) Download Generator ---
vcardBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const vcardData = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "FN:Ritesh",
    "TITLE:Master of AI",
    "ORG:AI & Immersive AR Architect",
    "TEL;TYPE=CELL,VOICE:+919044448686",
    "NOTE:Bringing anything to life. Immersive AR systems and Autonomous AI agent mastermind.",
    "URL;TYPE=WORK:https://ShivaRitesh.github.io/my-digital-bio/",
    "END:VCARD"
  ].join("\r\n");

  const blob = new Blob([vcardData], { type: "text/vcard;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Ritesh_Contact.vcf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});


// --- 11. Web HUD Share Trigger ---
shareBtn.addEventListener('click', async (e) => {
  e.stopPropagation();
  const shareData = {
    title: 'Ritesh - Smart Digital Card',
    text: 'Check out Ritesh\'s smart digital bio card (Master of AI)!',
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      const originalText = shareBtn.querySelector('span').textContent;
      shareBtn.querySelector('span').textContent = 'Link Copied!';
      shareBtn.style.borderColor = 'var(--neon-green)';
      shareBtn.style.color = 'var(--neon-green)';
      
      setTimeout(() => {
        shareBtn.querySelector('span').textContent = originalText;
        shareBtn.style.borderColor = '';
        shareBtn.style.color = '';
      }, 2000);
    }
  } catch (err) {
    console.error('Error sharing page:', err);
  }
});


// --- 12. Voice Synced Mute / Unmute Button ---
voiceSyncBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  isAudioEnabled = !isAudioEnabled;
  
  if (isAudioEnabled) {
    voiceSyncBtn.classList.remove('speaking');
    voiceSyncBtn.innerHTML = '<i data-lucide="volume-2"></i>';
    speakText(answers.welcome);
  } else {
    voiceSyncBtn.classList.add('speaking');
    voiceSyncBtn.innerHTML = '<i data-lucide="volume-x"></i>';
    if (speechSynth) {
      speechSynth.cancel();
    }
    stopVisualTalking();
    subtitlesBox.textContent = "Voice transmission suspended. Subtitles active.";
    subtitlesBox.classList.add('visible');
  }
  lucide.createIcons();
});
