// Select DOM Elements
const bootScreen = document.getElementById('bootScreen');
const bootBtn = document.getElementById('bootBtn');
const bootTerminal = document.getElementById('bootTerminal');
const webcamVideo = document.getElementById('webcam');
const camStatus = document.getElementById('camStatus');
const qrInput = document.getElementById('qrInput');
const qrcodeContainer = document.getElementById('qrcode');
const waForm = document.getElementById('waForm');
const waMsg = document.getElementById('waMsg');
const vcardBtn = document.getElementById('vcardBtn');
const shareBtn = document.getElementById('shareBtn');
const voiceSyncBtn = document.getElementById('voiceSyncBtn');
const assistantImg = document.getElementById('assistantImg');
const mouthWave = document.getElementById('mouthWave');
const subtitlesBox = document.getElementById('subtitlesBox');
const avatarWrapper = document.getElementById('avatarWrapper');
const hologramStage = document.getElementById('hologramStage');
const particlesCanvas = document.getElementById('particlesCanvas');
const visualizerCanvas = document.getElementById('visualizerCanvas');

// New interactive elements: Flipping card and Depth Slider
const cardInner = document.getElementById('cardInner');
const flipCardBtn = document.getElementById('flipCardBtn');
const depthSlider = document.getElementById('depthSlider');

// Canvas context setups
const pCtx = particlesCanvas.getContext('2d');
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

// --- 1. WebAR Camera Initialization ---
const startARCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" } // Try back camera
    });
    webcamVideo.srcObject = stream;
    camStatus.innerHTML = "CAMERA: <span>ONLINE</span>";
    camStatus.style.color = "var(--neon-green)";
  } catch (err) {
    console.warn("Camera failed to stream. Using fallback grid background.", err);
    camStatus.innerHTML = "CAMERA: <span>DIGITAL_ENV</span>";
    camStatus.style.color = "var(--neon-red)";
  }
};

// Hook Boot Button
bootBtn.addEventListener('click', async () => {
  if (isSystemBooted) return;
  bootBtn.disabled = true;
  bootBtn.textContent = "ESTABLISHING LINK...";

  await logBoot("Acquiring hardware camera stream...", 200);
  await startARCamera();
  await logBoot("Initializing voice synthesis module...", 200);
  loadVoices();
  await logBoot("Synthesizing projection matrix...", 200);
  await logBoot("Hologram synchronized. Access Granted.", 100);

  // Fade out boot screen
  setTimeout(() => {
    bootScreen.classList.add('fade-out');
    isSystemBooted = true;
    
    // Play welcoming greeting
    speakText(answers.welcome);
  }, 400);
});

// --- 2. Web Speech Synthesis Voice Selector ---
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

// --- 3. Speech Playback & Lip-Sync Animation ---
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
  
  // Cute, high-pitched virtual assistant voice parameters
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
  
  // Sync boundary triggers to shake image and expand mouth waves in sync with syllables
  currentUtterance.onboundary = (e) => {
    if (e.name === 'word') {
      const depthScale = parseFloat(depthSlider.value);
      // Dynamic talking ripple expansions
      mouthWave.style.transform = `translate(-50%, -50%) scale(${Math.random() * 0.8 + 1.2}) scaleY(${Math.random() * 0.6 + 1.1})`;
      
      // Animate rotation while maintaining the slider depth scale factor!
      assistantImg.style.transform = `scale(${depthScale}) translateY(-4px) rotate(${Math.random() * 4 - 2}deg)`;
      setTimeout(() => {
        mouthWave.style.transform = '';
        assistantImg.style.transform = `scale(${depthScale})`;
      }, 70);
    }
  };

  speechSynth.speak(currentUtterance);
};

const startVisualTalking = (text) => {
  hologramStage.classList.add('is-talking');
  avatarWrapper.classList.add('is-talking-avatar');
  subtitlesBox.textContent = text;
  subtitlesBox.classList.add('visible');
};

const stopVisualTalking = () => {
  hologramStage.classList.remove('is-talking');
  avatarWrapper.classList.remove('is-talking-avatar');
  setTimeout(() => {
    if (!speechSynth.speaking) {
      subtitlesBox.classList.remove('visible');
    }
  }, 3000);
};

// --- 4. 3D Card Flip Mechanism ---
const toggleCardFlip = (e) => {
  if (e) e.stopPropagation();
  cardInner.classList.toggle('flipped');
};

// Flip card on direct card click or flip button tap
cardInner.addEventListener('click', toggleCardFlip);
flipCardBtn.addEventListener('click', toggleCardFlip);


// --- 5. Hologram Depth Control (Move Back & Forth) ---
depthSlider.addEventListener('input', (e) => {
  const depth = e.target.value;
  // Apply scale to the assistant image directly
  assistantImg.style.transform = `scale(${depth})`;
  
  // Also adjust particles canvas float speed slightly based on depth perspective
  particleSpeedModifier = depth;
});


// --- 6. Interactive Q&A HUD Commands ---
const qaGrid = document.getElementById('qaGrid');
const qaButtons = qaGrid.querySelectorAll('.qa-hud-btn');

qaButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (!isSystemBooted) return;
    qaButtons.forEach(b => b.classList.remove('active'));
    
    const targetBtn = e.currentTarget;
    targetBtn.classList.add('active');
    
    // Auto flip card back to front if flipped, so we can see the assistant project
    if (cardInner.classList.contains('flipped')) {
      cardInner.classList.remove('flipped');
    }
    
    const key = targetBtn.getAttribute('data-question');
    if (answers[key]) {
      speakText(answers[key]);
    }
  });
});


// --- 7. Speech Audio Visualizer Canvas Renderer ---
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
    
    // Red glowing equalizer bars
    vCtx.fillStyle = 'var(--neon-red)';
    vCtx.shadowBlur = 4;
    vCtx.shadowColor = 'var(--neon-red)';
    
    vCtx.fillRect(x + 2, y, barWidth - 4, height);
  }
  
  requestAnimationFrame(drawVisualizer);
};
drawVisualizer();


// --- 8. Dynamic QR Code HUD Widget ---
let currentQR = new QRCode(qrcodeContainer, {
  text: qrInput.value,
  width: 90,
  height: 90,
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
    "URL;TYPE=WORK:https://instagram.com/ritesh",
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


// --- 12. Floating Canvas Particles stage ---
let particles = [];
let particleSpeedModifier = 1.0;

const resizeParticles = () => {
  const rect = particlesCanvas.getBoundingClientRect();
  particlesCanvas.width = rect.width;
  particlesCanvas.height = rect.height;
};
resizeParticles();
window.addEventListener('resize', resizeParticles);

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * particlesCanvas.width;
    this.y = particlesCanvas.height + Math.random() * 20;
    this.size = Math.random() * 1.8 + 0.5;
    this.speedY = -(Math.random() * 0.7 + 0.2);
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.alpha = Math.random() * 0.5 + 0.2;
    const colors = ['#ff0033', '#ffaa00', '#ffffff']; // Red & Gold & White particles
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  update() {
    const talkScale = hologramStage.classList.contains('is-talking') ? 2.5 : 1.0;
    this.y += this.speedY * talkScale * particleSpeedModifier;
    this.x += this.speedX * talkScale * particleSpeedModifier;
    if (this.y < 0 || this.x < 0 || this.x > particlesCanvas.width) {
      this.reset();
    }
  }
  draw() {
    pCtx.save();
    pCtx.globalAlpha = this.alpha;
    pCtx.shadowBlur = 4;
    pCtx.shadowColor = this.color;
    pCtx.fillStyle = this.color;
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.restore();
  }
}

for (let i = 0; i < 20; i++) {
  particles.push(new Particle());
}

const drawParticles = () => {
  pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(drawParticles);
};
drawParticles();


// --- 13. Voice Synced Mute / Unmute Button ---
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
