import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Search, Download, Upload, Trash2, Copy, Edit3, 
  Save, ArrowLeft, Check, AlertCircle, X, ChevronRight, Sparkles, 
  Users, HeartPulse, ShieldAlert, FileSpreadsheet, HelpCircle, 
  Info, Calendar, School, UserPlus, Eye
} from 'lucide-react';
import { 
  StudentRecord, INITIAL_RECORD, CSP_CODES, BrotherSisterType, 
  PersonneAutoriseeType, ContactPrevenirType, getPreviousSchoolYear
} from './types';
import { exportToCSV, importFromCSV } from './csvUtils';
import { PrintPreview } from './components/PrintPreview';
import { SignaturePad } from './components/SignaturePad';
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
  const [schoolYear, setSchoolYear] = useState('2026-2027');
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

  // Synchronize current record with app-wide school preferences when they change
  useEffect(() => {
    if (currentRecord) {
      let changed = false;
      const updated = { ...currentRecord };
      if (currentRecord.anneeScolaire !== schoolYear) {
        updated.anneeScolaire = schoolYear;
        changed = true;
      }
      if (currentRecord.ecoleNom !== schoolName) {
        updated.ecoleNom = schoolName;
        changed = true;
      }
      if (changed) {
        setCurrentRecord(updated);
      }
    }
  }, [schoolYear, schoolName, currentRecord?.id]);

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
                  Remplissez facilement les dossiers d'inscription scolaires de vos enfants, sauvegardez les données localement ou exportez-les pour les intégrer directement dans Google Sheets. Générez ensuite un document PDF de 4 ou 5 pages impeccable, identique aux formulaires papiers officiels.
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
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 hidden lg:block bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000')] bg-blend-overlay"></div>
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
                        <th className="px-6 py-4">Classe & Enseignant ({schoolYear})</th>
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wide uppercase border border-blue-100">{rec.eleve.classe || 'Non spécifiée'}</span>
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{rec.anneeScolaire}</span>
                              </div>
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
                    Pour sauvegarder vos renseignements dans votre Google Sheet, téléchargez vos fiches au format CSV. Vous pourrez ensuite importer ce fichier directement dans Google Sheets ou l'importer à nouveau ici plus tard pour modifier ou compléter des fiches !
                  </p>
                </div>
              </div>
              <a 
                href="https://sheets.new" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/15 px-4.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap self-stretch md:self-auto justify-center"
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
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'eleve' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    1. Élève
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'eleve' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('famille')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'famille' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    2. Famille & Fratrie
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'famille' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('medical')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'medical' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4" />
                    3. Situation Médicale
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'medical' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('autorisations')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'autorisations' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    4-7. Autorisations
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'autorisations' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('personnes')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'personnes' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    8. Personnes Autorisées
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${editorTab === 'personnes' ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <button
                  onClick={() => setEditorTab('urgence')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-left ${editorTab === 'urgence' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'}`}
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

              {/* Right Input Panel */}
              <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[500px]">
                {/* SECTION 1: ÉLÈVE INPUTS */}
                {editorTab === 'eleve' && (
                  <div className="space-y-8">
                    {/* PARTIE 1 : ÉTAT CIVIL */}
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wide">1. État Civil de l'Élève</h5>
                        <p className="text-xs text-slate-500">Informations d'identité et de naissance de l'enfant.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Nom de famille (en capitales)</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.nom}
                            onChange={(e) => updateCurrentRecordField('eleve', 'nom', e.target.value)}
                            placeholder="DUPONT"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Prénom(s)</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.prenoms}
                            onChange={(e) => updateCurrentRecordField('eleve', 'prenoms', e.target.value)}
                            placeholder="Jean, Paul, Pierre"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Sexe</label>
                          <select
                            value={currentRecord.eleve.sexe}
                            onChange={(e) => updateCurrentRecordField('eleve', 'sexe', e.target.value)}
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          >
                            <option value="">Sélectionner</option>
                            <option value="M">Masculin (M)</option>
                            <option value="F">Féminin (F)</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Date de naissance</label>
                          <input
                            type="date"
                            value={currentRecord.eleve.dateNaissance}
                            onChange={(e) => updateCurrentRecordField('eleve', 'dateNaissance', e.target.value)}
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Lieu de naissance (Ville)</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.villeNaissance}
                            onChange={(e) => updateCurrentRecordField('eleve', 'villeNaissance', e.target.value)}
                            placeholder="Paris"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Département de Naissance</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.departementNaissance}
                            onChange={(e) => updateCurrentRecordField('eleve', 'departementNaissance', e.target.value)}
                            placeholder="75"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Nationalité</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.nationalite}
                            onChange={(e) => updateCurrentRecordField('eleve', 'nationalite', e.target.value)}
                            placeholder="Française"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PARTIE 2 : SCOLARITÉ PRÉCÉDENTE */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="pb-2">
                        <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wide">2. Année Scolaire {getPreviousSchoolYear(currentRecord.anneeScolaire)}</h5>
                        <p className="text-xs text-slate-500">Renseignements sur la scolarité de l'élève durant l'année scolaire.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Classe ({getPreviousSchoolYear(currentRecord.anneeScolaire)})</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.classePrecedente || ''}
                            onChange={(e) => updateCurrentRecordField('eleve', 'classePrecedente', e.target.value)}
                            placeholder="CE2"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Enseignant(e) ({getPreviousSchoolYear(currentRecord.anneeScolaire)})</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.enseignantPrecedent || ''}
                            onChange={(e) => updateCurrentRecordField('eleve', 'enseignantPrecedent', e.target.value)}
                            placeholder="M. Durand"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">École Fréquentée</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.ecolePrecedente}
                            onChange={(e) => updateCurrentRecordField('eleve', 'ecolePrecedente', e.target.value)}
                            placeholder="École de Fontenay le Pesnel"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Ville de l'École précédente</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.villeEcolePrecedente}
                            onChange={(e) => updateCurrentRecordField('eleve', 'villeEcolePrecedente', e.target.value)}
                            placeholder="Fontenay le Pesnel"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                        <span className="text-xs font-bold text-slate-600 uppercase">L'élève est-il redoublant ?</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="redoublant"
                              checked={currentRecord.eleve.redoublant === true}
                              onChange={() => updateCurrentRecordField('eleve', 'redoublant', true)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            Oui
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="redoublant"
                              checked={currentRecord.eleve.redoublant === false}
                              onChange={() => updateCurrentRecordField('eleve', 'redoublant', false)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            Non
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* PARTIE 3 : SCOLARITÉ */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="pb-2">
                        <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wide">3. Scolarité {currentRecord.anneeScolaire}</h5>
                        <p className="text-xs text-slate-500">Renseignements sur l'affectation de l'élève pour cette année scolaire.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Classe ({currentRecord.anneeScolaire})</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.classe}
                            onChange={(e) => updateCurrentRecordField('eleve', 'classe', e.target.value)}
                            placeholder="CM1"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase">Enseignant(e) ({currentRecord.anneeScolaire})</label>
                          <input
                            type="text"
                            value={currentRecord.eleve.enseignant}
                            onChange={(e) => updateCurrentRecordField('eleve', 'enseignant', e.target.value)}
                            placeholder="Mme Martin"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 2: FAMILLE & FRATRIE INPUTS */}
                {editorTab === 'famille' && (
                  <div className="space-y-8 animate-fade-in">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">Responsables Légaux & Fratrie</h4>
                      <p className="text-xs text-slate-500">Section 2 de la fiche. Remplissez les données pour les parents ou tuteurs et l'entourage familial.</p>
                    </div>

                    {/* Parents Accordion Style */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      
                      {/* PARENT 1 */}
                      <div className="border border-slate-200 rounded-2xl p-4.5 space-y-4 bg-slate-50/20">
                        <div className="font-extrabold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                          <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">1</span>
                          REPRÉSENTANT LÉGAL 1
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const p1 = { ...currentRecord.famille.parent1, lienParente: 'Père' as const };
                              updateCurrentRecordField('famille', 'parent1', p1);
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent1.lienParente === 'Père' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                          >
                            Père
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p1 = { ...currentRecord.famille.parent1, lienParente: 'Mère' as const };
                              updateCurrentRecordField('famille', 'parent1', p1);
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent1.lienParente === 'Mère' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                          >
                            Mère
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p1 = { ...currentRecord.famille.parent1, lienParente: 'Autre' as const };
                              updateCurrentRecordField('famille', 'parent1', p1);
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent1.lienParente === 'Autre' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                          >
                            Autre
                          </button>
                        </div>

                        {currentRecord.famille.parent1.lienParente === 'Autre' && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase">Précision Lien de Parenté</label>
                            <input
                              type="text"
                              value={currentRecord.famille.parent1.lienAutrePrecision || ''}
                              onChange={(e) => {
                                const p1 = { ...currentRecord.famille.parent1, lienAutrePrecision: e.target.value };
                                updateCurrentRecordField('famille', 'parent1', p1);
                              }}
                              placeholder="Grand-père, Tuteur..."
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nom</label>
                            <input
                              type="text"
                              value={currentRecord.famille.parent1.nom}
                              onChange={(e) => {
                                const p1 = { ...currentRecord.famille.parent1, nom: e.target.value };
                                updateCurrentRecordField('famille', 'parent1', p1);
                              }}
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Prénom</label>
                            <input
                              type="text"
                              value={currentRecord.famille.parent1.prenom}
                              onChange={(e) => {
                                const p1 = { ...currentRecord.famille.parent1, prenom: e.target.value };
                                updateCurrentRecordField('famille', 'parent1', p1);
                              }}
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse Postale Complète</label>
                          <textarea
                            rows={2}
                            value={currentRecord.famille.parent1.adresse}
                            onChange={(e) => {
                              const p1 = { ...currentRecord.famille.parent1, adresse: e.target.value };
                              updateCurrentRecordField('famille', 'parent1', p1);
                            }}
                            placeholder="12 rue des Fleurs, 14250 Fontenay"
                            className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Tél Fixe</label>
                            <input
                              type="tel"
                              value={currentRecord.famille.parent1.telDomicile}
                              onChange={(e) => {
                                const p1 = { ...currentRecord.famille.parent1, telDomicile: e.target.value };
                                updateCurrentRecordField('famille', 'parent1', p1);
                              }}
                              className="border px-2 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Tél Portable</label>
                            <input
                              type="tel"
                              value={currentRecord.famille.parent1.telPortable}
                              onChange={(e) => {
                                const p1 = { ...currentRecord.famille.parent1, telPortable: e.target.value };
                                updateCurrentRecordField('famille', 'parent1', p1);
                              }}
                              className="border px-2 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Tél Pro</label>
                            <input
                              type="tel"
                              value={currentRecord.famille.parent1.telProfessionnel}
                              onChange={(e) => {
                                const p1 = { ...currentRecord.famille.parent1, telProfessionnel: e.target.value };
                                updateCurrentRecordField('famille', 'parent1', p1);
                              }}
                              className="border px-2 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Courriel</label>
                          <input
                            type="email"
                            value={currentRecord.famille.parent1.courriel}
                            onChange={(e) => {
                              const p1 = { ...currentRecord.famille.parent1, courriel: e.target.value };
                              updateCurrentRecordField('famille', 'parent1', p1);
                            }}
                            className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Profession</label>
                            <input
                              type="text"
                              value={currentRecord.famille.parent1.profession}
                              onChange={(e) => {
                                const p1 = { ...currentRecord.famille.parent1, profession: e.target.value };
                                updateCurrentRecordField('famille', 'parent1', p1);
                              }}
                              placeholder="Commerçant"
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Code CSP (Page 3)</label>
                            <select
                              value={currentRecord.famille.parent1.codeCSP}
                              onChange={(e) => {
                                const p1 = { ...currentRecord.famille.parent1, codeCSP: e.target.value };
                                updateCurrentRecordField('famille', 'parent1', p1);
                              }}
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            >
                              <option value="">Sélectionner un code</option>
                              {CSP_CODES.map(c => (
                                <option key={c.code} value={c.code}>{c.code} - {c.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Situation de famille</label>
                            <select
                              value={currentRecord.famille.parent1.situationFamille || ''}
                              onChange={(e) => {
                                const p1 = { ...currentRecord.famille.parent1, situationFamille: e.target.value as any };
                                updateCurrentRecordField('famille', 'parent1', p1);
                              }}
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            >
                              <option value="">Sélectionner</option>
                              <option value="Marié">Marié(e)</option>
                              <option value="Séparé">Séparé(e)</option>
                              <option value="Divorcé">Divorcé(e)</option>
                              <option value="Vie maritale">Vie maritale</option>
                              <option value="Remarié">Remarié(e)</option>
                              <option value="Veuf">Veuf</option>
                              <option value="Veuve">Veuve</option>
                              <option value="Célibataire">Célibataire</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Résidence de l'enfant</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const p1 = { ...currentRecord.famille.parent1, residenceEnfant: true };
                                  updateCurrentRecordField('famille', 'parent1', p1);
                                }}
                                className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent1.residenceEnfant === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                              >
                                Oui
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const p1 = { ...currentRecord.famille.parent1, residenceEnfant: false };
                                  updateCurrentRecordField('famille', 'parent1', p1);
                                }}
                                className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent1.residenceEnfant === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                              >
                                Non
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Autorité parentale</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const p1 = { ...currentRecord.famille.parent1, autoriteParentale: true };
                                  updateCurrentRecordField('famille', 'parent1', p1);
                                }}
                                className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent1.autoriteParentale === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                              >
                                Oui
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const p1 = { ...currentRecord.famille.parent1, autoriteParentale: false };
                                  updateCurrentRecordField('famille', 'parent1', p1);
                                }}
                                className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent1.autoriteParentale === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                              >
                                Non
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PARENT 2 */}
                      <div className="border border-slate-200 rounded-2xl p-4.5 space-y-4 bg-slate-50/20">
                        <div className="font-extrabold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                          <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">2</span>
                          REPRÉSENTANT LÉGAL 2
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const p2 = { ...currentRecord.famille.parent2, lienParente: 'Père' as const };
                              updateCurrentRecordField('famille', 'parent2', p2);
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent2.lienParente === 'Père' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                          >
                            Père
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p2 = { ...currentRecord.famille.parent2, lienParente: 'Mère' as const };
                              updateCurrentRecordField('famille', 'parent2', p2);
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent2.lienParente === 'Mère' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                          >
                            Mère
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p2 = { ...currentRecord.famille.parent2, lienParente: 'Autre' as const };
                              updateCurrentRecordField('famille', 'parent2', p2);
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent2.lienParente === 'Autre' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                          >
                            Autre
                          </button>
                        </div>

                        {currentRecord.famille.parent2.lienParente === 'Autre' && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase">Précision Lien de Parenté</label>
                            <input
                              type="text"
                              value={currentRecord.famille.parent2.lienAutrePrecision || ''}
                              onChange={(e) => {
                                const p2 = { ...currentRecord.famille.parent2, lienAutrePrecision: e.target.value };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              placeholder="Grand-père, Tuteur..."
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nom</label>
                            <input
                              type="text"
                              value={currentRecord.famille.parent2.nom}
                              onChange={(e) => {
                                const p2 = { ...currentRecord.famille.parent2, nom: e.target.value };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Prénom</label>
                            <input
                              type="text"
                              value={currentRecord.famille.parent2.prenom}
                              onChange={(e) => {
                                const p2 = { ...currentRecord.famille.parent2, prenom: e.target.value };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse Postale Complète</label>
                            <button
                              type="button"
                              onClick={() => {
                                const p2 = { ...currentRecord.famille.parent2, adresse: currentRecord.famille.parent1.adresse };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              className="text-[10px] text-blue-600 font-bold hover:underline"
                            >
                              Identique au Représentant 1
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={currentRecord.famille.parent2.adresse}
                            onChange={(e) => {
                              const p2 = { ...currentRecord.famille.parent2, adresse: e.target.value };
                              updateCurrentRecordField('famille', 'parent2', p2);
                            }}
                            placeholder="12 rue des Fleurs, 14250 Fontenay"
                            className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Tél Fixe</label>
                            <input
                              type="tel"
                              value={currentRecord.famille.parent2.telDomicile}
                              onChange={(e) => {
                                const p2 = { ...currentRecord.famille.parent2, telDomicile: e.target.value };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              className="border px-2 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Tél Portable</label>
                            <input
                              type="tel"
                              value={currentRecord.famille.parent2.telPortable}
                              onChange={(e) => {
                                const p2 = { ...currentRecord.famille.parent2, telPortable: e.target.value };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              className="border px-2 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Tél Pro</label>
                            <input
                              type="tel"
                              value={currentRecord.famille.parent2.telProfessionnel}
                              onChange={(e) => {
                                const p2 = { ...currentRecord.famille.parent2, telProfessionnel: e.target.value };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              className="border px-2 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Courriel</label>
                          <input
                            type="email"
                            value={currentRecord.famille.parent2.courriel}
                            onChange={(e) => {
                              const p2 = { ...currentRecord.famille.parent2, courriel: e.target.value };
                              updateCurrentRecordField('famille', 'parent2', p2);
                            }}
                            className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Profession</label>
                            <input
                              type="text"
                              value={currentRecord.famille.parent2.profession}
                              onChange={(e) => {
                                const p2 = { ...currentRecord.famille.parent2, profession: e.target.value };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              placeholder="Mécanicien"
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Code CSP (Page 3)</label>
                            <select
                              value={currentRecord.famille.parent2.codeCSP}
                              onChange={(e) => {
                                const p2 = { ...currentRecord.famille.parent2, codeCSP: e.target.value };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            >
                              <option value="">Sélectionner un code</option>
                              {CSP_CODES.map(c => (
                                <option key={c.code} value={c.code}>{c.code} - {c.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Situation de famille</label>
                            <select
                              value={currentRecord.famille.parent2.situationFamille || ''}
                              onChange={(e) => {
                                const p2 = { ...currentRecord.famille.parent2, situationFamille: e.target.value as any };
                                updateCurrentRecordField('famille', 'parent2', p2);
                              }}
                              className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                            >
                              <option value="">Sélectionner</option>
                              <option value="Marié">Marié(e)</option>
                              <option value="Séparé">Séparé(e)</option>
                              <option value="Divorcé">Divorcé(e)</option>
                              <option value="Vie maritale">Vie maritale</option>
                              <option value="Remarié">Remarié(e)</option>
                              <option value="Veuf">Veuf</option>
                              <option value="Veuve">Veuve</option>
                              <option value="Célibataire">Célibataire</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Résidence de l'enfant</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const p2 = { ...currentRecord.famille.parent2, residenceEnfant: true };
                                  updateCurrentRecordField('famille', 'parent2', p2);
                                }}
                                className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent2.residenceEnfant === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                              >
                                Oui
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const p2 = { ...currentRecord.famille.parent2, residenceEnfant: false };
                                  updateCurrentRecordField('famille', 'parent2', p2);
                                }}
                                className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent2.residenceEnfant === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                              >
                                Non
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Autorité parentale</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const p2 = { ...currentRecord.famille.parent2, autoriteParentale: true };
                                  updateCurrentRecordField('famille', 'parent2', p2);
                                }}
                                className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent2.autoriteParentale === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                              >
                                Oui
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const p2 = { ...currentRecord.famille.parent2, autoriteParentale: false };
                                  updateCurrentRecordField('famille', 'parent2', p2);
                                }}
                                className={`py-2 text-xs font-bold rounded-lg transition border ${currentRecord.famille.parent2.autoriteParentale === false ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                              >
                                Non
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SIBLINGS SECTION */}
                    <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="font-bold text-sm text-slate-900 uppercase">
                          Frères et sœurs vivant au foyer
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const siblings = [...currentRecord.famille.fratrie];
                            siblings.push({
                              id: crypto.randomUUID(),
                              nomPrenom: '',
                              dateNaissance: '',
                              ecoleClasse: ''
                            });
                            updateCurrentRecordField('famille', 'fratrie', siblings);
                          }}
                          className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Frère/Sœur
                        </button>
                      </div>

                      {currentRecord.famille.fratrie.length > 0 ? (
                        <div className="space-y-3">
                          {currentRecord.famille.fratrie.map((sibling, sIdx) => (
                            <div key={sibling.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                              <div className="md:col-span-5 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom & Prénom</label>
                                <input
                                  type="text"
                                  value={sibling.nomPrenom}
                                  onChange={(e) => {
                                    const updatedSiblings = [...currentRecord.famille.fratrie];
                                    updatedSiblings[sIdx].nomPrenom = e.target.value;
                                    updateCurrentRecordField('famille', 'fratrie', updatedSiblings);
                                  }}
                                  placeholder="Lucas Dupont"
                                  className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                                />
                              </div>
                              <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Date de Naissance</label>
                                <input
                                  type="date"
                                  value={sibling.dateNaissance}
                                  onChange={(e) => {
                                    const updatedSiblings = [...currentRecord.famille.fratrie];
                                    updatedSiblings[sIdx].dateNaissance = e.target.value;
                                    updateCurrentRecordField('famille', 'fratrie', updatedSiblings);
                                  }}
                                  className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                                />
                              </div>
                              <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">École / Classe</label>
                                <input
                                  type="text"
                                  value={sibling.ecoleClasse}
                                  onChange={(e) => {
                                    const updatedSiblings = [...currentRecord.famille.fratrie];
                                    updatedSiblings[sIdx].ecoleClasse = e.target.value;
                                    updateCurrentRecordField('famille', 'fratrie', updatedSiblings);
                                  }}
                                  placeholder="Maternelle / MS"
                                  className="border px-3 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                                />
                              </div>
                              <div className="md:col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedSiblings = currentRecord.famille.fratrie.filter(s => s.id !== sibling.id);
                                    updateCurrentRecordField('famille', 'fratrie', updatedSiblings);
                                  }}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400 text-xs italic">
                          Aucun frère ou sœur renseigné pour le foyer de l'élève.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 3: SITUATION MÉDICALE */}
                {editorTab === 'medical' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">Situation Médicale & Urgence</h4>
                      <p className="text-xs text-slate-500">Section 3 de la fiche de renseignement.</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-600 uppercase">N° de Sécurité Sociale de l'élève (ou du parent)</label>
                        <span className="text-[10px] text-slate-400">15 chiffres</span>
                      </div>
                      <input
                        type="text"
                        maxLength={15}
                        value={currentRecord.secuSociale}
                        onChange={(e) => updateCurrentRecordField('root', 'secuSociale', e.target.value)}
                        placeholder="1 85 02 75 112 345 67"
                        className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-widest text-blue-900 focus:outline-blue-500 bg-slate-50/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">N° et adresse du centre de sécurité sociale</label>
                        <input
                          type="text"
                          value={currentRecord.secuSocialeCentre || ''}
                          onChange={(e) => updateCurrentRecordField('root', 'secuSocialeCentre', e.target.value)}
                          placeholder="Ex : CPAM du Calvados, 14022 Caen Cedex 9"
                          className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">N° et adresse de l'assurance scolaire</label>
                        <input
                          type="text"
                          value={currentRecord.assurance.adresse || ''}
                          onChange={(e) => updateCurrentRecordField('assurance', 'adresse', e.target.value)}
                          placeholder="Ex : MAE - 24 rue de la République, 76000 Rouen"
                          className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase">Allergies ou Intolérances alimentaires ou médicamenteuses</label>
                      <textarea
                        rows={3}
                        value={currentRecord.medical.allergies}
                        onChange={(e) => updateCurrentRecordField('medical', 'allergies', e.target.value)}
                        placeholder="Ex : Allergie à la pénicilline, intolérance au gluten..."
                        className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase">Problèmes de santé particuliers (ex: asthme, diabète...)</label>
                      <textarea
                        rows={3}
                        value={currentRecord.medical.problemesSante}
                        onChange={(e) => updateCurrentRecordField('medical', 'problemesSante', e.target.value)}
                        placeholder="Ex : Asthme d'effort exigeant de la Ventoline, diabète de type 1..."
                        className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/30">
                        <span className="text-xs font-bold text-slate-600 uppercase">Protocole d'accueil individualisé (P.A.I.) en cours ?</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="pai"
                              checked={currentRecord.medical.paiEnCours === true}
                              onChange={() => updateCurrentRecordField('medical', 'paiEnCours', true)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            Oui
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="pai"
                              checked={currentRecord.medical.paiEnCours === false}
                              onChange={() => updateCurrentRecordField('medical', 'paiEnCours', false)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            Non
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/30">
                        <span className="text-xs font-bold text-slate-600 uppercase">Plan d'accompagnement Personnalisé (P.A.P.) en cours ?</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="pap"
                              checked={currentRecord.medical.papEnCours === true}
                              onChange={() => updateCurrentRecordField('medical', 'papEnCours', true)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            Oui
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="pap"
                              checked={currentRecord.medical.papEnCours === false}
                              onChange={() => updateCurrentRecordField('medical', 'papEnCours', false)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            Non
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h5 className="text-xs font-extrabold text-slate-900 uppercase mb-3">Médecin traitant de famille</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du médecin</label>
                          <input
                            type="text"
                            value={currentRecord.medical.medecinNom}
                            onChange={(e) => updateCurrentRecordField('medical', 'medecinNom', e.target.value)}
                            placeholder="Dr. Martin"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Ville</label>
                          <input
                            type="text"
                            value={currentRecord.medical.medecinVille}
                            onChange={(e) => updateCurrentRecordField('medical', 'medecinVille', e.target.value)}
                            placeholder="Fontenay le Pesnel"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro de téléphone</label>
                          <input
                            type="tel"
                            value={currentRecord.medical.medecinTel}
                            onChange={(e) => updateCurrentRecordField('medical', 'medecinTel', e.target.value)}
                            placeholder="02 31 80 81 82"
                            className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">Établissement Hospitalier de préférence</label>
                        <input
                          type="text"
                          value={currentRecord.medical.hopitalPreference}
                          onChange={(e) => updateCurrentRecordField('medical', 'hopitalPreference', e.target.value)}
                          placeholder="CHU de Caen, Normandie"
                          className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">Date du dernier rappel de vaccin antitétanique</label>
                        <input
                          type="text"
                          value={currentRecord.medical.vaccinAntitetaniqueDate || ''}
                          onChange={(e) => updateCurrentRecordField('medical', 'vaccinAntitetaniqueDate', e.target.value)}
                          placeholder="Ex : 12/05/2024 ou En cours..."
                          className="border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 4: AUTORISATIONS INPUTS */}
                {editorTab === 'autorisations' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">Lunettes, Assurances & Autorisations</h4>
                      <p className="text-xs text-slate-500">Sections 4 à 7 de la fiche de renseignement scolaire.</p>
                    </div>

                    {/* SECTION 4: LUNETTES */}
                    <div className="border border-slate-200 p-4.5 rounded-2xl space-y-4 bg-slate-50/25">
                      <h5 className="text-xs font-extrabold text-slate-900 uppercase">4 - LUNETTES ET CORRECTION VISUELLE</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between bg-white border p-3 rounded-xl text-xs">
                          <span className="font-semibold text-slate-600">L'élève porte-t-il des lunettes ?</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="porte-lunettes"
                                checked={currentRecord.lunettes.porte === true}
                                onChange={() => updateCurrentRecordField('lunettes', 'porte', true)}
                                className="w-4.5 h-4.5 text-blue-600"
                              />
                              Oui
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="porte-lunettes"
                                checked={currentRecord.lunettes.porte === false}
                                onChange={() => updateCurrentRecordField('lunettes', 'porte', false)}
                                className="w-4.5 h-4.5 text-blue-600"
                              />
                              Non
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white border p-3 rounded-xl text-xs">
                          <span className="font-semibold text-slate-600">Doit-il les porter en classe ?</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="classe-lunettes"
                                checked={currentRecord.lunettes.classe === true}
                                onChange={() => updateCurrentRecordField('lunettes', 'classe', true)}
                                className="w-4.5 h-4.5 text-blue-600"
                              />
                              Oui
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="classe-lunettes"
                                checked={currentRecord.lunettes.classe === false}
                                onChange={() => updateCurrentRecordField('lunettes', 'classe', false)}
                                className="w-4.5 h-4.5 text-blue-600"
                              />
                              Non
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 5: ASSURANCE */}
                    <div className="border border-slate-200 p-4.5 rounded-2xl space-y-4 bg-slate-50/25">
                      <h5 className="text-xs font-extrabold text-slate-900 uppercase">5 - ASSURANCE SCOLAIRE</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Compagnie d'Assurance</label>
                          <input
                            type="text"
                            value={currentRecord.assurance.compagnie}
                            onChange={(e) => updateCurrentRecordField('assurance', 'compagnie', e.target.value)}
                            placeholder="MAE, MAIF, AXA..."
                            className="border px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro de Contrat</label>
                          <input
                            type="text"
                            value={currentRecord.assurance.numeroContrat}
                            onChange={(e) => updateCurrentRecordField('assurance', 'numeroContrat', e.target.value)}
                            placeholder="Contrat n° 14250212S"
                            className="border px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">N° et adresse de l'assurance scolaire</label>
                        <input
                          type="text"
                          value={currentRecord.assurance.adresse || ''}
                          onChange={(e) => updateCurrentRecordField('assurance', 'adresse', e.target.value)}
                          placeholder="Ex : MAE - 24 rue de la République, 76000 Rouen"
                          className="border px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* SECTION 6: COORDONNÉES */}
                    <div className="border border-slate-200 p-4.5 rounded-2xl space-y-3.5 bg-slate-50/25">
                      <h5 className="text-xs font-extrabold text-slate-900 uppercase">6 - AUTORISATION DE COMMUNICATION DES COORDONNÉES</h5>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border p-3.5 rounded-xl text-xs gap-3">
                        <span className="font-medium text-slate-600 max-w-lg leading-relaxed">J'autorise la communication de mon adresse et de mon numéro de téléphone aux <strong>associations de parents d'élèves de l'école</strong> :</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="aut-com-assoc"
                              checked={currentRecord.autorisationCom.associationParents === true}
                              onChange={() => updateCurrentRecordField('autorisationCom', 'associationParents', true)}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Oui
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="aut-com-assoc"
                              checked={currentRecord.autorisationCom.associationParents === false}
                              onChange={() => updateCurrentRecordField('autorisationCom', 'associationParents', false)}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Non
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border p-3.5 rounded-xl text-xs gap-3">
                        <span className="font-medium text-slate-600 max-w-lg leading-relaxed">J'autorise la communication de mon adresse et de mon numéro de téléphone aux <strong>autres familles de la classe de mon enfant</strong> :</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="aut-com-familles"
                              checked={currentRecord.autorisationCom.autresFamilles === true}
                              onChange={() => updateCurrentRecordField('autorisationCom', 'autresFamilles', true)}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Oui
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="aut-com-familles"
                              checked={currentRecord.autorisationCom.autresFamilles === false}
                              onChange={() => updateCurrentRecordField('autorisationCom', 'autresFamilles', false)}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Non
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 7: DROIT A L'IMAGE */}
                    <div className="border border-slate-200 p-4.5 rounded-2xl space-y-3.5 bg-slate-50/25">
                      <h5 className="text-xs font-extrabold text-slate-900 uppercase">7 - DROIT À L'IMAGE ET DIFFUSION</h5>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border p-3.5 rounded-xl text-xs gap-3">
                        <span className="font-medium text-slate-600 max-w-lg leading-relaxed">J'autorise l'école à prendre des photographies ou des vidéos de mon enfant et à les diffuser sur le <strong>site internet ou le blog sécurisé de l'école</strong> :</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="aut-img-site"
                              checked={currentRecord.droitImage.siteInternet === true}
                              onChange={() => updateCurrentRecordField('droitImage', 'siteInternet', true)}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Oui
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="aut-img-site"
                              checked={currentRecord.droitImage.siteInternet === false}
                              onChange={() => updateCurrentRecordField('droitImage', 'siteInternet', false)}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Non
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border p-3.5 rounded-xl text-xs gap-3">
                        <span className="font-medium text-slate-600 max-w-lg leading-relaxed">J'autorise l'école à diffuser ces photos dans le <strong>journal de l'école ou les publications locales</strong> :</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="aut-img-journal"
                              checked={currentRecord.droitImage.journalEcole === true}
                              onChange={() => updateCurrentRecordField('droitImage', 'journalEcole', true)}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Oui
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="aut-img-journal"
                              checked={currentRecord.droitImage.journalEcole === false}
                              onChange={() => updateCurrentRecordField('droitImage', 'journalEcole', false)}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Non
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 8: PERSONNES AUTORISÉES INPUTS */}
                {editorTab === 'personnes' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">8. Personnes Autorisées à Sortie d'École</h4>
                        <p className="text-xs text-slate-500">Personnes majeures habilitées à venir chercher l'enfant ou à prévenir en cas d'urgence.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...currentRecord.personnesAutorisees];
                          list.push({
                            id: crypto.randomUUID(),
                            nomPrenom: '',
                            lienParente: '',
                            telephone: '',
                            adresseComplete: ''
                          });
                          updateCurrentRecordField('root', 'personnesAutorisees', list);
                        }}
                        className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Personne
                      </button>
                    </div>

                    {currentRecord.personnesAutorisees.length > 0 ? (
                      <div className="space-y-4">
                        {currentRecord.personnesAutorisees.map((person, pIdx) => (
                          <div key={person.id} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 space-y-3.5">
                            <div className="grid grid-cols-1 md:grid-cols-11 gap-3.5">
                              <div className="md:col-span-5 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom & Prénom</label>
                                <input
                                  type="text"
                                  value={person.nomPrenom}
                                  onChange={(e) => {
                                    const updated = [...currentRecord.personnesAutorisees];
                                    updated[pIdx].nomPrenom = e.target.value;
                                    updateCurrentRecordField('root', 'personnesAutorisees', updated);
                                  }}
                                  placeholder="Martine Petit"
                                  className="border px-3.5 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                                />
                              </div>
                              <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Lien de parenté / Relation</label>
                                <input
                                  type="text"
                                  value={person.lienParente}
                                  onChange={(e) => {
                                    const updated = [...currentRecord.personnesAutorisees];
                                    updated[pIdx].lienParente = e.target.value;
                                    updateCurrentRecordField('root', 'personnesAutorisees', updated);
                                  }}
                                  placeholder="Grand-mère, Voisine, Nounou"
                                  className="border px-3.5 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                                />
                              </div>
                              <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro de Téléphone</label>
                                <input
                                  type="tel"
                                  value={person.telephone}
                                  onChange={(e) => {
                                    const updated = [...currentRecord.personnesAutorisees];
                                    updated[pIdx].telephone = e.target.value;
                                    updateCurrentRecordField('root', 'personnesAutorisees', updated);
                                  }}
                                  placeholder="06 12 34 56 78"
                                  className="border px-3.5 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                              <div className="md:col-span-11 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse Complète</label>
                                <input
                                  type="text"
                                  value={person.adresseComplete || ''}
                                  onChange={(e) => {
                                    const updated = [...currentRecord.personnesAutorisees];
                                    updated[pIdx].adresseComplete = e.target.value;
                                    updateCurrentRecordField('root', 'personnesAutorisees', updated);
                                  }}
                                  placeholder="12 rue des Lilas, 14250 Fontenay le Pesnel"
                                  className="border px-3.5 py-2 rounded-xl text-xs font-medium focus:outline-blue-500 bg-white"
                                />
                              </div>
                              <div className="md:col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = currentRecord.personnesAutorisees.filter(p => p.id !== person.id);
                                    updateCurrentRecordField('root', 'personnesAutorisees', updated);
                                  }}
                                  className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition inline-flex items-center justify-center w-full md:w-auto"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed">
                        Indiquez les personnes majeures qui peuvent venir chercher votre enfant à la sortie.
                      </div>
                    )}
                  </div>
                )}

                {/* FICHE D'URGENCE INPUTS */}
                {editorTab === 'urgence' && (
                  <div className="space-y-6 animate-fade-in text-slate-700">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-bold text-red-700 text-base uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-5 h-5 text-red-600" />
                          Fiche d'Urgence Médicale (Page 5)
                        </h4>
                        <p className="text-xs text-slate-500">Renseignements médicaux et contacts de priorité pour les services de secours (SAMU/Pompiers).</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSmartAutofillUrgence}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md"
                      >
                        Pré-remplir la fiche
                      </button>
                    </div>

                    {/* Quick Info Alert */}
                    <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-red-600 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase">Important :</span> En cas d'accident grave, l'enfant est transporté par les services d'urgence vers le centre de soins le plus proche. Les parents doivent donner leur signature sur le document physique.
                      </div>
                    </div>

                    {/* Contacts Prévenir Section */}
                    <div className="border border-slate-200 p-4.5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-extrabold text-slate-900 uppercase">1 - Personnes à prévenir en l'absence des parents (par priorité)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...currentRecord.ficheUrgence.contactsPrevenir];
                            list.push({
                              id: crypto.randomUUID(),
                              nomPrenom: '',
                              lien: '',
                              telephone: ''
                            });
                            const fu = { ...currentRecord.ficheUrgence, contactsPrevenir: list };
                            updateCurrentRecordField('root', 'ficheUrgence', fu);
                          }}
                          className="flex items-center gap-1 text-[11px] bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Contact Urgence
                        </button>
                      </div>

                      {currentRecord.ficheUrgence.contactsPrevenir.length > 0 ? (
                        <div className="space-y-3">
                          {currentRecord.ficheUrgence.contactsPrevenir.map((contact, cIdx) => (
                            <div key={contact.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-xl border">
                              <div className="md:col-span-5 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom & Prénom</label>
                                <input
                                  type="text"
                                  value={contact.nomPrenom}
                                  onChange={(e) => {
                                    const list = [...currentRecord.ficheUrgence.contactsPrevenir];
                                    list[cIdx].nomPrenom = e.target.value;
                                    const fu = { ...currentRecord.ficheUrgence, contactsPrevenir: list };
                                    updateCurrentRecordField('root', 'ficheUrgence', fu);
                                  }}
                                  className="border px-3 py-1.5 rounded-xl text-xs bg-white"
                                />
                              </div>
                              <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Lien / Relation</label>
                                <input
                                  type="text"
                                  value={contact.lien}
                                  onChange={(e) => {
                                    const list = [...currentRecord.ficheUrgence.contactsPrevenir];
                                    list[cIdx].lien = e.target.value;
                                    const fu = { ...currentRecord.ficheUrgence, contactsPrevenir: list };
                                    updateCurrentRecordField('root', 'ficheUrgence', fu);
                                  }}
                                  className="border px-3 py-1.5 rounded-xl text-xs bg-white"
                                />
                              </div>
                              <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro de téléphone</label>
                                <input
                                  type="tel"
                                  value={contact.telephone}
                                  onChange={(e) => {
                                    const list = [...currentRecord.ficheUrgence.contactsPrevenir];
                                    list[cIdx].telephone = e.target.value;
                                    const fu = { ...currentRecord.ficheUrgence, contactsPrevenir: list };
                                    updateCurrentRecordField('root', 'ficheUrgence', fu);
                                  }}
                                  className="border px-3 py-1.5 rounded-xl text-xs bg-white"
                                />
                              </div>
                              <div className="md:col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = currentRecord.ficheUrgence.contactsPrevenir.filter(c => c.id !== contact.id);
                                    const fu = { ...currentRecord.ficheUrgence, contactsPrevenir: list };
                                    updateCurrentRecordField('root', 'ficheUrgence', fu);
                                  }}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed">
                          Saisissez des contacts spécifiques. Par défaut, la fiche utilisera vos premiers contacts autorisés.
                        </div>
                      )}
                    </div>

                    {/* Allergies & Asthme Box */}
                    <div className="border border-slate-200 p-4.5 rounded-2xl space-y-4">
                      <span className="text-xs font-extrabold text-slate-900 uppercase block">2 - Renseignements Médicaux Importants</span>
                      
                      <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-600 uppercase">Allergies connues :</span>
                        <label className="flex items-center gap-1 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentRecord.ficheUrgence.allergiesMedicamenteuses}
                            onChange={(e) => {
                              const fu = { ...currentRecord.ficheUrgence, allergiesMedicamenteuses: e.target.checked };
                              updateCurrentRecordField('root', 'ficheUrgence', fu);
                            }}
                            className="w-4 h-4 text-red-600 rounded"
                          />
                          Médicamenteuses
                        </label>
                        <label className="flex items-center gap-1 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentRecord.ficheUrgence.allergiesAlimentaires}
                            onChange={(e) => {
                              const fu = { ...currentRecord.ficheUrgence, allergiesAlimentaires: e.target.checked };
                              updateCurrentRecordField('root', 'ficheUrgence', fu);
                            }}
                            className="w-4 h-4 text-red-600 rounded"
                          />
                          Alimentaires
                        </label>
                        <label className="flex items-center gap-1 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentRecord.ficheUrgence.allergiesVenins}
                            onChange={(e) => {
                              const fu = { ...currentRecord.ficheUrgence, allergiesVenins: e.target.checked };
                              updateCurrentRecordField('root', 'ficheUrgence', fu);
                            }}
                            className="w-4 h-4 text-red-600 rounded"
                          />
                          Venins (guêpes...)
                        </label>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Précision sur les allergies</label>
                        <input
                          type="text"
                          value={currentRecord.ficheUrgence.allergiesPrecision}
                          onChange={(e) => {
                            const fu = { ...currentRecord.ficheUrgence, allergiesPrecision: e.target.value };
                            updateCurrentRecordField('root', 'ficheUrgence', fu);
                          }}
                          placeholder="Ex: Choc anaphylactique aux cacahuètes. Possède un EpiPen."
                          className="border px-3.5 py-2.5 rounded-xl text-xs bg-white focus:outline-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between border p-3.5 rounded-xl text-xs bg-slate-50/50">
                          <span className="font-semibold text-slate-600">L'élève est-il asthmatique ?</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="asthme"
                                checked={currentRecord.ficheUrgence.asthme === true}
                                onChange={() => {
                                  const fu = { ...currentRecord.ficheUrgence, asthme: true };
                                  updateCurrentRecordField('root', 'ficheUrgence', fu);
                                }}
                                className="w-4.5 h-4.5 text-blue-600"
                              />
                              Oui
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="asthme"
                                checked={currentRecord.ficheUrgence.asthme === false}
                                onChange={() => {
                                  const fu = { ...currentRecord.ficheUrgence, asthme: false };
                                  updateCurrentRecordField('root', 'ficheUrgence', fu);
                                }}
                                className="w-4.5 h-4.5 text-blue-600"
                              />
                              Non
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border p-3.5 rounded-xl text-xs bg-slate-50/50">
                          <span className="font-semibold text-slate-600">L'élève est-il diabétique ?</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="diabete"
                                checked={currentRecord.ficheUrgence.diabete === true}
                                onChange={() => {
                                  const fu = { ...currentRecord.ficheUrgence, diabete: true };
                                  updateCurrentRecordField('root', 'ficheUrgence', fu);
                                }}
                                className="w-4.5 h-4.5 text-blue-600"
                              />
                              Oui
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="diabete"
                                checked={currentRecord.ficheUrgence.diabete === false}
                                onChange={() => {
                                  const fu = { ...currentRecord.ficheUrgence, diabete: false };
                                  updateCurrentRecordField('root', 'ficheUrgence', fu);
                                }}
                                className="w-4.5 h-4.5 text-blue-600"
                              />
                              Non
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Autre problème de santé important à signaler</label>
                        <input
                          type="text"
                          value={currentRecord.ficheUrgence.autreSante}
                          onChange={(e) => {
                            const fu = { ...currentRecord.ficheUrgence, autreSante: e.target.value };
                            updateCurrentRecordField('root', 'ficheUrgence', fu);
                          }}
                          className="border px-3.5 py-2.5 rounded-xl text-xs bg-white focus:outline-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border">
                        <span className="text-xs font-bold text-slate-600 uppercase">Suit-il un traitement médical régulier à l'école ?</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="traitementRegulier"
                              checked={currentRecord.ficheUrgence.traitementRegulier === true}
                              onChange={() => {
                                const fu = { ...currentRecord.ficheUrgence, traitementRegulier: true };
                                updateCurrentRecordField('root', 'ficheUrgence', fu);
                              }}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Oui
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer font-bold">
                            <input
                              type="radio"
                              name="traitementRegulier"
                              checked={currentRecord.ficheUrgence.traitementRegulier === false}
                              onChange={() => {
                                const fu = { ...currentRecord.ficheUrgence, traitementRegulier: false };
                                updateCurrentRecordField('root', 'ficheUrgence', fu);
                              }}
                              className="w-4.5 h-4.5 text-blue-600"
                            />
                            Non
                          </label>
                        </div>
                      </div>

                      {currentRecord.ficheUrgence.traitementRegulier && (
                        <div className="flex flex-col gap-1 bg-red-50/20 p-3 rounded-xl border border-dashed border-red-200">
                          <label className="text-xs font-bold text-red-800 uppercase">Précisions Traitement (Médicaments, doses, horaires)</label>
                          <textarea
                            rows={2}
                            value={currentRecord.ficheUrgence.traitementPrecision}
                            onChange={(e) => {
                              const fu = { ...currentRecord.ficheUrgence, traitementPrecision: e.target.value };
                              updateCurrentRecordField('root', 'ficheUrgence', fu);
                            }}
                            placeholder="Ex : Prendre de la Ventoline en cas d'effort ou de crise d'asthme."
                            className="border px-3 py-2 rounded-xl text-xs bg-white focus:outline-blue-500"
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Recommandations particulières des parents / consignes</label>
                        <textarea
                          rows={2.5}
                          value={currentRecord.ficheUrgence.recommandations}
                          onChange={(e) => {
                            const fu = { ...currentRecord.ficheUrgence, recommandations: e.target.value };
                            updateCurrentRecordField('root', 'ficheUrgence', fu);
                          }}
                          placeholder="Ex : En cas de malaise, appeler le 15 puis joindre immédiatement le père."
                          className="border px-3.5 py-2 rounded-xl text-xs bg-white focus:outline-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-600 uppercase">Date de Signature des parents</label>
                          <input
                            type="date"
                            value={currentRecord.ficheUrgence.signatureDate}
                            onChange={(e) => {
                              const fu = { ...currentRecord.ficheUrgence, signatureDate: e.target.value };
                              updateCurrentRecordField('root', 'ficheUrgence', fu);
                            }}
                            className="border px-3.5 py-2.5 rounded-xl text-xs bg-white focus:outline-blue-500 w-full max-w-xs"
                          />
                        </div>

                        <SignaturePad
                          value={currentRecord.signature}
                          onChange={(value) => updateCurrentRecordField('root', 'signature', value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Next/Back tab shortcuts */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {editorTab !== 'eleve' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (editorTab === 'famille') setEditorTab('eleve');
                        else if (editorTab === 'medical') setEditorTab('famille');
                        else if (editorTab === 'autorisations') setEditorTab('medical');
                        else if (editorTab === 'personnes') setEditorTab('autorisations');
                        else if (editorTab === 'urgence') setEditorTab('personnes');
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 px-3.5 py-2 rounded-xl transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Précédent
                    </button>
                  ) : <div />}

                  {editorTab !== 'urgence' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (editorTab === 'eleve') setEditorTab('famille');
                        else if (editorTab === 'famille') setEditorTab('medical');
                        else if (editorTab === 'medical') setEditorTab('autorisations');
                        else if (editorTab === 'autorisations') setEditorTab('personnes');
                        else if (editorTab === 'personnes') setEditorTab('urgence');
                      }}
                      className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-950 flex items-center gap-1 px-4.5 py-2 rounded-xl transition shadow-sm"
                    >
                      Suivant <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : <div />}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* OFF-SCREEN DOM RENDERING FOR HIGH FIDELITY PDF CAPTURE */}
      {/* We position it absolutely at left: -9999px and height: 0, overflow: hidden so that html2canvas */}
      {/* can capture it, but it remains invisible to the actual UI */}
      <div 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px', 
          height: 0, 
          overflow: 'hidden' 
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
