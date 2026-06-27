import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Section = 'Dashboard' | 'Cattle' | 'Camps' | 'Vaccines' | 'Counts';
type Gender = 'Female' | 'Male' | 'Other';
type Status = 'Active' | 'Sold' | 'Quarantined' | 'Veterinary';

interface CattleRecord {
  id: number;
  tag: string;
  breed: string;
  colorId: string;
  gender: Gender;
  birthDate: string;
  status: Status;
  weight: number;
  campId: number | null;
  note: string;
  createdAt: string;
}

interface Camp {
  id: number;
  name: string;
  colorId: string;
  description: string;
  createdAt: string;
}

interface VaccineRecord {
  id: number;
  cattleId: number;
  vaccineName: string;
  scheduledDate: string;
  givenDate: string | null;
  note: string;
  createdAt: string;
}

interface CountLog {
  id: number;
  campId: number;
  countDate: string;
  bulls: number;
  cows: number;
  calves: number;
  note: string;
  createdAt: string;
}

const API_BASE = 'https://herdflow-h619.onrender.com'; // production Render backend for phone access anywhere
const genders: Gender[] = ['Female', 'Male', 'Other'];
const statuses: Status[] = ['Active', 'Sold', 'Quarantined', 'Veterinary'];
const colors = [
  { label: 'Blue', value: '#2563eb' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Red', value: '#c2410c' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Yellow', value: '#f59e0b' },
  { label: 'Dark', value: '#0f172a' }
];

export default function App() {
  const [section, setSection] = useState<Section>('Dashboard');
  const [cattle, setCattle] = useState<CattleRecord[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [counts, setCounts] = useState<CountLog[]>([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cattleForm, setCattleForm] = useState<Omit<CattleRecord, 'id' | 'createdAt'>>({
    tag: '',
    breed: '',
    colorId: colors[0].value,
    gender: 'Female',
    birthDate: '',
    status: 'Active',
    weight: 0,
    campId: null,
    note: ''
  });
  const [editingCattleId, setEditingCattleId] = useState<number | null>(null);

  const [campForm, setCampForm] = useState<Omit<Camp, 'id' | 'createdAt'>>({
    name: '',
    colorId: colors[0].value,
    description: ''
  });
  const [editingCampId, setEditingCampId] = useState<number | null>(null);

  const [vaccineForm, setVaccineForm] = useState<Omit<VaccineRecord, 'id' | 'createdAt'>>({
    cattleId: 0,
    vaccineName: '',
    scheduledDate: '',
    givenDate: null,
    note: ''
  });
  const resetVaccineForm = () => setVaccineForm({ cattleId: 0, vaccineName: '', scheduledDate: '', givenDate: null, note: '' });
  const [editingVaccineId, setEditingVaccineId] = useState<number | null>(null);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showVaccineDatePicker, setShowVaccineDatePicker] = useState(false);
  const [showGivenDatePicker, setShowGivenDatePicker] = useState(false);
  const handleAddCattle = async(newCow: Omit<CattleRecord, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch(`${API_BASE}/api/cattle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCow)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('Sync error:', body.error || res.statusText);
      }
    } catch (err: any) {
      console.error('Sync error:', err.message || err);
    }
  };

  const [countForm, setCountForm] = useState<Omit<CountLog, 'id' | 'createdAt'>>({
    campId: 0,
    countDate: '',
    bulls: 0,
    cows: 0,
    calves: 0,
    note: ''
  });

  const summary = useMemo(() => {
    const total = cattle.length;
    const active = cattle.filter((item) => item.status === 'Active').length;
    const sold = cattle.filter((item) => item.status === 'Sold').length;
    const quarantined = cattle.filter((item) => item.status === 'Quarantined').length;
    const veterinary = cattle.filter((item) => item.status === 'Veterinary').length;
    return { total, active, sold, quarantined, veterinary };
  }, [cattle]);

  useEffect(() => {
    refreshData();
  }, []);

  async function refreshData() {
    setSectionLoading(true);
    setError(null);
    try {
      const [cattleRes, campsRes, vaccineRes, countRes] = await Promise.all([
        fetch(`${API_BASE}/api/cattle`),
        fetch(`${API_BASE}/api/camps`),
        fetch(`${API_BASE}/api/vaccines`),
        fetch(`${API_BASE}/api/counts`)
      ]);
      if (!cattleRes.ok || !campsRes.ok || !vaccineRes.ok || !countRes.ok) {
        throw new Error('Unable to fetch from server.');
      }
      setCattle(await cattleRes.json());
      setCamps(await campsRes.json());
      setVaccines(await vaccineRes.json());
      setCounts(await countRes.json());
    } catch (err: any) {
      setError(err.message || 'Unable to load data.');
    } finally {
      setSectionLoading(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  function setBirthDate(date: Date) {
    setCattleForm((prev) => ({ ...prev, birthDate: date.toISOString().split('T')[0] }));
  }

  function setScheduledDate(date: Date) {
    setVaccineForm((prev) => ({ ...prev, scheduledDate: date.toISOString().split('T')[0] }));
  }

  function setGivenDate(date: Date) {
    setVaccineForm((prev) => ({ ...prev, givenDate: date.toISOString().split('T')[0] }));
  }

  function handleBirthDateChange(event: any, selectedDate?: Date) {
    setShowBirthDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  }

  function handleScheduledDateChange(event: any, selectedDate?: Date) {
    setShowVaccineDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  }

  function handleGivenDateChange(event: any, selectedDate?: Date) {
    setShowGivenDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setGivenDate(selectedDate);
    }
  }

  function getCampName(campId: number | null) {
    return campId ? camps.find((camp) => camp.id === campId)?.name || 'Unassigned' : 'Unassigned';
  }

  function getCattleName(cattleId: number) {
    const animal = cattle.find((item) => item.id === cattleId);
    return animal ? `${animal.tag} (${animal.breed})` : 'Unknown';
  }

  async function saveCattle() {
    setError(null);
    if (!cattleForm.tag || !cattleForm.breed || !cattleForm.birthDate || cattleForm.weight <= 0) {
      setError('Tag, breed, birth date, and weight are required.');
      return;
    }
    try {
      const url = editingCattleId ? `${API_BASE}/api/cattle/${editingCattleId}` : `${API_BASE}/api/cattle`;
      const method = editingCattleId ? 'PUT' : 'POST';
      const result = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cattleForm)
      });
      if (!result.ok) {
        const body = await result.json();
        throw new Error(body.error || 'Unable to save cattle.');
      }
      resetCattleForm();
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to save cattle.');
    }
  }

  async function deleteCattle(record: CattleRecord) {
    Alert.alert('Delete Animal', `Delete ${record.tag}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/cattle/${record.id}`, { method: 'DELETE' });
            refreshData();
          } catch {
            setError('Failed to delete animal.');
          }
        }
      }
    ]);
  }

  function editCattle(record: CattleRecord) {
    setEditingCattleId(record.id);
    setCattleForm({
      tag: record.tag,
      breed: record.breed,
      colorId: record.colorId,
      gender: record.gender,
      birthDate: record.birthDate,
      status: record.status,
      weight: record.weight,
      campId: record.campId,
      note: record.note
    });
    setSection('Cattle');
  }

  function resetCattleForm() {
    setEditingCattleId(null);
    setCattleForm({
      tag: '',
      breed: '',
      colorId: colors[0].value,
      gender: 'Female',
      birthDate: '',
      status: 'Active',
      weight: 0,
      campId: null,
      note: ''
    });
  }

  async function saveCamp() {
    if (!campForm.name) {
      setError('Camp name is required.');
      return;
    }
    try {
      const url = editingCampId ? `${API_BASE}/api/camps/${editingCampId}` : `${API_BASE}/api/camps`;
      const method = editingCampId ? 'PUT' : 'POST';
      const result = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campForm)
      });
      if (!result.ok) {
        const body = await result.json();
        throw new Error(body.error || 'Unable to save camp.');
      }
      resetCampForm();
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to save camp.');
    }
  }

  async function deleteCamp(camp: Camp) {
    Alert.alert('Delete Camp', `Delete ${camp.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/camps/${camp.id}`, { method: 'DELETE' });
            refreshData();
          } catch {
            setError('Failed to delete camp.');
          }
        }
      }
    ]);
  }

  function editCamp(camp: Camp) {
    setEditingCampId(camp.id);
    setCampForm({
      name: camp.name,
      colorId: camp.colorId,
      description: camp.description
    });
    setSection('Camps');
  }

  function resetCampForm() {
    setEditingCampId(null);
    setCampForm({ name: '', colorId: colors[0].value, description: '' });
  }

  async function saveVaccine() {
    if (!vaccineForm.cattleId || !vaccineForm.vaccineName || !vaccineForm.scheduledDate) {
      setError('Animal, vaccine, and scheduled date are required.');
      return;
    }
    try {
      const url = editingVaccineId ? `${API_BASE}/api/vaccines/${editingVaccineId}` : `${API_BASE}/api/vaccines`;
      const method = editingVaccineId ? 'PUT' : 'POST';
      const result = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vaccineForm)
      });
      if (!result.ok) {
        const body = await result.json();
        throw new Error(body.error || 'Unable to save vaccine.');
      }
      resetVaccineForm();
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to save vaccine.');
    }
  }

  async function deleteVaccine(vaccine: VaccineRecord) {
    Alert.alert('Delete Vaccine', `Delete ${vaccine.vaccineName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/vaccines/${vaccine.id}`, { method: 'DELETE' });
            refreshData();
          } catch {
            setError('Failed to delete vaccine.');
          }
        }
      }
    ]);
  }

  async function saveCount() {
    if (!countForm.campId || !countForm.countDate) {
      setError('Camp and count date are required.');
      return;
    }
    try {
      const result = await fetch(`${API_BASE}/api/counts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countForm)
      });
      if (!result.ok) {
        const body = await result.json();
        throw new Error(body.error || 'Unable to save count.');
      }
      setCountForm({ campId: 0, countDate: '', bulls: 0, cows: 0, calves: 0, note: '' });
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to save count.');
    }
  }

  async function deleteCount(count: CountLog) {
    Alert.alert('Delete Count', `Delete count from ${formatDate(count.countDate)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/counts/${count.id}`, { method: 'DELETE' });
            refreshData();
          } catch {
            setError('Failed to delete count.');
          }
        }
      }
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.title}>HerdFlow</Text>
            <Text style={styles.subtitle}>The Future of Livestock Management</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {(['Dashboard', 'Cattle', 'Camps', 'Vaccines', 'Counts'] as Section[]).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.tabButton, section === item && styles.tabButtonActive]}
            onPress={() => setSection(item)}
          >
            <Text style={[styles.tabText, section === item && styles.tabTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sectionLoading && <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />}

        {section === 'Dashboard' && (
          <>
            <View style={styles.summaryGrid}>
              {[
                { label: 'Total', value: summary.total },
                { label: 'Active', value: summary.active },
                { label: 'Sold', value: summary.sold },
                { label: 'Quarantine', value: summary.quarantined },
                { label: 'Veterinary', value: summary.veterinary }
              ].map((item) => (
                <View key={item.label} style={styles.card}>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardValue}>{item.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Upcoming Vaccines</Text>
              {(vaccines.filter((item) => !item.givenDate).slice(0, 4)).map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listTitle}>{item.vaccineName}</Text>
                    <Text style={styles.listSubtitle}>{getCattleName(item.cattleId)}</Text>
                  </View>
                  <Text style={styles.listMeta}>{formatDate(item.scheduledDate)}</Text>
                </View>
              ))}
              {!vaccines.some((item) => !item.givenDate) && <Text style={styles.muted}>No upcoming vaccines.</Text>}
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Latest Camp Counts</Text>
              {(counts.slice(0, 2)).map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listTitle}>{getCampName(item.campId)}</Text>
                    <Text style={styles.listSubtitle}>{formatDate(item.countDate)}</Text>
                  </View>
                  <View style={styles.countsRow}>
                    <Text style={styles.countBadge}>B {item.bulls}</Text>
                    <Text style={styles.countBadge}>C {item.cows}</Text>
                    <Text style={styles.countBadge}>K {item.calves}</Text>
                  </View>
                </View>
              ))}
              {counts.length === 0 && <Text style={styles.muted}>No counts recorded yet.</Text>}
            </View>
          </>
        )}

        {section === 'Cattle' && (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{editingCattleId ? 'Edit Animal' : 'Add Animal'}</Text>
              <View style={styles.formRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Tag ID"
                  value={cattleForm.tag}
                  onChangeText={(value) => setCattleForm((prev) => ({ ...prev, tag: value }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Breed"
                  value={cattleForm.breed}
                  onChangeText={(value) => setCattleForm((prev) => ({ ...prev, breed: value }))}
                />
              </View>
              <Text style={styles.sectionLabel}>Color</Text>
              <View style={[styles.optionRow, styles.colorRow]}>
                {colors.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.colorButton,
                      cattleForm.colorId === option.value && styles.colorButtonActive
                    ]}
                    onPress={() => setCattleForm((prev) => ({ ...prev, colorId: option.value }))}
                  >
                    <View style={[styles.colorDot, { backgroundColor: option.value }]} />
                    <Text style={[styles.optionText, cattleForm.colorId === option.value && styles.optionTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.formRow}>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowBirthDatePicker(true)}>
                  <Text style={styles.dateInputText}>{cattleForm.birthDate ? formatDate(cattleForm.birthDate) : 'Select birth date'}</Text>
                </TouchableOpacity>
              </View>
              {showBirthDatePicker && (
                <DateTimePicker
                  value={cattleForm.birthDate ? new Date(cattleForm.birthDate) : new Date()}
                  mode="date"
                  display="calendar"
                  onChange={handleBirthDateChange}
                  maximumDate={new Date()}
                />
              )}
              <View style={styles.optionRow}>
                {genders.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, cattleForm.gender === option && styles.optionButtonActive]}
                    onPress={() => setCattleForm((prev) => ({ ...prev, gender: option }))}
                  >
                    <Text style={[styles.optionText, cattleForm.gender === option && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.optionRow}>
                {statuses.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, cattleForm.status === option && styles.optionButtonActive]}
                    onPress={() => setCattleForm((prev) => ({ ...prev, status: option }))}
                  >
                    <Text style={[styles.optionText, cattleForm.status === option && styles.optionTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.formRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Weight (kg)"
                  keyboardType="numeric"
                  value={cattleForm.weight ? String(cattleForm.weight) : ''}
                  onChangeText={(value) => setCattleForm((prev) => ({ ...prev, weight: Number(value) }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Camp ID"
                  keyboardType="numeric"
                  value={cattleForm.campId ? String(cattleForm.campId) : ''}
                  onChangeText={(value) => setCattleForm((prev) => ({ ...prev, campId: value ? Number(value) : null }))}
                />
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes"
                value={cattleForm.note}
                onChangeText={(value) => setCattleForm((prev) => ({ ...prev, note: value }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryButton} onPress={saveCattle}>
                <Text style={styles.primaryButtonText}>{editingCattleId ? 'Save Animal' : 'Add Animal'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetCattleForm}>
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Herd Records</Text>
              {cattle.map((record) => (
                <View key={record.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listTitle}>{record.tag} — {record.breed}</Text>
                    <Text style={styles.listSubtitle}>{getCampName(record.campId)} · {record.status}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => editCattle(record)}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deleteCattle(record)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {cattle.length === 0 && <Text style={styles.muted}>No cattle records found.</Text>}
            </View>
          </>
        )}

        {section === 'Camps' && (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{editingCampId ? 'Edit Camp' : 'Add Camp'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Camp name"
                value={campForm.name}
                onChangeText={(value) => setCampForm((prev) => ({ ...prev, name: value }))}
              />
              <Text style={styles.sectionLabel}>Color</Text>
              <View style={[styles.optionRow, styles.colorRow]}>
                {colors.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.colorButton,
                      campForm.colorId === option.value && styles.colorButtonActive
                    ]}
                    onPress={() => setCampForm((prev) => ({ ...prev, colorId: option.value }))}
                  >
                    <View style={[styles.colorDot, { backgroundColor: option.value }]} />
                    <Text style={[styles.optionText, campForm.colorId === option.value && styles.optionTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={campForm.description}
                onChangeText={(value) => setCampForm((prev) => ({ ...prev, description: value }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryButton} onPress={saveCamp}>
                <Text style={styles.primaryButtonText}>{editingCampId ? 'Save Camp' : 'Add Camp'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetCampForm}>
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Camp List</Text>
              {camps.map((camp) => (
                <View key={camp.id} style={styles.listItem}> 
                  <View>
                    <Text style={styles.listTitle}>{camp.name}</Text>
                    <Text style={styles.listSubtitle}>{camp.description || 'No description'}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => editCamp(camp)}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deleteCamp(camp)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {camps.length === 0 && <Text style={styles.muted}>No camps created yet.</Text>}
            </View>
          </>
        )}

        {section === 'Vaccines' && (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{editingVaccineId ? 'Edit Vaccine' : 'Schedule Vaccine'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Cattle ID"
                keyboardType="numeric"
                value={vaccineForm.cattleId ? String(vaccineForm.cattleId) : ''}
                onChangeText={(value) => setVaccineForm((prev) => ({ ...prev, cattleId: Number(value) }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Vaccine name"
                value={vaccineForm.vaccineName}
                onChangeText={(value) => setVaccineForm((prev) => ({ ...prev, vaccineName: value }))}
              />
              <TouchableOpacity style={styles.dateInput} onPress={() => setShowVaccineDatePicker(true)}>
                <Text style={styles.dateInputText}>{vaccineForm.scheduledDate ? formatDate(vaccineForm.scheduledDate) : 'Select scheduled date'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateInput, styles.marginTop8]} onPress={() => setShowGivenDatePicker(true)}>
                <Text style={styles.dateInputText}>{vaccineForm.givenDate ? formatDate(vaccineForm.givenDate) : 'Select given date'}</Text>
              </TouchableOpacity>
              {showVaccineDatePicker && (
                <DateTimePicker
                  value={vaccineForm.scheduledDate ? new Date(vaccineForm.scheduledDate) : new Date()}
                  mode="date"
                  display="calendar"
                  onChange={handleScheduledDateChange}
                />
              )}
              {showGivenDatePicker && (
                <DateTimePicker
                  value={vaccineForm.givenDate ? new Date(vaccineForm.givenDate) : new Date()}
                  mode="date"
                  display="calendar"
                  onChange={handleGivenDateChange}
                />
              )}
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes"
                value={vaccineForm.note}
                onChangeText={(value) => setVaccineForm((prev) => ({ ...prev, note: value }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryButton} onPress={saveVaccine}>
                <Text style={styles.primaryButtonText}>{editingVaccineId ? 'Save Vaccine' : 'Add Vaccine'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Vaccine Schedule</Text>
              {vaccines.map((entry) => (
                <View key={entry.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listTitle}>{entry.vaccineName}</Text>
                    <Text style={styles.listSubtitle}>{getCattleName(entry.cattleId)} · {formatDate(entry.scheduledDate)}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => {
                      setEditingVaccineId(entry.id);
                      setVaccineForm({
                        cattleId: entry.cattleId,
                        vaccineName: entry.vaccineName,
                        scheduledDate: entry.scheduledDate,
                        givenDate: entry.givenDate,
                        note: entry.note
                      });
                    }}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => deleteVaccine(entry)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {vaccines.length === 0 && <Text style={styles.muted}>No vaccine records yet.</Text>}
            </View>
          </>
        )}

        {section === 'Counts' && (
          <>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Record Camp Count</Text>
              <TextInput
                style={styles.input}
                placeholder="Camp ID"
                keyboardType="numeric"
                value={countForm.campId ? String(countForm.campId) : ''}
                onChangeText={(value) => setCountForm((prev) => ({ ...prev, campId: Number(value) }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Count date (YYYY-MM-DD)"
                value={countForm.countDate}
                onChangeText={(value) => setCountForm((prev) => ({ ...prev, countDate: value }))}
              />
              <View style={styles.formRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Bulls"
                  keyboardType="numeric"
                  value={countForm.bulls ? String(countForm.bulls) : ''}
                  onChangeText={(value) => setCountForm((prev) => ({ ...prev, bulls: Number(value) }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Cows"
                  keyboardType="numeric"
                  value={countForm.cows ? String(countForm.cows) : ''}
                  onChangeText={(value) => setCountForm((prev) => ({ ...prev, cows: Number(value) }))}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Calves"
                keyboardType="numeric"
                value={countForm.calves ? String(countForm.calves) : ''}
                onChangeText={(value) => setCountForm((prev) => ({ ...prev, calves: Number(value) }))}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes"
                value={countForm.note}
                onChangeText={(value) => setCountForm((prev) => ({ ...prev, note: value }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryButton} onPress={saveCount}>
                <Text style={styles.primaryButtonText}>Save Count</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Recent Counts</Text>
              {counts.map((log) => (
                <View key={log.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.listTitle}>{getCampName(log.campId)}</Text>
                    <Text style={styles.listSubtitle}>{formatDate(log.countDate)}</Text>
                  </View>
                  <View style={styles.countsRow}>
                    <Text style={styles.countBadge}>B {log.bulls}</Text>
                    <Text style={styles.countBadge}>C {log.cows}</Text>
                    <Text style={styles.countBadge}>K {log.calves}</Text>
                  </View>
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton, styles.deleteSmall]} onPress={() => deleteCount(log)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {counts.length === 0 && <Text style={styles.muted}>No count records yet.</Text>}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitle: {
    marginTop: 6,
    color: '#475569',
    fontSize: 14,
    maxWidth: 260
  },
  subtitleSecondary: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
    maxWidth: 260
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#334155',
    fontWeight: '700'
  },
  colorRow: {
    flexWrap: 'wrap'
  },
  colorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    marginRight: 10,
    marginBottom: 10
  },
  colorButtonActive: {
    backgroundColor: '#334155',
    borderColor: '#334155'
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8
  },
  dateInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minWidth: '48%',
    justifyContent: 'center'
  },
  dateInputText: {
    color: '#0f172a'
  },
  marginTop8: {
    marginTop: 12
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerText: {
    flex: 1,
    marginLeft: 12
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff'
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#334155',
    borderRadius: 12
  },
  refreshText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  tabRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: 12
  },
  tabButton: {
    marginRight: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  tabButtonActive: {
    backgroundColor: '#334155',
    borderColor: '#334155'
  },
  tabText: {
    color: '#0f172a',
    fontWeight: '700'
  },
  tabTextActive: {
    color: '#ffffff'
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  sectionBlock: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '48%',
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardLabel: {
    color: '#475569',
    marginBottom: 8
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a'
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    color: '#0f172a',
    flex: 1,
    minWidth: '48%'
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top'
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    backgroundColor: '#ffffff'
  },
  optionButtonActive: {
    backgroundColor: '#334155',
    borderColor: '#334155'
  },
  optionText: {
    color: '#0f172a'
  },
  optionTextActive: {
    color: '#ffffff'
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700'
  },
  listItem: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  listTitle: {
    fontWeight: '700',
    color: '#0f172a'
  },
  listSubtitle: {
    color: '#64748b',
    marginTop: 4
  },
  listMeta: {
    color: '#334155',
    fontWeight: '700'
  },
  countsRow: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap'
  },
  countBadge: {
    marginRight: 8,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    color: '#0f172a',
    fontWeight: '700'
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#334155',
    borderRadius: 14,
    marginRight: 10
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  deleteButton: {
    backgroundColor: '#ef4444'
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  deleteSmall: {
    marginTop: 8
  },
  loader: {
    marginVertical: 24
  },
  error: {
    color: '#b91c1c',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '700'
  },
  muted: {
    color: '#64748b'
  }
});
