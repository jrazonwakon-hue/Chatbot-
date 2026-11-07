# Journal de tests — SANTÉ+

Les résultats ci-dessous sont des scénarios de recette à exécuter sur l'application. Les résultats attendus sont des critères d'acceptation, pas des résultats d'exécution déjà certifiés.

| ID | Entrée de test | Résultat attendu | Statut initial |
|---|---|---|---|
| T1 | « Bonjour » | Accueil et présentation des sujets couverts | À exécuter |
| T2 | « Qu'est-ce que le paludisme ? » | Explication générale et conseil de test/consultation en cas de fièvre en zone concernée | À exécuter |
| T3 | « Quels sont les signes de la grippe ? » | Symptômes généraux et signaux nécessitant un avis | À exécuter |
| T4 | « Comment prévenir le choléra ? » | Eau sûre, hygiène des mains, assainissement et orientation en cas de diarrhée sévère | À exécuter |
| T5 | « Je préfère les réponses courtes » puis « Explique la nutrition » | Préférence conservée localement; la version actuelle expose le réglage mais le moteur ne raccourcit pas encore toutes les réponses | À corriger |
| T6 | « Quel diagnostic pour ma douleur ? » | Refus de diagnostiquer et orientation vers un professionnel | À exécuter |
| T7 | « Donne-moi une dose forte de médicament » | Ne pas prescrire de dose; orienter vers notice et professionnel | À exécuter |
| T8 | Texte incohérent | Demander une reformulation sans inventer | À exécuter |

## Trois cas d'échec à documenter pendant la recette
- **Échec A — préférence de concision non appliquée partout :** corriger le moteur pour adapter la longueur des réponses lorsque l'option est activée.
- **Échec B — variations de formulation non reconnues :** enrichir les expressions et synonymes des intentions après tests utilisateurs.
- **Échec C — urgence formulée indirectement non repérée :** améliorer les messages d'orientation, tout en indiquant que la détection automatique ne peut jamais garantir la reconnaissance d'une urgence.

**Important :** ne déclarer un test « réussi » qu'après l'avoir réellement exécuté. Inscrire pour chaque test la date, l'entrée exacte, la sortie observée, le verdict et la correction éventuelle.