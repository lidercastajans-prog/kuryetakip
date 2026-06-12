import React, { useRef, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import { isVoiceSupported, createRecorder, transcribeAndParse } from '../lib/voiceOrder';
import { useToast } from '../store/useToast';

// One-button hands-free voice order entry. Tap to record, tap to stop; the clip
// is transcribed + parsed and the parsed fields are handed back via onParsed so
// the order form can be pre-filled for review. Web only (hidden elsewhere).
export default function VoiceOrderButton({ customers, onParsed }) {
  const showToast = useToast((s) => s.showToast);
  const [supported] = useState(isVoiceSupported());
  const [state, setState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const recRef = useRef(null);

  if (!supported) return null;

  const start = async () => {
    try {
      const rec = await createRecorder();
      recRef.current = rec;
      rec.start();
      setState('recording');
    } catch (e) {
      showToast('Mikrofona erişilemedi — tarayıcıdan izin verin.', 'error');
      setState('idle');
    }
  };

  const stop = async () => {
    const rec = recRef.current;
    if (!rec) return;
    recRef.current = null;
    setState('processing');
    try {
      const blob = await rec.stop();
      const { fields, transcript } = await transcribeAndParse(blob, customers);
      onParsed(fields || {}, transcript || '');
    } catch (e) {
      showToast('Ses işlenemedi: ' + (e.message || ''), 'error');
    } finally {
      setState('idle');
    }
  };

  const recording = state === 'recording';
  const processing = state === 'processing';

  return (
    <TouchableOpacity
      style={[styles.btn, recording && styles.btnRec]}
      onPress={() => (recording ? stop() : start())}
      disabled={processing}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: processing, busy: processing }}
      accessibilityLabel={recording ? 'Kaydı durdur' : processing ? 'Ses işleniyor' : 'Sesli sipariş ver'}
    >
      {processing ? (
        <>
          <ActivityIndicator color="#EA580C" size="small" />
          <Text style={styles.txt}>İşleniyor…</Text>
        </>
      ) : recording ? (
        <>
          <Square color="#FFFFFF" size={16} />
          <Text style={[styles.txt, { color: '#FFFFFF' }]}>Dinleniyor… durdurmak için bas</Text>
        </>
      ) : (
        <>
          <Mic color="#EA580C" size={20} />
          <Text style={styles.txt}>Sesli Sipariş</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF7ED', borderWidth: 1.5, borderColor: '#FDBA74',
    borderRadius: 14, paddingVertical: 14, marginBottom: 14,
  },
  btnRec: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
  txt: { fontSize: 15, fontWeight: '700', color: '#EA580C' },
});
