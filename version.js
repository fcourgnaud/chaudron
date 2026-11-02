/* =========================================================
   LE CHAUDRON — version.js
   Le numéro de version de l'app et l'historique des changements.
   À CHAQUE mise à jour : change le numéro et ajoute une entrée
   EN HAUT de l'historique. C'est ce numéro qui dit aux téléphones
   qu'une nouvelle version est disponible.

   Numérotation X.Y.Z :
     X = grosse refonte, Y = nouvelle fonction, Z = petite correction
   ========================================================= */

const VERSION = { numero: '2.3.2', date: '2026-11-02' };

const HISTORIQUE = [
  { numero: '2.3.2', date: '2026-11-02', nouveautes: [
    "Correction du bouton « Mettre à jour » : il retélécharge maintenant chaque fichier depuis GitHub au lieu de reprendre ceux gardés en mémoire par le téléphone.",
    "Si la nouvelle version n'est pas encore arrivée sur le téléphone, le bandeau le dit au lieu de reproposer la même mise à jour.",
  ]},
  { numero: '2.3.1', date: '2026-11-02', nouveautes: [
    "2 secondes de silence entre deux phrases du chaudron (réglable avec pauseEntrePhrases dans contenu.js).",
    "Les phrases ne se coupent plus entre elles : elles passent toujours l'une après l'autre.",
  ]},
  { numero: '2.3.0', date: '2026-11-02', nouveautes: [
    "Musique de fond : tes morceaux du dossier musique/, ou une musique mystérieuse composée par l'app s'il n'y en a pas.",
    "Bouton 🎵 pendant la partie et option Musique sur l'écran de préparation.",
    "La musique baisse quand le chaudron parle, et le son se coupe quand l'app passe en arrière-plan.",
  ]},
  { numero: '2.2.0', date: '2026-11-02', nouveautes: [
    "Numéro de version affiché sur l'écran titre, avec l'historique des changements.",
    "Alerte quand une nouvelle version est en ligne, avec un bouton pour recharger.",
    "Le téléphone vérifie toujours s'il y a des fichiers plus récents avant d'utiliser ceux en mémoire.",
  ]},
  { numero: '2.1.0', date: '2026-11-02', nouveautes: [
    "Voix enregistrées : l'app joue les mp3 du dossier voix/ et lit elle-même les phrases manquantes.",
    "L'écran de préparation indique combien de voix ont été trouvées.",
  ]},
  { numero: '2.0.0', date: '2026-11-02', nouveautes: [
    "Refonte thématique : écran titre, chaudron animé, ciel étoilé, parchemins.",
    "Écrans séparés : titre, préparation, jeu, annonces de manche et de tour.",
    "Grimoire en tiroir, choix des ingrédients sans caméra, ambiance sonore.",
    "Fichiers séparés : contenu.js (textes), moteur.js (fonctionnement), images/ (icônes).",
  ]},
  { numero: '1.0.0', date: '2026-11-02', nouveautes: [
    "Première version : modes Concours et Pleine Lune, sons, fumée, lecture des QR codes.",
  ]},
];
