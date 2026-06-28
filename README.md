<div align="center">
<h1>Portail Scolaire</h1>
</div>

# Portail Scolaire

Une application d'IA pour la gestion et l'assistance pédagogique.

## Prise en main

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn

### Installation et exécution

1. **Installer les dépendances:**
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement:**
   - Créez un fichier `.env.local` à la racine du projet
   - Ajoutez votre clé API Gemini (ou un autre fournisseur d'IA compatible):
     ```
     GEMINI_API_KEY=votre_clé_api_ici
     ```

3. **Lancer l'application en développement:**
   ```bash
   npm run dev
   ```

4. **Accéder à l'application:**
   Ouvrez votre navigateur et visitez `http://localhost:3000`

## Caractéristiques

- Interface utilisateur intuitive pour l'assistance pédagogique
- Intégration avec des API d'IA indépendantes
- Pas de dépendances propriétaires ou de services tiers obligatoires

## Architecture

L'application est construite avec:
- **Frontend:** Framework JavaScript moderne
- **Backend:** API compatible avec les services d'IA
- **Déploiement:** Flexible et indépendant

## Configuration de production

Pour déployer en production:
- Assurez-vous que `GEMINI_API_KEY` est défini dans votre environnement
- Lancez `npm run build` pour générer la version optimisée
- Utilisez `npm start` pour servir l'application

## Contribution

Les contributions sont bienvenues! N'hésitez pas à fork le projet et soumettre des pull requests.

## Licence

À définir selon vos préférences.
