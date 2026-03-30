import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, Platform, RefreshControl, Dimensions
} from 'react-native';
import Svg, { Rect, G, Text as SvgText, Circle, Line } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store/useStore';
import {
  Crown, Plus, TrendingUp, TrendingDown, Wallet, Fuel, Wrench,
  UsersRound, Building, MoreHorizontal, X, ChevronDown,
  ArrowUpCircle, ArrowDownCircle, FileText, Receipt,
  BarChart2, Target, AlertCircle, Download, Bell, Star
} from 'lucide-react-native';

const { width: SW } = Dimensions.get('window');
const MONTHS_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

const INCOME_CATEGORIES = [
  { key: 'Sipariş Geliri', icon: Receipt, color: '#16A34A' },
  { key: 'Tahsilat', icon: Wallet, color: '#059669' },
  { key: 'Diğer Gelir', icon: TrendingUp, color: '#0D9488' },
];
const EXPENSE_CATEGORIES = [
  { key: 'Yakıt', icon: Fuel, color: '#DC2626' },
  { key: 'Araç Bakım', icon: Wrench, color: '#EA580C' },
  { key: 'Personel', icon: UsersRound, color: '#7C3AED' },
  { key: 'Kira', icon: Building, color: '#0284C7' },
  { key: 'Diğer Gider', icon: MoreHorizontal, color: '#6B7280' },
];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
const FILTER_OPTIONS = [
  { key: 'today', label: 'Bugün' },
  { key: 'week', label: 'Bu Hafta' },
  { key: 'month', label: 'Bu Ay' },
  { key: 'all', label: 'Tümü' },
];
const TABS = [
  { key: 'ozet', label: 'Özet', icon: Receipt },
  { key: 'grafik', label: 'Grafik', icon: BarChart2 },
  { key: 'butce', label: 'Bütçe', icon: Target },
  { key: 'analiz', label: 'Analiz', icon: Star },
];


const BarChart6M = ({ data }) => {
  const W = SW - 48;
  const H = 160;
  const padL = 38;
  const padB = 28;
  const chartW = W - padL;
  const chartH = H - padB;
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const colW = chartW / data.length;
  const barW = Math.min(colW * 0.28, 13);
  const fmt = v => v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`;

  return (
    <Svg width={W} height={H}>
      {[0, 0.5, 1].map((r, i) => {
        const y = chartH - r * chartH;
        return (
          <G key={i}>
            <Line x1={padL} y1={y} x2={W} y2={y} stroke="#F3F4F6" strokeWidth={1} />
            <SvgText x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">{fmt(Math.round(r * maxVal))}</SvgText>
          </G>
        );
      })}
      {data.map((d, i) => {
        const cx = padL + i * colW + colW / 2;
        const incH = Math.max((d.income / maxVal) * chartH, d.income > 0 ? 3 : 0);
        const expH = Math.max((d.expense / maxVal) * chartH, d.expense > 0 ? 3 : 0);
        return (
          <G key={i}>
            <Rect x={cx - barW - 2} y={chartH - incH} width={barW} height={incH} fill="#16A34A" rx={3} />
            <Rect x={cx + 2} y={chartH - expH} width={barW} height={expH} fill="#DC2626" rx={3} />
            <SvgText x={cx} y={H - 4} textAnchor="middle" fontSize={9} fill="#6B7280">{d.label}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

const DonutChart = ({ segments, total, size = 140 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 20;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const arcLen = total > 0 ? (seg.value / total) * circumference : 0;
        const rotation = -90 + (cumulative / (total || 1)) * 360;
        cumulative += seg.value;
        return (
          <Circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${arcLen} ${circumference - arcLen}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
    </Svg>
  );
};

export default function PremiumScreen() {
  const { cashTransactions, customers, orders, addCashTransaction, deleteCashTransaction, fetchData } = useStore();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ozet');
  const [activeFilter, setActiveFilter] = useState('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [txType, setTxType] = useState('income');
  const [txCategory, setTxCategory] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [budgets, setBudgets] = useState({});
  const [editingBudgetCat, setEditingBudgetCat] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return cashTransactions.filter(t => {
      const d = new Date(t.date);
      switch (activeFilter) {
        case 'today': return d.toDateString() === now.toDateString();
        case 'week': { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
        case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        default: return true;
      }
    });
  }, [cashTransactions, activeFilter]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const m = d.getMonth(); const y = d.getFullYear();
      const txs = cashTransactions.filter(t => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y; });
      return {
        label: MONTHS_TR[m],
        income: txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }, [cashTransactions]);

  const categoryExpenses = useMemo(() => {
    const now = new Date();
    const thisMonth = cashTransactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return EXPENSE_CATEGORIES.map(cat => ({
      label: cat.key, color: cat.color,
      value: thisMonth.filter(t => t.category === cat.key).reduce((s, t) => s + Number(t.amount), 0),
    })).filter(s => s.value > 0);
  }, [cashTransactions]);

  const catTotal = categoryExpenses.reduce((s, c) => s + c.value, 0);

  const budgetProgress = useMemo(() => {
    const now = new Date();
    return EXPENSE_CATEGORIES.map(cat => {
      const spent = cashTransactions.filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && t.category === cat.key && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((s, t) => s + Number(t.amount), 0);
      const limit = budgets[cat.key] || 0;
      return { ...cat, spent, limit, ratio: limit > 0 ? Math.min(spent / limit, 1) : 0 };
    });
  }, [cashTransactions, budgets]);

  const analysisData = useMemo(() => {
    const now = new Date();
    const thisMonthOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonthIncome = cashTransactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'income' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, t) => s + Number(t.amount), 0);
    const avgOrderValue = thisMonthOrders.length > 0
      ? thisMonthOrders.reduce((s, o) => s + Number(o.amount), 0) / thisMonthOrders.length : 0;
    const dailyAvg = thisMonthIncome > 0 ? thisMonthIncome / now.getDate() : 0;
    const customerRevenue = customers.map(c => ({
      ...c,
      revenue: orders.filter(o => o.customerId === c.id).reduce((s, o) => s + Number(o.amount), 0),
      orderCount: orders.filter(o => o.customerId === c.id).length,
    })).sort((a, b) => b.revenue - a.revenue);
    const routeMap = {};
    orders.forEach(o => {
      if (o.pickupLocation && o.deliveryLocation) {
        const key = `${o.pickupLocation} → ${o.deliveryLocation}`;
        routeMap[key] = (routeMap[key] || 0) + 1;
      }
    });
    const topRoute = Object.entries(routeMap).sort((a, b) => b[1] - a[1])[0];
    const getDueStatus = (dueDateStr) => {
      if (!dueDateStr) return null;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const due = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
      const diff = Math.round((due - today) / 86400000);
      if (diff < 0) return { label: `${Math.abs(diff)} gün geçti`, color: '#DC2626', bg: '#FEF2F2', priority: 0 };
      if (diff === 0) return { label: 'Bugün son gün', color: '#EA580C', bg: '#FFF7ED', priority: 1 };
      if (diff <= 3) return { label: `${diff} gün kaldı`, color: '#D97706', bg: '#FFFBEB', priority: 2 };
      if (diff <= 7) return { label: `${diff} gün kaldı`, color: '#0284C7', bg: '#F0F9FF', priority: 3 };
      return { label: `${diff} gün kaldı`, color: '#16A34A', bg: '#F0FDF4', priority: 4 };
    };
    const reminders = customers
      .filter(c => (c.balance || 0) > 0)
      .map(c => ({ ...c, dueStatus: getDueStatus(c.due_date) }))
      .sort((a, b) => {
        const pa = a.dueStatus ? a.dueStatus.priority : 5;
        const pb = b.dueStatus ? b.dueStatus.priority : 5;
        if (pa !== pb) return pa - pb;
        return (b.balance || 0) - (a.balance || 0);
      });
    return { avgOrderValue, dailyAvg, thisMonthOrders, customerRevenue, topRoute, reminders };
  }, [orders, customers, cashTransactions]);

  const customerExtraData = useMemo(() => {
    if (!selectedCustomer) return [];
    const o = orders.filter(o => o.customerId === selectedCustomer.id).map(o => ({
      id: o.id, date: o.date, type: 'order',
      description: `${o.pickupLocation || '-'} → ${o.deliveryLocation || '-'}`,
      amount: Number(o.amount),
    }));
    const p = cashTransactions.filter(t => t.relatedCustomerId === selectedCustomer.id && t.category === 'Tahsilat').map(t => ({
      id: t.id, date: t.date, type: 'payment', description: t.description || 'Tahsilat', amount: Number(t.amount),
    }));
    return [...o, ...p].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedCustomer, orders, cashTransactions]);

  const getCatMeta = cat => ALL_CATEGORIES.find(c => c.key === cat) || { icon: MoreHorizontal, color: '#6B7280' };
  const fmt = val => Number(val).toLocaleString('tr-TR');
  const fmtDate = str => new Date(str).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleAddTransaction = async () => {
    if (!txCategory) return Alert.alert('Hata', 'Kategori seçiniz');
    if (!txAmount || isNaN(Number(txAmount))) return Alert.alert('Hata', 'Geçerli tutar giriniz');
    const ok = await addCashTransaction({ type: txType, category: txCategory, amount: Number(txAmount), description: txDescription || txCategory });
    if (ok) {
      setShowAddModal(false);
      setTxType('income'); setTxCategory(''); setTxAmount(''); setTxDescription('');
      Alert.alert('Başarılı ✓', 'Kasa kaydı oluşturuldu.');
    }
  };

  const handleDelete = id => Alert.alert('Kaydı Sil', 'Emin misiniz?', [
    { text: 'İptal', style: 'cancel' },
    { text: 'Sil', style: 'destructive', onPress: () => deleteCashTransaction(id) },
  ]);

  const handleExportCash = async () => {
    try {
      if (cashTransactions.length === 0) return Alert.alert('Uyarı', 'Dışa aktarılacak kayıt yok.');
      let csv = 'Tarih;Tip;Kategori;Tutar;Aciklama\n';
      cashTransactions.forEach(t => {
        csv += `${fmtDate(t.date)};${t.type === 'income' ? 'Gelir' : 'Gider'};${t.category};${t.amount};${t.description || ''}\n`;
      });
      const uri = FileSystem.documentDirectory + 'Kasa_Raporu.csv';
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: 'utf8' });
      if (!(await Sharing.isAvailableAsync())) return Alert.alert('Hata', 'Paylaşım desteklenmiyor.');
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Kasa Raporunu Paylaş' });
    } catch (e) { Alert.alert('Hata', e.message); }
  };

  const openBudget = cat => { setEditingBudgetCat(cat); setBudgetInput(budgets[cat] ? String(budgets[cat]) : ''); setShowBudgetModal(true); };
  const saveBudget = () => {
    if (!budgetInput || isNaN(Number(budgetInput))) return Alert.alert('Hata', 'Geçerli tutar girin');
    setBudgets(prev => ({ ...prev, [editingBudgetCat]: Number(budgetInput) }));
    setShowBudgetModal(false);
  };

  // ─── TAB: ÖZET ────────────────────────────────────────────────────────────
  const renderOzet = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {FILTER_OPTIONS.map(f => (
          <TouchableOpacity key={f.key} style={[s.filterChip, activeFilter === f.key && s.filterChipActive]} onPress={() => setActiveFilter(f.key)}>
            <Text style={[s.filterChipText, activeFilter === f.key && s.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.summaryRow}>
        <View style={[s.summaryCard, s.summaryIncome]}>
          <ArrowUpCircle color="#16A34A" size={22} />
          <Text style={s.summaryLabel}>Gelir</Text>
          <Text style={[s.summaryValue, { color: '#16A34A' }]}>{fmt(totalIncome)} ₺</Text>
        </View>
        <View style={[s.summaryCard, s.summaryExpense]}>
          <ArrowDownCircle color="#DC2626" size={22} />
          <Text style={s.summaryLabel}>Gider</Text>
          <Text style={[s.summaryValue, { color: '#DC2626' }]}>{fmt(totalExpense)} ₺</Text>
        </View>
      </View>
      <View style={s.netCard}>
        <Wallet color={netBalance >= 0 ? '#16A34A' : '#DC2626'} size={24} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={s.netLabel}>Net Kasa Bakiyesi</Text>
          <Text style={[s.netValue, { color: netBalance >= 0 ? '#16A34A' : '#DC2626' }]}>
            {netBalance >= 0 ? '+' : ''}{fmt(netBalance)} ₺
          </Text>
        </View>
      </View>

      <TouchableOpacity style={s.extraButton} onPress={() => setShowExtraModal(true)} activeOpacity={0.8}>
        <FileText color="#7C3AED" size={20} />
        <Text style={s.extraButtonText}>Cari Hesap Ekstresi</Text>
        <ChevronDown color="#7C3AED" size={18} />
      </TouchableOpacity>

      <Text style={s.sectionTitle}>Kasa Hareketleri</Text>
      {filteredTransactions.length === 0 ? (
        <View style={s.emptyCard}>
          <Receipt color="#D1D5DB" size={40} />
          <Text style={s.emptyTitle}>Kayıt bulunamadı</Text>
          <Text style={s.emptySubtext}>Seçilen dönemde kasa hareketi yok</Text>
        </View>
      ) : filteredTransactions.map(tx => {
        const cat = getCatMeta(tx.category);
        const IconComp = cat.icon;
        return (
          <TouchableOpacity key={tx.id} style={s.txCard} onLongPress={() => handleDelete(tx.id)} activeOpacity={0.9}>
            <View style={[s.txIconBg, { backgroundColor: cat.color + '15' }]}>
              <IconComp color={cat.color} size={20} />
            </View>
            <View style={s.txContent}>
              <Text style={s.txCategory}>{tx.category}</Text>
              <Text style={s.txDesc} numberOfLines={1}>{tx.description || '-'}</Text>
              <Text style={s.txDate}>{fmtDate(tx.date)}</Text>
            </View>
            <Text style={[s.txAmount, { color: tx.type === 'income' ? '#16A34A' : '#DC2626' }]}>
              {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)} ₺
            </Text>
          </TouchableOpacity>
        );
      })}

      <Text style={s.sectionTitle}>En Çok Ciro Yapan Müşteriler</Text>
      {[...customers].sort((a, b) => {
        const aT = orders.filter(o => o.customerId === a.id).reduce((s, o) => s + Number(o.amount), 0);
        const bT = orders.filter(o => o.customerId === b.id).reduce((s, o) => s + Number(o.amount), 0);
        return bT - aT;
      }).slice(0, 5).map((c, i) => {
        const cTotal = orders.filter(o => o.customerId === c.id).reduce((s, o) => s + Number(o.amount), 0);
        if (cTotal === 0) return null;
        return (
          <View key={c.id} style={s.topCustomerRow}>
            <View style={s.rankBadge}><Text style={s.rankText}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.topCustomerName}>{c.name}</Text>
              <Text style={s.topCustomerBalance}>Bakiye: {fmt(c.balance || 0)} ₺</Text>
            </View>
            <Text style={s.topCustomerTotal}>{fmt(cTotal)} ₺</Text>
          </View>
        );
      }).filter(Boolean)}
    </>
  );

  // ─── TAB: GRAFİK ─────────────────────────────────────────────────────────
  const renderGrafik = () => (
    <>
      <View style={s.chartCard}>
        <View style={s.chartHeader}>
          <Text style={s.chartTitle}>Aylık Gelir / Gider</Text>
          <View style={s.chartLegend}>
            <View style={[s.legendDot, { backgroundColor: '#16A34A' }]} /><Text style={s.legendText}>Gelir</Text>
            <View style={[s.legendDot, { backgroundColor: '#DC2626', marginLeft: 10 }]} /><Text style={s.legendText}>Gider</Text>
          </View>
        </View>
        <BarChart6M data={monthlyData} />
      </View>

      <View style={s.chartCard}>
        <Text style={s.chartTitle}>Bu Ay Gider Dağılımı</Text>
        {categoryExpenses.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text style={s.emptySubtext}>Bu ay henüz gider kaydı yok</Text>
          </View>
        ) : (
          <View style={s.donutRow}>
            <DonutChart segments={categoryExpenses} total={catTotal} size={130} />
            <View style={s.donutLegend}>
              {categoryExpenses.map(seg => (
                <View key={seg.label} style={s.donutLegendItem}>
                  <View style={[s.legendDot, { backgroundColor: seg.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.donutLegendLabel}>{seg.label}</Text>
                    <Text style={s.donutLegendValue}>{fmt(seg.value)} ₺</Text>
                  </View>
                  <Text style={s.donutLegendPct}>{catTotal > 0 ? Math.round(seg.value / catTotal * 100) : 0}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={s.exportBtn} onPress={handleExportCash} activeOpacity={0.85}>
        <Download color="#FFFFFF" size={18} />
        <Text style={s.exportBtnText}>Kasa Raporunu İndir & Paylaş</Text>
      </TouchableOpacity>
    </>
  );

  // ─── TAB: BÜTÇE ──────────────────────────────────────────────────────────
  const renderButce = () => (
    <>
      <View style={s.infoCard}>
        <Target color="#EA580C" size={18} />
        <Text style={s.infoCardText}>Kategoriye tıklayarak aylık limit belirle. Limite yaklaşınca uyarı görürsün.</Text>
      </View>
      {budgetProgress.map(cat => {
        const IconComp = cat.icon;
        const over = cat.limit > 0 && cat.spent > cat.limit;
        const warn = cat.limit > 0 && cat.ratio >= 0.8 && !over;
        const barColor = over ? '#DC2626' : warn ? '#F59E0B' : cat.color;
        return (
          <TouchableOpacity key={cat.key} style={s.budgetCard} onPress={() => openBudget(cat.key)} activeOpacity={0.85}>
            <View style={s.budgetCardTop}>
              <View style={[s.budgetIcon, { backgroundColor: cat.color + '15' }]}>
                <IconComp color={cat.color} size={20} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.budgetCatName}>{cat.key}</Text>
                <Text style={s.budgetSpent}>
                  {fmt(cat.spent)} ₺{cat.limit > 0 ? ` / ${fmt(cat.limit)} ₺` : ' · Limit yok'}
                </Text>
              </View>
              {(over || warn) && <AlertCircle color={over ? '#DC2626' : '#F59E0B'} size={20} />}
            </View>
            {cat.limit > 0 && (
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${cat.ratio * 100}%`, backgroundColor: barColor }]} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </>
  );

  // ─── TAB: ANALİZ ─────────────────────────────────────────────────────────
  const renderAnaliz = () => (
    <>
      <Text style={s.sectionTitle}>Bu Ay Özet</Text>
      <View style={s.metricsGrid}>
        <View style={s.metricCard}>
          <Text style={s.metricValue}>{analysisData.thisMonthOrders.length}</Text>
          <Text style={s.metricLabel}>Sipariş</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricValue}>{fmt(Math.round(analysisData.avgOrderValue))} ₺</Text>
          <Text style={s.metricLabel}>Ort. Sipariş</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricValue}>{fmt(Math.round(analysisData.dailyAvg))} ₺</Text>
          <Text style={s.metricLabel}>Günlük Ort.</Text>
        </View>
      </View>

      {analysisData.topRoute && (
        <>
          <Text style={s.sectionTitle}>En Sık Rota</Text>
          <View style={s.routeCard}>
            <View style={s.routeDot} />
            <Text style={s.routeText} numberOfLines={1}>{analysisData.topRoute[0]}</Text>
            <View style={s.routeBadge}>
              <Text style={s.routeBadgeText}>{analysisData.topRoute[1]}x</Text>
            </View>
          </View>
        </>
      )}

      <Text style={s.sectionTitle}>Müşteri Sıralaması</Text>
      {analysisData.customerRevenue.filter(c => c.revenue > 0).slice(0, 5).map((c, i) => (
        <View key={c.id} style={s.topCustomerRow}>
          <View style={s.rankBadge}><Text style={s.rankText}>{i + 1}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.topCustomerName}>{c.name}</Text>
            <Text style={s.topCustomerBalance}>{c.orderCount} sipariş</Text>
          </View>
          <Text style={s.topCustomerTotal}>{fmt(c.revenue)} ₺</Text>
        </View>
      ))}

      <Text style={s.sectionTitle}>Tahsilat Bekleyenler</Text>
      {analysisData.reminders.length === 0 ? (
        <View style={s.emptyCard}>
          <Bell color="#D1D5DB" size={36} />
          <Text style={s.emptyTitle}>Bekleyen tahsilat yok</Text>
        </View>
      ) : analysisData.reminders.map(c => (
        <View key={c.id} style={[s.reminderCard, c.dueStatus && { borderLeftWidth: 3, borderLeftColor: c.dueStatus.color }]}>
          <View style={[s.reminderAvatar, c.dueStatus && { backgroundColor: c.dueStatus.bg }]}>
            <Text style={[s.reminderAvatarText, c.dueStatus && { color: c.dueStatus.color }]}>{c.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.reminderName}>{c.name}</Text>
            {c.dueStatus ? (
              <View style={[s.duePill, { backgroundColor: c.dueStatus.bg }]}>
                <Text style={[s.duePillText, { color: c.dueStatus.color }]}>{c.dueStatus.label}</Text>
              </View>
            ) : (
              <Text style={s.reminderSub}>Vade tarihi belirlenmemiş</Text>
            )}
          </View>
          <View style={s.reminderBadge}>
            <Text style={s.reminderBadgeText}>{fmt(c.balance || 0)} ₺</Text>
          </View>
        </View>
      ))}
    </>
  );

  return (
    <View style={s.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EA580C" />}
      >
        {/* Header */}
        <View style={[s.headerGradient, { paddingTop: insets.top + 20 }]}>
          <View style={s.headerRow}>
            <View>
              <View style={s.premiumBadge}>
                <Crown color="#F59E0B" size={14} />
                <Text style={s.premiumBadgeText}>Premium</Text>
              </View>
              <Text style={s.headerTitle}>Kasa & Finans</Text>
              <Text style={s.headerSubtitle}>Gelir-gider ve finans analizi</Text>
            </View>
            <TouchableOpacity style={s.addButton} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
              <Plus color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={s.tabBar}>
          {TABS.map(tab => {
            const IconComp = tab.icon;
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={[s.tabBtn, active && s.tabBtnActive]} onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
                <IconComp color={active ? '#EA580C' : '#9CA3AF'} size={18} />
                <Text style={[s.tabBtnText, active && s.tabBtnTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'ozet' && renderOzet()}
        {activeTab === 'grafik' && renderGrafik()}
        {activeTab === 'butce' && renderButce()}
        {activeTab === 'analiz' && renderAnaliz()}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ADD TRANSACTION MODAL */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Kasa Kaydı Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X color="#6B7280" size={24} /></TouchableOpacity>
            </View>
            <View style={s.typeToggle}>
              <TouchableOpacity style={[s.typeBtn, txType === 'income' && s.typeBtnIncomeActive]} onPress={() => { setTxType('income'); setTxCategory(''); }}>
                <ArrowUpCircle color={txType === 'income' ? '#FFFFFF' : '#16A34A'} size={18} />
                <Text style={[s.typeBtnText, txType === 'income' && s.typeBtnTextActive]}>Gelir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.typeBtn, txType === 'expense' && s.typeBtnExpenseActive]} onPress={() => { setTxType('expense'); setTxCategory(''); }}>
                <ArrowDownCircle color={txType === 'expense' ? '#FFFFFF' : '#DC2626'} size={18} />
                <Text style={[s.typeBtnText, txType === 'expense' && s.typeBtnTextActive]}>Gider</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.inputLabel}>Kategori</Text>
            <View style={s.categoryGrid}>
              {(txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => {
                const IconComp = cat.icon;
                const sel = txCategory === cat.key;
                return (
                  <TouchableOpacity key={cat.key} style={[s.categoryChip, sel && { backgroundColor: cat.color + '20', borderColor: cat.color }]} onPress={() => setTxCategory(cat.key)}>
                    <IconComp color={sel ? cat.color : '#6B7280'} size={16} />
                    <Text style={[s.categoryChipText, sel && { color: cat.color }]}>{cat.key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.inputLabel}>Tutar (₺)</Text>
            <TextInput style={s.input} placeholder="0.00" placeholderTextColor="#D1D5DB" keyboardType="numeric" value={txAmount} onChangeText={setTxAmount} />
            <Text style={s.inputLabel}>Açıklama</Text>
            <TextInput style={s.input} placeholder="Opsiyonel..." placeholderTextColor="#D1D5DB" value={txDescription} onChangeText={setTxDescription} />
            <TouchableOpacity style={s.saveBtn} onPress={handleAddTransaction} activeOpacity={0.85}>
              <Text style={s.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BUDGET MODAL */}
      <Modal visible={showBudgetModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingBudgetCat} Limiti</Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}><X color="#6B7280" size={24} /></TouchableOpacity>
            </View>
            <Text style={s.inputLabel}>Aylık Bütçe Limiti (₺)</Text>
            <TextInput style={s.input} placeholder="Örn: 5000" placeholderTextColor="#D1D5DB" keyboardType="numeric" value={budgetInput} onChangeText={setBudgetInput} autoFocus />
            <TouchableOpacity style={s.saveBtn} onPress={saveBudget} activeOpacity={0.85}>
              <Text style={s.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
            {budgets[editingBudgetCat] > 0 && (
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: '#F3F4F6', marginTop: 8 }]} onPress={() => { setBudgets(prev => { const n = { ...prev }; delete n[editingBudgetCat]; return n; }); setShowBudgetModal(false); }}>
                <Text style={[s.saveBtnText, { color: '#6B7280' }]}>Limiti Kaldır</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* CARİ EKSTRE MODAL */}
      <Modal visible={showExtraModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { paddingBottom: insets.bottom + 20, maxHeight: '85%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Cari Hesap Ekstresi</Text>
              <TouchableOpacity onPress={() => { setShowExtraModal(false); setSelectedCustomer(null); }}><X color="#6B7280" size={24} /></TouchableOpacity>
            </View>
            {!selectedCustomer ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {customers.length === 0 ? <Text style={s.emptySubtext}>Henüz müşteri yok</Text> : customers.map(c => (
                  <TouchableOpacity key={c.id} style={s.customerPickRow} onPress={() => setSelectedCustomer(c)}>
                    <View style={s.customerPickAvatar}><Text style={s.customerPickAvatarText}>{c.name.charAt(0).toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.customerPickName}>{c.name}</Text>
                      <Text style={s.customerPickBalance}>Bakiye: {fmt(c.balance || 0)} ₺</Text>
                    </View>
                    <ChevronDown color="#9CA3AF" size={16} style={{ transform: [{ rotate: '-90deg' }] }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={s.backBtn} onPress={() => setSelectedCustomer(null)}>
                  <ChevronDown color="#EA580C" size={16} style={{ transform: [{ rotate: '90deg' }] }} />
                  <Text style={s.backBtnText}>Geri</Text>
                </TouchableOpacity>
                <View style={s.extraSummary}>
                  <View style={s.extraSummaryAvatar}><Text style={s.extraSummaryAvatarText}>{selectedCustomer.name.charAt(0).toUpperCase()}</Text></View>
                  <Text style={s.extraSummaryName}>{selectedCustomer.name}</Text>
                  <View style={s.extraSummaryRow}>
                    <View style={s.extraSumItem}>
                      <Text style={s.extraSumLabel}>Toplam Sipariş</Text>
                      <Text style={s.extraSumValue}>{fmt(orders.filter(o => o.customerId === selectedCustomer.id).reduce((s, o) => s + Number(o.amount), 0))} ₺</Text>
                    </View>
                    <View style={s.extraSumDivider} />
                    <View style={s.extraSumItem}>
                      <Text style={s.extraSumLabel}>Bakiye</Text>
                      <Text style={[s.extraSumValue, { color: (selectedCustomer.balance || 0) > 0 ? '#DC2626' : '#16A34A' }]}>{fmt(selectedCustomer.balance || 0)} ₺</Text>
                    </View>
                  </View>
                </View>
                <Text style={[s.sectionTitle, { paddingHorizontal: 0, marginTop: 10 }]}>Hareketler</Text>
                {customerExtraData.length === 0 ? <Text style={s.emptySubtext}>Hareket bulunamadı</Text> : customerExtraData.map(item => (
                  <View key={item.id} style={s.extraRow}>
                    <View style={[s.extraDot, { backgroundColor: item.type === 'order' ? '#EA580C' : '#16A34A' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.extraRowDesc}>{item.description}</Text>
                      <Text style={s.extraRowDate}>{fmtDate(item.date)}</Text>
                    </View>
                    <Text style={[s.extraRowAmount, { color: item.type === 'order' ? '#DC2626' : '#16A34A' }]}>
                      {item.type === 'order' ? '+' : '-'}{fmt(item.amount)} ₺
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
  container: { paddingBottom: 30 },

  headerGradient: { backgroundColor: '#111827', paddingHorizontal: 24, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  premiumBadgeText: { color: '#F59E0B', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  addButton: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }),
  },

  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 4, marginBottom: 16,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 } }),
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, gap: 3 },
  tabBtnActive: { backgroundColor: '#FFF7ED' },
  tabBtnText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  tabBtnTextActive: { color: '#EA580C' },

  filterRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },

  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  summaryCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 }, android: { elevation: 3 } }),
  },
  summaryIncome: { borderLeftWidth: 3, borderLeftColor: '#16A34A' },
  summaryExpense: { borderLeftWidth: 3, borderLeftColor: '#DC2626' },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginTop: 8 },
  summaryValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginTop: 2 },

  netCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 18, padding: 18, marginBottom: 16,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 }, android: { elevation: 3 } }),
  },
  netLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  netValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },

  extraButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF', marginHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#DDD6FE', gap: 8, marginBottom: 20 },
  extraButtonText: { fontSize: 15, color: '#7C3AED', fontWeight: '700' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', paddingHorizontal: 20, marginBottom: 12, letterSpacing: -0.3 },

  emptyCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 20, padding: 36, alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 }, android: { elevation: 2 } }),
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 14 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },

  txCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 8, borderRadius: 14, padding: 14,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 }, android: { elevation: 2 } }),
  },
  txIconBg: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txContent: { flex: 1, marginLeft: 12 },
  txCategory: { fontSize: 14, fontWeight: '700', color: '#111827' },
  txDesc: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  txDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },

  topCustomerRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 8, borderRadius: 14, padding: 14,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 }, android: { elevation: 2 } }),
  },
  rankBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankText: { fontSize: 14, fontWeight: '800', color: '#EA580C' },
  topCustomerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  topCustomerBalance: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  topCustomerTotal: { fontSize: 16, fontWeight: '800', color: '#111827' },

  // Charts
  chartCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 20, padding: 18, marginBottom: 16,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 }, android: { elevation: 3 } }),
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutLegend: { flex: 1, gap: 8 },
  donutLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  donutLegendLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  donutLegendValue: { fontSize: 11, color: '#6B7280' },
  donutLegendPct: { fontSize: 12, fontWeight: '700', color: '#111827' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', marginHorizontal: 16, borderRadius: 16, paddingVertical: 16, gap: 10, marginBottom: 16,
  },
  exportBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Budget
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF7ED', marginHorizontal: 16, borderRadius: 14, padding: 14, gap: 10, marginBottom: 16, borderWidth: 1, borderColor: '#FED7AA' },
  infoCardText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '500', lineHeight: 18 },
  budgetCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 10,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  budgetCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  budgetIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  budgetCatName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  budgetSpent: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  progressBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  // Analysis
  metricsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  metricCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  metricValue: { fontSize: 16, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  metricLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 4, textAlign: 'center' },
  routeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 20, gap: 10,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  routeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EA580C' },
  routeText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  routeBadge: { backgroundColor: '#FFF7ED', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  routeBadgeText: { fontSize: 13, fontWeight: '700', color: '#EA580C' },
  reminderCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 8, borderRadius: 14, padding: 14,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 }, android: { elevation: 2 } }),
  },
  reminderAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  reminderAvatarText: { fontSize: 16, fontWeight: '800', color: '#DC2626' },
  reminderName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  reminderSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  duePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  duePillText: { fontSize: 11, fontWeight: '700' },
  reminderBadge: { backgroundColor: '#FEF2F2', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  reminderBadgeText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', gap: 6 },
  typeBtnIncomeActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  typeBtnExpenseActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  typeBtnTextActive: { color: '#FFFFFF' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', gap: 6 },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 12 },
  saveBtn: {
    backgroundColor: '#EA580C', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8,
    ...Platform.select({ ios: { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }),
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Ekstre
  customerPickRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  customerPickAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  customerPickAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  customerPickName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  customerPickBalance: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 4 },
  backBtnText: { color: '#EA580C', fontSize: 14, fontWeight: '600' },
  extraSummary: { backgroundColor: '#F9FAFB', borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  extraSummaryAvatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  extraSummaryAvatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  extraSummaryName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 14 },
  extraSummaryRow: { flexDirection: 'row', width: '100%' },
  extraSumItem: { flex: 1, alignItems: 'center' },
  extraSumLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  extraSumValue: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 4 },
  extraSumDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  extraRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: 10 },
  extraDot: { width: 8, height: 8, borderRadius: 4 },
  extraRowDesc: { fontSize: 13, fontWeight: '600', color: '#111827' },
  extraRowDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  extraRowAmount: { fontSize: 14, fontWeight: '700' },
});
