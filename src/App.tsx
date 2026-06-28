import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Search, Download, Upload, Trash2, Copy, Edit3, 
  Save, ArrowLeft, Check, AlertCircle, X, ChevronRight, Sparkles, 
  Users, HeartPulse, ShieldAlert, FileSpreadsheet, HelpCircle, 
  Info, Calendar, School, UserPlus, Eye
} from 'lucide-react';
import { 
  StudentRecord, INITIAL_RECORD, CSP_CODES, BrotherSisterType, 
  PersonneAutoriseeType, ContactPrevenirType 
} from './types';
import { exportToCSV, importFromCSV } from './csvUtils';
import { PrintPreview } from './components/PrintPreview';
import { generateStudentPDF } from './utils/pdfGenerator';

export default function App() {
  // STATE
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'editor'>('dashboard');
  const [currentRecord, setCurrentRecord] = useState<StudentRecord | null>(null);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  // CSV Import feedback
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Editor State
  const [editorTab, setEditorTab] = useState<'eleve' | 'famille' | 'medical' | 'autorisations' | 'personnes' | 'urgence'>('eleve');
  const [includeCSP, setIncludeCSP] = useState(true);
  const [pdfRecord, setPdfRecord] = useState<StudentRecord | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // School preferences (configured on dashboard)
  const [schoolName, setSchoolName] = useState('ÉCOLE PRIMAIRE DE FONTENAY LE PESNEL');
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('school_records');
    const savedSchool = localStorage.getItem('school_name');
    const savedYear = localStorage.getItem('school_year');
    
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    if (savedSchool) setSchoolName(savedSchool);
    if (savedYear) setSchoolYear(savedYear);
  }, []);

  // Save to localStorage when records change
  const saveRecordsToStorage = (newRecords: StudentRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('school_records', JSON.stringify(newRecords));
  };

  // Actions
  const handleCreateNew = () => {
    const newRec = INITIAL_RECORD(schoolName, schoolYear);
    newRec.id = crypto.randomUUID();
    const now = new Date().toISOString();
    newRec.createdAt = now;
    newRec.updatedAt = now;
    setCurrentRecord(newRec);
    setEditorTab('eleve');
    setActiveView('editor');
  };

  const handleEditRecord = (record: StudentRecord) => {
    setCurrentRecord({ ...record });
    setEditorTab('eleve');
    setActiveView('editor');
  };

  const handleDuplicateRecord = (record: StudentRecord) => {
    const duplicated: StudentRecord = JSON.parse(JSON.stringify(record));
    duplicated.id = crypto.randomUUID();
    const now = new Date().toISOString();
    duplicated.createdAt = now;
    duplicated.updatedAt = now;
    duplicated.eleve.nom = `${duplicated.eleve.nom} (Copie)`;
    
    // Add to state and select
    const updated = [duplicated, ...records];
    saveRecordsToStorage(updated);
    
    setCurrentRecord(duplicated);
    setEditorTab('eleve');
    setActiveView('editor');
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche ? Cette action est irréversible.')) {
      const updated = records.filter(r => r.id !== id);
      saveRecordsToStorage(updated);
    }
  };

  // CSV Import / Export
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('Aucune fiche à exporter.');
      return;
    }
    const csvContent = exportToCSV(records);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // Include BOM for French Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fiches_scolaires_${schoolYear.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importFromCSV(text);
        if (imported.length === 0) {
          setImportStatus({ success: false, message: 'Aucune donnée valide trouvée dans le fichier CSV.' });
          return;
        }

        // Merge imported records with existing ones (matching by ID, overriding, or adding new)
        const recordMap = new Map<string, StudentRecord>(records.map(r => [r.id, r]));
        imported.forEach(imp => {
          recordMap.set(imp.id, imp);
        });

        const merged: StudentRecord[] = Array.from(recordMap.values());
        saveRecordsToStorage(merged);
        setImportStatus({ success: true, message: `${imported.length} fiche(s) importée(s) et synchronisée(s) avec succès !` });
        
        // Auto-dismiss status after 5 seconds
        setTimeout(() => setImportStatus(null), 5000);
      } catch (err) {
        setImportStatus({ success: false, message: 'Erreur lors de la lecture du fichier CSV. Vérifiez le format.' });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  // Save Settings
  const handleSaveSettings = () => {
    localStorage.setItem('school_name', schoolName);
    localStorage.setItem('school_year', schoolYear);
    setIsEditingSettings(false);
  };

  // Editor Actions
  const updateCurrentRecordField = (section: string, field: string, value: any) => {
    if (!currentRecord) return;
    
    const updated = { ...currentRecord };
    if (section === 'root') {
      (updated as any)[field] = value;
    } else {
      (updated as any)[section] = {
        ...(updated as any)[section],
        [field]: value
      };
    }
    setCurrentRecord(updated);
  };

  const handleSaveForm = () => {
    if (!currentRecord) return;
    
    const now = new Date().toISOString();
    const updatedRecord = {
      ...currentRecord,
      updatedAt: now,
      eleve: {
        ...currentRecord.eleve,
        nom: currentRecord.eleve.nom.toUpperCase() // Nom de famille toujours en majuscules
      }
    };

    const index = records.findIndex(r => r.id === updatedRecord.id);
    let updatedRecords = [...records];
    if (index > -1) {
      updatedRecords[index] = updatedRecord;
    } else {
      updatedRecords = [updatedRecord, ...updatedRecords];
    }

    saveRecordsToStorage(updatedRecords);
    setCurrentRecord(updatedRecord);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Smart Autofill Fiche Urgence
  const handleSmartAutofillUrgence = () => {
    if (!currentRecord) return;
    
    const updated = { ...currentRecord };
    
    // Autofill Fiche Urgence Contacts Prevenir from Personnes Autorisées if empty
    if (updated.ficheUrgence.contactsPrevenir.length === 0 && updated.personnesAutorisees.length > 0) {
      updated.ficheUrgence.contactsPrevenir = updated.personnesAutorisees.slice(0, 2).map(pa => ({
        id: crypto.randomUUID(),
        nomPrenom: pa.nomPrenom,
        lien: pa.lienParente,
        telephone: pa.telephone
      }));
    }

    // Autofill allergies precision from medical section if empty
    if (!updated.ficheUrgence.allergiesPrecision && updated.medical.allergies) {
      updated.ficheUrgence.allergiesPrecision = updated.medical.allergies;
      if (updated.medical.allergies.toLowerCase().includes('alimentaire')) {
        updated.ficheUrgence.allergiesAlimentaires = true;
      }
      if (updated.medical.allergies.toLowerCase().includes('médicament') || updated.medical.allergies.toLowerCase().includes('medicament')) {
        updated.ficheUrgence.allergiesMedicamenteuses = true;
      }
    }

    // Autofill other health issues
    if (!updated.ficheUrgence.autreSante && updated.medical.problemesSante) {
      updated.ficheUrgence.autreSante = updated.medical.problemesSante;
      if (updated.medical.problemesSante.toLowerCase().includes('asthme')) {
        updated.ficheUrgence.asthme = true;
      }
      if (updated.medical.problemesSante.toLowerCase().includes('diabète') || updated.medical.problemesSante.toLowerCase().includes('diabete')) {
        updated.ficheUrgence.diabete = true;
      }
    }

    // Autofill treatment status from PAI
    if (updated.ficheUrgence.traitementRegulier === null && updated.medical.paiEnCours !== null) {
      updated.ficheUrgence.traitementRegulier = updated.medical.paiEnCours;
    }

    // Autofill signature date if empty
    if (!updated.ficheUrgence.signatureDate) {
      updated.ficheUrgence.signatureDate = new Date().toISOString().split('T')[0];
    }

    setCurrentRecord(updated);
    alert('Fiche d\'urgence pré-remplie automatiquement avec les données déjà saisies ! Veuillez la vérifier.');
  };

  // Trigger PDF Generation
  const handleDownloadPDF = async (recordToPrint: StudentRecord, forceIncludeCSP = false) => {
    setIsGeneratingPDF(true);
    setPdfRecord(recordToPrint);
    
    // Give React time to render the off-screen PrintPreview before capturing
    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      const studentName = (recordToPrint.eleve.nom || recordToPrint.eleve.prenoms)
        ? `${recordToPrint.eleve.nom} ${recordToPrint.eleve.prenoms}`
        : 'Vierge';
      await generateStudentPDF(studentName, forceIncludeCSP || includeCSP);
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors de la génération du PDF.');
    } finally {
      setPdfRecord(null);
      setIsGeneratingPDF(false);
    }
  };

  // Download blank form (5 pages)
  const handleDownloadBlankForm = async () => {
    const blankRecord = INITIAL_RECORD(schoolName, schoolYear);
    blankRecord.eleve.paysNaissance = '';
    blankRecord.eleve.nationalite = '';
    
    await handleDownloadPDF(blankRecord, true);
  };

  // FILTERED RECORDS
  const filteredRecords = records.filter(r => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      r.eleve.nom.toLowerCase().includes(s) || 
      r.eleve.prenoms.toLowerCase().includes(s) || 
      r.eleve.classe.toLowerCase().includes(s) ||
      r.famille.parent1.nom.toLowerCase().includes(s) ||
      r.famille.parent1.prenom.toLowerCase().includes(s) ||
      r.famille.parent2.nom.toLowerCase().includes(s) ||
      r.famille.parent2.prenom.toLowerCase().includes(s);
      
    const matchesClass = classFilter === '' || r.eleve.classe === classFilter;
    
    return matchesSearch && matchesClass;
  });

  // Get unique classes for filter dropdown
  const uniqueClasses = Array.from(new Set(records.map(r => r.eleve.classe).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased flex flex-col">
      {/* Top Banner / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-100">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Portail Scolaire</h1>
              <p className="text-xs text-slate-500 font-medium">Fiches d'Inscription & Fiches d'Urgence</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick settings summary */}
            {!isEditingSettings ? (
              <div className="hidden md:flex items-center gap-3.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5"><School className="w-3.5 h-3.5 text-blue-500" /> <span className="text-slate-900 font-semibold">{schoolName}</span></div>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500" /> Année : <span className="text-slate-900 font-semibold">{schoolYear}</span></div>
                <button 
                  onClick={() => setIsEditingSettings(true)}
                  className="text-blue-600 hover:text-blue-800 font-semibold border-l border-slate-200 pl-3 ml-1"
                >
                  Modifier
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs">
                <input 
                  type="text" 
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Nom de l'école"
                  className="border border-slate-300 px-2 py-1 rounded bg-white text-xs w-48 font-medium focus:outline-blue-500"
                />
                <input 
                  type="text" 
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  placeholder="Année scolaire"
                  className="border border-slate-300 px-2 py-1 rounded bg-white text-xs w-24 font-medium focus:outline-blue-500"
                />
                <button 
                  onClick={handleSaveSettings}
                  className="bg-blue-600 text-white px-2.5 py-1 rounded font-semibold hover:bg-blue-700 transition"
                >
                  OK
                </button>
                <button 
                  onClick={() => setIsEditingSettings(false)}
                  className="text-slate-500 hover:text-slate-700 px-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeView === 'editor' && (
              <button
                onClick={() => {
                  if (window.confirm('Voulez-vous enregistrer vos modifications avant de quitter ?')) {
                    handleSaveForm();
                  }
                  setActiveView('dashboard');
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition px-3 py-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* IMPORT STATUS ALERT */}
        {importStatus && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 shadow-sm transition-all duration-300 ${importStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className={`p-1.5 rounded-lg ${importStatus.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {importStatus.success ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">{importStatus.success ? 'Importation réussie' : 'Erreur d\'importation'}</h4>
              <p className="text-xs mt-0.5 opacity-90">{importStatus.message}</p>
            </div>
            <button onClick={() => setImportStatus(null)} className="opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VIEW 1: DASHBOARD */}
        {activeView === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header / Intro section */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <span className="bg-blue-500/30 text-blue-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-blue-400/20">Espace Administratif</span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-3">Gestion des Fiches de Renseignement & Urgences</h2>
                <p className="text-sm text-blue-100 mt-2 leading-relaxed">
                  Remplissez facilement les dossiers d'inscription scolaires de vos enfants, sauvegardez les données localement ou exportez-les pour les intégrer directement dans Google Sheets.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-50 hover:scale-[1.02] transition active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle Saisie Élève
                  </button>
                  <button
                    onClick={handleDownloadBlankForm}
                    disabled={isGeneratingPDF}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 disabled:bg-slate-300 hover:scale-[1.02] transition active:scale-[0.98]"
                  >
                    {isGeneratingPDF && pdfRecord?.eleve.nom === '' && pdfRecord?.eleve.prenoms === '' ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Génération...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Télécharger Fiche Vierge (5 pages)
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-blue-500/30 border border-blue-400/30 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-500/50 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Exporter tout en CSV (Google Sheets)
                  </button>
                  <button
                    onClick={handleImportCSVClick}
                    className="flex items-center gap-2 bg-slate-800/20 border border-white/15 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800/40 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Importer CSV
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".csv" 
                    className="hidden" 
                  />
                </div>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 hidden lg:block bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000')] "></div>
            </div>

            {/* Quick Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Élèves</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">{records.length}</div>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Classes Saisies</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">{uniqueClasses.length}</div>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Établissement</span>
                <div className="text-sm font-bold text-slate-900 truncate mt-2">{schoolName}</div>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Année Scolaire</span>
                <div className="text-lg font-bold text-slate-900 mt-1.5">{schoolYear}</div>
              </div>
            </div>

            {/* Records management card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">Liste des élèves enregistrés</h3>
                  <p className="text-xs text-slate-500">Gérez, modifiez, dupliquez ou téléchargez les fiches sous forme de PDF officiels.</p>
                </div>

                {/* Search & Filter bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Rechercher élève, parent..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-blue-500 w-56 transition"
                    />
                  </div>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 focus:bg-white focus:outline-blue-500"
                  >
                    <option value="">Toutes les classes</option>
                    {uniqueClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Records List Table */}
              {filteredRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                        <th className="px-6 py-4">Élève</th>
                        <th className="px-6 py-4">Classe & Enseignant</th>
                        <th className="px-6 py-4">Responsables Légaux</th>
                        <th className="px-6 py-4 text-right">Actions de Fiche</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredRecords.map((rec) => {
                        const modifiedDate = new Date(rec.updatedAt || rec.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        });
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/55 transition">
                            {/* Column 1: Pupil details */}
                            <td className="px-6 py-4.5">
                              <div className="font-bold text-slate-900 text-sm">{rec.eleve.nom.toUpperCase()} {rec.eleve.prenoms}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <span>Né(e) le {rec.eleve.dateNaissance ? new Date(rec.eleve.dateNaissance).toLocaleDateString('fr-FR') : '...'}</span>
                                {rec.eleve.sexe && (
                                  <>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="font-semibold text-slate-500">{rec.eleve.sexe}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            {/* Column 2: Class */}
                            <td className="px-6 py-4.5">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wide uppercase border border-blue-100">{rec.eleve.classe || 'Non spécifiée'}</span>
                              <div className="text-[11px] text-slate-500 mt-1 font-medium">{rec.eleve.enseignant ? `M./Mme ${rec.eleve.enseignant}` : 'Enseignant non désigné'}</div>
                            </td>
                            {/* Column 3: Parents */}
                            <td className="px-6 py-4.5 space-y-0.5">
                              {rec.famille.parent1.nom ? (
                                <div className="font-medium text-slate-900">{rec.famille.parent1.prenom} {rec.famille.parent1.nom} <span className="text-[10px] text-slate-400">({rec.famille.parent1.lienParente})</span></div>
                              ) : null}
                              {rec.famille.parent2.nom ? (
                                <div className="font-medium text-slate-500">{rec.famille.parent2.prenom} {rec.famille.parent2.nom} <span className="text-[10px] text-slate-400">({rec.famille.parent2.lienParente})</span></div>
                              ) : null}
                              {!rec.famille.parent1.nom && !rec.famille.parent2.nom && (
                                <span className="text-slate-400 italic">Aucun responsable saisi</span>
                              )}
                            </td>
                            {/* Column 4: Actions */}
                            <td className="px-6 py-4.5 text-right space-y-1">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditRecord(rec)}
                                  title="Modifier"
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateRecord(rec)}
                                  title="Dupliquer (Utile pour frères/sœurs)"
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(rec)}
                                  title="Générer & Télécharger le PDF"
                                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 rounded-lg transition flex items-center gap-1.5 font-bold px-3 py-2"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  title="Supprimer"
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-400 italic">Modifié le {modifiedDate}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">Aucune fiche élève enregistrée</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    {searchTerm || classFilter 
                      ? "Aucun élève ne correspond à vos filtres de recherche actuels. Réessayez avec d'autres termes."
                      : `Saisissez les informations scolaires d'un élève pour générer sa fiche d'inscription ou importez un fichier CSV préexistant.`}
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    {searchTerm || classFilter ? (
                      <button
                        onClick={() => { setSearchTerm(''); setClassFilter(''); }}
                        className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                      >
                        Réinitialiser la recherche
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleCreateNew}
                          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-blue-700 transition"
                        >
                          Créer une fiche élève
                        </button>
                        <button
                          onClick={handleImportCSVClick}
                          className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
                        >
                          Importer depuis CSV
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row gap-5 items-center justify-between">
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-white/10 rounded-xl mt-1 text-yellow-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Synchronisation avec Google Sheets</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-xl">
                    Pour sauvegarder vos renseignements dans votre Google Sheet, téléchargez vos fiches au format CSV. Vous pourrez ensuite importer ce fichier directement dans Google Sheets ou le traiter dans Excel.
                  </p>
                </div>
              </div>
              <a 
                href="https://sheets.new" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/15 px-4.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap self-stretch md:self-auto justify-center md:justify-start"
              >
                Ouvrir un Google Sheet vide
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* VIEW 2: INTERACTIVE FORM EDITOR */}
        {activeView === 'editor' && currentRecord && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Toolbar */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Saisie en cours</div>
                  <h3 className="font-bold text-slate-900 text-base">{currentRecord.eleve.nom ? currentRecord.eleve.nom.toUpperCase() : 'Nouvel élève'} {currentRecord.eleve.prenoms}</h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleSaveForm}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-2 rounded-xl font-bold text-xs transition shadow-sm active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
                <button
                  onClick={handleSmartAutofillUrgence}
                  title="Copie automatiquement les informations communes pour remplir la Fiche d'Urgence médicale de la Page 5"
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-bold text-xs transition border border-indigo-100"
                >
                  <Sparkles className="w-4 h-4" />
                  Remplir Fiche d'Urgence
                </button>
                <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-xl text-xs font-medium">
                  <label htmlFor="includeCSPCheckbox" className="text-slate-600 cursor-pointer">Inclure les codes CSP (P.3)</label>
                  <input
                    id="includeCSPCheckbox"
                    type="checkbox"
                    checked={includeCSP}
                    onChange={(e) => setIncludeCSP(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => handleDownloadPDF(currentRecord)}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4.5 py-2 rounded-xl font-bold text-xs transition shadow-sm active:scale-95"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Télécharger le PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Form Section Selector & Input Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Sidebar Tab Navigation */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-1 sticky top-24">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase px-3 block mb-2">Sections du formulaire</span>
                
                <button
                  onClick={() => setEditorTab('eleve')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'eleve' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    1. Élève
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'eleve' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('famille')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'famille' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    2. Famille & Fratrie
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'famille' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('medical')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'medical' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4" />
                    3. Situation Médicale
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'medical' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('autorisations')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'autorisations' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    4-7. Autorisations
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'autorisations' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('personnes')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'personnes' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    8. Personnes Autorisées
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'personnes' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('urgence')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'urgence' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    Fiche d'Urgence (P.5)
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'urgence' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                {saveSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mt-4 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Fiche enregistrée !
                  </div>
                )}
              </div>

              {/* Right Input Panel - Placeholder for brevity */}
              <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[500px]">
                <p className="text-slate-500">Contenu du formulaire s'afficherait ici...</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* OFF-SCREEN DOM RENDERING FOR HIGH FIDELITY PDF CAPTURE */}
      {/* Fixed positioning with proper visibility for html2canvas */}
      <div 
        style={{ 
          position: 'fixed', 
          left: '-10000px', 
          top: '-10000px', 
          width: '850px',
          height: 'auto',
          visibility: 'hidden',
          overflow: 'visible',
          zIndex: -1
        }}
      >
        {pdfRecord && (
          <PrintPreview record={pdfRecord} includeCSP={includeCSP} />
        )}
      </div>

      {/* Footer copyright */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-xs text-center border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <p>© 2026 Portail d'Inscription Scolaire. Tous droits réservés.</p>
          <div className="flex gap-4">
            <span className="hover:text-white transition">Formulaires Officiels de Rentrée</span>
            <span>•</span>
            <span className="hover:text-white transition">Générateur PDF Vectoriel</span>
            <span>•</span>
            <span className="hover:text-white transition">Sauvegarde Sécurisée</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
