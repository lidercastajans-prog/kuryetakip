import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Modal, Animated, Platform, KeyboardAvoidingView,
  Linking, Share
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store/useStore';
import { PackagePlus, Bike, Car, Truck, History, ListTodo, Download, X, ChevronDown, FileText, Send, Edit2, Trash2, MapPin, Share2, Clock } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const VEHICLE_TYPES = [
  { label: 'Motor', value: 'Motor', icon: Bike },
  { label: 'Minivan', value: 'Minivan', icon: Car },
  { label: 'Panelvan', value: 'Panelvan', icon: Truck },
  { label: 'Kamyonet', value: 'Kamyonet', icon: Truck },
];

const ISTANBUL_DISTRICTS = [
  { label: 'Adalar', lat: 40.8757, lon: 29.1294 },
  { label: 'Arnavutköy', lat: 41.1833, lon: 28.7333 },
  { label: 'Ataşehir', lat: 40.9833, lon: 29.1167 },
  { label: 'Avcılar', lat: 40.9806, lon: 28.7203 },
  { label: 'Bağcılar', lat: 41.0333, lon: 28.8417 },
  { label: 'Bahçelievler', lat: 41.0000, lon: 28.8500 },
  { label: 'Bakırköy', lat: 40.9886, lon: 28.8744 },
  { label: 'Başakşehir', lat: 41.0969, lon: 28.8017 },
  { label: 'Bayrampaşa', lat: 41.0333, lon: 28.9000 },
  { label: 'Beşiktaş', lat: 41.0428, lon: 29.0075 },
  { label: 'Beykoz', lat: 41.1333, lon: 29.1167 },
  { label: 'Beylikdüzü', lat: 40.9833, lon: 28.6333 },
  { label: 'Beyoğlu', lat: 41.0333, lon: 28.9833 },
  { label: 'Büyükçekmece', lat: 41.0167, lon: 28.5833 },
  { label: 'Çatalca', lat: 41.1444, lon: 28.4611 },
  { label: 'Çekmeköy', lat: 41.0333, lon: 29.1667 },
  { label: 'Esenler', lat: 41.0333, lon: 28.8833 },
  { label: 'Esenyurt', lat: 41.0333, lon: 28.6833 },
  { label: 'Eyüpsultan', lat: 41.0417, lon: 28.9333 },
  { label: 'Fatih', lat: 41.0167, lon: 28.9333 },
  { label: 'Gaziosmanpaşa', lat: 41.0583, lon: 28.9083 },
  { label: 'Güngören', lat: 41.0222, lon: 28.8722 },
  { label: 'Kadıköy', lat: 40.9900, lon: 29.0200 },
  { label: 'Kağıthane', lat: 41.0833, lon: 28.9667 },
  { label: 'Kartal', lat: 40.8878, lon: 29.1867 },
  { label: 'Küçükçekmece', lat: 41.0000, lon: 28.7833 },
  { label: 'Maltepe', lat: 40.9231, lon: 29.1306 },
  { label: 'Pendik', lat: 40.8767, lon: 29.2567 },
  { label: 'Sancaktepe', lat: 40.9833, lon: 29.2167 },
  { label: 'Sarıyer', lat: 41.1667, lon: 29.0500 },
  { label: 'Silivri', lat: 41.0667, lon: 28.2500 },
  { label: 'Sultanbeyli', lat: 40.9667, lon: 29.2667 },
  { label: 'Sultangazi', lat: 41.1083, lon: 28.8667 },
  { label: 'Şile', lat: 41.1750, lon: 29.6139 },
  { label: 'Şişli', lat: 41.0600, lon: 28.9875 },
  { label: 'Tuzla', lat: 40.8167, lon: 29.3000 },
  { label: 'Ümraniye', lat: 41.0333, lon: 29.0833 },
  { label: 'Üsküdar', lat: 41.0269, lon: 29.0158 },
  { label: 'Zeytinburnu', lat: 40.9889, lon: 28.9042 }
];

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return (R * c).toFixed(1);
}

const FadeInView = ({ children, delay = 0, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

export default function OrdersScreen() {
  const { orders, customers, addOrder, updateOrderStatus, editOrder, deleteOrder } = useStore();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('active');
  const [formCollapsed, setFormCollapsed] = useState(false);
  
  // District Modal State
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [selectingDistrictFor, setSelectingDistrictFor] = useState(null); // 'pickup' | 'delivery'
  const [districtSearch, setDistrictSearch] = useState('');

  // Order Form State
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [amount, setAmount] = useState('');
  const [vehicleType, setVehicleType] = useState('Motor');
  const [courierName, setCourierName] = useState('');
  const [courierPlate, setCourierPlate] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [note, setNote] = useState('');
  const [orderDueDate, setOrderDueDate] = useState(null);
  const [showOrderDueCal, setShowOrderDueCal] = useState(false);
  const [orderCalMonth, setOrderCalMonth] = useState(new Date().getMonth());
  const [orderCalYear, setOrderCalYear] = useState(new Date().getFullYear());

  const buildCalDays = (month, year) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay + 6) % 7;
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const getOrderDueStatus = (dueDateStr) => {
    if (!dueDateStr) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(dueDateStr); due.setHours(0,0,0,0);
    const diff = Math.round((due - today) / 86400000);
    if (diff < 0) return { label: `${Math.abs(diff)} gün geçti`, color: '#DC2626', bg: '#FEF2F2' };
    if (diff === 0) return { label: 'Bugün son gün', color: '#EA580C', bg: '#FFF7ED' };
    if (diff <= 3) return { label: `${diff} gün kaldı`, color: '#D97706', bg: '#FFFBEB' };
    if (diff <= 7) return { label: `${diff} gün kaldı`, color: '#0284C7', bg: '#F0F9FF' };
    return { label: `${diff} gün kaldı`, color: '#16A34A', bg: '#F0FDF4' };
  };

  // Export Modal State
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportCustomerId, setExportCustomerId] = useState('');
  const [exportStartDate, setExportStartDate] = useState(new Date());
  const [exportEndDate, setExportEndDate] = useState(new Date());
  const [openCalendar, setOpenCalendar] = useState(null); // 'start' | 'end' | null
  const [calViewMonth, setCalViewMonth] = useState(new Date().getMonth());
  const [calViewYear, setCalViewYear] = useState(new Date().getFullYear());

  const handleAddOrder = async () => {
    if (!selectedCustomerId || !pickupLocation || !deliveryLocation || !amount) {
      return Alert.alert('Hata', 'Zorunlu alanları (Müşteri, Semt, Tutar) eksiksiz girin.');
    }
    const customer = customers.find(c => c.id === selectedCustomerId);

    const dueDateVal = orderDueDate ? orderDueDate.toISOString() : null;

    if (editingOrderId) {
      editOrder(editingOrderId, {
        customerId: customer.id,
        customerName: customer.name,
        pickupLocation: pickupLocation.label,
        deliveryLocation: deliveryLocation.label,
        vehicleType,
        amount: Number(amount),
        courierName,
        courierPlate,
        courierPhone,
        note,
        due_date: dueDateVal,
      });
      Alert.alert('Başarılı ✓', 'Sipariş güncellendi.');
    } else {
      await addOrder({
        customerId: customer.id,
        customerName: customer.name,
        pickupLocation: pickupLocation.label,
        deliveryLocation: deliveryLocation.label,
        vehicleType,
        amount: Number(amount),
        courierName,
        courierPlate,
        courierPhone,
        note,
        due_date: dueDateVal,
      });
      Alert.alert('Başarılı ✓', 'Sipariş oluşturuldu ve müşteriye borç yazıldı.');
    }

    setEditingOrderId(null);
    setSelectedCustomerId(''); setPickupLocation(null); setDeliveryLocation(null); setAmount('');
    setCourierName(''); setCourierPlate(''); setCourierPhone(''); setNote(''); setOrderDueDate(null); setShowOrderDueCal(false);
    setActiveTab('active');
  };

  const handleEditClick = (order) => {
    setEditingOrderId(order.id);
    setSelectedCustomerId(order.customerId);
    setPickupLocation(ISTANBUL_DISTRICTS.find(d => d.label === order.pickupLocation) || { label: order.pickupLocation });
    setDeliveryLocation(ISTANBUL_DISTRICTS.find(d => d.label === order.deliveryLocation) || { label: order.deliveryLocation });
    setAmount(String(order.amount));
    setVehicleType(order.vehicleType || 'Motor');
    setCourierName(order.courierName || '');
    setCourierPlate(order.courierPlate || '');
    setCourierPhone(order.courierPhone || '');
    setNote(order.note || '');
    setOrderDueDate(order.due_date ? new Date(order.due_date) : null);
    setFormCollapsed(false);
    setActiveTab('active');
  };

  const handleDeleteClick = (orderId) => {
    Alert.alert('Emin misiniz?', 'Siparişi ve tahsilat etkilerini silmek üzeresiniz. Bu işlem geri alınamaz.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteOrder(orderId) }
    ]);
  };

  const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const DAYS_TR = ['Pz','Pt','Sa','Ça','Pe','Cu','Ct'];

  const openExportModal = () => {
    const today = new Date();
    setExportStartDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setExportEndDate(today);
    setCalViewMonth(today.getMonth());
    setCalViewYear(today.getFullYear());
    setOpenCalendar(null);
    setExportModalVisible(true);
  };

  const handleCalendarDayPress = (day) => {
    const selected = new Date(calViewYear, calViewMonth, day);
    if (openCalendar === 'start') {
      setExportStartDate(selected);
      if (selected > exportEndDate) setExportEndDate(selected);
    } else {
      setExportEndDate(selected);
      if (selected < exportStartDate) setExportStartDate(selected);
    }
    setOpenCalendar(null);
  };

  const openCalendarFor = (which) => {
    const ref = which === 'start' ? exportStartDate : exportEndDate;
    setCalViewMonth(ref.getMonth());
    setCalViewYear(ref.getFullYear());
    setOpenCalendar(openCalendar === which ? null : which);
  };

  const formatDateTR = (d) =>
    `${String(d.getDate()).padStart(2,'0')} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;

  const buildCalendarDays = () => {
    const firstDay = new Date(calViewYear, calViewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
    const startOffset = (firstDay + 6) % 7; // Mon-based
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const isDaySelected = (day) => {
    if (!day) return false;
    const d = new Date(calViewYear, calViewMonth, day);
    return d >= exportStartDate && d <= exportEndDate;
  };

  const isDayStart = (day) => {
    if (!day) return false;
    const d = new Date(calViewYear, calViewMonth, day);
    return d.toDateString() === exportStartDate.toDateString();
  };

  const isDayEnd = (day) => {
    if (!day) return false;
    const d = new Date(calViewYear, calViewMonth, day);
    return d.toDateString() === exportEndDate.toDateString();
  };

  const handleShareOrder = async (order) => {
    const text = `📦 *${order.customerName} Kurye Siparişi*\n\n*Alınacak:* ${order.pickupLocation || '-'}\n*Teslim:* ${order.deliveryLocation || '-'}\n*Araç:* ${order.vehicleType || '-'}\n*Tutar:* ${order.amount} ₺${order.note ? `\n*Not:* ${order.note}` : ''}\n\nİyi çalışmalar!`;
    try {
      await Share.share({
        message: text,
      });
    } catch (error) {
      Alert.alert('Hata', 'Paylaşım gerçekleştirilemedi.');
    }
  };

  const handleExport = async () => {
    try {
      let filteredForExport = orders.filter(o => o.status === 'Teslim Edildi');
      if (exportCustomerId) {
        filteredForExport = filteredForExport.filter(o => o.customerId === exportCustomerId);
      }
      const start = new Date(exportStartDate.getFullYear(), exportStartDate.getMonth(), exportStartDate.getDate());
      const end = new Date(exportEndDate.getFullYear(), exportEndDate.getMonth(), exportEndDate.getDate() + 1);
      filteredForExport = filteredForExport.filter(o => new Date(o.date) >= start && new Date(o.date) < end);
      if (filteredForExport.length === 0) {
        return Alert.alert('Uyarı', 'Seçili filtrelere uygun geçmiş sipariş bulunamadı.');
      }

      let csvStr = "Tarih;Musteri_Firma;Alinan_Semt;Teslim_Semt;Arac;Kurye_Ad;Kurye_Plaka;Kurye_Tel;Tutar_TL;Not\n";
      filteredForExport.forEach(o => {
        const d = new Date(o.date).toLocaleDateString('tr-TR');
        csvStr += `${d};${o.customerName};${o.pickupLocation};${o.deliveryLocation};${o.vehicleType};${o.courierName || ''};${o.courierPlate || ''};${o.courierPhone || ''};${o.amount};${o.note || ''}\n`;
      });

      const fileUri = FileSystem.documentDirectory + "Siparisler_Raporu.csv";
      await FileSystem.writeAsStringAsync(fileUri, csvStr, { encoding: 'utf8' });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Hata", "Bu cihazda dosya paylaşımı desteklenmiyor.");
        return;
      }
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Excel/CSV Olarak Paylaş' });
      setExportModalVisible(false);
    } catch (error) {
      Alert.alert("Hata", "Bir sorun oluştu: " + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Bekliyor': return { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' };
      case 'Yolda': return { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' };
      case 'Teslim Edildi': return { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' };
      default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF' };
    }
  };

  const nextStatus = (currentStatus) => {
    if (currentStatus === 'Bekliyor') return 'Yolda';
    if (currentStatus === 'Yolda') return 'Teslim Edildi';
    return null;
  };

  const getNextStatusLabel = (current) => {
    if (current === 'Bekliyor') return '🚀 Yola Çıkar';
    if (current === 'Yolda') return '✓ Teslim Et';
    return null;
  };

  const filteredOrders = orders.filter(o =>
    activeTab === 'active' ? o.status !== 'Teslim Edildi' : o.status === 'Teslim Edildi'
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={[styles.headerSection, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.pageTitle}>Siparişler</Text>
            <Text style={styles.pageSubtitle}>{orders.length} toplam sipariş</Text>
          </View>

          {/* New Order Form */}
          <FadeInView delay={100}>
            <TouchableOpacity
              style={styles.formToggle}
              onPress={() => {
                if(formCollapsed && editingOrderId) {
                   setEditingOrderId(null);
                   setSelectedCustomerId(''); setPickupLocation(null); setDeliveryLocation(null); setAmount('');
                   setCourierName(''); setCourierPlate(''); setCourierPhone(''); setNote('');
                }
                setFormCollapsed(!formCollapsed);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.formToggleLeft}>
                <View style={[styles.formToggleIcon, editingOrderId && { backgroundColor: '#EFF6FF' }]}>
                  {editingOrderId ? <Edit2 color="#2563EB" size={20} /> : <PackagePlus color="#EA580C" size={20} />}
                </View>
                <Text style={styles.formToggleText}>{editingOrderId ? 'Siparişi Düzenle' : 'Yeni Sipariş Ekle'}</Text>
              </View>
              <Animated.View style={{ transform: [{ rotate: formCollapsed ? '0deg' : '180deg' }] }}>
                <ChevronDown color="#9CA3AF" size={20} />
              </Animated.View>
            </TouchableOpacity>

            {!formCollapsed && (
              <View style={styles.formCard}>
                {/* Customer Selection */}
                <Text style={styles.inputLabel}>Müşteri Seçin</Text>
                {customers.length === 0 ? (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>Önce Cari sekmesinden müşteri ekleyin.</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {customers.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, selectedCustomerId === c.id && styles.chipActive]}
                        onPress={() => setSelectedCustomerId(c.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.chipAvatar, selectedCustomerId === c.id && styles.chipAvatarActive]}>
                          <Text style={[styles.chipAvatarText, selectedCustomerId === c.id && { color: '#EA580C' }]}>
                            {c.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.chipText, selectedCustomerId === c.id && styles.chipTextActive]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Vehicle Type */}
                <Text style={styles.inputLabel}>Araç Türü</Text>
                <View style={styles.vehicleGrid}>
                  {VEHICLE_TYPES.map(vt => {
                    const Icon = vt.icon;
                    const isActive = vehicleType === vt.value;
                    return (
                      <TouchableOpacity
                        key={vt.value}
                        style={[styles.vehicleBtn, isActive && styles.vehicleBtnActive]}
                        onPress={() => setVehicleType(vt.value)}
                        activeOpacity={0.7}
                      >
                        <Icon color={isActive ? "#fff" : "#6B7280"} size={18} />
                        <Text style={[styles.vehicleBtnText, isActive && styles.vehicleBtnTextActive]}>
                          {vt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Locations */}
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Alınacak Semt</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => { setSelectingDistrictFor('pickup'); setDistrictModalVisible(true); }}
                    >
                      <Text style={{ color: pickupLocation ? '#111827' : '#C3C7CC' }}>
                        {pickupLocation ? pickupLocation.label : 'Örn: Şişli'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Teslim Semti</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => { setSelectingDistrictFor('delivery'); setDistrictModalVisible(true); }}
                    >
                      <Text style={{ color: deliveryLocation ? '#111827' : '#C3C7CC' }}>
                        {deliveryLocation ? deliveryLocation.label : 'Örn: Kadıköy'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {pickupLocation && deliveryLocation && pickupLocation.lat && deliveryLocation.lat && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -4, marginBottom: 8, paddingHorizontal: 4 }}>
                    <MapPin color="#ea580c" size={14} />
                    <Text style={{ fontSize: 13, color: '#ea580c', fontWeight: '600', marginLeft: 4 }}>
                      Tahmini Mesafe: {getDistanceKm(pickupLocation.lat, pickupLocation.lon, deliveryLocation.lat, deliveryLocation.lon)} km
                    </Text>
                  </View>
                )}

                {/* Amount */}
                <Text style={styles.inputLabel}>Sipariş Tutarı (₺)</Text>
                <TextInput style={styles.input} placeholder="Örn: 250" placeholderTextColor="#C3C7CC" value={amount} onChangeText={setAmount} keyboardType="numeric" />

                {/* Courier Info */}
                <Text style={[styles.inputLabel, { color: '#9CA3AF' }]}>Kurye Bilgileri (İsteğe Bağlı)</Text>
                <TextInput style={styles.input} placeholder="Kurye Ad/Soyadı" placeholderTextColor="#C3C7CC" value={courierName} onChangeText={setCourierName} />
                <View style={styles.inputRow}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Araç Plakası" placeholderTextColor="#C3C7CC" value={courierPlate} onChangeText={setCourierPlate} />
                  <View style={{ width: 10 }} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Tel No" placeholderTextColor="#C3C7CC" value={courierPhone} onChangeText={setCourierPhone} keyboardType="phone-pad" />
                </View>

                {/* Notes */}
                <Text style={[styles.inputLabel, { color: '#9CA3AF' }]}>Ekstra Notlar</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Zile basılmasın, kapıya bırakılsın..." placeholderTextColor="#C3C7CC" value={note} onChangeText={setNote} multiline />

                {/* Due Date */}
                <Text style={[styles.inputLabel, { color: '#9CA3AF' }]}>Vade / Teslim Tarihi (İsteğe Bağlı)</Text>
                <TouchableOpacity
                  style={[styles.dueDateBtn, orderDueDate && { borderColor: '#EA580C', backgroundColor: '#FFF7ED' }]}
                  onPress={() => {
                    const ref = orderDueDate || new Date();
                    setOrderCalMonth(ref.getMonth());
                    setOrderCalYear(ref.getFullYear());
                    setShowOrderDueCal(!showOrderDueCal);
                  }}
                >
                  <Clock color={orderDueDate ? '#EA580C' : '#9CA3AF'} size={16} />
                  <Text style={[styles.dueDateBtnText, orderDueDate && { color: '#EA580C' }]}>
                    {orderDueDate
                      ? orderDueDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
                      : 'Vade tarihi seç'}
                  </Text>
                  {orderDueDate && (
                    <TouchableOpacity onPress={() => { setOrderDueDate(null); setShowOrderDueCal(false); }}>
                      <X color="#DC2626" size={14} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {showOrderDueCal && (
                  <View style={styles.calBox}>
                    <View style={styles.calNavRow}>
                      <TouchableOpacity onPress={() => { const d = new Date(orderCalYear, orderCalMonth - 1); setOrderCalMonth(d.getMonth()); setOrderCalYear(d.getFullYear()); }} style={styles.calNavBtn}>
                        <Text style={styles.calArrow}>‹</Text>
                      </TouchableOpacity>
                      <Text style={styles.calNavTitle}>{MONTHS_TR[orderCalMonth]} {orderCalYear}</Text>
                      <TouchableOpacity onPress={() => { const d = new Date(orderCalYear, orderCalMonth + 1); setOrderCalMonth(d.getMonth()); setOrderCalYear(d.getFullYear()); }} style={styles.calNavBtn}>
                        <Text style={styles.calArrow}>›</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.calDayNames}>
                      {DAYS_TR.map(d => <Text key={d} style={styles.calDayName}>{d}</Text>)}
                    </View>
                    <View style={styles.calGrid}>
                      {buildCalDays(orderCalMonth, orderCalYear).map((day, i) => {
                        const isSel = orderDueDate && day &&
                          new Date(orderCalYear, orderCalMonth, day).toDateString() === orderDueDate.toDateString();
                        return (
                          <TouchableOpacity key={i} style={[styles.calCell, isSel && styles.calCellSelected]}
                            onPress={() => { if (day) { setOrderDueDate(new Date(orderCalYear, orderCalMonth, day)); setShowOrderDueCal(false); } }}
                          >
                            <Text style={[styles.calCellText, isSel && styles.calCellTextSelected]}>{day || ''}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Submit */}
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddOrder} activeOpacity={0.85}>
                  <Send color="#FFFFFF" size={18} />
                  <Text style={styles.submitBtnText}>Siparişi Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}
          </FadeInView>

          {/* Tabs */}
          <FadeInView delay={200}>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'active' && styles.tabActive]}
                onPress={() => setActiveTab('active')}
                activeOpacity={0.7}
              >
                <ListTodo color={activeTab === 'active' ? "#FFFFFF" : "#6B7280"} size={16} />
                <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                  Aktif ({orders.filter(o => o.status !== 'Teslim Edildi').length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                onPress={() => setActiveTab('history')}
                activeOpacity={0.7}
              >
                <History color={activeTab === 'history' ? "#FFFFFF" : "#6B7280"} size={16} />
                <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                  Geçmiş ({orders.filter(o => o.status === 'Teslim Edildi').length})
                </Text>
              </TouchableOpacity>
            </View>
          </FadeInView>

          {/* Export Button */}
          {activeTab === 'history' && (
            <FadeInView delay={250}>
              <TouchableOpacity style={styles.exportBtn} onPress={openExportModal} activeOpacity={0.7}>
                <Download color="#16A34A" size={16} />
                <Text style={styles.exportBtnText}>Geçmişi Raporla (Excel)</Text>
              </TouchableOpacity>
            </FadeInView>
          )}

          {/* Order List */}
          {filteredOrders.length === 0 ? (
            <FadeInView delay={300}>
              <View style={styles.emptyState}>
                <ListTodo color="#D1D5DB" size={40} />
                <Text style={styles.emptyTitle}>Bu listede sipariş yok</Text>
              </View>
            </FadeInView>
          ) : (
            filteredOrders.map((order, index) => {
              const colors = getStatusColor(order.status);
              const next = nextStatus(order.status);
              const nextLabel = getNextStatusLabel(order.status);
              const orderDate = new Date(order.date).toLocaleDateString('tr-TR');
              const dueStatus = getOrderDueStatus(order.due_date);

              return (
                <FadeInView key={order.id} delay={300 + index * 60}>
                  <View style={styles.orderCard}>
                    <View style={[styles.orderAccent, { backgroundColor: colors.dot }]} />
                    <View style={styles.orderBody}>
                      {/* Header */}
                      <View style={styles.orderHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orderCustomer}>{order.customerName}</Text>
                          <Text style={styles.orderMeta}>{orderDate} • {order.vehicleType}</Text>
                          {dueStatus && order.status !== 'Teslim Edildi' && (
                            <View style={[styles.orderDueBadge, { backgroundColor: dueStatus.bg }]}>
                              <Clock color={dueStatus.color} size={11} />
                              <Text style={[styles.orderDueBadgeText, { color: dueStatus.color }]}>{dueStatus.label}</Text>
                            </View>
                          )}
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
                          <View style={[styles.statusDot, { backgroundColor: colors.dot }]} />
                          <Text style={[styles.statusLabel, { color: colors.text }]}>{order.status}</Text>
                        </View>
                      </View>

                      {/* Route */}
                      <View style={styles.routeBox}>
                        <View style={styles.routePoint}>
                          <View style={[styles.routeCircle, { backgroundColor: '#EF4444' }]} />
                          <Text style={styles.routeLabel}>{order.pickupLocation || '-'}</Text>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routePoint}>
                          <View style={[styles.routeCircle, { backgroundColor: '#22C55E' }]} />
                          <Text style={styles.routeLabel}>{order.deliveryLocation || '-'}</Text>
                        </View>
                      </View>

                      {/* Details */}
                      {(order.courierName || order.note) && (
                        <View style={styles.detailBox}>
                          {order.courierName && (
                            <Text style={styles.detailLine}>
                              🏍 {order.courierName} {order.courierPlate ? `(${order.courierPlate})` : ''}
                            </Text>
                          )}
                          {order.courierPhone && <Text style={styles.detailLine}>📞 {order.courierPhone}</Text>}
                          {order.note && <Text style={[styles.detailLine, { fontStyle: 'italic' }]}>📝 {order.note}</Text>}
                        </View>
                      )}

                      {/* Footer */}
                      <View style={styles.orderFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.orderPrice}>{order.amount} ₺</Text>
                          <View style={{ flexDirection: 'row', marginLeft: 12 }}>
                            {activeTab === 'active' && (
                              <>
                                <TouchableOpacity onPress={() => handleEditClick(order)} style={{ padding: 6, backgroundColor: '#EFF6FF', borderRadius: 8, marginRight: 6 }}>
                                  <Edit2 color="#2563EB" size={16} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteClick(order.id)} style={{ padding: 6, backgroundColor: '#FEF2F2', borderRadius: 8, marginRight: 6 }}>
                                  <Trash2 color="#DC2626" size={16} />
                                </TouchableOpacity>
                              </>
                            )}
                            <TouchableOpacity onPress={() => handleShareOrder(order)} style={{ padding: 6, backgroundColor: '#ECFCCB', borderRadius: 8 }}>
                              <Share2 color="#65A30D" size={16} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        {next && (
                          <TouchableOpacity
                            style={[styles.actionBtn, next === 'Teslim Edildi' && { backgroundColor: '#16A34A' }]}
                            onPress={() => updateOrderStatus(order.id, next)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.actionBtnText}>{nextLabel}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </FadeInView>
              );
            })
          )}

          {/* DISTRICT MODAL */}
          <Modal visible={districtModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { height: '80%' }]}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Semt Seçin</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDistrictModalVisible(false)} style={styles.modalClose}>
                    <X color="#6B7280" size={20} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, { marginBottom: 16 }]}
                  placeholder="Ara..."
                  placeholderTextColor="#9CA3AF"
                  value={districtSearch}
                  onChangeText={setDistrictSearch}
                />
                <ScrollView showsVerticalScrollIndicator={false}>
                  {ISTANBUL_DISTRICTS.filter(d => d.label.toLowerCase().includes(districtSearch.toLowerCase())).map(district => (
                    <TouchableOpacity
                      key={district.label}
                      style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => {
                        if (selectingDistrictFor === 'pickup') setPickupLocation(district);
                        if (selectingDistrictFor === 'delivery') setDeliveryLocation(district);
                        setDistrictModalVisible(false);
                        setDistrictSearch('');
                      }}
                    >
                      <MapPin color="#EA580C" size={18} style={{ marginRight: 10, opacity: 0.7 }} />
                      <Text style={{ fontSize: 16, color: '#111827' }}>{district.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* EXPORT MODAL */}
          <Modal visible={exportModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Rapor Al</Text>
                    <Text style={styles.modalSubtitle}>Excel/CSV olarak dışa aktar</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setExportModalVisible(false)}
                  >
                    <X color="#6B7280" size={20} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Müşteriye Göre Filtrele</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <TouchableOpacity
                    style={[styles.chip, !exportCustomerId && styles.chipActive]}
                    onPress={() => setExportCustomerId('')}
                  >
                    <Text style={[styles.chipText, !exportCustomerId && styles.chipTextActive]}>Tümü</Text>
                  </TouchableOpacity>
                  {customers.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, exportCustomerId === c.id && styles.chipActive]}
                      onPress={() => setExportCustomerId(c.id)}
                    >
                      <Text style={[styles.chipText, exportCustomerId === c.id && styles.chipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Tarih Aralığı</Text>
                <View style={styles.dateRangeRow}>
                  <TouchableOpacity
                    style={[styles.datePill, openCalendar === 'start' && styles.datePillActive]}
                    onPress={() => openCalendarFor('start')}
                  >
                    <Text style={styles.datePillLabel}>Başlangıç</Text>
                    <Text style={[styles.datePillValue, openCalendar === 'start' && { color: '#EA580C' }]}>{formatDateTR(exportStartDate)}</Text>
                  </TouchableOpacity>
                  <View style={styles.dateRangeDash} />
                  <TouchableOpacity
                    style={[styles.datePill, openCalendar === 'end' && styles.datePillActive]}
                    onPress={() => openCalendarFor('end')}
                  >
                    <Text style={styles.datePillLabel}>Bitiş</Text>
                    <Text style={[styles.datePillValue, openCalendar === 'end' && { color: '#EA580C' }]}>{formatDateTR(exportEndDate)}</Text>
                  </TouchableOpacity>
                </View>

                {openCalendar && (
                  <View style={styles.calendarBox}>
                    <View style={styles.calNavRow}>
                      <TouchableOpacity onPress={() => { const d = new Date(calViewYear, calViewMonth - 1); setCalViewMonth(d.getMonth()); setCalViewYear(d.getFullYear()); }} style={styles.calNavBtn}>
                        <Text style={styles.calNavArrow}>‹</Text>
                      </TouchableOpacity>
                      <Text style={styles.calNavTitle}>{MONTHS_TR[calViewMonth]} {calViewYear}</Text>
                      <TouchableOpacity onPress={() => { const d = new Date(calViewYear, calViewMonth + 1); setCalViewMonth(d.getMonth()); setCalViewYear(d.getFullYear()); }} style={styles.calNavBtn}>
                        <Text style={styles.calNavArrow}>›</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.calDayNames}>
                      {DAYS_TR.map(d => <Text key={d} style={styles.calDayName}>{d}</Text>)}
                    </View>
                    <View style={styles.calGrid}>
                      {buildCalendarDays().map((day, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.calCell,
                            day && isDaySelected(day) && styles.calCellSelected,
                            day && (isDayStart(day) || isDayEnd(day)) && styles.calCellEndpoint,
                          ]}
                          onPress={() => day && handleCalendarDayPress(day)}
                          activeOpacity={day ? 0.7 : 1}
                        >
                          <Text style={[
                            styles.calCellText,
                            day && isDaySelected(day) && styles.calCellTextSelected,
                            day && (isDayStart(day) || isDayEnd(day)) && styles.calCellTextEndpoint,
                          ]}>{day || ''}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.exportSubmitBtn} onPress={handleExport} activeOpacity={0.85}>
                  <FileText color="#FFFFFF" size={18} />
                  <Text style={styles.exportSubmitText}>Rapor Oluştur ve Paylaş</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
  container: { paddingBottom: 40 },

  // Header
  headerSection: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingTop: 0, // Controlled by insets in JSX
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },

  // Form Toggle
  formToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  formToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formToggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formToggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  // Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 1,
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },

  // Inputs
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 8,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputHalf: {
    flex: 1,
    marginRight: 5,
  },

  // Chips
  chipScroll: {
    marginBottom: 4,
    maxHeight: 50,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  chipAvatarActive: {
    backgroundColor: '#FFEDD5',
  },
  chipAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#EA580C',
  },

  // Date range picker
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  datePill: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  datePillActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  datePillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  datePillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  dateRangeDash: {
    width: 10,
    height: 2,
    backgroundColor: '#D1D5DB',
    borderRadius: 1,
  },
  calendarBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 4,
  },
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calNavBtn: { padding: 6 },
  calNavArrow: { fontSize: 22, color: '#EA580C', fontWeight: '700', lineHeight: 24 },
  calNavTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  calDayNames: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calCellSelected: {
    backgroundColor: '#FFEDD5',
  },
  calCellEndpoint: {
    backgroundColor: '#EA580C',
    borderRadius: 8,
  },
  calCellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  calCellTextSelected: {
    color: '#EA580C',
    fontWeight: '600',
  },
  calCellTextEndpoint: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Vehicle
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  vehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  vehicleBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  vehicleBtnText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  vehicleBtnTextActive: {
    color: '#FFFFFF',
  },

  // Warning
  warningBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    ...Platform.select({
      ios: { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#111827',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  tabText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Export
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    marginHorizontal: 20,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  exportBtnText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },

  // Empty
  dueDateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  dueDateBtnText: { flex: 1, fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  calBox: {
    backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1,
    borderColor: '#E5E7EB', padding: 12, marginBottom: 12,
  },
  calNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  calNavBtn: { padding: 6 },
  calArrow: { fontSize: 22, color: '#EA580C', fontWeight: '700', lineHeight: 24 },
  calNavTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  calDayNames: { flexDirection: 'row', marginBottom: 4 },
  calDayName: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  calCellSelected: { backgroundColor: '#EA580C' },
  calCellText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  calCellTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  orderDueBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginTop: 4,
  },
  orderDueBadgeText: { fontSize: 11, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },

  // Order Card
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  orderAccent: {
    width: 4,
  },
  orderBody: {
    flex: 1,
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  orderMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Route
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  routeLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  routeLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },

  // Detail
  detailBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  detailLine: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
    fontWeight: '500',
  },

  // Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  actionBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  exportSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    ...Platform.select({
      ios: { shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  exportSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
