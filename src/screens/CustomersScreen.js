import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Animated, Platform, KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store/useStore';
import { UserPlus, Wallet, Building2, MapPin, Phone, CreditCard, ChevronDown, Trash2, Calendar, Clock } from 'lucide-react-native';

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

export default function CustomersScreen() {
  const { customers, addCustomer, addPayment, deleteCustomer, updateCustomerDueDate } = useStore();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [dueDate, setDueDate] = useState(null);
  const [showDueCal, setShowDueCal] = useState(false);
  const [calViewMonth, setCalViewMonth] = useState(new Date().getMonth());
  const [calViewYear, setCalViewYear] = useState(new Date().getFullYear());

  // Due date calendar for existing customers
  const [dueDateCustomerId, setDueDateCustomerId] = useState(null);
  const [showExistingCal, setShowExistingCal] = useState(false);
  const [existingCalMonth, setExistingCalMonth] = useState(new Date().getMonth());
  const [existingCalYear, setExistingCalYear] = useState(new Date().getFullYear());

  const [paymentCustomerId, setPaymentCustomerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const DAYS_TR = ['Pz','Pt','Sa','Ça','Pe','Cu','Ct'];

  const buildCalDays = (month, year) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay + 6) % 7;
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const getDueStatus = (dueDateStr) => {
    if (!dueDateStr) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / 86400000);
    if (diff < 0) return { label: `${Math.abs(diff)} gün geçti`, color: '#DC2626', bg: '#FEF2F2' };
    if (diff === 0) return { label: 'Bugün son gün', color: '#EA580C', bg: '#FFF7ED' };
    if (diff <= 3) return { label: `${diff} gün kaldı`, color: '#D97706', bg: '#FFFBEB' };
    if (diff <= 7) return { label: `${diff} gün kaldı`, color: '#0284C7', bg: '#F0F9FF' };
    return { label: `${diff} gün kaldı`, color: '#16A34A', bg: '#F0FDF4' };
  };

  const handleAddCustomer = () => {
    if (!name) return Alert.alert('Hata', 'Müşteri / Firma adı zorunludur');
    addCustomer({ name, phone, taxOffice, taxNumber, address, due_date: dueDate ? dueDate.toISOString() : null });
    setName(''); setPhone(''); setTaxOffice(''); setTaxNumber(''); setAddress(''); setDueDate(null); setShowDueCal(false);
    Alert.alert('Başarılı ✓', 'Müşteri başarıyla eklendi.');
  };

  const handleAddPayment = () => {
    if (!paymentCustomerId || !paymentAmount) return Alert.alert('Hata', 'Müşteri ve tahsilat tutarı gereklidir');
    addPayment(paymentCustomerId, paymentAmount);
    setPaymentCustomerId(''); setPaymentAmount('');
    Alert.alert('Başarılı ✓', 'Tahsilat alındı, cari bakiyeden düşüldü.');
  };

  const handleDeleteCustomer = (customerId, customerName) => {
    Alert.alert('Müşteriyi Sil', `${customerName} isimli müşteriyi kalıcı olarak silmek istediğinize emin misiniz? Bu müşteriye ait siparişler de listenizden kaldırılacaktır.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteCustomer(customerId) }
    ]);
  };

  const getInitials = (n) => {
    const parts = n.split(' ');
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
  };

  const totalCustomers = customers.length;
  const totalDebt = customers.reduce((sum, c) => sum + Math.max(c.balance || 0, 0), 0);

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={[styles.headerSection, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.pageTitle}>Cari Hesaplar</Text>
            <Text style={styles.pageSubtitle}>{totalCustomers} müşteri • {totalDebt.toLocaleString('tr-TR')} ₺ toplam</Text>
          </View>

          {/* New Customer Form */}
          <FadeInView delay={100}>
            <TouchableOpacity
              style={styles.formToggle}
              onPress={() => setFormCollapsed(!formCollapsed)}
              activeOpacity={0.7}
            >
              <View style={styles.formToggleLeft}>
                <View style={styles.formToggleIcon}>
                  <UserPlus color="#EA580C" size={20} />
                </View>
                <Text style={styles.formToggleText}>Yeni Müşteri Ekle</Text>
              </View>
              <Animated.View style={{ transform: [{ rotate: formCollapsed ? '0deg' : '180deg' }] }}>
                <ChevronDown color="#9CA3AF" size={20} />
              </Animated.View>
            </TouchableOpacity>

            {!formCollapsed && (
              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>Müşteri / Firma Adı *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: ABC Lojistik"
                  placeholderTextColor="#C3C7CC"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.inputLabel}>Telefon</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0532 XXX XX XX"
                  placeholderTextColor="#C3C7CC"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: 5 }}>
                    <Text style={styles.inputLabel}>Vergi Dairesi</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Vergi Dairesi"
                      placeholderTextColor="#C3C7CC"
                      value={taxOffice}
                      onChangeText={setTaxOffice}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text style={styles.inputLabel}>Vergi No / T.C.</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Vergi No"
                      placeholderTextColor="#C3C7CC"
                      value={taxNumber}
                      onChangeText={setTaxNumber}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Açık Adres</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Adres bilgisi..."
                  placeholderTextColor="#C3C7CC"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />

                {/* Due Date Picker */}
                <Text style={styles.inputLabel}>Vade Tarihi</Text>
                <TouchableOpacity
                  style={[styles.dueDateBtn, dueDate && { borderColor: '#EA580C', backgroundColor: '#FFF7ED' }]}
                  onPress={() => {
                    setCalViewMonth(dueDate ? dueDate.getMonth() : new Date().getMonth());
                    setCalViewYear(dueDate ? dueDate.getFullYear() : new Date().getFullYear());
                    setShowDueCal(!showDueCal);
                  }}
                >
                  <Clock color={dueDate ? '#EA580C' : '#9CA3AF'} size={16} />
                  <Text style={[styles.dueDateBtnText, dueDate && { color: '#EA580C' }]}>
                    {dueDate
                      ? dueDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
                      : 'Vade tarihi seç (opsiyonel)'}
                  </Text>
                  {dueDate && (
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); setDueDate(null); setShowDueCal(false); }}>
                      <Clock color="#DC2626" size={14} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {showDueCal && (
                  <View style={styles.calBox}>
                    <View style={styles.calNavRow}>
                      <TouchableOpacity onPress={() => { const d = new Date(calViewYear, calViewMonth - 1); setCalViewMonth(d.getMonth()); setCalViewYear(d.getFullYear()); }} style={styles.calNavBtn}>
                        <Text style={styles.calArrow}>‹</Text>
                      </TouchableOpacity>
                      <Text style={styles.calNavTitle}>{MONTHS_TR[calViewMonth]} {calViewYear}</Text>
                      <TouchableOpacity onPress={() => { const d = new Date(calViewYear, calViewMonth + 1); setCalViewMonth(d.getMonth()); setCalViewYear(d.getFullYear()); }} style={styles.calNavBtn}>
                        <Text style={styles.calArrow}>›</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.calDayNames}>
                      {DAYS_TR.map(d => <Text key={d} style={styles.calDayName}>{d}</Text>)}
                    </View>
                    <View style={styles.calGrid}>
                      {buildCalDays(calViewMonth, calViewYear).map((day, i) => {
                        const isSelected = dueDate && day &&
                          new Date(calViewYear, calViewMonth, day).toDateString() === dueDate.toDateString();
                        return (
                          <TouchableOpacity key={i} style={[styles.calCell, isSelected && styles.calCellSelected]}
                            onPress={() => { if (day) { setDueDate(new Date(calViewYear, calViewMonth, day)); setShowDueCal(false); } }}
                          >
                            <Text style={[styles.calCellText, isSelected && styles.calCellTextSelected]}>{day || ''}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.submitBtn} onPress={handleAddCustomer} activeOpacity={0.85}>
                  <UserPlus color="#FFFFFF" size={18} />
                  <Text style={styles.submitBtnText}>Müşteriyi Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}
          </FadeInView>

          {/* Customer List */}
          <FadeInView delay={200}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Müşteriler</Text>
              <Text style={styles.sectionSubtitle}>
                Tahsilat almak için müşteriye dokunun
              </Text>
            </View>
          </FadeInView>

          {customers.length === 0 ? (
            <FadeInView delay={300}>
              <View style={styles.emptyState}>
                <UserPlus color="#D1D5DB" size={40} />
                <Text style={styles.emptyTitle}>Henüz müşteri kaydınız yok</Text>
                <Text style={styles.emptySubtext}>Yukarıdan yeni müşteri ekleyerek başlayın</Text>
              </View>
            </FadeInView>
          ) : (
            customers.map((c, index) => {
              const isSelected = paymentCustomerId === c.id;
              const hasDebt = c.balance > 0;
              const dueStatus = getDueStatus(c.due_date);

              return (
                <FadeInView key={c.id} delay={300 + index * 60}>
                  <TouchableOpacity
                    style={[styles.customerCard, isSelected && styles.customerCardSelected]}
                    onPress={() => setPaymentCustomerId(isSelected ? '' : c.id)}
                    activeOpacity={0.7}
                  >
                    {/* Avatar */}
                    <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                      <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                        {getInitials(c.name)}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>{c.name}</Text>

                      <View style={styles.infoRow}>
                        <Phone color="#9CA3AF" size={12} />
                        <Text style={styles.infoText}>{c.phone || 'Tel bilgisi yok'}</Text>
                      </View>

                      {(c.taxOffice || c.taxNumber) && (
                        <View style={styles.infoRow}>
                          <Building2 color="#9CA3AF" size={12} />
                          <Text style={styles.infoText}>{c.taxOffice} - {c.taxNumber}</Text>
                        </View>
                      )}

                      {c.address && (
                        <View style={styles.infoRow}>
                          <MapPin color="#9CA3AF" size={12} />
                          <Text style={styles.infoText} numberOfLines={1}>{c.address}</Text>
                        </View>
                      )}

                      {dueStatus && (
                        <View style={[styles.dueBadge, { backgroundColor: dueStatus.bg }]}>
                          <Clock color={dueStatus.color} size={11} />
                          <Text style={[styles.dueBadgeText, { color: dueStatus.color }]}>{dueStatus.label}</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.setDueBtn}
                        onPress={() => {
                          const ref = c.due_date ? new Date(c.due_date) : new Date();
                          setExistingCalMonth(ref.getMonth());
                          setExistingCalYear(ref.getFullYear());
                          setDueDateCustomerId(dueDateCustomerId === c.id ? null : c.id);
                          setShowExistingCal(dueDateCustomerId !== c.id);
                        }}
                      >
                        <Calendar color="#6B7280" size={12} />
                        <Text style={styles.setDueBtnText}>{c.due_date ? 'Vadeyi Güncelle' : 'Vade Tarihi Ekle'}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Balance */}
                    <View style={[styles.balanceSection, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }]}>
                      <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                        <Text style={styles.balanceLabel}>Borç</Text>
                        <View style={[styles.balanceBadge, hasDebt ? styles.debtBadge : styles.clearBadge]}>
                          <Text style={[styles.balanceValue, hasDebt ? styles.debtText : styles.clearText]}>
                            {c.balance} ₺
                          </Text>
                        </View>
                      </View>
                      
                      {/* Delete Button */}
                      <TouchableOpacity
                        style={{ padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 }}
                        onPress={() => handleDeleteCustomer(c.id, c.name)}
                      >
                        <Trash2 color="#DC2626" size={18} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Due Date Calendar for existing customer */}
                  {showExistingCal && dueDateCustomerId === c.id && (
                    <View style={[styles.calBox, { marginHorizontal: 20, marginTop: -8, marginBottom: 8 }]}>
                      <View style={styles.calNavRow}>
                        <TouchableOpacity onPress={() => { const d = new Date(existingCalYear, existingCalMonth - 1); setExistingCalMonth(d.getMonth()); setExistingCalYear(d.getFullYear()); }} style={styles.calNavBtn}>
                          <Text style={styles.calArrow}>‹</Text>
                        </TouchableOpacity>
                        <Text style={styles.calNavTitle}>{MONTHS_TR[existingCalMonth]} {existingCalYear}</Text>
                        <TouchableOpacity onPress={() => { const d = new Date(existingCalYear, existingCalMonth + 1); setExistingCalMonth(d.getMonth()); setExistingCalYear(d.getFullYear()); }} style={styles.calNavBtn}>
                          <Text style={styles.calArrow}>›</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.calDayNames}>
                        {DAYS_TR.map(d => <Text key={d} style={styles.calDayName}>{d}</Text>)}
                      </View>
                      <View style={styles.calGrid}>
                        {buildCalDays(existingCalMonth, existingCalYear).map((day, i) => {
                          const isSelected = c.due_date && day &&
                            new Date(existingCalYear, existingCalMonth, day).toDateString() === new Date(c.due_date).toDateString();
                          return (
                            <TouchableOpacity key={i} style={[styles.calCell, isSelected && styles.calCellSelected]}
                              onPress={() => {
                                if (day) {
                                  updateCustomerDueDate(c.id, new Date(existingCalYear, existingCalMonth, day).toISOString());
                                  setShowExistingCal(false);
                                  setDueDateCustomerId(null);
                                }
                              }}
                            >
                              <Text style={[styles.calCellText, isSelected && styles.calCellTextSelected]}>{day || ''}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      {c.due_date && (
                        <TouchableOpacity style={styles.removeDueBtn} onPress={() => { updateCustomerDueDate(c.id, null); setShowExistingCal(false); setDueDateCustomerId(null); }}>
                          <Text style={styles.removeDueBtnText}>Vade Tarihini Kaldır</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Payment Section - Inline */}
                  {isSelected && (
                    <View style={styles.paymentCard}>
                      <View style={styles.paymentHeader}>
                        <View style={styles.paymentIconBg}>
                          <Wallet color="#16A34A" size={18} />
                        </View>
                        <View>
                          <Text style={styles.paymentTitle}>Tahsilat Al</Text>
                          <Text style={styles.paymentSubtitle}>{c.name} • Mevcut borç: {c.balance} ₺</Text>
                        </View>
                      </View>

                      <TextInput
                        style={styles.paymentInput}
                        placeholder="Alınan Tutar (₺)"
                        placeholderTextColor="#C3C7CC"
                        value={paymentAmount}
                        onChangeText={setPaymentAmount}
                        keyboardType="numeric"
                      />

                      <TouchableOpacity style={styles.paymentBtn} onPress={handleAddPayment} activeOpacity={0.85}>
                        <CreditCard color="#FFFFFF" size={16} />
                        <Text style={styles.paymentBtnText}>Tahsilatı Onayla</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </FadeInView>
              );
            })
          )}

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
    marginBottom: 6,
    marginTop: 12,
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
    marginBottom: 4,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Customer Card
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  customerCardSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  // Avatar
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarSelected: {
    backgroundColor: '#DBEAFE',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6B7280',
  },
  avatarTextSelected: {
    color: '#2563EB',
  },

  // Customer Info
  customerInfo: {
    flex: 1,
    paddingRight: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 5,
    fontWeight: '500',
  },

  // Balance
  balanceSection: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  debtBadge: {
    backgroundColor: '#FEF2F2',
  },
  clearBadge: {
    backgroundColor: '#F0FDF4',
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  debtText: {
    color: '#DC2626',
  },
  clearText: {
    color: '#16A34A',
  },

  // Payment Card
  dueBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, marginTop: 6,
  },
  dueBadgeText: { fontSize: 11, fontWeight: '700' },
  setDueBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
  },
  setDueBtnText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  dueDateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, marginBottom: 12,
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
  removeDueBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 8 },
  removeDueBtnText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },

  paymentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#3B82F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  paymentIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  paymentInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  paymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    padding: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  paymentBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});
