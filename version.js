/* =========================================================
   LE CHAUDRON — version.js
   Le numéro de version de l'app et l'historique des changements.
   À CHAQUE mise à jour : change le numéro et ajoute une entrée
   EN HAUT de l'historique. C'est ce numéro qui dit aux téléphones
   qu'une nouvelle version est disponible.

   Numérotation X.Y.Z :
     X = grosse refonte, Y = nouvelle fonction, Z = petite correction
   ========================================================= */

const VERSION = { numero: '5.3.3', date: '2026-11-05' };

const HISTORIQUE = [
  { numero: '5.3.3', date: '2026-11-05', nouveautes: ["Plus de visages à côté des noms des sorcières."]},
  { numero: '5.3.2', date: '2026-11-05', nouveautes: ["Plus de numéro d'ordre sur les cartes jetées."]},
  { numero: '5.3.1', date: '2026-11-05', nouveautes: ["Numéro d'ordre des cartes plus petit, en bas à gauche."]},
  { numero: '5.3.0', date: '2026-11-05', nouveautes: ["Les cartes de l'app sont maintenant tes cartes illustrées (images/cartes-ingredients)."]},
  { numero: '5.2.7', date: '2026-11-05', nouveautes: ["Accueil : ombre portée plus diffuse."]},
  { numero: '5.2.6', date: '2026-11-05', nouveautes: ["Accueil : ombre portée sur le personnage et le titre pour les détacher du fond."]},
  { numero: '5.2.5', date: '2026-11-05', nouveautes: ["Portraits des sorcières plus grands : en jeu à côté du nom, et en grand sur l'écran « Au tour de… »."]},
  { numero: '5.2.4', date: '2026-11-04', nouveautes: ["Accueil : le personnage est plus grand et plus haut."]},
  { numero: '5.2.3', date: '2026-11-04', nouveautes: [
    "À chaque arrivée sur l'accueil, le chaudron prend une de ses 10 poses au hasard.",
  ]},
  { numero: '5.2.2', date: '2026-11-04', nouveautes: [
    "App allégée : images à la bonne taille, musiques et voix compressées (environ 3 fois moins à télécharger).",
    "Le fond animé calcule deux fois moins : le téléphone chauffe moins et la batterie dure plus longtemps.",
    "Le lecteur de QR codes est inclus dans l'app : elle marche entièrement hors ligne.",
  ]},
  { numero: '5.2.1', date: '2026-11-04', nouveautes: [
    "Plus de bouton Brasser : le brassage part quand toutes les cases sont remplies. « Au suivant » et la main sont toujours affichés : « Au suivant » s'allume après les résultats, la main se grise une fois les cartes choisies.",
    "Titres des cartes tous à la même taille, sur deux lignes si besoin. Portrait et cartes un peu plus bas ; personnage de l'accueil plus grand.",
  ]},
  { numero: '5.2.0', date: '2026-11-04', nouveautes: [
    "Les 4 sorcières ont leur portrait : en médaillon sur l'écran de préparation, et en buste à côté de son nom pendant son tour.",
  ]},
  { numero: '5.1.2', date: '2026-11-04', nouveautes: [
    "Correction : après avoir penché le téléphone, les boutons répondent de nouveau au toucher.",
  ]},
  { numero: '5.1.1', date: '2026-11-04', nouveautes: [
    "L'écran ne pivote plus quand on penche le téléphone : l'app reste toujours en portrait.",
  ]},
  { numero: '5.1.0', date: '2026-11-04', nouveautes: [
    "Nouvelles cartes d'après la maquette, avec les illustrations du dossier images/ingredients (même dessin que les cartes imprimées).",
    "Écran de jeu dans les polices de l'accueil ; polices incluses dans l'app (dossier polices/).",
    "Roue crantée à la place du livre : fenêtre d'options pour couper les voix, la musique et l'ambiance (et ouvrir le grimoire).",
    "Préparation : options de jeu dans un onglet déroulant. Les écrans ne glissent plus sous le doigt.",
    "La musique de l'accueil et de la manche 1 continue sans recommencer. Plus de flèche sur « Au suivant ».",
  ]},
  { numero: '5.0.0', date: '2026-11-04', nouveautes: [
    "Nouvelles règles du Concours à 2, 3 ou 4 sorcières : chacune a sa propre recette secrète (aucun ingrédient en commun). Pour gagner une manche, il faut brasser toute sa recette dans le bon ordre.",
    "Nouvelle réponse : l'Œil, quand l'ingrédient est dans la recette d'une autre sorcière. Les sons passent d'abord, puis les icônes et la fumée.",
    "Manches : Apprentie 3 ingrédients, Sorcière 4, Archimage 4 en mode expert.",
    "Plus de marché, plus d'ingrédient secret, plus d'annonce : à la fin de chaque tour, l'app rappelle de défausser jusqu'à 4 cartes et de passer une carte à gauche.",
    "L'Œil de triton devient la Queue de lézard. Le solo et la Pleine Lune gardent les anciennes règles.",
  ]},
  { numero: '4.2.1', date: '2026-11-03', nouveautes: [
    "Haut de l'écran de jeu d'après la maquette : la sorcière du tour et, collé à droite, le bouton Brasser ou Au suivant. Les cartes sont juste dessous et ne bougent plus.",
  ]},
  { numero: '4.2.0', date: '2026-11-03', nouveautes: [
    "Une musique par manche : manche 1, manche 2, manche 3, et une pour la Pleine Lune (dossier musique/). Elle change en fondu au début de chaque manche.",
    "L'écran d'accueil tient dans l'écran, sans défiler.",
  ]},
  { numero: '4.1.5', date: '2026-11-03', nouveautes: [
    "Plus rien ne bouge quand un bouton apparaît : personnage, boîte de dialogue et annonce restent fixés en bas, la fumée et les cartes gardent leur place.",
    "Le bouton « J'annonce la recette » reste affiché, grisé quand on ne peut pas annoncer.",
    "Cartes remontées à 20 px sous le bouton Brasser ; les pouvoirs passent sous la fumée.",
  ]},
  { numero: '4.1.4', date: '2026-11-03', nouveautes: [
    "Les cartes ne bougent plus quand les boutons changent : la place est réservée au-dessus.",
    "La fumée se place entre le personnage et le bord droit de l'écran.",
    "Boutons du jeu 5 % plus petits ; nom de la manche et de la sorcière dans la police du menu de l'accueil.",
  ]},
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
