import React from 'react';
import { StudentRecord, CSP_CODES, getPreviousSchoolYear } from '../types';

interface PrintPreviewProps {
  record: StudentRecord;
  includeCSP: boolean;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ record, includeCSP }) => {
  // Helper to format dates cleanly
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '... / ... / ......';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper to render value or dotted line placeholder
  const renderField = (value: string | null | undefined, placeholderLength: number = 20) => {
    if (value !== undefined && value !== null && value.trim() !== '') {
      return <span className="font-mono font-medium text-blue-900 px-1">{value}</span>;
    }
    return <span className="text-gray-400 font-mono">{".".repeat(placeholderLength)}</span>;
  };

  const renderCheckbox = (checked: boolean | null | undefined) => {
    return (
      <span className={`inline-flex items-center justify-center w-4 h-4 border border-black rounded-sm mr-1 font-mono text-xs leading-none select-none font-bold ${checked ? 'bg-black text-white' : 'bg-white text-transparent'}`}>
        {checked ? 'X' : ''}
      </span>
    );
  };

  return (
    <div id="school-fiche-print-container" className="bg-gray-100 p-4 overflow-auto flex flex-col items-center gap-8" style={{ width: '100%', maxWidth: '850px' }}>
      {/* PAGE 1: FICHE DE RENSEIGNEMENT (ÉLÈVE, FAMILLE) */}
      <div id="print-page-1" className="bg-white text-black font-sans p-10 flex flex-col justify-between shadow-md print:shadow-none" style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}>
        <div>
          {/* Header */}
          <div className="text-center font-bold text-sm tracking-wide mb-2 uppercase">
            A remettre à l'école obligatoirement à chaque rentrée scolaire
          </div>
          
          <div className="border-4 border-black p-3 mb-4 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Fiche de Renseignement Scolaire</h1>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase">
              <div className="text-left">ÉCOLE : <span className="underline">{record.ecoleNom || '...................................................'}</span></div>
              <div className="text-right">ANNÉE SCOLAIRE : <span className="underline">{record.anneeScolaire || '2026 - 2027'}</span></div>
            </div>
          </div>

          {/* SECTION 1: ÉLÈVE */}
          <div className="border-2 border-black p-2 mb-3">
            <h2 className="text-[11px] font-bold uppercase bg-black text-white px-2 py-0.5 mb-2 inline-block">1 - ÉLÈVE</h2>
            
            <div className="space-y-2 text-[11px]">
              {/* 1.1 - État Civil */}
              <div>
                <div className="font-bold underline text-[10px] mb-1 uppercase">1.1 - État Civil de l'Élève</div>
                <div className="grid grid-cols-1 gap-1 text-[11px]">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold uppercase">Nom de famille :</span> {renderField(record.eleve.nom, 24)}</div>
                    <div><span className="font-semibold uppercase">Prénom :</span> {renderField(record.eleve.prenoms, 24)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold uppercase">Sexe :</span>
                      <span className="flex items-center gap-0.5">{renderCheckbox(record.eleve.sexe === 'M')} M</span>
                      <span className="flex items-center gap-0.5">{renderCheckbox(record.eleve.sexe === 'F')} F</span>
                    </div>
                    <div><span className="font-semibold uppercase">Né(e) le :</span> {renderField(formatDate(record.eleve.dateNaissance), 10)}</div>
                    <div><span className="font-semibold uppercase">À :</span> {renderField(record.eleve.villeNaissance, 12)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold uppercase">Département de naissance :</span> {renderField(record.eleve.departementNaissance, 12)}</div>
                    <div><span className="font-semibold uppercase">Nationalité :</span> {renderField(record.eleve.nationalite, 15)}</div>
                  </div>
                </div>
              </div>

              {/* 1.2 - Année scolaire */}
              <div className="border-t border-gray-300 pt-1.5">
                <div className="font-bold underline text-[10px] mb-1 uppercase">1.2 - Année Scolaire {getPreviousSchoolYear(record.anneeScolaire)}</div>
                <div className="grid grid-cols-1 gap-1 text-[11px]">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold uppercase">Classe ({getPreviousSchoolYear(record.anneeScolaire)}) :</span> {renderField(record.eleve.classePrecedente, 15)}</div>
                    <div><span className="font-semibold uppercase">Enseignant(e) ({getPreviousSchoolYear(record.anneeScolaire)}) :</span> {renderField(record.eleve.enseignantPrecedent, 15)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold uppercase">École fréquentée :</span> {renderField(record.eleve.ecolePrecedente, 18)}</div>
                    <div><span className="font-semibold uppercase">Ville :</span> {renderField(record.eleve.villeEcolePrecedente, 15)}</div>
                  </div>
                  <div className="flex gap-6 items-center">
                    <span className="font-semibold uppercase">L'élève est-il redoublant ? :</span>
                    <span className="flex items-center gap-1">{renderCheckbox(record.eleve.redoublant === true)} Oui</span>
                    <span className="flex items-center gap-1">{renderCheckbox(record.eleve.redoublant === false)} Non</span>
                  </div>
                </div>
              </div>

              {/* 1.3 - Scolarité */}
              <div className="border-t border-gray-300 pt-1.5">
                <div className="font-bold underline text-[10px] mb-1 uppercase">1.3 - Scolarité {record.anneeScolaire || '2026-2027'}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="font-semibold uppercase">Classe ({record.anneeScolaire || '2026-2027'}) :</span> {renderField(record.eleve.classe, 18)}</div>
                  <div><span className="font-semibold uppercase">Enseignant(e) ({record.anneeScolaire || '2026-2027'}) :</span> {renderField(record.eleve.enseignant, 18)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: FAMILLE */}
          <div className="border-2 border-black p-3">
            <h2 className="text-xs font-bold uppercase bg-black text-white px-2 py-1 mb-3 inline-block">2 - FAMILLE</h2>
            
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              {/* Représentant 1 */}
              <div className="border-r border-gray-300 pr-3">
                <div className="font-bold underline mb-1 text-center uppercase">REPRÉSENTANT LÉGAL 1</div>
                <div className="flex gap-3 mb-1.5 flex-wrap">
                  <span className="flex items-center gap-0.5">{renderCheckbox(record.famille.parent1.lienParente === 'Père')} Père</span>
                  <span className="flex items-center gap-0.5">{renderCheckbox(record.famille.parent1.lienParente === 'Mère')} Mère</span>
                  <span className="flex items-center gap-0.5">{renderCheckbox(record.famille.parent1.lienParente === 'Autre')} Autre</span>
                </div>
                {record.famille.parent1.lienParente === 'Autre' && (
                  <div className="mb-1.5"><span className="font-semibold">Précision :</span> {renderField(record.famille.parent1.lienAutrePrecision, 15)}</div>
                )}
                <div className="space-y-1.5">
                  <div><span className="font-semibold uppercase">Nom :</span> {renderField(record.famille.parent1.nom, 15)}</div>
                  <div><span className="font-semibold uppercase">Prénom :</span> {renderField(record.famille.parent1.prenom, 15)}</div>
                  <div><span className="font-semibold uppercase">Adresse :</span> {renderField(record.famille.parent1.adresse, 25)}</div>
                  <div><span className="font-semibold uppercase">Tél Domicile :</span> {renderField(record.famille.parent1.telDomicile, 12)}</div>
                  <div><span className="font-semibold uppercase">Tél Portable :</span> {renderField(record.famille.parent1.telPortable, 12)}</div>
                  <div><span className="font-semibold uppercase">Tél Travail :</span> {renderField(record.famille.parent1.telProfessionnel, 12)}</div>
                  <div className="truncate"><span className="font-semibold uppercase">Courriel :</span> {renderField(record.famille.parent1.courriel, 20)}</div>
                  <div><span className="font-semibold uppercase">Profession :</span> {renderField(record.famille.parent1.profession, 15)}</div>
                  <div><span className="font-semibold uppercase">Code C.S.P. (Page 3) :</span> <span className="font-mono bg-gray-100 border px-1.5 py-0.5 rounded font-bold">{record.famille.parent1.codeCSP || '__'}</span></div>
                  <div><span className="font-semibold uppercase">Situation de famille :</span> {renderField(record.famille.parent1.situationFamille, 15)}</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div><span className="font-semibold uppercase">Résid. enfant :</span> {record.famille.parent1.residenceEnfant === true ? 'Oui' : record.famille.parent1.residenceEnfant === false ? 'Non' : '___'}</div>
                    <div><span className="font-semibold uppercase">Aut. parentale :</span> {record.famille.parent1.autoriteParentale === true ? 'Oui' : record.famille.parent1.autoriteParentale === false ? 'Non' : '___'}</div>
                  </div>
                </div>
              </div>

              {/* Représentant 2 */}
              <div className="pl-1">
                <div className="font-bold underline mb-1 text-center uppercase">REPRÉSENTANT LÉGAL 2</div>
                <div className="flex gap-3 mb-1.5 flex-wrap">
                  <span className="flex items-center gap-0.5">{renderCheckbox(record.famille.parent2.lienParente === 'Père')} Père</span>
                  <span className="flex items-center gap-0.5">{renderCheckbox(record.famille.parent2.lienParente === 'Mère')} Mère</span>
                  <span className="flex items-center gap-0.5">{renderCheckbox(record.famille.parent2.lienParente === 'Autre')} Autre</span>
                </div>
                {record.famille.parent2.lienParente === 'Autre' && (
                  <div className="mb-1.5"><span className="font-semibold">Précision :</span> {renderField(record.famille.parent2.lienAutrePrecision, 15)}</div>
                )}
                <div className="space-y-1.5">
                  <div><span className="font-semibold uppercase">Nom :</span> {renderField(record.famille.parent2.nom, 15)}</div>
                  <div><span className="font-semibold uppercase">Prénom :</span> {renderField(record.famille.parent2.prenom, 15)}</div>
                  <div><span className="font-semibold uppercase">Adresse (si diff.) :</span> {renderField(record.famille.parent2.adresse, 25)}</div>
                  <div><span className="font-semibold uppercase">Tél Domicile :</span> {renderField(record.famille.parent2.telDomicile, 12)}</div>
                  <div><span className="font-semibold uppercase">Tél Portable :</span> {renderField(record.famille.parent2.telPortable, 12)}</div>
                  <div><span className="font-semibold uppercase">Tél Travail :</span> {renderField(record.famille.parent2.telProfessionnel, 12)}</div>
                  <div className="truncate"><span className="font-semibold uppercase">Courriel :</span> {renderField(record.famille.parent2.courriel, 20)}</div>
                  <div><span className="font-semibold uppercase">Profession :</span> {renderField(record.famille.parent2.profession, 15)}</div>
                  <div><span className="font-semibold uppercase">Code C.S.P. (Page 3) :</span> <span className="font-mono bg-gray-100 border px-1.5 py-0.5 rounded font-bold">{record.famille.parent2.codeCSP || '__'}</span></div>
                  <div><span className="font-semibold uppercase">Situation de famille :</span> {renderField(record.famille.parent2.situationFamille, 15)}</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div><span className="font-semibold uppercase">Résid. enfant :</span> {record.famille.parent2.residenceEnfant === true ? 'Oui' : record.famille.parent2.residenceEnfant === false ? 'Non' : '___'}</div>
                    <div><span className="font-semibold uppercase">Aut. parentale :</span> {record.famille.parent2.autoriteParentale === true ? 'Oui' : record.famille.parent2.autoriteParentale === false ? 'Non' : '___'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fratrie Table */}
            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase mb-1">Frères et sœurs vivant au foyer :</div>
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-left w-1/2 uppercase font-semibold">Nom et Prénom</th>
                    <th className="border border-black p-1 text-center w-1/4 uppercase font-semibold">Date de Naissance</th>
                    <th className="border border-black p-1 text-left w-1/4 uppercase font-semibold">École fréquentée / Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3].map((index) => {
                    const sibling = record.famille.fratrie[index];
                    return (
                      <tr key={index}>
                        <td className="border border-black p-1 h-5 font-mono text-blue-900">
                          {sibling ? sibling.nomPrenom : ''}
                        </td>
                        <td className="border border-black p-1 h-5 text-center font-mono text-blue-900">
                          {sibling ? formatDate(sibling.dateNaissance) : ''}
                        </td>
                        <td className="border border-black p-1 h-5 font-mono text-blue-900">
                          {sibling ? sibling.ecoleClasse : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] border-t border-gray-300 pt-1">
          <span>{record.eleve.nom ? `${record.eleve.nom} ${record.eleve.prenoms}` : 'Fiche de Renseignement'}</span>
          <span className="font-bold">PAGE 1</span>
        </div>
      </div>

      {/* PAGE 2: SITUATION MÉDICALE, LUNETTES, ASSURANCE, AUTORISATIONS */}
      <div id="print-page-2" className="bg-white text-black font-sans p-10 flex flex-col justify-between shadow-md print:shadow-none" style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}>
        <div>
          {/* Top header block */}
          <div className="border border-black p-2.5 mb-4 text-xs font-semibold uppercase flex items-center justify-between">
            <span>Élève : {record.eleve.nom ? `${record.eleve.nom.toUpperCase()} ${record.eleve.prenoms}` : '...................................................'}</span>
            <div className="flex items-center gap-1.5">
              <span>N° de Sécurité sociale du parent en charge de l'enfant :</span>
              <span className="font-mono bg-gray-100 border-2 border-black px-2 py-0.5 tracking-[3px] text-sm text-blue-900 font-bold">
                {record.secuSociale || '  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .'}
              </span>
            </div>
          </div>

          {/* SECTION 3: SITUATION MÉDICALE */}
          <div className="border-2 border-black p-3.5 mb-4 text-xs">
            <h2 className="text-xs font-bold uppercase bg-black text-white px-2 py-1 mb-3 inline-block">3 - SITUATION MÉDICALE - SITUATION D'URGENCE</h2>
            <div className="space-y-2.5">
              <div>
                <span className="font-semibold uppercase">Allergies ou intolérances alimentaires ou médicamenteuses :</span>
                <p className="mt-1 font-mono text-blue-900 pl-2 bg-gray-50 p-1 rounded min-h-[1.5rem] border border-dashed border-gray-200">{record.medical.allergies || 'Aucune signalée.'}</p>
              </div>
              <div>
                <span className="font-semibold uppercase">Problèmes de santé particuliers (ex: asthme, diabète) :</span>
                <p className="mt-1 font-mono text-blue-900 pl-2 bg-gray-50 p-1 rounded min-h-[1.5rem] border border-dashed border-gray-200">{record.medical.problemesSante || 'Aucun signalé.'}</p>
              </div>
              <div className="flex gap-4 items-center">
                <span className="font-semibold uppercase">Traitement en cours nécessitant un protocole d'accueil individualisé (P.A.I.) :</span>
                <span className="flex items-center gap-1">{renderCheckbox(record.medical.paiEnCours === true)} Oui</span>
                <span className="flex items-center gap-1">{renderCheckbox(record.medical.paiEnCours === false)} Non</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t pt-2.5 mt-2.5">
                <div><span className="font-semibold uppercase">Médecin traitant :</span> {renderField(record.medical.medecinNom, 12)}</div>
                <div><span className="font-semibold uppercase">Ville :</span> {renderField(record.medical.medecinVille, 10)}</div>
                <div><span className="font-semibold uppercase">Tél :</span> {renderField(record.medical.medecinTel, 12)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold uppercase">Hôpital de préférence :</span> {renderField(record.medical.hopitalPreference, 20)}
                </div>
                <div>
                  <span className="font-semibold uppercase">Date dernier rappel vaccin antitétanique :</span> {renderField(record.medical.vaccinAntitetaniqueDate, 15)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-2 mt-2">
                <div>
                  <span className="font-semibold uppercase block text-[9px] text-gray-500">N° et adresse du centre de Sécurité Sociale :</span>
                  <span className="font-mono text-blue-900 text-xs">{record.secuSocialeCentre || '...................................................'}</span>
                </div>
                <div>
                  <span className="font-semibold uppercase block text-[9px] text-gray-500">N° et adresse de l'assurance scolaire :</span>
                  <span className="font-mono text-blue-900 text-xs">{record.assurance.adresse || '...................................................'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: LUNETTES */}
          <div className="border-2 border-black p-3.5 mb-4 text-xs">
            <h2 className="text-xs font-bold uppercase bg-black text-white px-2 py-1 mb-2.5 inline-block">4 - LUNETTES / CORRECTION VISUELLE</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span>L'élève porte-t-il des lunettes / lentilles ?</span>
                <span className="flex items-center gap-1">{renderCheckbox(record.lunettes.porte === true)} Oui</span>
                <span className="flex items-center gap-1">{renderCheckbox(record.lunettes.porte === false)} Non</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Doit-il les porter en classe ?</span>
                <span className="flex items-center gap-1">{renderCheckbox(record.lunettes.classe === true)} Oui</span>
                <span className="flex items-center gap-1">{renderCheckbox(record.lunettes.classe === false)} Non</span>
              </div>
            </div>
          </div>

          {/* SECTION 5: ASSURANCE */}
          <div className="border-2 border-black p-3.5 mb-4 text-xs">
            <h2 className="text-xs font-bold uppercase bg-black text-white px-2 py-1 mb-2.5 inline-block">5 - ASSURANCE SCOLAIRE</h2>
            <p className="text-[10px] text-gray-600 mb-2">L'assurance est obligatoire pour toutes les activités scolaires facultatives (sorties de fin d'année, classes de découvertes, etc.).</p>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div><span className="font-semibold uppercase">Compagnie :</span> {renderField(record.assurance.compagnie, 25)}</div>
              <div><span className="font-semibold uppercase">N° de contrat :</span> {renderField(record.assurance.numeroContrat, 20)}</div>
            </div>
            <div className="border-t pt-1.5 mt-1.5">
              <span className="font-semibold uppercase">N° et adresse de l'assurance scolaire :</span> {renderField(record.assurance.adresse, 50)}
            </div>
          </div>

          {/* SECTION 6: AUTORISATION DE COMMUNICATION */}
          <div className="border-2 border-black p-3.5 mb-4 text-xs">
            <h2 className="text-xs font-bold uppercase bg-black text-white px-2 py-1 mb-2 inline-block">6 - AUTORISATION DE COMMUNICATION DES COORDONNÉES</h2>
            <div className="space-y-1.5 mt-1">
              <div className="flex items-center justify-between">
                <span>J'autorise la communication de mes coordonnées aux associations de parents d'élèves de l'école :</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">{renderCheckbox(record.autorisationCom.associationParents === true)} Oui</span>
                  <span className="flex items-center gap-1">{renderCheckbox(record.autorisationCom.associationParents === false)} Non</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>J'autorise la communication de mes coordonnées aux autres familles de la classe de mon enfant :</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">{renderCheckbox(record.autorisationCom.autresFamilles === true)} Oui</span>
                  <span className="flex items-center gap-1">{renderCheckbox(record.autorisationCom.autresFamilles === false)} Non</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 7: DROIT A L'IMAGE */}
          <div className="border-2 border-black p-3.5 text-xs">
            <h2 className="text-xs font-bold uppercase bg-black text-white px-2 py-1 mb-2 inline-block">7 - AUTORISATION RELATIVE AU DROIT À L'IMAGE</h2>
            <p className="text-[10px] text-gray-600 mb-2">Dans le cadre d'activités pédagogiques, des photos/vidéos de votre enfant peuvent être prises pour illustrer la vie scolaire.</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Publication sur le site ou le blog sécurisé de l'école :</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">{renderCheckbox(record.droitImage.siteInternet === true)} Oui</span>
                  <span className="flex items-center gap-1">{renderCheckbox(record.droitImage.siteInternet === false)} Non</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Publication dans le journal de l'école ou articles de presse locale :</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">{renderCheckbox(record.droitImage.journalEcole === true)} Oui</span>
                  <span className="flex items-center gap-1">{record.droitImage.journalEcole === false ? renderCheckbox(true) : renderCheckbox(false)} Non</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-200">
              <div className="text-[10px]">Date : {renderField(formatDate(new Date().toISOString().split('T')[0]), 10)}</div>
              <div className="text-[10px] text-center w-1/3">
                <span className="font-semibold block uppercase text-[8px] text-gray-500 mb-2">Signature des parents</span>
                <div className="h-10 border border-dashed border-gray-300 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                  {record.signature ? (
                    <img src={record.signature} className="max-h-full max-w-full object-contain" alt="Signature" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-gray-400 text-[9px] italic">Signer après impression</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] border-t border-gray-300 pt-1">
          <span>{record.eleve.nom ? `${record.eleve.nom} ${record.eleve.prenoms}` : 'Fiche de Renseignement'}</span>
          <span className="font-bold">PAGE 2</span>
        </div>
      </div>

      {/* PAGE 3: CODES DES PROFESSIONS (OPTIONAL) */}
      {includeCSP && (
        <div id="print-page-3" className="bg-white text-black font-sans p-10 flex flex-col justify-between shadow-md print:shadow-none" style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}>
          <div>
            <div className="text-center mb-4">
              <h1 className="text-sm font-bold uppercase border-b-2 border-black pb-1.5">CODES DES PROFESSIONS ET CATÉGORIES SOCIO-PROFESSIONNELLES</h1>
              <p className="text-[10px] text-gray-600 mt-1">À utiliser pour remplir les cases "Code C.S.P." en Page 1</p>
            </div>

            <div className="grid grid-cols-2 gap-x-6 text-[9px] leading-tight">
              {/* Left Column */}
              <div className="space-y-3">
                <div>
                  <div className="font-bold uppercase border-b border-black mb-1 bg-gray-100 px-1 py-0.5">1 - AGRICULTEURS EXPLOITANTS</div>
                  <div><span className="font-bold">10</span> - Agriculteurs exploitants</div>
                </div>

                <div>
                  <div className="font-bold uppercase border-b border-black mb-1 bg-gray-100 px-1 py-0.5">2 - ARTISANS, COMMERÇANTS ET CHEFS D'ENTREPRISE</div>
                  <div><span className="font-bold">21</span> - Artisans</div>
                  <div><span className="font-bold">22</span> - Commerçants et assimilés</div>
                  <div><span className="font-bold">23</span> - Chefs d'entreprise de 10 salariés ou plus</div>
                </div>

                <div>
                  <div className="font-bold uppercase border-b border-black mb-1 bg-gray-100 px-1 py-0.5">3 - CADRES ET PROFESSIONS INTELLECTUELLES SUPÉRIEURES</div>
                  <div><span className="font-bold">31</span> - Professions libérales</div>
                  <div><span className="font-bold">33</span> - Cadres de la fonction publique</div>
                  <div><span className="font-bold">34</span> - Professeurs, professions scientifiques</div>
                  <div><span className="font-bold">35</span> - Professions de l'information, des arts et spectacles</div>
                  <div><span className="font-bold">37</span> - Cadres administratifs et commerciaux d'entreprise</div>
                  <div><span className="font-bold">38</span> - Ingénieurs et cadres techniques d'entreprise</div>
                </div>

                <div>
                  <div className="font-bold uppercase border-b border-black mb-1 bg-gray-100 px-1 py-0.5">4 - PROFESSIONS INTERMÉDIAIRES</div>
                  <div><span className="font-bold">42</span> - Professeurs des écoles, instituteurs et assimilés</div>
                  <div><span className="font-bold">43</span> - Professions intermédiaires de la santé / social</div>
                  <div><span className="font-bold">44</span> - Clergé, religieux</div>
                  <div><span className="font-bold">45</span> - Professions intermédiaires de la fonction publique</div>
                  <div><span className="font-bold">46</span> - Professions intermédiaires administratives d'entreprise</div>
                  <div><span className="font-bold">47</span> - Techniciens</div>
                  <div><span className="font-bold">48</span> - Contremaîtres, agents de maîtrise</div>
                </div>

                <div>
                  <div className="font-bold uppercase border-b border-black mb-1 bg-gray-100 px-1 py-0.5">5 - EMPLOYÉS</div>
                  <div><span className="font-bold">52</span> - Employés civils et agents de la fonction publique</div>
                  <div><span className="font-bold">53</span> - Policiers et militaires</div>
                  <div><span className="font-bold">54</span> - Employés administratifs d'entreprise</div>
                  <div><span className="font-bold">55</span> - Employés de commerce</div>
                  <div><span className="font-bold">56</span> - Personnels des services directs aux particuliers</div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div>
                  <div className="font-bold uppercase border-b border-black mb-1 bg-gray-100 px-1 py-0.5">6 - OUVRIERS</div>
                  <div><span className="font-bold">62</span> - Ouvriers qualifiés de type industriel</div>
                  <div><span className="font-bold">63</span> - Ouvriers qualifiés de type artisanal</div>
                  <div><span className="font-bold">64</span> - Chauffeurs</div>
                  <div><span className="font-bold">65</span> - Ouvriers qualifiés manutention/transports</div>
                  <div><span className="font-bold">67</span> - Ouvriers non qualifiés de type industriel</div>
                  <div><span className="font-bold">68</span> - Ouvriers non qualifiés de type artisanal</div>
                  <div><span className="font-bold">69</span> - Ouvriers agricoles</div>
                </div>

                <div>
                  <div className="font-bold uppercase border-b border-black mb-1 bg-gray-100 px-1 py-0.5">7 - RETRAITÉS</div>
                  <div><span className="font-bold">71</span> - Anciens agriculteurs exploitants</div>
                  <div><span className="font-bold">72</span> - Anciens artisans, commerçants, chefs d'entreprise</div>
                  <div><span className="font-bold">74</span> - Anciens cadres</div>
                  <div><span className="font-bold">75</span> - Anciennes professions intermédiaires</div>
                  <div><span className="font-bold">77</span> - Anciens employés</div>
                  <div><span className="font-bold">78</span> - Anciens ouvriers</div>
                </div>

                <div>
                  <div className="font-bold uppercase border-b border-black mb-1 bg-gray-100 px-1 py-0.5">8 - AUTRES PERSONNES SANS ACTIVITÉ PROFESSIONNELLE</div>
                  <div><span className="font-bold">81</span> - Chômeurs n'ayant jamais travaillé</div>
                  <div><span className="font-bold">84</span> - Élèves, étudiants</div>
                  <div><span className="font-bold">85</span> - Sans activité de moins de 60 ans (sauf retraités)</div>
                  <div><span className="font-bold">86</span> - Sans activité de 60 ans et plus (sauf retraités)</div>
                </div>

                <div>
                  <div className="font-bold uppercase border-b border-black mb-1 bg-gray-100 px-1 py-0.5">9 - SANS PROFESSION</div>
                  <div><span className="font-bold">99</span> - Sans profession (sans autre précision)</div>
                </div>

                <div className="border border-dashed border-gray-400 p-2 text-[9px] leading-snug mt-4 bg-gray-50 text-gray-700">
                  <span className="font-bold block uppercase mb-1">Rappel Réglementaire :</span>
                  L'indication de ces catégories socio-professionnelles est demandée pour l'établissement de statistiques académiques confidentielles de l'Éducation Nationale.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[10px] border-t border-gray-300 pt-1">
            <span>Codes des Professions</span>
            <span className="font-bold">PAGE 3</span>
          </div>
        </div>
      )}

      {/* PAGE 4: SECTION 8 - PERSONNES AUTORISÉES */}
      <div id="print-page-4" className="bg-white text-black font-sans p-10 flex flex-col justify-between shadow-md print:shadow-none" style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}>
        <div>
          {/* Top banner */}
          <div className="grid grid-cols-2 gap-4 border border-black p-2.5 mb-4 text-xs font-semibold uppercase">
            <div>Élève : {record.eleve.nom ? `${record.eleve.nom.toUpperCase()} ${record.eleve.prenoms}` : '...................................................'}</div>
            <div className="text-right">Classe ({record.anneeScolaire || '2026-2027'}) : {record.eleve.classe ? record.eleve.classe : '.....................'}</div>
          </div>

          {/* SECTION 8 */}
          <div className="border-2 border-black p-4 mb-4 text-xs">
            <h2 className="text-xs font-bold uppercase bg-black text-white px-2 py-1 mb-3 inline-block">8 - PERSONNES AUTORISÉES À PRENDRE L'ENFANT À LA SORTIE DE L'ÉCOLE</h2>
            <p className="text-[10px] text-gray-600 mb-3 font-medium">
              (Indiquez les personnes majeures qui peuvent venir chercher votre enfant, ou à contacter en cas d'urgence médicale si vous n'êtes pas joignables)
            </p>

            <table className="w-full border-collapse border border-black text-[11px] mb-4">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border border-black p-2 w-[25%] uppercase font-semibold">Nom et Prénom</th>
                  <th className="border border-black p-2 w-[20%] uppercase font-semibold">Lien de parenté / Relation</th>
                  <th className="border border-black p-2 w-[20%] uppercase font-semibold">Téléphone(s)</th>
                  <th className="border border-black p-2 w-[35%] uppercase font-semibold">Adresse complète</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3].map((index) => {
                  const p = record.personnesAutorisees[index];
                  return (
                    <tr key={index}>
                      <td className="border border-black p-2 h-7 font-mono text-blue-900">
                        {p ? p.nomPrenom : ''}
                      </td>
                      <td className="border border-black p-2 h-7 font-mono text-blue-900">
                        {p ? p.lienParente : ''}
                      </td>
                      <td className="border border-black p-2 h-7 font-mono text-blue-900">
                        {p ? p.telephone : ''}
                      </td>
                      <td className="border border-black p-2 h-7 font-mono text-blue-900">
                        {p ? p.adresseComplete : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* EMERGENCY MEDICAL CLAUSE */}
          <div className="border border-black p-4 text-[10.5px] bg-gray-50 text-justify leading-relaxed">
            <h3 className="font-bold uppercase text-center text-xs mb-2">AUTORISATION D'HOSPITALISATION EN CAS D'URGENCE</h3>
            <p>
              Je soussigné(e), responsable légal de l'enfant désigné ci-dessus, déclare :
            </p>
            <p className="mt-1">
              1. Autoriser la direction de l'école ou l'enseignant de ma classe, en cas d'accident ou d'urgence médicale grave, à faire appel aux services de secours d'urgence (SAMU 15, Sapeurs-Pompiers 18) et à faire transporter et hospitaliser mon enfant dans l'établissement hospitalier le plus adapté ou préconisé.
            </p>
            <p className="mt-1">
              2. Autoriser l'équipe médicale d'urgence à pratiquer toutes les interventions et traitements médicaux ou chirurgicaux rendus indispensables par l'état de santé de mon enfant.
            </p>
            
            <div className="flex justify-between items-end mt-8">
              <div>
                <span className="font-semibold block uppercase text-[8px] text-gray-500 mb-1">Fait à (Ville)</span>
                {renderField(record.medical.medecinVille || record.eleve.villeNaissance || record.famille.parent1.adresse.split(' ').pop()?.replace(/\d/g, ''), 15)}
              </div>
              <div>
                <span className="font-semibold block uppercase text-[8px] text-gray-500 mb-1">Le (Date)</span>
                {renderField(formatDate(new Date().toISOString().split('T')[0]), 10)}
              </div>
              <div className="text-center w-1/3">
                <span className="font-semibold block uppercase text-[8px] text-gray-500 mb-2">Signature du Représentant Légal</span>
                <div className="h-10 border border-dashed border-gray-300 bg-white rounded flex items-center justify-center overflow-hidden">
                  {record.signature ? (
                    <img src={record.signature} className="max-h-full max-w-full object-contain" alt="Signature" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-gray-400 text-[8px] italic">Signer après impression</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] border-t border-gray-300 pt-1">
          <span>{record.eleve.nom ? `${record.eleve.nom} ${record.eleve.prenoms}` : 'Fiche de Renseignement'}</span>
          <span className="font-bold">{includeCSP ? 'PAGE 4' : 'PAGE 3'}</span>
        </div>
      </div>

      {/* PAGE 5: FICHE D'URGENCE À L'ATTENTION DES PARENTS */}
      <div id="print-page-5" className="bg-white text-black font-sans p-10 flex flex-col justify-between shadow-md print:shadow-none" style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}>
        <div>
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-400 pb-2 mb-4">
            <div>
              <h1 className="text-[13px] font-bold uppercase tracking-wide text-red-700">FICHE D'URGENCE À L'ATTENTION DES PARENTS</h1>
              <p className="text-[9px] text-gray-600 italic mt-0.5">* Document non confidentiel à remplir par les familles au début de l'année scolaire</p>
            </div>
            <div className="text-right text-[10px] font-bold uppercase">
              <div>ÉCOLE : <span className="underline">{record.ecoleNom || 'DE FONTENAY LE PESNEL'}</span></div>
              <div>ANNÉE : <span className="underline">{record.anneeScolaire || '2026-2027'}</span></div>
            </div>
          </div>

          {/* TWO COLUMN GRID FOR BASIC INFO */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Pupil Information */}
            <div className="border border-black p-3 rounded">
              <h2 className="text-[10px] font-bold uppercase bg-red-700 text-white px-2 py-0.5 mb-2 inline-block rounded-sm">RENSEIGNEMENTS ÉLÈVE</h2>
              <div className="space-y-1.5 text-xs">
                <div><span className="font-semibold uppercase">Nom :</span> {renderField(record.eleve.nom, 15)}</div>
                <div><span className="font-semibold uppercase">Prénom :</span> {renderField(record.eleve.prenoms, 15)}</div>
                <div className="grid grid-cols-2 gap-1">
                  <div><span className="font-semibold uppercase">Né(e) le :</span> {renderField(formatDate(record.eleve.dateNaissance), 10)}</div>
                  <div><span className="font-semibold uppercase">Classe ({record.anneeScolaire || '2026-2027'}) :</span> {renderField(record.eleve.classe, 8)}</div>
                </div>
                <div><span className="font-semibold uppercase">Enseignant(e) ({record.anneeScolaire || '2026-2027'}) :</span> {renderField(record.eleve.enseignant, 15)}</div>
                <div><span className="font-semibold uppercase">Adresse :</span> {renderField(record.famille.parent1.adresse || record.famille.parent2.adresse, 20)}</div>
              </div>
            </div>

            {/* Legal Guardians Information */}
            <div className="border border-black p-3 rounded">
              <h2 className="text-[10px] font-bold uppercase bg-red-700 text-white px-2 py-0.5 mb-2 inline-block rounded-sm">RESPONSABLES LÉGAUX</h2>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="font-semibold uppercase block text-[10px] border-b pb-0.5 mb-1 text-gray-600">Parent 1: {record.famille.parent1.prenom} {record.famille.parent1.nom}</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div><span className="font-semibold">Port:</span> {renderField(record.famille.parent1.telPortable, 10)}</div>
                    <div><span className="font-semibold">Pro:</span> {renderField(record.famille.parent1.telProfessionnel, 10)}</div>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="font-semibold uppercase block text-[10px] border-b pb-0.5 mb-1 text-gray-600">Parent 2: {record.famille.parent2.prenom} {record.famille.parent2.nom}</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div><span className="font-semibold">Port:</span> {renderField(record.famille.parent2.telPortable, 10)}</div>
                    <div><span className="font-semibold">Pro:</span> {renderField(record.famille.parent2.telProfessionnel, 10)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTACTS IN ABSENCE OF PARENTS */}
          <div className="border border-black p-3 mb-4 rounded text-xs">
            <h2 className="text-[10px] font-bold uppercase bg-red-700 text-white px-2 py-0.5 mb-2 inline-block rounded-sm">PERSONNES À PRÉVENIR EN CAS D'URGENCE (si parents injoignables)</h2>
            <table className="w-full border-collapse border border-black text-[10.5px]">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border border-black p-1 w-1/3 uppercase font-semibold">Nom et Prénom</th>
                  <th className="border border-black p-1 w-1/4 uppercase font-semibold">Lien / Relation</th>
                  <th className="border border-black p-1 w-5/12 uppercase font-semibold">Numéros de téléphone</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1].map((index) => {
                  const p = record.ficheUrgence.contactsPrevenir[index] || record.personnesAutorisees[index];
                  return (
                    <tr key={index}>
                      <td className="border border-black p-1 h-6 font-mono text-blue-900">
                        {p ? p.nomPrenom : ''}
                      </td>
                      <td className="border border-black p-1 h-6 font-mono text-blue-900">
                        {p ? (p.lienParente || (p as any).lien || '') : ''}
                      </td>
                      <td className="border border-black p-1 h-6 font-mono text-blue-900">
                        {p ? p.telephone : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MEDICAL INFO FOR EMERGENCY */}
          <div className="border border-black p-3.5 mb-4 rounded text-xs">
            <h2 className="text-[10px] font-bold uppercase bg-red-700 text-white px-2 py-0.5 mb-2 inline-block rounded-sm">RENSEIGNEMENTS MÉDICAUX CONCERNANT L'ÉLÈVE</h2>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="font-semibold uppercase">Allergies graves :</span>
                <span className="flex items-center gap-0.5">{renderCheckbox(record.ficheUrgence.allergiesMedicamenteuses)} Médicamenteuses</span>
                <span className="flex items-center gap-0.5">{renderCheckbox(record.ficheUrgence.allergiesAlimentaires)} Alimentaires</span>
                <span className="flex items-center gap-0.5">{renderCheckbox(record.ficheUrgence.allergiesVenins)} Venins</span>
              </div>
              
              {(record.ficheUrgence.allergiesMedicamenteuses || record.ficheUrgence.allergiesAlimentaires || record.ficheUrgence.allergiesVenins || record.ficheUrgence.allergiesPrecision) && (
                <div className="bg-red-50 border border-red-100 p-1.5 rounded text-[11px]">
                  <span className="font-semibold text-red-800">Précisions Allergies (ex: Pénicilline, Arachide, Guêpes) :</span>
                  <p className="font-mono text-blue-900 mt-0.5">{record.ficheUrgence.allergiesPrecision || record.medical.allergies || 'Non spécifié.'}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t pt-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase">Asthme connu :</span>
                  <span className="flex items-center gap-1">{renderCheckbox(record.ficheUrgence.asthme === true)} Oui</span>
                  <span className="flex items-center gap-1">{renderCheckbox(record.ficheUrgence.asthme === false)} Non</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase">Diabète :</span>
                  <span className="flex items-center gap-1">{renderCheckbox(record.ficheUrgence.diabete === true)} Oui</span>
                  <span className="flex items-center gap-1">{renderCheckbox(record.ficheUrgence.diabete === false)} Non</span>
                </div>
              </div>

              <div>
                <span className="font-semibold uppercase">Autre problème de santé important à signaler :</span>
                <p className="mt-1 font-mono text-blue-900 pl-2 bg-gray-50 p-1 rounded min-h-[1.5rem] border border-dashed border-gray-200">
                  {record.ficheUrgence.autreSante || record.medical.problemesSante || 'Aucun.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold uppercase">L'enfant suit-il un traitement médical régulier :</span>
                <span className="flex items-center gap-1">{renderCheckbox(record.ficheUrgence.traitementRegulier === true)} Oui</span>
                <span className="flex items-center gap-1">{renderCheckbox(record.ficheUrgence.traitementRegulier === false)} Non</span>
              </div>

              {record.ficheUrgence.traitementRegulier && (
                <div className="bg-gray-50 p-1.5 rounded text-[11px] border border-dashed">
                  <span className="font-semibold">Précisions Traitement (médicaments, posologie, horaires à l'école) :</span>
                  <p className="font-mono text-blue-900 mt-0.5">{record.ficheUrgence.traitementPrecision || 'Non spécifié.'}</p>
                </div>
              )}

              <div>
                <span className="font-semibold uppercase">Recommandations particulières des parents :</span>
                <p className="mt-1 font-mono text-blue-900 pl-2 bg-gray-50 p-1 rounded min-h-[1.5rem] border border-dashed border-gray-200">
                  {record.ficheUrgence.recommandations || 'Aucune.'}
                </p>
              </div>

              {/* COMPLEMENTARY MEDICAL INFORMATION REQUIRED FOR EMERGENCY SHEET */}
              <div className="border-t border-gray-300 pt-2.5 mt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px]">
                <div>
                  <span className="font-bold uppercase text-[9px] text-gray-500 block">Coordonnées du Médecin Traitant :</span>
                  <span className="font-mono text-blue-900">
                    {record.medical.medecinNom ? `Dr. ${record.medical.medecinNom} (${record.medical.medecinVille || ''}) - Tél: ${record.medical.medecinTel || ''}` : '...................................................'}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase text-[9px] text-gray-500 block">Dernier rappel de vaccin antitétanique :</span>
                  <span className="font-mono text-blue-900">
                    {record.medical.vaccinAntitetaniqueDate || '...................................................'}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase text-[9px] text-gray-500 block">Adresse du centre de Sécurité Sociale :</span>
                  <span className="font-mono text-blue-900">
                    {record.secuSocialeCentre || '...................................................'}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase text-[9px] text-gray-500 block">Adresse de l'Assurance Scolaire :</span>
                  <span className="font-mono text-blue-900">
                    {record.assurance.adresse || '...................................................'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1 col-span-2 border-t border-dashed border-gray-200 pt-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase text-[9.5px]">Présence d'un P.A.I. en cours :</span>
                    <span className="flex items-center gap-1">{renderCheckbox(record.medical.paiEnCours === true)} Oui</span>
                    <span className="flex items-center gap-1">{renderCheckbox(record.medical.paiEnCours === false)} Non</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase text-[9.5px]">Existence d'un P.A.P. (Plan d'Accompagnement Personnalisé) :</span>
                    <span className="flex items-center gap-1">{renderCheckbox(record.medical.papEnCours === true)} Oui</span>
                    <span className="flex items-center gap-1">{renderCheckbox(record.medical.papEnCours === false)} Non</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE SECTION FOR EMERGENCY */}
          <div className="border border-black p-3 rounded bg-red-50 text-[10.5px]">
            <p className="font-medium text-red-900 text-center uppercase mb-1.5">Consignes réglementaires de transport d'urgence</p>
            <p className="text-gray-700 leading-relaxed text-[9.5px]">
              En cas d'accident ou d'urgence médicale nécessitant une intervention immédiate, le chef d'établissement ou l'enseignant prendra les mesures d'urgence qui s'imposent en contactant le SAMU (15) ou les Pompiers (18). L'enfant sera transporté par l'ambulance de secours vers le centre hospitalier public le plus proche ou l'hôpital de préférence stipulé. Les parents seront avisés immédiatement.
            </p>
            <div className="flex justify-between items-end mt-4">
              <div className="text-[10px]">Date : {renderField(record.ficheUrgence.signatureDate || formatDate(new Date().toISOString().split('T')[0]), 10)}</div>
              <div className="text-center w-1/3">
                <span className="font-semibold block uppercase text-[8px] text-gray-500 mb-2">Signature des parents</span>
                <div className="h-10 border border-dashed border-gray-300 bg-white rounded flex items-center justify-center overflow-hidden">
                  {record.signature ? (
                    <img src={record.signature} className="max-h-full max-w-full object-contain" alt="Signature" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-gray-400 text-[8px] italic">Signer après impression</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] border-t border-gray-300 pt-1 text-red-800 font-medium">
          <span>{record.eleve.nom ? `${record.eleve.nom} ${record.eleve.prenoms}` : "Fiche d'Urgence"}</span>
          <span className="font-bold">{includeCSP ? 'PAGE 5' : 'PAGE 4'}</span>
        </div>
      </div>
    </div>
  );
};
