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
  pauseEntreSons: 900,        // millisecondes entre deux réponses
  voixVitesse: 0.9,           // 0.5 à 2
  voixHauteur: 0.55,          // 0 (grave) à 2 (aigu)
  dureeRideau: 1800,          // durée des écrans "Au tour de..." (ms)

  // Tes propres sons (optionnel). Mets les fichiers dans le dossier "sons"
  // et liste-les ici, ex. bulle: ['sons/bulle1.mp3', 'sons/bulle2.mp3'].
  // Liste vide = le téléphone fabrique le son lui-même.
  fichiersSons: { bulle: [], sifflement: [], pschitt: [], explosion: [], victoire: [], scan: [], ambiance: [] },
};

const MANCHES = [
  { nom: 'Apprentie', taille: 3 },
  { nom: 'Sorcière',  taille: 4 },
  { nom: 'Archimage', taille: 5 },
];

// Les icônes sont dans le dossier images/ (fam-plantes.svg, etc.)
const FAMILLES = {
  plantes:   { nom: 'Plantes'   },
  bestioles: { nom: 'Bestioles' },
  mineraux:  { nom: 'Minéraux'  },
  liquides:  { nom: 'Liquides'  },
  ossements: { nom: 'Ossements' },
  etoiles:   { nom: 'Étoiles'   },
};

// n = numéro de la carte = son QR code. Pour mettre ton illustration,
// dépose images/ingredients/CHAUDRON-01.png (ou .jpg, voir FORMAT_ILLUSTRATIONS).
const FORMAT_ILLUSTRATIONS = 'png';
const INGREDIENTS = [
  { n:  1, fam: 'plantes', nom: "Mandragore", texte: "Elle hurle quand on l'arrache. Bouchez-vous les oreilles." },
  { n:  2, fam: 'plantes', nom: "Ortie de minuit", texte: "Ne pique qu'à minuit pile. Les autres heures, elle boude." },
  { n:  3, fam: 'plantes', nom: "Champignon rieur", texte: "Il glousse dans le noir. Personne ne sait de quoi." },
  { n:  4, fam: 'plantes', nom: "Racine de saule", texte: "Elle pleure un peu dans la potion. C'est normal." },
  { n:  5, fam: 'bestioles', nom: "Bave de crapaud", texte: "Fraîche du matin, récoltée avec politesse." },
  { n:  6, fam: 'bestioles', nom: "Aile de chauve-souris", texte: "Légère comme un soupir, noire comme une dette." },
  { n:  7, fam: 'bestioles', nom: "Œil de triton", texte: "Il vous regarde encore. Évitez de cligner." },
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
  { id: 'chouette', nom: 'Œil de chouette',   emoji: '🦉', app: true,  texte: "Écoute ta réponse en secret, téléphone collé à l'oreille." },
  { id: 'serpent',  nom: 'Langue de serpent', emoji: '🐍', app: true,  texte: "Montre une carte : le chaudron te chuchote si elle est dans la recette." },
  { id: 'amulette', nom: 'Amulette de suie',  emoji: '🧿', app: true,  texte: "Te protège d'une explosion (automatique)." },
  { id: 'sablier',  nom: 'Sablier',           emoji: '⏳', app: true,  texte: "Rejoue un brassage juste après le tien." },
  { id: 'balai',    nom: 'Balai rapide',      emoji: '🧹', app: false, texte: "Cueille deux cartes au lieu d'une." },
  { id: 'chat',     nom: 'Chat noir',         emoji: '🐈‍⬛', app: false, texte: "Vole une carte au hasard à une autre sorcière." },
];

const NOMS_PAR_DEFAUT = ['Morgane', 'Baba', 'Hécate', 'Circé'];

// Phrases du chaudron : une est tirée au hasard.
// {joueur} {ingredient} {a} {b} {n} {manche} {recette} sont remplacés automatiquement.
const PHRASES = {
  accueil:   ['Ah… de nouvelles apprenties. Montrez-moi ce que vous valez.', "J'ai faim. Nourrissez-moi, sorcières.", 'Le feu est allumé. Que le concours commence.'],
  manche:    ['Manche {manche}. Ma recette compte {n} ingrédients.', "Manche {manche}. {n} ingrédients, et l'ordre compte."],
  tour:      ['À toi, {joueur}.', '{joueur}, approche.', 'Voyons ce que {joueur} me prépare.', "{joueur}, je t'écoute."],
  moquerie:  ['Encore {ingredient} ? Vraiment ?', "{ingredient}… je l'ai déjà recraché, celui-là.", "Tu n'écoutes rien. {ingredient}, toujours pas.", 'Ah, {ingredient}. Encore. Quelle imagination.'],
  rate:      ['Hmm.', 'Pas encore…', 'Je reste sur ma faim.', 'Intéressant. Mais non.', 'Ça mijote…', 'Beurk. Au suivant.'],
  presque:   ['Oh… tu brûles.', "Presque. J'en salive.", 'Ça sent bon… mais pas assez.'],
  explosion: ['BOUM ! {a} et {b} ne se supportent pas !', 'Pas {a} avec {b}, malheureuse ! BOUM !'],
  protege:   ["L'amulette de {joueur} a avalé la suie."],
  passe:     ['{joueur} est encore couverte de suie : elle passe son tour.'],
  doublon:   ['Celui-là est déjà dans mon ventre.'],
  victoire:  ['Parfait. Absolument parfait. {joueur} a trouvé la potion !', 'Délicieux ! {joueur} remporte la manche !'],
  grande:    ['Inclinez-vous devant {joueur}, Grande Sorcière !'],
  lune:      ['Plus que {n} essais avant que la lune se lève.'],
  luneDerniere: ['Dernier essai. La lune est là…'],
  luneGagne: ['La potion est prête avant la lune. Bravo, le cercle !'],
  lunePerdu: ['La lune est levée. Trop tard. Ma recette était : {recette}.'],
  serpentOui:['Oui… il est dans ma recette.'],
  serpentNon:['Non. Jamais de la vie.'],
  chouette:  ['Colle-moi à ton oreille…'],
  secret:    ["Chut… c'est notre secret."],
};
