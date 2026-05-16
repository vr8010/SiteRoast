const API = 'http://localhost:3000/api';

// ── Sidebar ──────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.querySelector('.overlay').classList.toggle('show');
}

// Create overlay div
const overlay = document.createElement('div');
overlay.className = 'overlay';
overlay.onclick = toggleSidebar;
document.body.appendChild(overlay);

// ── Section Navigation ────────────────────────────────────
const sectionTitles = {
  dashboard: 'Home Dashboard',
  worker: 'Worker माहिती',
  location: 'Location Tracking',
  attendance: 'Attendance & Payment',
  chatbot: 'AI Assistant',
  health: 'Health & Safety',
  crop: 'Crop AI',
  schemes: 'सरकारी योजना',
  factory: 'Sugar Factory',
  contractor: 'Contractor Panel'
};

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('topbar-title').textContent = sectionTitles[id] || id;
  if (document.getElementById('sidebar').classList.contains('open')) toggleSidebar();
}

// ── Weather (Open-Meteo, free, no key needed) ─────────────
async function loadWeather() {
  try {
    // Default: Pune, Maharashtra
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.85&current_weather=true');
    const data = await res.json();
    const temp = data.current_weather.temperature;
    const wind = data.current_weather.windspeed;
    const info = `🌡️ ${temp}°C | 💨 ${wind} km/h`;
    document.getElementById('topbar-weather').textContent = info;
    document.getElementById('weather-info').textContent = `${temp}°C, वारा ${wind} km/h`;
    if (temp > 38) {
      document.getElementById('weather-info').textContent += ' ⚠️ उष्माघाताचा धोका!';
    }
  } catch {
    document.getElementById('weather-info').textContent = 'हवामान उपलब्ध नाही';
  }
}

// ── GPS Location ──────────────────────────────────────────
function getLocation() {
  if (!navigator.geolocation) {
    document.getElementById('gps-status').textContent = 'GPS उपलब्ध नाही';
    return;
  }
  document.getElementById('gps-status').textContent = 'GPS शोधत आहे...';
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      document.getElementById('gps-status').textContent = '✅ Location मिळाले';
      document.getElementById('gps-coords').textContent = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
      document.getElementById('map-placeholder').innerHTML =
        `<iframe width="100%" height="200" style="border:0;border-radius:12px"
          src="https://maps.google.com/maps?q=${latitude},${longitude}&z=14&output=embed">
        </iframe>`;
    },
    () => {
      document.getElementById('gps-status').textContent = '❌ Location मिळाले नाही';
    }
  );
}

// ── Worker Form ───────────────────────────────────────────
document.getElementById('worker-form').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    name: document.getElementById('w-name').value,
    aadhaar: document.getElementById('w-aadhaar').value,
    village: document.getElementById('w-village').value,
    phone: document.getElementById('w-phone').value,
    familyDetails: document.getElementById('w-family').value,
    workExperience: document.getElementById('w-exp').value,
    role: document.getElementById('w-role').value
  };
  try {
    const res = await fetch(`${API}/workers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const worker = await res.json();
    alert(`✅ नोंदणी यशस्वी!\nWorker ID: ${worker._id}`);
    e.target.reset();
    loadAllWorkers();
  } catch {
    alert('❌ नोंदणी अयशस्वी. Server चालू आहे का?');
  }
});

async function loadAllWorkers() {
  try {
    const res = await fetch(`${API}/workers`);
    const workers = await res.json();
    const box = document.getElementById('worker-list');
    const cbox = document.getElementById('contractor-workers');
    const html = workers.length
      ? workers.map(w => `<div class="list-item">👤 <strong>${w.name}</strong> | ${w.village || '-'} | ${w.role} | ID: <code>${w._id}</code></div>`).join('')
      : '<p style="color:#888;padding:0.5rem">कोणतेही कामगार नाहीत</p>';
    if (box) box.innerHTML = html;
    if (cbox) cbox.innerHTML = html;
  } catch {
    console.error('Workers load failed');
  }
}

// ── Attendance Form ───────────────────────────────────────
document.getElementById('attendance-form').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    workerId: document.getElementById('a-workerid').value,
    date: document.getElementById('a-date').value || new Date().toISOString(),
    tonsWorked: parseFloat(document.getElementById('a-tons').value),
    ratePerTon: parseFloat(document.getElementById('a-rate').value) || 350
  };
  try {
    await fetch(`${API}/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    alert('✅ Attendance नोंदवली!');
    e.target.reset();
    loadPayment();
  } catch {
    alert('❌ Attendance नोंदवता आली नाही.');
  }
});

async function loadPayment() {
  const wid = document.getElementById('a-workerid').value;
  if (!wid) { alert('Worker ID टाका'); return; }
  try {
    const res = await fetch(`${API}/attendance/${wid}`);
    const data = await res.json();
    document.getElementById('p-tons').textContent = data.totalTons + ' टन';
    document.getElementById('p-total').textContent = '₹' + data.totalPay;
    document.getElementById('p-pending').textContent = '₹' + data.pending;
    document.getElementById('payment-summary').style.display = 'block';
    // Update dashboard
    document.getElementById('sum-tons').textContent = data.totalTons + ' टन';
    document.getElementById('sum-pay').textContent = '₹' + data.totalPay;
    document.getElementById('sum-pending').textContent = '₹' + data.pending;
  } catch {
    alert('❌ Payment माहिती मिळाली नाही.');
  }
}

// ── AI Chatbot ────────────────────────────────────────────
async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  appendChat(msg, 'user');
  input.value = '';

  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    appendChat(data.reply, 'bot');
  } catch {
    appendChat('❌ Server शी संपर्क होत नाही.', 'bot');
  }
}

function appendChat(text, role) {
  const box = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ── Voice Input ───────────────────────────────────────────
function startVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('तुमचा browser voice input support करत नाही. Chrome वापरा.');
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SR();
  recognition.lang = 'mr-IN';
  recognition.interimResults = false;
  recognition.onresult = e => {
    document.getElementById('chat-input').value = e.results[0][0].transcript;
    sendChat();
  };
  recognition.onerror = () => alert('Voice input अयशस्वी. पुन्हा प्रयत्न करा.');
  recognition.start();
}

// ── Health Tips ───────────────────────────────────────────
const healthTips = {
  heatstroke: `🌡️ उष्माघात (Heat Stroke)\n\nलक्षणे: जास्त घाम, चक्कर, डोकेदुखी, बेशुद्धी\n\nउपाय:\n• सावलीत न्या\n• थंड पाणी प्या\n• ओले कापड डोक्यावर ठेवा\n• 108 वर कॉल करा`,
  injury: `🩹 जखम / दुखापत\n\nप्रथमोपचार:\n• जखम स्वच्छ पाण्याने धुवा\n• Antiseptic लावा\n• पट्टी बांधा\n• खोल जखम असल्यास डॉक्टरकडे जा`,
  snake: `🐍 साप चावणे\n\nतातडीचे उपाय:\n• घाबरू नका, हालचाल कमी करा\n• जखम हृदयापेक्षा खाली ठेवा\n• चावलेली जागा बांधू नका\n• 108 वर कॉल करा - तातडीने!`,
  water: `💧 पाणी व पोषण\n\nदैनंदिन टिप्स:\n• दिवसातून किमान 3-4 लिटर पाणी प्या\n• ORS द्रावण घ्या\n• सकाळी नाश्ता करा\n• उन्हात काम करताना 30 मिनिटांनी विश्रांती घ्या`
};

function showHealthTip(type) {
  const box = document.getElementById('health-tip-box');
  box.style.display = 'block';
  box.style.whiteSpace = 'pre-line';
  box.textContent = healthTips[type] || '';
  box.scrollIntoView({ behavior: 'smooth' });
}

// ── Crop Disease Detection ────────────────────────────────
async function detectDisease() {
  const fileInput = document.getElementById('crop-image');
  if (!fileInput.files.length) { alert('कृपया फोटो निवडा'); return; }

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  const resultBox = document.getElementById('crop-result');
  resultBox.style.display = 'block';
  resultBox.innerHTML = '🔍 तपासत आहे...';

  try {
    const res = await fetch(`${API}/crop/detect`, { method: 'POST', body: formData });
    const data = await res.json();
    resultBox.innerHTML = `
      <h3>🌿 निदान: ${data.disease}</h3>
      <p>विश्वासार्हता: <strong>${data.confidence}</strong></p>
      <p>सुचवणी: ${data.suggestion}</p>
    `;
  } catch {
    resultBox.innerHTML = '❌ तपासणी अयशस्वी. Server चालू आहे का?';
  }
}

// ── Factory Form ──────────────────────────────────────────
document.getElementById('factory-form').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    name: document.getElementById('f-name').value,
    location: document.getElementById('f-location').value,
    district: document.getElementById('f-district').value,
    ratePerTon: parseFloat(document.getElementById('f-rate').value),
    contact: document.getElementById('f-contact').value
  };
  try {
    await fetch(`${API}/factories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    alert('✅ कारखाना जोडला!');
    e.target.reset();
    loadFactories();
  } catch {
    alert('❌ कारखाना जोडता आला नाही.');
  }
});

async function loadFactories() {
  try {
    const res = await fetch(`${API}/factories`);
    const factories = await res.json();
    const box = document.getElementById('factory-list');
    const nearby = document.getElementById('nearby-factories');
    const html = factories.length
      ? factories.map(f => `<div class="list-item">🏭 <strong>${f.name}</strong> | ${f.district || '-'} | ₹${f.ratePerTon || '-'}/टन | 📞 ${f.contact || '-'}</div>`).join('')
      : '<p style="color:#888;padding:0.5rem">कोणतेही कारखाने नाहीत</p>';
    if (box) box.innerHTML = html;
    if (nearby) nearby.innerHTML = html;
  } catch {
    console.error('Factories load failed');
  }
}

// ── Init ──────────────────────────────────────────────────
loadWeather();
loadAllWorkers();
loadFactories();
