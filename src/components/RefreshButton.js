import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useStore } from '../store/useStore';

// Manual "yenile" button — re-fetches everything from the cloud so changes that
// happened elsewhere (other device/session) show up immediately.
export default function RefreshButton({ color = '#EA580C', size = 18, style, onPress }) {
  const fetchData = useStore((s) => s.fetchData);
  const [spinning, setSpinning] = useState(false);

  const handlePress = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      await (onPress ? onPress() : fetchData());
    } finally {
      setSpinning(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={spinning}
      style={[styles.btn, style]}
      activeOpacity={0.7}
      accessibilityLabel="Yenile"
    >
      {spinning ? <ActivityIndicator size="small" color={color} /> : <RefreshCw color={color} size={size} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
