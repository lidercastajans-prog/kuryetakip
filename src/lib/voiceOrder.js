// Hands-free voice order: record a clip in the browser and send it to the
// voice-order Edge Function (OpenAI Whisper + GPT) which returns structured
// order fields. Web only.
const FUNCTION_URL = 'https://nfdzipkrkphvkhybjuvw.supabase.co/functions/v1/voice-order';
// Publishable key — public by design (the function gateway rejects the legacy anon key).
const PUBLISHABLE_KEY = 'sb_publishable_WXYOmybpH1PfK00ECxhMTQ_oKOkmVk6';

export function isVoiceSupported() {
  return typeof navigator !== 'undefined'
    && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    && typeof MediaRecorder !== 'undefined';
}

function pickMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/mpeg'];
  for (const t of candidates) {
    try { if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t; } catch { /* ignore */ }
  }
  return '';
}

const extFor = (mime) =>
  mime.includes('mp4') || mime.includes('m4a') ? 'mp4'
    : mime.includes('aac') ? 'aac'
      : mime.includes('mpeg') || mime.includes('mp3') ? 'mp3'
        : 'webm';

// Returns a recorder with start() and stop()->Promise<Blob>.
export async function createRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = pickMimeType();
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

  return {
    start: () => rec.start(),
    stop: () => new Promise((resolve) => {
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' }));
      };
      rec.stop();
    }),
  };
}

export async function transcribeAndParse(blob, customers) {
  const ext = extFor(blob.type || 'audio/webm');
  const fd = new FormData();
  fd.append('audio', blob, `order.${ext}`);
  fd.append('customers', JSON.stringify((customers || []).map((c) => ({ id: c.id, name: c.name }))));

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { apikey: PUBLISHABLE_KEY }, // do NOT set Content-Type; browser adds the multipart boundary
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
  return data; // { transcript, fields }
}
