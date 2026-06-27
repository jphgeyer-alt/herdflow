import { useEffect, useMemo, useRef, useState } from 'react';

type Gender = 'Female' | 'Male' | 'Other';
type Status = 'Active' | 'Sold' | 'Quarantined' | 'Veterinary';
type ViewSection = 'dashboard' | 'cattle' | 'camps' | 'vaccines' | 'counts';

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

const statusOptions: Status[] = ['Active', 'Sold', 'Quarantined', 'Veterinary'];
const genderOptions: Gender[] = ['Female', 'Male', 'Other'];
const colors = ['#2563eb', '#16a34a', '#c2410c', '#db2777', '#7c3aed', '#f59e0b', '#0f172a'];

const initialCattleForm = {
  tag: '',
  breed: '',
  colorId: colors[0],
  gender: 'Female' as Gender,
  birthDate: '',
  status: 'Active' as Status,
  weight: 0,
  campId: null as number | null,
  note: ''
};

const initialCampForm = {
  name: '',
  colorId: colors[0],
  description: ''
};

const initialVaccineForm = {
  cattleId: null as number | null,
  vaccineName: '',
  scheduledDate: '',
  givenDate: '' as string | null,
  note: ''
};

const initialCountForm = {
  campId: null as number | null,
  countDate: '',
  bulls: 0,
  cows: 0,
  calves: 0,
  note: ''
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

function App() {
  const [section, setSection] = useState<ViewSection>('dashboard');
  const [cattle, setCattle] = useState<CattleRecord[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [counts, setCounts] = useState<CountLog[]>([]);
  const [cattleForm, setCattleForm] = useState(initialCattleForm);
  const [campForm, setCampForm] = useState(initialCampForm);
  const [vaccineForm, setVaccineForm] = useState(initialVaccineForm);
  const [countForm, setCountForm] = useState(initialCountForm);
  const [viewingCount, setViewingCount] = useState<CountLog | null>(null);
  const nativeDateRef = useRef<HTMLInputElement | null>(null);
  const [editingCattleId, setEditingCattleId] = useState<number | null>(null);
  const [editingCampId, setEditingCampId] = useState<number | null>(null);
  const [editingVaccineId, setEditingVaccineId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncMessage, setSyncMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const summary = useMemo(() => {
    const total = cattle.length;
    const active = cattle.filter((item) => item.status === 'Active').length;
    const sold = cattle.filter((item) => item.status === 'Sold').length;
    const quarantined = cattle.filter((item) => item.status === 'Quarantined').length;
    const veterinary = cattle.filter((item) => item.status === 'Veterinary').length;
    const latestCount = counts[0];
    return {
      total,
      active,
      sold,
      quarantined,
      veterinary,
      latestCount
    };
  }, [cattle, counts]);

  useEffect(() => {
    loadLocalData();
    fetchRemoteData();

    const handleOnline = () => {
      setIsOffline(false);
      fetchRemoteData();
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* ignore registration failures */
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  function loadLocalData() {
    const localCattle = localStorage.getItem('herdflow:cattle');
    const localCamps = localStorage.getItem('herdflow:camps');
    const localVaccines = localStorage.getItem('herdflow:vaccines');
    const localCounts = localStorage.getItem('herdflow:counts');

    if (localCattle) setCattle(JSON.parse(localCattle));
    if (localCamps) setCamps(JSON.parse(localCamps));
    if (localVaccines) setVaccines(JSON.parse(localVaccines));
    if (localCounts) setCounts(JSON.parse(localCounts));
  }

  async function fetchRemoteData() {
    if (!navigator.onLine) {
      setIsOffline(true);
      setSyncMessage('Offline mode: working from saved data.');
      setIsLoading(false);
      return;
    }

    try {
      const [cattleData, campsData, vaccinesData, countsData] = await Promise.all([
        fetch(apiUrl('/api/cattle')).then((res) => res.json()),
        fetch(apiUrl('/api/camps')).then((res) => res.json()),
        fetch(apiUrl('/api/vaccines')).then((res) => res.json()),
        fetch(apiUrl('/api/counts')).then((res) => res.json())
      ]);

      setCattle(cattleData);
      setCamps(campsData);
      setVaccines(vaccinesData);
      setCounts(countsData);
      saveLocal('herdflow:cattle', cattleData);
      saveLocal('herdflow:camps', campsData);
      saveLocal('herdflow:vaccines', vaccinesData);
      saveLocal('herdflow:counts', countsData);
      setIsOffline(false);
      setSyncMessage('Connected: remote data loaded.');
      setIsLoading(false);
    } catch {
      setIsOffline(true);
      setSyncMessage('Unable to reach server. Using offline data.');
      setIsLoading(false);
    }
  }

  function saveLocal(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function buildRecordId() {
    return Date.now();
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getCampColor(campId: number | null) {
    const camp = camps.find((item) => item.id === campId);
    return camp ? camp.colorId : '#94a3b8';
  }

  function getCampName(campId: number | null) {
    return camps.find((item) => item.id === campId)?.name || 'Unassigned';
  }

  function getCattleLabel(cattleId: number) {
    const animal = cattle.find((item) => item.id === cattleId);
    return animal ? `${animal.tag} (${animal.breed})` : 'Unknown animal';
  }

  function handleFieldChange<K extends keyof typeof initialCattleForm>(key: K, value: typeof initialCattleForm[K]) {
    setCattleForm((current) => ({ ...current, [key]: value }));
  }

  function handleCampField<K extends keyof typeof initialCampForm>(key: K, value: typeof initialCampForm[K]) {
    setCampForm((current) => ({ ...current, [key]: value }));
  }

  function handleVaccineField<K extends keyof typeof initialVaccineForm>(key: K, value: typeof initialVaccineForm[K]) {
    setVaccineForm((current) => ({ ...current, [key]: value }));
  }

  function handleCountField<K extends keyof typeof initialCountForm>(key: K, value: typeof initialCountForm[K]) {
    setCountForm((current) => ({ ...current, [key]: value }));
  }

  function openNativeDatePicker() {
    // Try to invoke the platform's native picker when available
    const picker = nativeDateRef.current as any;
    if (picker && typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }

    // Fallback to a simple prompt for unsupported browsers
    const val = window.prompt('Enter date (YYYY-MM-DD)', countForm.countDate || '');
    if (val) handleCountField('countDate', val);
  }

  function resetCattleForm() {
    setCattleForm(initialCattleForm);
    setEditingCattleId(null);
    setError(null);
  }

  function resetCampForm() {
    setCampForm(initialCampForm);
    setEditingCampId(null);
    setError(null);
  }

  function resetVaccineForm() {
    setVaccineForm(initialVaccineForm);
    setEditingVaccineId(null);
    setError(null);
  }

  function resetCountForm() {
    setCountForm(initialCountForm);
    setError(null);
  }

  async function saveCattle(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!cattleForm.tag || !cattleForm.breed || !cattleForm.birthDate || !cattleForm.weight) {
      setError('Tag, breed, birth date, and weight are required.');
      return;
    }

    const localRecord: CattleRecord = {
      id: editingCattleId || buildRecordId(),
      createdAt: new Date().toISOString(),
      ...cattleForm
    };

    const updatedRecords = editingCattleId
      ? cattle.map((item) => (item.id === editingCattleId ? localRecord : item))
      : [localRecord, ...cattle];

    setCattle(updatedRecords);
    saveLocal('herdflow:cattle', updatedRecords);
    resetCattleForm();

    if (!isOffline) {
      try {
        const url = editingCattleId ? apiUrl(`/api/cattle/${editingCattleId}`) : apiUrl('/api/cattle');
        const method = editingCattleId ? 'PUT' : 'POST';
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cattleForm)
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Saved locally. Remote sync failed.');
      }
    }
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
    setSection('cattle');
  }

  async function removeCattle(record: CattleRecord) {
    if (!window.confirm(`Delete ${record.tag} permanently?`)) return;

    const updated = cattle.filter((item) => item.id !== record.id);
    setCattle(updated);
    saveLocal('herdflow:cattle', updated);

    if (!isOffline) {
      try {
        await fetch(apiUrl(`/api/cattle/${record.id}`), { method: 'DELETE' });
        fetchRemoteData();
      } catch {
        setSyncMessage('Removed locally. Remote delete may be pending.');
      }
    }
  }

  async function saveCamp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!campForm.name) {
      setError('Camp name is required.');
      return;
    }

    const localCamp: Camp = {
      id: editingCampId || buildRecordId(),
      createdAt: new Date().toISOString(),
      ...campForm
    };
    const updated = editingCampId ? camps.map((item) => (item.id === editingCampId ? localCamp : item)) : [localCamp, ...camps];
    setCamps(updated);
    saveLocal('herdflow:camps', updated);
    resetCampForm();

    if (!isOffline) {
      const url = editingCampId ? apiUrl(`/api/camps/${editingCampId}`) : apiUrl('/api/camps');
      const method = editingCampId ? 'PUT' : 'POST';
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campForm)
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Camp saved locally. Remote sync failed.');
      }
    }
  }

  function editCamp(camp: Camp) {
    setEditingCampId(camp.id);
    setCampForm({ name: camp.name, colorId: camp.colorId, description: camp.description });
    setSection('camps');
  }

  async function removeCamp(camp: Camp) {
    if (!window.confirm(`Delete camp ${camp.name}?`)) return;

    const updated = camps.filter((item) => item.id !== camp.id);
    setCamps(updated);
    saveLocal('herdflow:camps', updated);

    const reassigned = cattle.map((item) => (item.campId === camp.id ? { ...item, campId: null } : item));
    setCattle(reassigned);
    saveLocal('herdflow:cattle', reassigned);

    if (!isOffline) {
      try {
        await fetch(apiUrl(`/api/camps/${camp.id}`), { method: 'DELETE' });
        fetchRemoteData();
      } catch {
        setSyncMessage('Camp removed locally. Remote delete may be pending.');
      }
    }
  }

  async function saveVaccine(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!vaccineForm.cattleId || !vaccineForm.vaccineName || !vaccineForm.scheduledDate) {
      setError('Cattle, vaccine name, and scheduled date are required.');
      return;
    }

    const localVaccine: VaccineRecord = {
      id: editingVaccineId || buildRecordId(),
      createdAt: new Date().toISOString(),
      ...vaccineForm
    };
    const updated = editingVaccineId ? vaccines.map((item) => (item.id === editingVaccineId ? localVaccine : item)) : [localVaccine, ...vaccines];
    setVaccines(updated);
    saveLocal('herdflow:vaccines', updated);
    resetVaccineForm();

    if (!isOffline) {
      const url = editingVaccineId ? apiUrl(`/api/vaccines/${editingVaccineId}`) : apiUrl('/api/vaccines');
      const method = editingVaccineId ? 'PUT' : 'POST';
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cattleId: vaccineForm.cattleId,
            vaccineName: vaccineForm.vaccineName,
            scheduledDate: vaccineForm.scheduledDate,
            givenDate: vaccineForm.givenDate || null,
            note: vaccineForm.note
          })
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Vaccine schedule saved locally. Remote sync failed.');
      }
    }
  }

  function editVaccine(vaccine: VaccineRecord) {
    setEditingVaccineId(vaccine.id);
    setVaccineForm({
      cattleId: vaccine.cattleId,
      vaccineName: vaccine.vaccineName,
      scheduledDate: vaccine.scheduledDate,
      givenDate: vaccine.givenDate,
      note: vaccine.note
    });
    setSection('vaccines');
  }

  async function removeVaccine(vaccine: VaccineRecord) {
    if (!window.confirm(`Remove vaccine schedule ${vaccine.vaccineName}?`)) return;
    const updated = vaccines.filter((item) => item.id !== vaccine.id);
    setVaccines(updated);
    saveLocal('herdflow:vaccines', updated);

    if (!isOffline) {
      try {
        await fetch(apiUrl(`/api/vaccines/${vaccine.id}`), { method: 'DELETE' });
        fetchRemoteData();
      } catch {
        setSyncMessage('Vaccine removed locally. Remote delete may be pending.');
      }
    }
  }

  async function saveCount(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!countForm.campId || !countForm.countDate) {
      setError('Camp and count date are required.');
      return;
    }

    const localCount: CountLog = {
      id: buildRecordId(),
      createdAt: new Date().toISOString(),
      ...countForm
    };
    const updated = [localCount, ...counts];
    setCounts(updated);
    saveLocal('herdflow:counts', updated);
    resetCountForm();

    if (!isOffline) {
      try {
        await fetch(apiUrl('/api/counts'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localCount)
        });
        fetchRemoteData();
      } catch {
        setSyncMessage('Count recorded locally. Remote sync failed.');
      }
    }
  }

  async function removeCount(log: CountLog) {
    if (!window.confirm(`Delete count record from ${formatDate(log.countDate)}?`)) return;
    const updated = counts.filter((item) => item.id !== log.id);
    setCounts(updated);
    saveLocal('herdflow:counts', updated);

    if (!isOffline) {
      try {
        await fetch(apiUrl(`/api/counts/${log.id}`), { method: 'DELETE' });
        fetchRemoteData();
      } catch {
        setSyncMessage('Count removed locally. Remote delete may be pending.');
      }
    }
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <img src="/src/logo.png" alt="HerdFlow Logo" className="loading-logo" />
          <p className="loading-text">Loading HerdFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header>
        <div>
          <div className="header-with-logo">
            <img src="/src/logo.png" alt="HerdFlow Logo" className="logo" />
            <div>
              <h1>HerdFlow</h1>
              <p>Professional cattle record keeping for camps, vaccines, counts, and offline use.</p>
            </div>
          </div>
        </div>
        <div className="status-pill">
          <span className={isOffline ? 'offline' : 'online'}>{isOffline ? 'Offline' : 'Online'}</span>
        </div>
      </header>

      <section className="nav-grid">
        {(['dashboard', 'cattle', 'camps', 'vaccines', 'counts'] as ViewSection[]).map((item) => (
          <button
            key={item}
            className={section === item ? 'tab active' : 'tab'}
            onClick={() => setSection(item)}
          >
            {item === 'dashboard' ? 'Dashboard' : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </section>

      {syncMessage && <p className="status-message">{syncMessage}</p>}

      {section === 'dashboard' && (
        <>
          <section className="summary-grid">
            <article>
              <h3>Total Cattle</h3>
              <strong>{summary.total}</strong>
            </article>
            <article>
              <h3>Active</h3>
              <strong>{summary.active}</strong>
            </article>
            <article>
              <h3>Sold</h3>
              <strong>{summary.sold}</strong>
            </article>
            <article>
              <h3>Quarantined</h3>
              <strong>{summary.quarantined}</strong>
            </article>
            <article>
              <h3>Veterinary</h3>
              <strong>{summary.veterinary}</strong>
            </article>
          </section>

          <section className="dashboard-grid">
            <div className="panel">
              <h2>Latest Camp Count</h2>
              {summary.latestCount ? (
                <div>
                  <p className="muted">{getCampName(summary.latestCount.campId)} · {formatDate(summary.latestCount.countDate)}</p>
                  <div className="count-detail"><strong>{summary.latestCount.bulls}</strong> Bulls</div>
                  <div className="count-detail"><strong>{summary.latestCount.cows}</strong> Cows</div>
                  <div className="count-detail"><strong>{summary.latestCount.calves}</strong> Calves</div>
                </div>
              ) : (
                <p className="muted">No count records yet.</p>
              )}
            </div>

            <div className="panel">
              <h2>Upcoming Vaccine Schedules</h2>
              {vaccines.filter((v) => !v.givenDate).slice(0, 5).map((vaccine) => (
                <div key={vaccine.id} className="item-row">
                  <div>
                    <strong>{vaccine.vaccineName}</strong>
                    <div className="muted">{getCattleLabel(vaccine.cattleId)}</div>
                  </div>
                  <span>{formatDate(vaccine.scheduledDate)}</span>
                </div>
              ))}
              {!vaccines.some((v) => !v.givenDate) && <p className="muted">No upcoming vaccines scheduled.</p>}
            </div>
          </section>
        </>
      )}

      {section === 'cattle' && (
        <div className="content-grid">
          <form className="record-form" onSubmit={saveCattle}>
            <div className="form-header">
              <h2>{editingCattleId ? 'Edit Animal' : 'Add Animal'}</h2>
              {editingCattleId && <button type="button" className="secondary" onClick={resetCattleForm}>Cancel</button>}
            </div>

            {error && <p className="error-message">{error}</p>}

            <label>
              Tag ID
              <input value={cattleForm.tag} onChange={(event) => handleFieldChange('tag', event.target.value)} placeholder="E.g. 7321-A" />
            </label>

            <label>
              Breed
              <input value={cattleForm.breed} onChange={(event) => handleFieldChange('breed', event.target.value)} placeholder="E.g. Angus" />
            </label>

            <div className="field-row">
              <label>
                Color ID
                <select value={cattleForm.colorId} onChange={(event) => handleFieldChange('colorId', event.target.value)}>
                  {colors.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </label>

              <label>
                Camp
                <select value={cattleForm.campId ?? ''} onChange={(event) => handleFieldChange('campId', event.target.value ? Number(event.target.value) : null)}>
                  <option value="">Unassigned</option>
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-row">
              <label>
                Gender
                <select value={cattleForm.gender} onChange={(event) => handleFieldChange('gender', event.target.value as Gender)}>
                  {genderOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label>
                Birth Date
                <input type="date" value={cattleForm.birthDate} onChange={(event) => handleFieldChange('birthDate', event.target.value)} />
              </label>
            </div>

            <div className="field-row">
              <label>
                Status
                <select value={cattleForm.status} onChange={(event) => handleFieldChange('status', event.target.value as Status)}>
                  {statusOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label>
                Weight (kg)
                <input type="number" min="0" value={cattleForm.weight} onChange={(event) => handleFieldChange('weight', Number(event.target.value))} />
              </label>
            </div>

            <label>
              Notes
              <textarea value={cattleForm.note} onChange={(event) => handleFieldChange('note', event.target.value)} placeholder="Health, breeding and location notes" />
            </label>

            <button type="submit" className="primary">{editingCattleId ? 'Save Animal' : 'Add Animal'}</button>
          </form>

          <section className="table-panel">
            <div className="table-header"><h2>Cattle Records</h2></div>
            <table>
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Breed</th>
                  <th>Camp</th>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cattle.map((record) => (
                  <tr key={record.id}>
                    <td><span className="color-chip" style={{ background: record.colorId }} />{record.tag}</td>
                    <td>{record.breed}</td>
                    <td>{getCampName(record.campId)}</td>
                    <td>{record.status}</td>
                    <td>{record.weight} kg</td>
                    <td className="actions-cell">
                      <button type="button" className="secondary" onClick={() => editCattle(record)}>Edit</button>
                      <button type="button" className="danger" onClick={() => removeCattle(record)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {cattle.length === 0 && (
                  <tr><td colSpan={6} className="empty-state">No cattle records yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {section === 'camps' && (
        <div className="content-grid">
          <form className="record-form" onSubmit={saveCamp}>
            <div className="form-header">
              <h2>{editingCampId ? 'Edit Camp' : 'New Camp'}</h2>
              {editingCampId && <button type="button" className="secondary" onClick={resetCampForm}>Cancel</button>}
            </div>
            {error && <p className="error-message">{error}</p>}

            <label>
              Camp Name
              <input value={campForm.name} onChange={(event) => handleCampField('name', event.target.value)} placeholder="E.g. North Pasture" />
            </label>

            <label>
              Color ID
              <select value={campForm.colorId} onChange={(event) => handleCampField('colorId', event.target.value)}>
                {colors.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </label>

            <label>
              Description
              <textarea value={campForm.description} onChange={(event) => handleCampField('description', event.target.value)} placeholder="Location, fences, notes." />
            </label>

            <button type="submit" className="primary">{editingCampId ? 'Save Camp' : 'Add Camp'}</button>
          </form>

          <section className="table-panel">
            <div className="table-header"><h2>Camp Directory</h2></div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Color</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {camps.map((camp) => (
                  <tr key={camp.id}>
                    <td>{camp.name}</td>
                    <td><span className="color-chip" style={{ background: camp.colorId }} />{camp.colorId}</td>
                    <td>{camp.description || '—'}</td>
                    <td className="actions-cell">
                      <button type="button" className="secondary" onClick={() => editCamp(camp)}>Edit</button>
                      <button type="button" className="danger" onClick={() => removeCamp(camp)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {camps.length === 0 && (
                  <tr><td colSpan={4} className="empty-state">No camps created yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {section === 'vaccines' && (
        <div className="content-grid">
          <form className="record-form" onSubmit={saveVaccine}>
            <div className="form-header">
              <h2>{editingVaccineId ? 'Edit Vaccine' : 'Schedule Vaccine'}</h2>
              {editingVaccineId && <button type="button" className="secondary" onClick={resetVaccineForm}>Cancel</button>}
            </div>
            {error && <p className="error-message">{error}</p>}

            <label>
              Animal
              <select value={vaccineForm.cattleId ?? ''} onChange={(event) => handleVaccineField('cattleId', event.target.value ? Number(event.target.value) : null)}>
                <option value="">Select animal</option>
                {cattle.map((item) => (
                  <option key={item.id} value={item.id}>{item.tag} — {item.breed}</option>
                ))}
              </select>
            </label>

            <label>
              Vaccine
              <input value={vaccineForm.vaccineName} onChange={(event) => handleVaccineField('vaccineName', event.target.value)} placeholder="E.g. BVD, Clostridial" />
            </label>

            <div className="field-row">
              <label>
                Scheduled Date
                <input type="date" value={vaccineForm.scheduledDate} onChange={(event) => handleVaccineField('scheduledDate', event.target.value)} />
              </label>
              <label>
                Completed Date
                <input type="date" value={vaccineForm.givenDate ?? ''} onChange={(event) => handleVaccineField('givenDate', event.target.value || null)} />
              </label>
            </div>

            <label>
              Notes
              <textarea value={vaccineForm.note} onChange={(event) => handleVaccineField('note', event.target.value)} placeholder="Dose, provider, or follow-up." />
            </label>

            <button type="submit" className="primary">{editingVaccineId ? 'Save Vaccine' : 'Add Vaccine'}</button>
          </form>

          <section className="table-panel">
            <div className="table-header"><h2>Vaccine & Health Schedule</h2></div>
            <table>
              <thead>
                <tr>
                  <th>Animal</th>
                  <th>Vaccine</th>
                  <th>Scheduled</th>
                  <th>Given</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((entry) => (
                  <tr key={entry.id}>
                    <td>{getCattleLabel(entry.cattleId)}</td>
                    <td>{entry.vaccineName}</td>
                    <td>{formatDate(entry.scheduledDate)}</td>
                    <td>{entry.givenDate ? formatDate(entry.givenDate) : 'Pending'}</td>
                    <td className="actions-cell">
                      <button type="button" className="secondary" onClick={() => editVaccine(entry)}>Edit</button>
                      <button type="button" className="danger" onClick={() => removeVaccine(entry)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {vaccines.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No vaccine records yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {section === 'counts' && (
        <div className="content-grid">
          <form className="record-form" onSubmit={saveCount}>
            <div className="form-header">
              <h2>Count Camp Inventory</h2>
            </div>
            {error && <p className="error-message">{error}</p>}

            <label>
              Camp
              <select value={countForm.campId ?? ''} onChange={(event) => handleCountField('campId', event.target.value ? Number(event.target.value) : null)}>
                <option value="">Select camp</option>
                {camps.map((camp) => (
                  <option key={camp.id} value={camp.id}>{camp.name}</option>
                ))}
              </select>
            </label>

            <label>
              Count Date
              <div className="date-row">
                <input type="date" value={countForm.countDate} onChange={(event) => handleCountField('countDate', event.target.value)} />
                <button type="button" className="secondary date-btn" onClick={openNativeDatePicker}>Pick</button>
              </div>
              {/* Hidden native picker used to call showPicker() when available */}
              <input ref={nativeDateRef} type="date" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} onChange={(e) => handleCountField('countDate', e.target.value)} />
            </label>

            <div className="field-row">
              <label>
                Bulls
                <input type="number" min="0" value={countForm.bulls} onChange={(event) => handleCountField('bulls', Number(event.target.value))} />
              </label>
              <label>
                Cows
                <input type="number" min="0" value={countForm.cows} onChange={(event) => handleCountField('cows', Number(event.target.value))} />
              </label>
              <label>
                Calves
                <input type="number" min="0" value={countForm.calves} onChange={(event) => handleCountField('calves', Number(event.target.value))} />
              </label>
            </div>

            <label>
              Notes
              <textarea value={countForm.note} onChange={(event) => handleCountField('note', event.target.value)} placeholder="Record keeper name or field notes." />
            </label>

            <button type="submit" className="primary">Save Count</button>
          </form>

          <section className="table-panel">
            <div className="table-header"><h2>Camp Count Records</h2></div>
            <table>
              <thead>
                <tr>
                  <th>Camp</th>
                  <th>Date</th>
                  <th>Bulls</th>
                  <th>Cows</th>
                  <th>Calves</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((log) => (
                  <tr key={log.id}>
                    <td>{getCampName(log.campId)}</td>
                    <td>{formatDate(log.countDate)}</td>
                    <td>{log.bulls}</td>
                    <td>{log.cows}</td>
                    <td>{log.calves}</td>
                    <td className="actions-cell">
                            <button type="button" className="secondary" onClick={() => setViewingCount(log)}>View</button>
                            <button type="button" className="danger" onClick={() => removeCount(log)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {counts.length === 0 && (
                  <tr><td colSpan={6} className="empty-state">No camp counts recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}
      {viewingCount && (
        <div className="modal-backdrop" onClick={() => setViewingCount(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Count Details</h3>
              <button type="button" className="secondary" onClick={() => setViewingCount(null)}>Close</button>
            </div>
            <div className="modal-body">
              <p><strong>Camp:</strong> {getCampName(viewingCount.campId)}</p>
              <p><strong>Date:</strong> {formatDate(viewingCount.countDate)}</p>
              <p><strong>Bulls:</strong> {viewingCount.bulls}</p>
              <p><strong>Cows:</strong> {viewingCount.cows}</p>
              <p><strong>Calves:</strong> {viewingCount.calves}</p>
              <p><strong>Notes:</strong></p>
              <p className="muted">{viewingCount.note || '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
