/* =========================================================
   LE CHAUDRON — version.js
   Le numéro de version de l'app et l'historique des changements.
   À CHAQUE mise à jour : change le numéro et ajoute une entrée
   EN HAUT de l'historique. C'est ce numéro qui dit aux téléphones
   qu'une nouvelle version est disponible.

   Numérotation X.Y.Z :
     X = grosse refonte, Y = nouvelle fonction, Z = petite correction
   ========================================================= */

const VERSION = { numero: '4.1.3', date: '2026-11-03' };

const HISTORIQUE = [
  { numero: '4.1.3', date: '2026-11-03', nouveautes: [
    "Personnage un peu plus grand, plus à gauche et plus haut ; boîte de dialogue remontée ; dégradés réduits.",
    "Les pictos des familles et des réponses sont en PNG (fam-….png, rep-….png). S'il en manque un, l'app reprend le .svg.",
  ]},
  { numero: '4.1.2', date: '2026-11-03', nouveautes: [
    "Personnage plus grand, rogné sur la gauche comme sur la maquette.",
    "Dégradé bordeaux en haut et en bas de l'écran de jeu.",
  ]},
  { numero: '4.1.1', date: '2026-11-03', nouveautes: [
    "Écran de jeu ajusté sur la nouvelle maquette : réponses dans une pastille sous chaque carte, fumée sous les cartes, boîte de dialogue sur toute la largeur, « J'annonce la recette » dessous, personnage plus grand.",
    "La boîte de dialogue n'affiche plus que les phrases du chaudron (plus de consignes).",
  ]},
  { numero: '4.1.0', date: '2026-11-03', nouveautes: [
    "Nouvel écran de jeu d'après la maquette : la sorcière du tour, Brasser, les cases des cartes, l'annonce et la boîte de dialogue en bas.",
    "Le personnage du chaudron apparaît à côté de la boîte de dialogue : 10 postures, une par phrase (colonne « Posture » du Google Sheet), avec un petit glissement à chaque phrase.",
    "Écran titre : le personnage derrière le logo.",
    "Pour retirer la dernière carte jetée, on la touche. Musique et ambiance se règlent dans le grimoire.",
  ]},
  { numero: '4.0.1', date: '2026-11-03', nouveautes: [
    "Il n'y a plus que les emplacements des cartes de la manche (3, 4 ou 5) : la case « facultatif » disparaît.",
    "Quand on quitte la partie, tout s'arrête aussitôt : voix, sons, musique, ambiance, caméra et annonces en attente.",
    "Les phrases affichées sont celles du Google Sheet (onglet « Voix à enregistrer ») : le texte correspond maintenant à la voix enregistrée.",
  ]},
  { numero: '4.0.0', date: '2026-11-03', nouveautes: [
    "Nouveau style « Cauldrons », façon jeu de rôle : logo, menu avec curseur, cadres dorés, boîte de dialogue du chaudron.",
    "Le fond est le chaudron vu de haut : un tourbillon animé avec une surface liquide et des bulles. Quand la fumée prend une couleur, une brume de cette couleur traverse l'écran et le fond perd ses couleurs pour la faire ressortir.",
    "L'image de la caméra n'est plus affichée : elle lit toujours les QR codes, en silence.",
    "Nouvelle icône pour installer l'app sur l'écran d'accueil.",
  ]},
  { numero: '3.2.1', date: '2026-11-02', nouveautes: [
    "Correction : l'app ne se fige plus si index.html n'est pas à jour (le bouton d'annonce est ajouté tout seul).",
    "En cas d'erreur, un message s'affiche à l'écran avec le numéro de version, au lieu d'une app figée.",
  ]},
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

/* ---------- Filet de sécurité : si une erreur survient, on l'affiche au lieu de figer l'app ---------- */
window.addEventListener('error', e => {
  try {
    let b = document.getElementById('bandeau-erreur');
    if (!b) {
      b = document.createElement('div'); b.id = 'bandeau-erreur';
      b.style.cssText = 'position:fixed;left:10px;right:10px;top:10px;z-index:999;padding:12px 14px;border-radius:12px;background:#5a1a1a;color:#fff;font:14px/1.35 sans-serif;box-shadow:0 6px 20px #0008';
      document.body.appendChild(b);
    }
    b.innerHTML = `<b>Oups, le chaudron a avalé une erreur.</b><br>${e.message || e}<br><small>Version ${VERSION.numero}. Vérifie que tous les fichiers de l'app sont à jour sur GitHub, puis recharge.</small>`;
  } catch (x) {}
});
