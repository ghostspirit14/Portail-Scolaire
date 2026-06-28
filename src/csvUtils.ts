import { StudentRecord } from './types';

// Flatten a student record into a simple key-value object
export function flattenRecord(record: StudentRecord): Record<string, string> {
  return {
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    anneeScolaire: record.anneeScolaire,
    ecoleNom: record.ecoleNom,
    
    // Élève
    eleve_nom: record.eleve.nom,
    eleve_prenoms: record.eleve.prenoms,
    eleve_sexe: record.eleve.sexe,
    eleve_dateNaissance: record.eleve.dateNaissance,
    eleve_villeNaissance: record.eleve.villeNaissance,
    eleve_departementNaissance: record.eleve.departementNaissance,
    eleve_paysNaissance: record.eleve.paysNaissance,
    eleve_nationalite: record.eleve.nationalite,
    eleve_classe: record.eleve.classe,
    eleve_enseignant: record.eleve.enseignant,
    eleve_ecolePrecedente: record.eleve.ecolePrecedente,
    eleve_villeEcolePrecedente: record.eleve.villeEcolePrecedente,
    eleve_redoublant: record.eleve.redoublant === null ? '' : record.eleve.redoublant ? 'Oui' : 'Non',

    // Parent 1
    parent1_lienParente: record.famille.parent1.lienParente,
    parent1_lienAutrePrecision: record.famille.parent1.lienAutrePrecision || '',
    parent1_nom: record.famille.parent1.nom,
    parent1_prenom: record.famille.parent1.prenom,
    parent1_adresse: record.famille.parent1.adresse,
    parent1_telDomicile: record.famille.parent1.telDomicile,
    parent1_telPortable: record.famille.parent1.telPortable,
    parent1_telProfessionnel: record.famille.parent1.telProfessionnel,
    parent1_courriel: record.famille.parent1.courriel,
    parent1_profession: record.famille.parent1.profession,
    parent1_codeCSP: record.famille.parent1.codeCSP,

    // Parent 2
    parent2_lienParente: record.famille.parent2.lienParente,
    parent2_lienAutrePrecision: record.famille.parent2.lienAutrePrecision || '',
    parent2_nom: record.famille.parent2.nom,
    parent2_prenom: record.famille.parent2.prenom,
    parent2_adresse: record.famille.parent2.adresse,
    parent2_telDomicile: record.famille.parent2.telDomicile,
    parent2_telPortable: record.famille.parent2.telPortable,
    parent2_telProfessionnel: record.famille.parent2.telProfessionnel,
    parent2_courriel: record.famille.parent2.courriel,
    parent2_profession: record.famille.parent2.profession,
    parent2_codeCSP: record.famille.parent2.codeCSP,

    // Fratrie
    fratrie_json: JSON.stringify(record.famille.fratrie),

    // Sécurité Sociale
    secuSociale: record.secuSociale,

    // Médical
    medical_allergies: record.medical.allergies,
    medical_problemesSante: record.medical.problemesSante,
    medical_paiEnCours: record.medical.paiEnCours === null ? '' : record.medical.paiEnCours ? 'Oui' : 'Non',
    medical_medecinNom: record.medical.medecinNom,
    medical_medecinVille: record.medical.medecinVille,
    medical_medecinTel: record.medical.medecinTel,
    medical_hopitalPreference: record.medical.hopitalPreference,

    // Lunettes
    lunettes_porte: record.lunettes.porte === null ? '' : record.lunettes.porte ? 'Oui' : 'Non',
    lunettes_classe: record.lunettes.classe === null ? '' : record.lunettes.classe ? 'Oui' : 'Non',

    // Assurance
    assurance_compagnie: record.assurance.compagnie,
    assurance_numeroContrat: record.assurance.numeroContrat,

    // Autorisation Com
    autorisationCom_associationParents: record.autorisationCom.associationParents === null ? '' : record.autorisationCom.associationParents ? 'Oui' : 'Non',
    autorisationCom_autresFamilles: record.autorisationCom.autresFamilles === null ? '' : record.autorisationCom.autresFamilles ? 'Oui' : 'Non',

    // Droit à l'image
    droitImage_siteInternet: record.droitImage.siteInternet === null ? '' : record.droitImage.siteInternet ? 'Oui' : 'Non',
    droitImage_journalEcole: record.droitImage.journalEcole === null ? '' : record.droitImage.journalEcole ? 'Oui' : 'Non',

    // Personnes autorisées & Contacts d'urgence
    personnesAutorisees_json: JSON.stringify(record.personnesAutorisees),
    contactsPrevenir_json: JSON.stringify(record.ficheUrgence.contactsPrevenir),

    // Fiche d'urgence détails
    ficheUrgence_allergiesMedicamenteuses: record.ficheUrgence.allergiesMedicamenteuses ? 'Oui' : 'Non',
    ficheUrgence_allergiesAlimentaires: record.ficheUrgence.allergiesAlimentaires ? 'Oui' : 'Non',
    ficheUrgence_allergiesVenins: record.ficheUrgence.allergiesVenins ? 'Oui' : 'Non',
    ficheUrgence_allergiesPrecision: record.ficheUrgence.allergiesPrecision,
    ficheUrgence_asthme: record.ficheUrgence.asthme ? 'Oui' : 'Non',
    ficheUrgence_diabete: record.ficheUrgence.diabete ? 'Oui' : 'Non',
    ficheUrgence_autreSante: record.ficheUrgence.autreSante,
    ficheUrgence_traitementRegulier: record.ficheUrgence.traitementRegulier === null ? '' : record.ficheUrgence.traitementRegulier ? 'Oui' : 'Non',
    ficheUrgence_traitementPrecision: record.ficheUrgence.traitementPrecision,
    ficheUrgence_recommandations: record.ficheUrgence.recommandations,
    ficheUrgence_signatureDate: record.ficheUrgence.signatureDate,
  };
}

// Convert flat object back to structured StudentRecord
export function inflateRecord(flat: Record<string, string>): StudentRecord {
  const parseBool = (val: string): boolean | null => {
    if (val === 'Oui') return true;
    if (val === 'Non') return false;
    return null;
  };

  const parseArray = <T>(val: string, fallback: T[]): T[] => {
    try {
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    id: flat.id || crypto.randomUUID(),
    createdAt: flat.createdAt || new Date().toISOString(),
    updatedAt: flat.updatedAt || new Date().toISOString(),
    anneeScolaire: flat.anneeScolaire || '2025-2026',
    ecoleNom: flat.ecoleNom || 'ÉCOLE PRIMAIRE DE FONTENAY LE PESNEL',
    
    eleve: {
      nom: flat.eleve_nom || '',
      prenoms: flat.eleve_prenoms || '',
      sexe: (flat.eleve_sexe as 'M' | 'F' | '') || '',
      dateNaissance: flat.eleve_dateNaissance || '',
      villeNaissance: flat.eleve_villeNaissance || '',
      departementNaissance: flat.eleve_departementNaissance || '',
      paysNaissance: flat.eleve_paysNaissance || 'France',
      nationalite: flat.eleve_nationalite || 'Française',
      classe: flat.eleve_classe || '',
      enseignant: flat.eleve_enseignant || '',
      ecolePrecedente: flat.eleve_ecolePrecedente || '',
      villeEcolePrecedente: flat.eleve_villeEcolePrecedente || '',
      redoublant: parseBool(flat.eleve_redoublant),
    },
    
    famille: {
      parent1: {
        lienParente: (flat.parent1_lienParente as any) || '',
        lienAutrePrecision: flat.parent1_lienAutrePrecision || '',
        nom: flat.parent1_nom || '',
        prenom: flat.parent1_prenom || '',
        adresse: flat.parent1_adresse || '',
        telDomicile: flat.parent1_telDomicile || '',
        telPortable: flat.parent1_telPortable || '',
        telProfessionnel: flat.parent1_telProfessionnel || '',
        courriel: flat.parent1_courriel || '',
        profession: flat.parent1_profession || '',
        codeCSP: flat.parent1_codeCSP || '',
      },
      parent2: {
        lienParente: (flat.parent2_lienParente as any) || '',
        lienAutrePrecision: flat.parent2_lienAutrePrecision || '',
        nom: flat.parent2_nom || '',
        prenom: flat.parent2_prenom || '',
        adresse: flat.parent2_adresse || '',
        telDomicile: flat.parent2_telDomicile || '',
        telPortable: flat.parent2_telPortable || '',
        telProfessionnel: flat.parent2_telProfessionnel || '',
        courriel: flat.parent2_courriel || '',
        profession: flat.parent2_profession || '',
        codeCSP: flat.parent2_codeCSP || '',
      },
      fratrie: parseArray(flat.fratrie_json, []),
    },
    
    secuSociale: flat.secuSociale || '',
    
    medical: {
      allergies: flat.medical_allergies || '',
      problemesSante: flat.medical_problemesSante || '',
      paiEnCours: parseBool(flat.medical_paiEnCours),
      medecinNom: flat.medical_medecinNom || '',
      medecinVille: flat.medical_medecinVille || '',
      medecinTel: flat.medical_medecinTel || '',
      hopitalPreference: flat.medical_hopitalPreference || '',
    },
    
    lunettes: {
      porte: parseBool(flat.lunettes_porte),
      classe: parseBool(flat.lunettes_classe),
    },
    
    assurance: {
      compagnie: flat.assurance_compagnie || '',
      numeroContrat: flat.assurance_numeroContrat || '',
    },
    
    autorisationCom: {
      associationParents: parseBool(flat.autorisationCom_associationParents),
      autresFamilles: parseBool(flat.autorisationCom_autresFamilles),
    },
    
    droitImage: {
      siteInternet: parseBool(flat.droitImage_siteInternet),
      journalEcole: parseBool(flat.droitImage_journalEcole),
    },
    
    personnesAutorisees: parseArray(flat.personnesAutorisees_json, []),
    
    ficheUrgence: {
      contactsPrevenir: parseArray(flat.contactsPrevenir_json, []),
      allergiesMedicamenteuses: flat.ficheUrgence_allergiesMedicamenteuses === 'Oui',
      allergiesAlimentaires: flat.ficheUrgence_allergiesAlimentaires === 'Oui',
      allergiesVenins: flat.ficheUrgence_allergiesVenins === 'Oui',
      allergiesPrecision: flat.ficheUrgence_allergiesPrecision || '',
      asthme: flat.ficheUrgence_asthme === 'Oui',
      diabete: flat.ficheUrgence_diabete === 'Oui',
      autreSante: flat.ficheUrgence_autreSante || '',
      traitementRegulier: parseBool(flat.ficheUrgence_traitementRegulier),
      traitementPrecision: flat.ficheUrgence_traitementPrecision || '',
      recommandations: flat.ficheUrgence_recommandations || '',
      signatureDate: flat.ficheUrgence_signatureDate || '',
    },
  };
}

// Convert student records array to CSV string
export function exportToCSV(records: StudentRecord[]): string {
  if (records.length === 0) return '';
  
  const flattenedList = records.map(flattenRecord);
  const headers = Object.keys(flattenedList[0]);
  
  // French Excel default: Semicolon separator, UTF-8 with BOM for correct accents
  const csvRows = [headers.join(';')];
  
  for (const flat of flattenedList) {
    const row = headers.map(header => {
      const val = flat[header] || '';
      // Escape double quotes and wrap in quotes if contains separator or quotes or newlines
      const escaped = val.replace(/"/g, '""');
      if (escaped.includes(';') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    });
    csvRows.push(row.join(';'));
  }
  
  return csvRows.join('\r\n');
}

// Parse CSV string back into StudentRecord array
export function importFromCSV(csvContent: string): StudentRecord[] {
  const records: StudentRecord[] = [];
  const lines: string[] = [];
  
  // Handle different newline encodings
  let currentLine = '';
  let insideQuotes = false;
  
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    }
    
    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && csvContent[i + 1] === '\n') {
        i++; // Skip \n
      }
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  
  if (lines.length < 2) return [];
  
  // Clean headers
  // Support either comma or semicolon as separator
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  const headers = splitCSVLine(firstLine, separator).map(h => h.trim().replace(/^\uFEFF/, '')); // Remove BOM if present
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCSVLine(lines[i], separator);
    const flat: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      flat[header] = values[index] || '';
    });
    
    records.push(inflateRecord(flat));
  }
  
  return records;
}

// Helper to split CSV line keeping quoted fields intact
function splitCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
