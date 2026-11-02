/* =========================================================
   LE CHAUDRON — version.js
   Le numéro de version de l'app et l'historique des changements.
   À CHAQUE mise à jour : change le numéro et ajoute une entrée
   EN HAUT de l'historique. C'est ce numéro qui dit aux téléphones
   qu'une nouvelle version est disponible.

   Numérotation X.Y.Z :
     X = grosse refonte, Y = nouvelle fonction, Z = petite correction
   ========================================================= */

const VERSION = { numero: '3.2.0', date: '2026-11-02' };

const HISTORIQUE = [
  { numero: '3.2.0', date: '2026-11-02', nouveautes: [
    "Ingrédient secret : en début de manche, l'app appelle chaque sorcière à tour de rôle et lui montre en secret un ingrédient de la recette.",
    "L'annonce se fait avant de brasser, ou juste après avoir entendu sa réponse (bouton « J'annonce maintenant »). Une seule annonce par tour.",
    "Rappel « Le marché se refait » après chaque tour de table.",
  ]},
  { numero: '3.1.0', date: '2026-11-02', nouveautes: [
    "Nouvelle façon de gagner, comme au Cluedo : pendant ton tour, au lieu de brasser, tu peux annoncer la recette en secret (bouton « J'annonce la recette »), sans avoir besoin des cartes.",
    "Annonce juste : tu gagnes la manche. Annonce fausse : tu es chassée jusqu'à la fin de la manche (tu peux encore échanger). S'il ne reste qu'une sorcière, elle gagne.",
    "En solo, une annonce fausse compte 3 brassages de plus ; en Pleine Lune, elle coûte 2 essais.",
    "Retour aux brassages complets : la potion qui mijote, les points et l'impatience de la version 3.0.0 sont retirés.",
  ]},
  { numero: '3.0.0', date: '2026-11-02', nouveautes: [
    "Nouvelle règle « La potion mijote » : un ingrédient à la bonne place reste dans la potion (on pose la carte au centre), et les brassages suivants ne remplissent que les places libres.",
    "Points : chaque ingrédient posé dans la potion rapporte 1 point. Quand la potion est complète, la plus forte en points gagne la manche ; en cas d'égalité, celle qui a terminé la potion.",
    "« Le chaudron s'impatiente » : si toute la recette a été entendue et qu'un tour de table passe sans nouvel ingrédient, chacune donne une carte au hasard à sa voisine de gauche.",
    "Avec l'Œil de chouette, rien ne reste dans la potion ce tour-ci (pour garder le secret).",
    "En mode expert, les bonnes places se voient (elles restent dans la potion) ; les autres réponses restent mélangées.",
  ]},
  { numero: '2.5.0', date: '2026-11-02', nouveautes: [
    "Chaudron plus petit et cartes jetées beaucoup plus grandes (illustration et nom plus lisibles).",
    "Les cartes jetées prennent toute la largeur disponible : plus grandes à 3 ou 4 cartes, un peu moins à 5.",
    "Chaque carte jetée apparaît en grand au centre pendant un instant, puis se range (durée : dureeApercuCarte dans contenu.js).",
    "Tailles réglables dans theme.css : --taille-chaudron, --hauteur-scene, --largeur-carte.",
  ]},
  { numero: '2.4.0', date: '2026-11-02', nouveautes: [
    "La signification de la fumée est écrite sur le chaudron après chaque brassage (ex. « Fumée verte : il manque des Plantes »), et dans le grimoire.",
    "« Bonne place », « Mauvaise place » ou « Absent » s'affiche sous chaque icône de réponse, aussi en mode expert.",
    "Textes modifiables dans contenu.js : LIBELLES_REPONSES et TEXTES_FUMEE.",
  ]},
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
