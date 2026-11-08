/* =========================================================
   LE CHAUDRON — contenu.js
   Tout le CONTENU du jeu : réglages, ingrédients, pouvoirs,
   phrases du chaudron. Tu peux modifier ce fichier sans
   toucher au moteur. Garde bien les virgules et les guillemets.
   ========================================================= */

const CONFIG = {
  prefixeQR: 'CHAUDRON-',     // texte des QR codes : CHAUDRON-01 ... CHAUDRON-24
  minBrassage: 3,             // cartes minimum jetées dans le chaudron
  maxBrassage: 4,             // maximum (passe à 5 pour la manche Archimage)
  essaisPleineLune: 8,
  penaliteAnnonceSolo: 3,     // en solo, une annonce fausse compte comme 3 brassages de plus
  penaliteAnnonceLune: 2,     // en Pleine Lune, une annonce fausse coûte 2 essais
  pauseEntreSons: 900,        // millisecondes entre deux réponses
  pauseAvantSons: 3000,       // pause quand toutes les cartes sont jetées, avant les sons
  pauseApresSons: 3000,       // pause après le dernier son, avant que le chaudron parle
  veilleMinutes: 3,           // sans carte scannée pendant ce temps, l'app s'endort (caméra, sons et écran)
  voixVitesse: 0.9,           // 0.5 à 2
  voixHauteur: 0.55,          // 0 (grave) à 2 (aigu)
  dureeRideau: 1800,
  dureeRappelGauche: 3500,    // durée du rappel « défaussez, puis passez une carte à gauche » (ms, touche pour passer)          // durée des écrans "Au tour de..." (ms)
  dureeApercuCarte: 1200,     // durée d'affichage en grand d'une carte qu'on vient de jeter (ms)

  // Voix enregistrées : fichiers mp3 dans le dossier "voix" (voir VOIX plus bas).
  // S'il manque un fichier, le téléphone lit la phrase lui-même.
  dossierVoix: 'voix/',
  formatVoix: 'mp3',
  volumeVoix: 1,              // 0 à 1
  pauseEntrePhrases: 2000,    // silence entre deux phrases du chaudron (millisecondes)

  // Musique de fond : mets tes morceaux (mp3) dans le dossier "musique"
  // et liste-les ici. Plusieurs morceaux = ils s'enchaînent au hasard.
  // Si aucun fichier n'est trouvé, l'app joue une musique qu'elle compose elle-même.
  fichiersMusique: [],         // ancienne musique unique (plus utilisée : voir « musiques » ci-dessous)
  // une musique par moment de la partie (elle tourne en boucle et change quand le moment change)
  // accueil : si vide, l'app prend fichiersMusique ci-dessus, ou sa musique composée
  musiques: {
    accueil: 'musique/theme-manche1.mp3',   // même musique que la manche 1 : elle continue sans recommencer
    manche1: 'musique/theme-manche1.mp3',
    manche2: 'musique/theme-manche2.mp3',
    manche3: 'musique/theme-manche3.mp3',
    lune:    'musique/theme-lune.mp3',
  },
  volumeMusique: 0.35,        // 0 à 1
  baisseMusiqueVoix: 0.35,    // pendant que le chaudron parle, la musique descend à 35 % de son volume
  musiqueComposee: true,      // false = pas de musique du tout si aucun fichier n'est trouvé

  // Tes propres sons (optionnel). Mets les fichiers dans le dossier "sons"
  // et liste-les ici, ex. bulle: ['sons/bulle1.mp3', 'sons/bulle2.mp3'].
  // Liste vide = le téléphone fabrique le son lui-même.
  fichiersSons: { bulle: [], sifflement: [], oeil: [], pschitt: [], explosion: [], victoire: [], scan: [], ambiance: [] },
};

// Manches du solo (anciennes règles)
const MANCHES = [
  { nom: 'Apprentie', taille: 3 },
  { nom: 'Sorcière',  taille: 4 },
  { nom: 'Archimage', taille: 5 },
];
// Manches du Concours à plusieurs (règles v5 : une recette secrète par sorcière)
// Règles de 2 à 4 sorcières (v6) : main de 4 cartes, appel de carte, on brasse toujours 3 cartes.
const MANCHES_V5 = [
  { nom: 'Apprentie', taille: 3, expert: false },
  { nom: 'Sorcière',  taille: 3, expert: false },
  { nom: 'Archimage', taille: 3, expert: false },
];

// Les icônes sont dans le dossier images/ (fam-plantes.png, etc. ; à défaut l'app prend le .svg du même nom)
const FAMILLES = {
  plantes:   { nom: 'Plantes',   fumee: 'verte'     },
  bestioles: { nom: 'Bestioles', fumee: 'orange'    },
  mineraux:  { nom: 'Minéraux',  fumee: 'turquoise' },
  liquides:  { nom: 'Liquides',  fumee: 'bleue'     },
  ossements: { nom: 'Ossements', fumee: 'ivoire'    },
  etoiles:   { nom: 'Étoiles',   fumee: 'violette'  },
};

// Textes affichés sous les icônes de réponse
const LIBELLES_REPONSES = { bulle: 'Bonne place', sifflement: 'Mauvaise place', oeil: 'Autre recette', pschitt: 'Absent' };

// Texte écrit sur le chaudron après chaque brassage. {couleur} et {famille} sont remplacés.
const TEXTES_FUMEE = {
  famille:   'Fumée {couleur} : il manque des {famille}',
  complete:  'Fumée dorée : toutes les familles sont là',
  victoire:  'Fumée blanche : potion réussie !',
  explosion: 'Fumée rouge : explosion !',
};

// n = numéro de la carte = son QR code. Pour mettre ton illustration,
// dépose images/ingredients/CHAUDRON-01.png (ou .jpg, voir FORMAT_ILLUSTRATIONS).
const FORMAT_ILLUSTRATIONS = 'png';   // illustrations : images/ingredients/<nom>.png (ex. Mandragore.png)
const FORMAT_PICTOS = 'png';        // pictos des familles (fam-…) et des réponses (rep-…) ; si le fichier manque, l'app prend le .svg
const INGREDIENTS = [
  { n:  1, fam: 'plantes', nom: "Mandragore", texte: "Elle hurle quand on l'arrache. Bouchez-vous les oreilles." },
  { n:  2, fam: 'plantes', nom: "Ortie de minuit", texte: "Ne pique qu'à minuit pile. Les autres heures, elle boude." },
  { n:  3, fam: 'plantes', nom: "Champignon rieur", texte: "Il glousse dans le noir. Personne ne sait de quoi." },
  { n:  4, fam: 'plantes', nom: "Racine de saule", texte: "Elle pleure un peu dans la potion. C'est normal." },
  { n:  5, fam: 'bestioles', nom: "Bave de crapaud", texte: "Fraîche du matin, récoltée avec politesse." },
  { n:  6, fam: 'bestioles', nom: "Aile de chauve-souris", texte: "Légère comme un soupir, noire comme une dette." },
  { n:  7, fam: 'bestioles', nom: "Queue de lézard", texte: "Elle repousse. Lui, il est parti sans elle." },
  { n:  8, fam: 'bestioles', nom: "Patte d'araignée", texte: "Une seule. L'araignée a gardé les sept autres." },
  { n:  9, fam: 'mineraux', nom: "Quartz chantant", texte: "Il fredonne faux, mais avec conviction." },
  { n: 10, fam: 'mineraux', nom: "Soufre", texte: "Ça sent l'œuf pourri et l'ambition." },
  { n: 11, fam: 'mineraux', nom: "Poudre de rubis", texte: "Trop chère pour être éternuée dessus." },
  { n: 12, fam: 'mineraux', nom: "Sel noir", texte: "Une pincée éloigne les voisins curieux." },
  { n: 13, fam: 'liquides', nom: "Larme de sirène", texte: "Elle a pleuré pour une chanson. Une seule larme." },
  { n: 14, fam: 'liquides', nom: "Rosée de l'aube", texte: "Cueillie avant le premier chant du coq." },
  { n: 15, fam: 'liquides', nom: "Encre de seiche", texte: "Parfaite pour écrire des sorts illisibles." },
  { n: 16, fam: 'liquides', nom: "Venin de vipère", texte: "Ne pas goûter pour vérifier. Jamais." },
  { n: 17, fam: 'ossements', nom: "Crâne de corbeau", texte: "Il a vu des choses. Il ne dira rien." },
  { n: 18, fam: 'ossements', nom: "Dent de loup", texte: "Perdue un soir de pleine lune, sans regret." },
  { n: 19, fam: 'ossements', nom: "Vertèbre de serpent", texte: "Elle ondule encore quand on ne la regarde pas." },
  { n: 20, fam: 'ossements', nom: "Poussière d'os", texte: "Ne pas confondre avec la farine. Encore." },
  { n: 21, fam: 'etoiles', nom: "Poussière de comète", texte: "Tombée il y a mille ans, encore tiède." },
  { n: 22, fam: 'etoiles', nom: "Éclat de lune", texte: "Gratté sur le croissant, un soir de brume." },
  { n: 23, fam: 'etoiles', nom: "Fragment de météore", texte: "Il cherche toujours à repartir vers le ciel." },
  { n: 24, fam: 'etoiles', nom: "Lumière d'étoile filante", texte: "Faites un vœu. Puis jetez-la dans le chaudron." }
];

// app: true = l'app gère le pouvoir (bouton pendant ton tour)
const POUVOIRS = [
  // Règles de 2 à 4 sorcières : les pouvoirs sont dans la pioche. Pioché, un pouvoir se pose face visible devant soi
  // (on pioche une carte pour le remplacer) ; il ne compte pas dans la main, ne peut pas être demandé,
  // et s'utilise une fois par tour au maximum, puis va à la défausse.
  { id: 'chouette', nom: 'Œil de chouette',   emoji: '🦉', app: true,  texte: "Ton brassage de ce tour est secret : tu écoutes les réponses, téléphone à l'oreille." },
  { id: 'serpent',  nom: 'Langue de serpent', emoji: '🐍', app: true,  texte: "Montre une carte au chaudron : il te chuchote si elle est dans ta recette, et à quelle place." },
  { id: 'amulette', nom: 'Amulette de suie',  emoji: '🧿', app: false, texte: "Refuse un appel de carte. Joue-la quand une adversaire te demande une carte." },
  { id: 'sablier',  nom: 'Sablier',           emoji: '⏳', app: true,  texte: "Après ton brassage, défausse et refais ta main, puis brasse une seconde fois." },
  { id: 'balai',    nom: 'Balai rapide',      emoji: '🧹', app: false, texte: "Pioche 2 cartes, garde-en une et défausse l'autre." },
  { id: 'chat',     nom: 'Chat noir',         emoji: '🐈‍⬛', app: false, texte: "Prends une carte au hasard dans la main d'une adversaire, puis donne-lui une carte de ta main." },
];

const NOMS_PAR_DEFAUT = ['Morgane', 'Baba', 'Hécate', 'Circé'];

// Phrases du chaudron : ce sont les phrases de l'onglet « Voix à enregistrer » du Google Sheet.
// Elles sont rangées DANS LE MÊME ORDRE que les fichiers de la liste VOIX plus bas :
// quand l'app joue accueil-2.mp3, elle affiche la 2e phrase de « accueil ».
// Sans fichier mp3, le téléphone lit la phrase lui-même.
// {nMot} {essaisMot} (nombres en lettres) {n} {joueur} {ingredient} {a} {b} {recette} sont remplacés automatiquement.
const PHRASES = {
  accueil:   ['Ah… encore des apprenties. Montrez-moi, un peu, ce que vous valez !', "J'ai faim. Il serait bon de me nourrir sur-le-champ !", 'Le feu est allumé… Que le concours commence.'],
  manche:    ["Ma recette compte {nMot} ingrédients, et l'ordre compte !"],
  tour:      ['À toi… donne-moi à manger !', 'Approche, et donne-moi à manger !', 'Voyons ce que tu me prépares !', 'Je sens déjà les ingrédients !'],
  moquerie:  ['Encore ça ? Vraiment ?', "Celui-là, je l'ai déjà recraché !", "Tu n'écoutes rien ! Toujours pas !", 'Encore le même ingrédient ! Quelle imagination.'],
  rate:      ['Mouais !… Ben non !', "Ben c'est raté ! Encore !", 'Je reste de nouveau sur ma faim !', 'Intéressant. Mais non !', 'Ça mijote pas !', 'Beurk !… Au suivant !'],
  presque:   ['Presque !… Allez, au suivant !', "Presque !… J'en salive déjà !", 'Ça sent bon… mais pas assez !'],
  instables: ['Attention ! Ce soir, un ingrédient des {f1} et un des {f2} ne se supportent pas…', 'Méfiez-vous : un des {f1} et un des {f2} ne doivent pas se rencontrer !'],
  explosion: ['BOUM ! Et voilà !… Ces deux-là ne se supportent pas !', 'Au nom de Saint Chaudron, pas ces deux-là ensemble ! Voilà, BOUM !'],
  protege:   ['Ok ! Ton amulette a avalé la suie !'],
  passe:     ['Ahah ! Encore couverte de suie ? Tu passes ton tour !'],
  doublon:   ['Alors… Celui-là est déjà dans mon ventre !'],
  horsJeu:   ["Celui-là n'est pas de la partie ! Range-le.", 'Pas cette famille-là aujourd\'hui ! Je n\'en veux pas.'],
  victoire:  ['Parfait. Absolument parfait. Tu as trouvé la potion !', 'Délicieux ! Tu remportes la manche !'],
  annonce:   ['Une annonce ? Voyons ça… Les autres, détournez les yeux.', 'Tu crois connaître ma recette ? Montre-moi.'],
  secrets:   ['Chacune connaît maintenant un de mes secrets. Gardez-le bien.', 'Mes secrets sont distribués. Que le meilleur nez gagne.'],
  marche:    ['Le marché se refait ! Remettez les cartes sous la pioche et retournez-en quatre nouvelles.', 'Nouveau tour, nouveau marché. Quatre ingrédients frais !'],
  annonceJuste: ["Exact. C'est bien ma recette. Tu remportes la manche !", "C'est parfait !… Tu t'es très bien débrouillée !"],
  annonceFausse: ["Faux ! Tu es chassée du concours jusqu'à la fin de la manche.", 'Raté ! Tu quittes la manche. Tu peux encore échanger, mais plus brasser.'],
  annonceFausseSolo: ['Faux. Ça te coûtera cher.'],
  annonceFausseLune: ['Faux ! La lune arrive plus vite…'],
  derniereEnLice: ['Il ne reste que toi. Tu remportes la manche !'],
  grande:    ['Si je le pouvais, je me serais incliné devant toi !'],
  luneDebut: ['La Pleine Lune. Ma recette compte {nMot} ingrédients. Vous avez {essaisMot} essais.'],
  lune:      ['Plus que {nMot} essais avant que la lune se lève…'],
  luneDeux:  ['Attention ! Plus que deux essais avant que la lune se lève…'],
  luneDerniere: ['Dernier essai. La lune est là…'],
  luneGagne: ['La potion est prête avant la lune !… Bravo, jeune apprenti !'],
  lunePerdu: ["La lune est levée. Trop tard. Regardez ce qu'il fallait !"],
  serpentOui:['Oui… il est dans ma recette !'],
  serpentPlace: ['Oui… il est dans ta recette, à la place {place} !'],
  serpentNon:['Non. Jamais de la vie !'],
  chouette:  ['Colle-moi à ton oreille !'],
  secret:    ["Chut… c'est notre secret !"],
};

// =========================================================
// POSTURES DU PERSONNAGE
// Chaque voix a sa posture (colonne « Posture » de l'onglet « Voix à enregistrer »).
// Les images sont dans images/chaudron/, au nom de la posture : fier.png, surpris.png…
// POSTURE_REPOS : l'image affichée en attendant (écran titre, début de partie).
// Si repos.png n'existe pas encore, l'app prend POSTURE_PAR_DEFAUT.
// =========================================================
const POSTURE_REPOS = 'repos';
const POSTURE_PAR_DEFAUT = 'fier';
const POSTURES = {
  'accueil-1': 'fier', 'accueil-2': 'malin', 'accueil-3': 'explique',
  'manche-apprentie': 'explique', 'manche-sorciere': 'explique', 'manche-archimage': 'malin',
  'tour-1': 'explique', 'tour-2': 'fier', 'tour-3': 'malin', 'tour-4': 'ravi',
  'moquerie-1': 'blase', 'moquerie-2': 'decu', 'moquerie-3': 'colere', 'moquerie-4': 'blase',
  'rate-1': 'blase', 'rate-2': 'decu', 'rate-3': 'decu', 'rate-4': 'reflexion', 'rate-5': 'decu', 'rate-6': 'blase',
  'presque-1': 'surpris', 'presque-2': 'ravi', 'presque-3': 'reflexion',
  'explosion-1': 'colere', 'explosion-2': 'colere',
  'protege-1': 'decu', 'passe-1': 'malin', 'doublon-1': 'blase',
  'victoire-1': 'ravi', 'victoire-2': 'joie', 'grande-1': 'joie',
  'lune-debut-3': 'explique', 'lune-debut-4': 'explique', 'lune-debut-5': 'explique',
  'lune-reste-7': 'reflexion', 'lune-reste-6': 'reflexion', 'lune-reste-5': 'malin', 'lune-reste-4': 'malin', 'lune-reste-3': 'malin', 'lune-reste-2': 'surpris',
  'lune-derniere-1': 'malin', 'lune-gagne-1': 'joie', 'lune-perdu-1': 'malin',
  'serpent-oui-1': 'malin', 'serpent-non-1': 'blase', 'chouette-1': 'explique', 'secret-1': 'malin',
  'annonce-1': 'surpris', 'annonce-2': 'reflexion', 'annonce-juste-1': 'surpris', 'annonce-juste-2': 'ravi',
  'annonce-fausse-1': 'malin', 'annonce-fausse-2': 'blase', 'annonce-fausse-solo-1': 'colere', 'annonce-fausse-lune-1': 'colere',
  'derniere-en-lice-1': 'fier', 'secrets-1': 'malin', 'secrets-2': 'malin', 'marche-1': 'explique', 'marche-2': 'explique',
};

// =========================================================
// VOIX ENREGISTRÉES
// Pour chaque moment, la liste des fichiers du dossier voix/
// (sans le ".mp3"). Ce sont les noms de l'onglet
// « Voix à enregistrer » du Google Sheet. L'app tire au hasard
// parmi les fichiers présents. Tu peux en ajouter : il suffit
// de mettre le fichier dans voix/ et son nom dans la bonne liste.
// =========================================================
const VOIX = {
  accueil:            ['accueil-1', 'accueil-2', 'accueil-3'],
  'manche-apprentie': ['manche-apprentie'],
  'manche-sorciere':  ['manche-sorciere'],
  'manche-archimage': ['manche-archimage'],
  tour:               ['tour-1', 'tour-2', 'tour-3', 'tour-4'],
  moquerie:           ['moquerie-1', 'moquerie-2', 'moquerie-3', 'moquerie-4'],
  rate:               ['rate-1', 'rate-2', 'rate-3', 'rate-4', 'rate-5', 'rate-6'],
  presque:            ['presque-1', 'presque-2', 'presque-3'],
  explosion:          ['explosion-1', 'explosion-2'],
  protege:            ['protege-1'],
  passe:              ['passe-1'],
  doublon:            ['doublon-1'],
  victoire:           ['victoire-1', 'victoire-2'],
  annonce:            ['annonce-1', 'annonce-2'],
  secrets:            ['secrets-1', 'secrets-2'],
  marche:             ['marche-1', 'marche-2'],
  annonceJuste:       ['annonce-juste-1', 'annonce-juste-2'],
  annonceFausse:      ['annonce-fausse-1', 'annonce-fausse-2'],
  annonceFausseSolo:  ['annonce-fausse-solo-1'],
  annonceFausseLune:  ['annonce-fausse-lune-1'],
  derniereEnLice:     ['derniere-en-lice-1'],
  grande:             ['grande-1'],
  'lune-debut-3':     ['lune-debut-3'],
  'lune-debut-4':     ['lune-debut-4'],
  'lune-debut-5':     ['lune-debut-5'],
  'lune-reste-7':     ['lune-reste-7'],
  'lune-reste-6':     ['lune-reste-6'],
  'lune-reste-5':     ['lune-reste-5'],
  'lune-reste-4':     ['lune-reste-4'],
  'lune-reste-3':     ['lune-reste-3'],
  'lune-reste-2':     ['lune-reste-2'],
  luneDerniere:       ['lune-derniere-1'],
  luneGagne:          ['lune-gagne-1'],
  lunePerdu:          ['lune-perdu-1'],
  serpentOui:         ['serpent-oui-1'],
  serpentNon:         ['serpent-non-1'],
  chouette:           ['chouette-1'],
  secret:             ['secret-1'],
};
