import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { isPushSupported, isPushEnabled, enablePush } from '../lib/push';
import { useToast } from '../store/useToast';

// Small card prompting the user to turn on web push for planned-delivery
// reminders. Renders nothing on native / unsupported browsers, or once enabled.
export default function PushToggle() {
  const showToast = useToast((s) => s.showToast);
  const [supported] = useState(isPushSupported());
  const [enabled, setEnabled] = useState(true); // assume on until checked (hides flicker)
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (supported) isPushEnabled().then(setEnabled);
    else setEnabled(true);
  }, [supported]);

  if (!supported || enabled) return null;

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    const res = await enablePush();
    setBusy(false);
    if (res.ok) {
      setEnabled(true);
      showToast('Teslimat bildirimleri açıldı', 'success');
    } else if (res.reason === 'denied') {
      showToast('Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsiniz.', 'error');
    } else if (res.reason === 'no-user') {
      showToast('Bildirimleri açmak için giriş yapın.', 'error');
    } else {
      showToast('Bildirimler açılamadı.', 'error');
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} disabled={busy}>
      <View style={styles.iconWrap}><Bell color="#EA580C" size={20} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Planlı teslimat bildirimleri</Text>
        <Text style={styles.sub}>Siparişin saati geldiğinde hatırlatma al</Text>
      </View>
      <View style={styles.btn}><Text style={styles.btnText}>{busy ? '...' : 'Aç'}</Text></View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 14,
    padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#FFEDD5',
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  btn: { backgroundColor: '#EA580C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
