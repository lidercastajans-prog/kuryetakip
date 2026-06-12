// Supabase Edge Function: voice-order
//
// Receives a recorded audio clip (multipart) + the user's customer list,
// transcribes it with OpenAI Whisper (Turkish) and parses the transcript into
// structured order fields with gpt-4o-mini. The client fills the order form with
// the result; the user reviews and saves. Nothing is created here.
//
// Secret required: OPENAI_API_KEY
// Called from the browser with header  apikey: <publishable key>.

const OPENAI = 'https://api.openai.com/v1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) return json({ error: 'OPENAI_API_KEY tanımlı değil.' }, 500);

    const form = await req.formData();
    const audio = form.get('audio');
    if (!(audio instanceof File)) return json({ error: 'Ses dosyası gelmedi.' }, 400);

    let customers: { id: string; name: string }[] = [];
    try { customers = JSON.parse(String(form.get('customers') ?? '[]')); } catch { /* ignore */ }

    // 1) Speech -> text (Whisper, Turkish)
    const sttForm = new FormData();
    sttForm.append('file', audio, audio.name || 'audio.webm');
    sttForm.append('model', 'whisper-1');
    sttForm.append('language', 'tr');
    const sttRes = await fetch(`${OPENAI}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: sttForm,
    });
    if (!sttRes.ok) return json({ error: 'Ses yazıya çevrilemedi.', detail: await sttRes.text() }, 502);
    const transcript: string = (await sttRes.json())?.text ?? '';

    // 2) Text -> structured order fields
    const names = customers.map((c) => c.name).filter(Boolean);
    // Bugünün tarihini (İstanbul saati) bağlam olarak ver ki "yarın", "Cuma",
    // "öbür gün saat 3" gibi göreceli ifadeler doğru çözülebilsin.
    const now = new Date();
    const trToday = new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(now);
    const isoToday = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now); // YYYY-MM-DD
    const system =
      'Sen bir kurye sipariş asistanısın. Kullanıcının Türkçe sesli siparişini yapılandırılmış JSON\'a çevir.\n' +
      `Bugün: ${trToday} (${isoToday}).\n` +
      'SADECE şu şemada JSON döndür (başka metin yok):\n' +
      '{"customerName":"","pickupProvince":"","pickupDistrict":"","pickupMahalle":"","deliveryProvince":"","deliveryDistrict":"","deliveryMahalle":"","amount":null,"vehicleType":"","note":"","dueDate":"","dueTime":""}\n' +
      'Kurallar:\n' +
      `- customerName: SADECE şu listeden en yakın eşleşen ad, eşleşme yoksa "": ${JSON.stringify(names)}\n` +
      '- pickup = alınacak/nereden, delivery = teslim/nereye. İl söylenmezse "İstanbul".\n' +
      '- pickupDistrict/deliveryDistrict = ilçe; pickupMahalle/deliveryMahalle = mahalle (yoksa "").\n' +
      '- amount: sayı (TL), yoksa null.\n' +
      '- vehicleType: "Motor" | "Minivan" | "Panelvan" | "Kamyonet" (yoksa "").\n' +
      '- note: ekstra not (yoksa "").\n' +
      '- dueDate: planlı/ileri teslimat tarihi YYYY-MM-DD biçiminde. "yarın", "öbür gün", "Cuma", "15 Haziran" gibi ifadeleri yukarıdaki bugüne göre çöz. Tarih söylenmediyse "".\n' +
      '- dueTime: planlı teslimat saati HH:MM (24 saat). "saat 3" → "15:00" gibi makul yorumla. Saat söylenmediyse "".\n' +
      '- Emin olmadığın alanları boş bırak.';

    const chatRes = await fetch(`${OPENAI}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: transcript || '(boş)' },
        ],
      }),
    });
    if (!chatRes.ok) return json({ error: 'Sipariş ayrıştırılamadı.', detail: await chatRes.text(), transcript }, 502);

    let fields = {};
    try { fields = JSON.parse((await chatRes.json())?.choices?.[0]?.message?.content ?? '{}'); } catch { /* ignore */ }

    return json({ transcript, fields });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
