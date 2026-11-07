# SANTÉ+ — Assistant d'information santé

SANTÉ+ est un chatbot pédagogique francophone destiné au grand public international. Il fournit des informations générales de santé et de prévention. Il ne diagnostique pas, ne prescrit pas et ne remplace jamais un professionnel de santé.

## Fonctionnalités
- Interface responsive de conversation.
- Huit familles d'intentions : salutations, maladies, symptômes, prévention, nutrition, hygiène, médicaments et orientation.
- Détection de certains signaux d'urgence avec message d'orientation.
- Préférences locales (nom d'affichage) et historique de démonstration dans le navigateur.
- Avertissements sur les limites médicales et la confidentialité.

## Stack
- Next.js 15, React 19, TypeScript
- CSS responsive, Lucide
- Stockage local navigateur pour cette version pédagogique

## Démarrer
```bash
npm install
npm run dev
```
Ouvrir http://localhost:3000.

## Limites importantes
Cette version utilise un moteur de réponses par règles et mots-clés, pas un LLM. Les réponses sont des exemples pédagogiques et doivent être vérifiées par des sources sanitaires officielles avant toute diffusion publique. La détection d'urgence par mots-clés n'est ni exhaustive ni un dispositif médical. Ne pas saisir de données personnelles ou médicales identifiantes.

## Évolutions envisagées
- Intégration d'un LLM via une route serveur et une clé API conservée exclusivement côté serveur.
- Sources médicales officielles avec dates de mise à jour.
- Authentification et base de données sécurisée avec politiques RLS après définition précise des données nécessaires.
- Tests automatisés, revue de sécurité et validation clinique du contenu.

## Confidentialité
L'historique et les préférences de cette démo sont stockés dans le localStorage du navigateur. Effacer la conversation ou les données du site permet de les supprimer de cet appareil. Aucun backend ni compte utilisateur n'est utilisé dans cette version.