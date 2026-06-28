export interface ParentType {
  lienParente: 'Père' | 'Mère' | 'Autre' | '';
  lienAutrePrecision?: string;
  nom: string;
  prenom: string;
  adresse: string;
  telDomicile: string;
  telPortable: string;
  telProfessionnel: string;
  courriel: string;
  profession: string;
  codeCSP: string;
}

export interface BrotherSisterType {
  id: string;
  nomPrenom: string;
  dateNaissance: string;
  ecoleClasse: string;
}

export interface PersonneAutoriseeType {
  id: string;
  nomPrenom: string;
  lienParente: string;
  telephone: string;
}

export interface ContactPrevenirType {
  id: string;
  nomPrenom: string;
  lien: string;
  telephone: string;
}

export interface StudentRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  anneeScolaire: string;
  ecoleNom: string;
  
  // SECTION 1: ÉLÈVE
  eleve: {
    nom: string;
    prenoms: string;
    sexe: 'M' | 'F' | '';
    dateNaissance: string;
    villeNaissance: string;
    departementNaissance: string;
    paysNaissance: string;
    nationalite: string;
    classe: string;
    enseignant: string;
    ecolePrecedente: string;
    villeEcolePrecedente: string;
    redoublant: boolean | null;
  };

  // SECTION 2: FAMILLE
  famille: {
    parent1: ParentType;
    parent2: ParentType;
    fratrie: BrotherSisterType[];
  };

  // N° SÉCURITÉ SOCIALE
  secuSociale: string;

  // SECTION 3: SITUATION MÉDICALE & URGENCE
  medical: {
    allergies: string;
    problemesSante: string;
    paiEnCours: boolean | null;
    medecinNom: string;
    medecinVille: string;
    medecinTel: string;
    hopitalPreference: string;
  };

  // SECTION 4: LUNETTES
  lunettes: {
    porte: boolean | null;
    classe: boolean | null;
  };

  // SECTION 5: ASSURANCE
  assurance: {
    compagnie: string;
    numeroContrat: string;
  };

  // SECTION 6: AUTORISATION DE COMMUNICATION
  autorisationCom: {
    associationParents: boolean | null;
    autresFamilles: boolean | null;
  };

  // SECTION 7: DROIT A L'IMAGE
  droitImage: {
    siteInternet: boolean | null;
    journalEcole: boolean | null;
  };

  // SECTION 8: PERSONNES AUTORISÉES
  personnesAutorisees: PersonneAutoriseeType[];

  // FICHE D'URGENCE (PAGE 5)
  ficheUrgence: {
    contactsPrevenir: ContactPrevenirType[];
    allergiesMedicamenteuses: boolean;
    allergiesAlimentaires: boolean;
    allergiesVenins: boolean;
    allergiesPrecision: string;
    asthme: boolean;
    diabete: boolean;
    autreSante: string;
    traitementRegulier: boolean | null;
    traitementPrecision: string;
    recommandations: string;
    signatureDate: string;
  };
}

export const INITIAL_RECORD = (schoolName: string = "ÉCOLE PRIMAIRE DE FONTENAY LE PESNEL", schoolYear: string = "2025-2026"): StudentRecord => ({
  id: '',
  createdAt: '',
  updatedAt: '',
  anneeScolaire: schoolYear,
  ecoleNom: schoolName,
  eleve: {
    nom: '',
    prenoms: '',
    sexe: '',
    dateNaissance: '',
    villeNaissance: '',
    departementNaissance: '',
    paysNaissance: 'France',
    nationalite: 'Française',
    classe: '',
    enseignant: '',
    ecolePrecedente: '',
    villeEcolePrecedente: '',
    redoublant: null,
  },
  famille: {
    parent1: {
      lienParente: '',
      lienAutrePrecision: '',
      nom: '',
      prenom: '',
      adresse: '',
      telDomicile: '',
      telPortable: '',
      telProfessionnel: '',
      courriel: '',
      profession: '',
      codeCSP: '',
    },
    parent2: {
      lienParente: '',
      lienAutrePrecision: '',
      nom: '',
      prenom: '',
      adresse: '',
      telDomicile: '',
      telPortable: '',
      telProfessionnel: '',
      courriel: '',
      profession: '',
      codeCSP: '',
    },
    fratrie: [],
  },
  secuSociale: '',
  medical: {
    allergies: '',
    problemesSante: '',
    paiEnCours: null,
    medecinNom: '',
    medecinVille: '',
    medecinTel: '',
    hopitalPreference: '',
  },
  lunettes: {
    porte: null,
    classe: null,
  },
  assurance: {
    compagnie: '',
    numeroContrat: '',
  },
  autorisationCom: {
    associationParents: null,
    autresFamilles: null,
  },
  droitImage: {
    siteInternet: null,
    journalEcole: null,
  },
  personnesAutorisees: [],
  ficheUrgence: {
    contactsPrevenir: [],
    allergiesMedicamenteuses: false,
    allergiesAlimentaires: false,
    allergiesVenins: false,
    allergiesPrecision: '',
    asthme: false,
    diabete: false,
    autreSante: '',
    traitementRegulier: null,
    traitementPrecision: '',
    recommandations: '',
    signatureDate: '',
  },
});

export interface CSPCodeType {
  code: string;
  label: string;
}

export const CSP_CODES: CSPCodeType[] = [
  { code: '10', label: 'Agriculteurs exploitants' },
  { code: '21', label: 'Artisans' },
  { code: '22', label: 'Commerçants et assimilés' },
  { code: '23', label: "Chefs d'entreprise de 10 salariés ou plus" },
  { code: '31', label: 'Professions libérales' },
  { code: '33', label: 'Cadres de la fonction publique' },
  { code: '34', label: 'Professeurs, professions scientifiques' },
  { code: '35', label: "Professions de l'information, des arts et des spectacles" },
  { code: '37', label: "Cadres administratifs et commerciaux d'entreprise" },
  { code: '38', label: "Ingénieurs et cadres techniques d'entreprise" },
  { code: '42', label: 'Professeurs des écoles, instituteurs et assimilés' },
  { code: '43', label: "Professions intermédiaires de la santé et du travail social" },
  { code: '44', label: 'Clergé, religieux' },
  { code: '45', label: "Professions intermédiaires administratives de la fonction publique" },
  { code: '46', label: "Professions intermédiaires administratives et commerciales des entreprises" },
  { code: '47', label: 'Techniciens' },
  { code: '48', label: 'Contremaîtres, agents de maîtrise' },
  { code: '52', label: 'Employés civils et agents de service de la fonction publique' },
  { code: '53', label: 'Policiers et militaires' },
  { code: '54', label: "Employés administratifs d'entreprise" },
  { code: '55', label: 'Employés de commerce' },
  { code: '56', label: 'Personnels des services directs aux particuliers' },
  { code: '62', label: 'Ouvriers qualifiés de type industriel' },
  { code: '63', label: 'Ouvriers qualifiés de type artisanal' },
  { code: '64', label: 'Chauffeurs' },
  { code: '65', label: 'Ouvriers qualifiés de la manutention, du magasinage et des transports' },
  { code: '67', label: 'Ouvriers non qualifiés de type industriel' },
  { code: '68', label: 'Ouvriers non qualifiés de type artisanal' },
  { code: '69', label: 'Ouvriers agricoles' },
  { code: '71', label: 'Anciens agriculteurs exploitants' },
  { code: '72', label: "Anciens artisans, commerçants, chefs d'entreprise" },
  { code: '74', label: 'Anciens cadres' },
  { code: '75', label: 'Anciennes professions intermédiaires' },
  { code: '77', label: 'Anciens employés' },
  { code: '78', label: 'Anciens ouvriers' },
  { code: '81', label: "Chômeurs n'ayant jamais travaillé" },
  { code: '84', label: 'Élèves, étudiants' },
  { code: '85', label: 'Personnes sans activité professionnelle de moins de 60 ans (sauf retraités)' },
  { code: '86', label: 'Personnes sans activité professionnelle de 60 ans et plus (sauf retraités)' },
  { code: '99', label: 'Sans profession (sans précision)' },
];
