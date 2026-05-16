require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const Worker = require('./models/worker');
const Attendance = require('./models/attendance');
const Factory = require('./models/factory');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ dest: 'uploads/' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sugarcane_app';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ── Worker Routes ──────────────────────────────────────────
app.get('/api/workers', async (req, res) => {
  const workers = await Worker.find();
  res.json(workers);
});

app.post('/api/workers', async (req, res) => {
  try {
    const worker = new Worker(req.body);
    await worker.save();
    res.status(201).json(worker);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/workers/:id', async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) return res.status(404).json({ error: 'Not found' });
  res.json(worker);
});

app.put('/api/workers/:id/location', async (req, res) => {
  const { lat, lng, campLocation } = req.body;
  const worker = await Worker.findByIdAndUpdate(
    req.params.id,
    { location: { lat, lng }, campLocation },
    { new: true }
  );
  res.json(worker);
});

// ── Attendance & Payment Routes ────────────────────────────
app.post('/api/attendance', async (req, res) => {
  try {
    const record = new Attendance(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/attendance/:workerId', async (req, res) => {
  const records = await Attendance.find({ workerId: req.params.workerId });
  const totalTons = records.reduce((sum, r) => sum + r.tonsWorked, 0);
  const totalPay = records.reduce((sum, r) => sum + r.payment, 0);
  const pending = records.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.payment, 0);
  res.json({ records, totalTons, totalPay, pending });
});

// ── Factory Routes ─────────────────────────────────────────
app.get('/api/factories', async (req, res) => {
  const factories = await Factory.find();
  res.json(factories);
});

app.post('/api/factories', async (req, res) => {
  try {
    const factory = new Factory(req.body);
    await factory.save();
    res.status(201).json(factory);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── AI Chatbot Route ───────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, workerId } = req.body;
  const msg = message.toLowerCase();

  let reply = '';

  if (msg.includes('पैसे') || msg.includes('payment') || msg.includes('wage')) {
    if (workerId) {
      const records = await Attendance.find({ workerId, status: 'pending' });
      const pending = records.reduce((sum, r) => sum + r.payment, 0);
      reply = `तुमचे बाकी पैसे: ₹${pending} आहेत.`;
    } else {
      reply = 'कृपया तुमचा Worker ID द्या.';
    }
  } else if (msg.includes('काम') || msg.includes('work') || msg.includes('location')) {
    reply = 'आजचे काम: शेत नं. 4, सकाळी 6 वाजता सुरू होईल. GPS location पाठवले आहे.';
  } else if (msg.includes('हवामान') || msg.includes('weather')) {
    reply = 'आज तापमान 34°C आहे. उष्माघाताची शक्यता आहे. भरपूर पाणी प्या.';
  } else if (msg.includes('आजारी') || msg.includes('health') || msg.includes('injury')) {
    reply = 'जवळच्या PHC ला जा. प्रथमोपचार: जखम स्वच्छ करा, पट्टी बांधा. गंभीर असल्यास 108 वर कॉल करा.';
  } else if (msg.includes('scheme') || msg.includes('योजना')) {
    reply = 'PM Shram Yogi Mandhan, ESIC, आणि Maharashtra Kamgar Kalyan योजना उपलब्ध आहेत.';
  } else {
    reply = 'नमस्कार! मी तुम्हाला काम, पैसे, हवामान, आरोग्य आणि सरकारी योजनांबद्दल मदत करू शकतो.';
  }

  res.json({ reply });
});

// ── Crop Disease Detection (mock AI) ──────────────────────
app.post('/api/crop/detect', upload.single('image'), (req, res) => {
  // In production: integrate with a real ML model or API
  const mockResults = [
    { disease: 'Red Rot', confidence: '87%', suggestion: 'Remove infected stalks. Apply Carbendazim fungicide.' },
    { disease: 'Smut', confidence: '72%', suggestion: 'Use disease-free seed cane. Apply Propiconazole.' },
    { disease: 'Healthy', confidence: '91%', suggestion: 'Crop looks healthy. Continue regular irrigation.' }
  ];
  const result = mockResults[Math.floor(Math.random() * mockResults.length)];
  res.json(result);
});

// ── Serve frontend ─────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
