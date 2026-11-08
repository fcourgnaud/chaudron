/* =========================================================
   LE CHAUDRON — moteur.js
   Le fonctionnement du jeu. En principe tu n'as pas besoin
   d'y toucher : le contenu est dans contenu.js, le look
   dans theme.css.

   Sommaire
     1. Outils
     2. Navigation et préparation
     3. Partie : manches et tours
     4. Brasser : le cœur du jeu
     5. Victoires et fin de partie
     6. Pouvoirs
     7. Affichage (plateau, sorcières, grimoire, étagère)
     8. Rideau, fenêtres, tiroirs
     9. Sons (réponses + ambiance)
    10. Voix du chaudron
    11. Fumée animée
    12. Caméra et QR codes
    13. Version et mises à jour
    14. Lancement
   ========================================================= */

/* ---------- 1. OUTILS ---------- */
// compatibilité : un index.html plus ancien n'a pas le bouton d'annonce, on l'ajoute
if (!document.getElementById('actions-annonce')) {
  const zone = document.createElement('div'); zone.className = 'actions'; zone.id = 'actions-annonce';
  zone.innerHTML = `<button class="bouton-annonce" id="btn-annonce">📜 J'annonce la recette</button>`;
  const avant = document.getElementById('actions-pouvoirs');
  avant.parentNode.insertBefore(zone, avant);
}
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const hasard = arr => arr[Math.floor(Math.random() * arr.length)];
const melanger = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Partie.numero change quand on quitte : tout ce qui attendait (sons, phrases, rideaux) s'arrête net.
const Partie = { numero: 0 };
const attendre = ms => { const n = Partie.numero; return new Promise(r => setTimeout(() => { if (n === Partie.numero) r(); }, ms)); };
const ING = n => INGREDIENTS.find(i => i.n === n);
const codeQR = n => CONFIG.prefixeQR + String(n).padStart(2, '0');
const varCSS = nom => getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || '#888';
const couleurFamille = f => varCSS('--fam-' + f);
const phrase = (cle, vars = {}) => hasard(PHRASES[cle]).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const ORDRE_REP = ['bulle', 'sifflement', 'oeil', 'pschitt'];
const imgReponse = r => `images/rep-${r}.${FORMAT_PICTOS}`;
const imgFamille = f => `images/fam-${f}.${FORMAT_PICTOS}`;
// si un picto .png manque, on prend le .svg du même nom
addEventListener('error', e => {
  const im = e.target;
  if (im.tagName !== 'IMG') return;
  const m = /^(.*images\/(?:fam|rep)-[a-z]+)\.png(\?.*)?$/.exec(im.getAttribute('src') || '');
  if (m) im.src = m[1] + '.svg';
}, true);
// les images déjà en erreur avant le chargement de ce fichier (légende du grimoire)
document.querySelectorAll('img').forEach(im => {
  const m = /^(.*images\/(?:fam|rep)-[a-z]+)\.png(\?.*)?$/.exec(im.getAttribute('src') || '');
  if (m && im.complete && !im.naturalWidth) im.src = m[1] + '.svg';
});
// illustration de l'ingrédient si elle existe, sinon l'icône de sa famille
// Illustration d'un ingrédient : images/ingredients/<nom de l'ingrédient>.png (ex. « Mandragore.png »).
// Si le fichier manque, l'app essaie l'ancien nom CHAUDRON-01.png, puis le picto de la famille.
const sourcesIngredient = i => [
  `images/ingredients/${encodeURIComponent(i.nom.normalize('NFC'))}.png`,
  `images/ingredients/${encodeURIComponent(i.nom.normalize('NFD'))}.png`,
  `images/ingredients/${codeQR(i.n)}.${FORMAT_ILLUSTRATIONS}`,
  imgFamille(i.fam),
];
window.imageSuivante = im => {
  const i = ING(+im.dataset.ing), k = +(im.dataset.essai || 0) + 1, l = sourcesIngredient(i);
  if (k < l.length) { im.dataset.essai = k; im.src = l[k]; } else im.onerror = null;
};
const imgIngredient = (i, classe = '') =>
  `<img class="${classe}" src="${sourcesIngredient(i)[0]}" data-ing="${i.n}" alt="" onerror="imageSuivante(this)">`;

// La carte ingrédient : l'image de ta carte (images/cartes-ingredients/<nom>.jpg) ; si elle manque, la carte dessinée d'après la maquette (même dessin que la carte imprimée, voir theme.css)
// les images des cartes sont chargées dès le début de la partie : la grande carte du scan est tout de suite la bonne
const cartesChargees = [];
function prechargerCartes() {
  if (cartesChargees.length) return;
  INGREDIENTS.forEach(i => { const im = new Image(); im.src = `images/cartes-ingredients/${encodeURIComponent(i.nom.normalize('NFC'))}.jpg`; cartesChargees.push(im); });
}
function carteIngredient(i) {
  const taille = '';   // tous les titres à la même taille (sur 2 lignes si besoin)
  return `<div class="carte-ing" style="--c:var(--fam-${i.fam});--f:var(--fam-${i.fam}-fonce)">
    <div class="panneau"></div>
    <div class="titre${taille}">${i.nom}</div>
    <div class="num">N° ${String(i.n).padStart(2, '0')}</div>
    <div class="fenetre-illu"></div>
    ${imgIngredient(i, 'illu')}
    <div class="medaillon"><img src="${imgFamille(i.fam)}" alt="${FAMILLES[i.fam].nom}"></div>
    <img class="carte-photo" src="images/cartes-ingredients/${encodeURIComponent(i.nom.normalize('NFC'))}.jpg" data-nfd="images/cartes-ingredients/${encodeURIComponent(i.nom.normalize('NFD'))}.jpg" alt="${i.nom}" onerror="if(this.dataset.nfd){this.src=this.dataset.nfd;this.dataset.nfd=''}else this.remove()">
  </div>`;
}

/* ---------- ÉCRAN TOUJOURS EN PORTRAIT ----------
   Quand on penche le téléphone, l'app ne pivote pas : on la tourne dans l'autre sens pour qu'elle reste
   comme en portrait (le téléphone est souvent posé à plat au milieu de la table). */
const surTelephone = matchMedia('(pointer: coarse)').matches;
function ecranPortrait() {
  const w = innerWidth, h = innerHeight;
  return surTelephone && w > h ? { w: h, h: w } : { w, h };
}
function garderPortrait() {
  const b = document.body, r = document.documentElement.style, w = innerWidth, h = innerHeight;
  if (surTelephone && w > h && !matchMedia('(orientation: portrait)').matches) {
    const angle = (screen.orientation && screen.orientation.angle) ?? window.orientation ?? 90;
    const sens = (angle === 90 || angle === -270) ? -90 : 90;
    Object.assign(b.style, { position: 'fixed', top: '0', left: '0', right: 'auto', bottom: 'auto', width: h + 'px', height: w + 'px', transformOrigin: '0 0',
      transform: sens === -90 ? `translate(0, ${h}px) rotate(-90deg)` : `translate(${w}px, 0) rotate(90deg)` });
    r.setProperty('--vw', h / 100 + 'px'); r.setProperty('--vh', w / 100 + 'px');
  } else {
    ['position', 'top', 'left', 'right', 'bottom', 'width', 'height', 'transform', 'transformOrigin'].forEach(k => b.style[k] = '');
    r.removeProperty('--vw'); r.removeProperty('--vh');
  }
}
// Sur iPhone, les dimensions arrivent en retard après la rotation, et les zones de toucher peuvent rester
// décalées : on recale plusieurs fois, on remet le défilement à zéro et on force un nouveau calcul de la page.
let dernierEtat = '';
function recaler() {
  garderPortrait();
  const etat = innerWidth + 'x' + innerHeight;
  window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0;
  if (etat !== dernierEtat) {
    dernierEtat = etat;
    const b = document.body; b.style.display = 'none'; void b.offsetHeight; b.style.display = '';
    dispatchEvent(new Event('resize'));
  }
}
function recalerPlusieursFois() { [0, 120, 350, 700, 1200].forEach(t => setTimeout(recaler, t)); }
addEventListener('resize', garderPortrait);
addEventListener('orientationchange', recalerPlusieursFois);
if (window.visualViewport) visualViewport.addEventListener('resize', () => setTimeout(recaler, 50));
if (screen.orientation) screen.orientation.addEventListener('change', recalerPlusieursFois);
garderPortrait();
try { screen.orientation.lock('portrait').catch(() => {}); } catch (e) {}

// Portrait de chaque sorcière, selon sa place (1 à 4) : images/sorcieres/sorciere-1.png …
const portraitSorciere = k => `<img class="portrait-sorciere" src="images/sorcieres/sorciere-${(k % 4) + 1}.png" alt="" onerror="this.replaceWith('🧙‍♀️')">`;
let R = { mode: 'concours', nb: 2, taille: 4, familles: Object.keys(FAMILLES) };   // réglages choisis
try { const f = JSON.parse(localStorage.getItem('chaudron-familles')); if (Array.isArray(f) && f.length) R.familles = Object.keys(FAMILLES).filter(id => f.includes(id)); } catch (e) {}
let S = {};                                         // état de la partie

/* ---------- 2. NAVIGATION ET PRÉPARATION ---------- */
function montrer(id) { $$('.ecran').forEach(e => e.classList.toggle('actif', e.id === id)); window.scrollTo(0, 0); if (window.FondMagique) FondMagique.ecran(id); if (id === 'ecran-titre') poseAccueil(); }
// À chaque arrivée sur l'accueil, le chaudron prend une pose au hasard (jamais deux fois la même de suite).
// Toutes les images des poses ont le même format (400 × 500) : les proportions ne changent pas.
let dernierePose = '';
function poseAccueil() {
  const im = document.querySelector('.perso-titre'); if (!im) return;
  const poses = [...new Set(Object.values(POSTURES))].filter(p => p !== dernierePose);
  dernierePose = poses[Math.floor(Math.random() * poses.length)];
  im.onerror = null; im.src = `images/chaudron/${dernierePose}.png`;
}
// menu de l'écran titre : le curseur ▸ suit le doigt / la souris
$$('.menu-rpg button').forEach(b => b.onmouseenter = b.onfocus = () => $$('.menu-rpg button').forEach(x => x.classList.toggle('choisi', x === b)));

$$('#ecran-titre [data-mode]').forEach(b => b.onclick = () => {
  debloquerAudio();
  if ($('#opt-musique').checked) Musique.demarrer();
  R.mode = b.dataset.mode;
  $('#prep-titre').textContent = R.mode === 'concours' ? 'Le Concours' : 'La Pleine Lune';
  $('#prep-sorcieres').hidden = R.mode !== 'concours';
  majPrepTaille();
  majFamilles();
  montrer('ecran-preparation');
});
$('#prep-retour').onclick = () => montrer('ecran-titre');

function choix(id, attr, cb) {
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $(id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    cb(b.dataset[attr]);
  });
}
choix('#choix-nombre', 'n', v => { R.nb = +v; majSaisieSorcieres(); majPrepTaille(); majFamilles(); });
// seule, on joue avec le principe de la Pleine Lune : on choisit la taille de la recette
function majPrepTaille() { $('#prep-taille').hidden = !(R.mode === 'lune' || R.nb === 1); }
choix('#choix-taille', 't', v => { R.taille = +v; majFamilles(); });

/* Familles en jeu : on choisit les familles d'ingrédients de la partie.
   Il en faut assez pour les recettes (sans ingrédient en commun) et les 2 ingrédients instables. */
function minFamilles() {
  const parFamille = 4;
  let besoin;
  if (R.mode === 'lune' || R.nb === 1) besoin = R.taille + 2;
  else if (R.nb > 1) besoin = R.nb * Math.max(...MANCHES_V5.map(m => m.taille)) + 2;
  else besoin = Math.max(...MANCHES.map(m => m.taille)) + 2;
  return Math.max(2, Math.ceil(besoin / parFamille));
}
function majFamilles() {
  const min = minFamilles(), ids = Object.keys(FAMILLES);
  // si on a ajouté des sorcières, on rajoute des familles pour qu'il y en ait assez
  for (const id of ids) { if (R.familles.length >= min) break; if (!R.familles.includes(id)) R.familles.push(id); }
  R.familles = ids.filter(id => R.familles.includes(id));
  $('#choix-familles').innerHTML = ids.map(id => `<button type="button" data-fam="${id}" class="${R.familles.includes(id) ? 'on' : ''}" style="--c:${couleurFamille(id)}" aria-pressed="${R.familles.includes(id)}">
    <img src="${imgFamille(id)}" alt=""><span>${FAMILLES[id].nom}</span></button>`).join('');
  const n = R.familles.length;
  $('#aide-familles').textContent = `${n} famille${n > 1 ? 's' : ''} sur ${ids.length} · ${n * 4} ingrédients. Il en faut au moins ${min}` +
    (R.mode === 'lune' || R.nb === 1 ? ` pour une recette de ${R.taille}.` : ` pour ${R.nb} sorcières.`);
  try { localStorage.setItem('chaudron-familles', JSON.stringify(R.familles)); } catch (e) {}
}
$('#choix-familles').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const id = b.dataset.fam, min = minFamilles();
  if (R.familles.includes(id)) {
    if (R.familles.length <= min) {             // pas assez de familles : on refuse, et on le dit
      const a = $('#aide-familles'); a.classList.remove('alerte'); void a.offsetWidth; a.classList.add('alerte'); return;
    }
    R.familles = R.familles.filter(f => f !== id);
  } else R.familles.push(id);
  majFamilles();
});
const enJeu = n => !S.familles || S.familles.includes(ING(n).fam);

function majSaisieSorcieres() {
  const box = $('#liste-sorcieres');
  const anciens = [...box.querySelectorAll('input')].map(i => i.value);
  box.innerHTML = '';
  for (let i = 0; i < R.nb; i++) {
    box.insertAdjacentHTML('beforeend', `<label class="sorciere-saisie"><span class="chapeau">${portraitSorciere(i)}</span><input maxlength="12" value="${anciens[i] || NOMS_PAR_DEFAUT[i]}"></label>`);
  }
}

$('#btn-allumer').onclick = () => { debloquerAudio(); demarrerPartie(); };

/* ---------- 3. PARTIE : MANCHES ET TOURS ---------- */
function demarrerPartie() {
  const noms = [...$('#liste-sorcieres').querySelectorAll('input')].map((i, k) => i.value.trim() || NOMS_PAR_DEFAUT[k]);
  const solo = R.mode === 'concours' && R.nb === 1;     // seule : principe de la Pleine Lune
  S = {
    mode: solo ? 'lune' : R.mode,
    solo,
    expert: $('#opt-expert').checked,
    voix: $('#opt-voix').checked,
    joueurs: (R.mode === 'concours' ? noms.slice(0, R.nb) : ['Le cercle']).map(nom => ({ nom, victoires: 0, pouvoirs: [], utilises: new Set(), passe: false, essais: 0, eliminee: false })),
    courant: 0,
    manche: 0,
    pouvoirsDispo: melanger(POUVOIRS.map(p => p.id)),
    familles: [...R.familles],            // les familles d'ingrédients de la partie
  };
  // Règles de 2 à 4 : des pouvoirs mélangés dans la pioche, 1 pour 6 ingrédients en jeu (2 à 4)
  S.pouvoirsPartie = melanger(POUVOIRS.map(p => p.id)).slice(0, Math.max(2, Math.min(4, Math.floor(S.familles.length * 4 / 6))));
  // Règles v5 : Concours à 2, 3 ou 4 sorcières, chacune sa recette secrète. Le solo et la Pleine Lune gardent les anciennes règles.
  S.v5 = S.mode === 'concours' && S.joueurs.length > 1;
  S.expertChoisi = S.expert;
  S.joueurs.forEach(j => { j.recette = []; j.absents = new Set(); j.malPlaces = {}; });
  montrer('ecran-jeu'); Perso.repos();
  remplirEtagere(); remplirLegendeFumees(); prechargerCartes();
  if ($('#opt-ambiance').checked) Ambiance.demarrer(); majBoutonAmbiance();
  if ($('#opt-musique').checked) Musique.demarrer(); else Musique.arreter();
  majBoutonMusique();
  if ($('#opt-camera').checked) Camera.demarrer(); else $('#oeil').hidden = true;
  garderEcranAllume(); Veille.reveil();
  nouvelleManche(true);
}

async function nouvelleManche(premiere) {
  Musique.piste(S.mode === 'lune' ? 'lune' : 'manche' + (S.manche + 1));   // la musique de cette manche
  const taille = S.mode === 'lune' ? R.taille : (S.v5 ? MANCHES_V5 : MANCHES)[S.manche].taille;
  const tirage = melanger(INGREDIENTS.filter(i => S.familles.includes(i.fam)).map(i => i.n));
  S.recette = tirage.slice(0, taille);
  let reste = tirage.slice(taille);
  if (S.v5) {
    // une recette par sorcière, sans aucun ingrédient en commun
    S.joueurs.forEach((j, k) => { j.recette = tirage.slice(k * taille, (k + 1) * taille); j.absents = new Set(); j.malPlaces = {}; });
    reste = tirage.slice(S.joueurs.length * taille);
    S.recette = S.joueurs[0].recette;
    S.expert = S.expertChoisi;
  }
  // 2 ingrédients instables, hors de toutes les recettes, de familles différentes (pas avec les règles de 2 à 4 sorcières)
  // 2 ingrédients instables, hors de toutes les recettes, de deux familles différentes, annoncées au début de la manche
  S.instables = [reste[0], reste.find(n => ING(n).fam !== ING(reste[0]).fam)].filter(Boolean);
  if (S.instables.length < 2) S.instables = [];
  majRappelInstables();
  S.max = taille;                       // autant d'emplacements que d'ingrédients dans la recette
  S.brassage = []; S.journal = []; S.absents = new Set(); S.malPlaces = {}; S.defausse = new Set();
  S.essais = 0; S.phase = 'attente'; S.derniere = null;
  S.secret = false; S.question = false; S.sablier = false;
  S.joueurs.forEach(j => { j.passe = false; j.eliminee = false; j.utilises = new Set(); j.fumee = null; });
  colorerPotion(null);
  majTitre(); majSorcieres(); majPlateau(); majJournal(); majPouvoirs(); majActions('brassage');

  if (S.mode === 'lune') {
    await rideau(`<div class="icone">🌕</div><div class="petit-titre">${S.solo ? 'Seule face au chaudron' : 'Mode coopératif'}</div><div class="grand-titre">La Pleine Lune</div><div class="sous-titre">${taille} ingrédients · ${CONFIG.essaisPleineLune} essais</div>`, CONFIG.dureeRideau + 600);
    await parler('luneDebut', { n: taille, essais: CONFIG.essaisPleineLune });
    if (S.instables.length) await parler('instables', { f1: FAMILLES[ING(S.instables[0]).fam].nom, f2: FAMILLES[ING(S.instables[1]).fam].nom });
    S.phase = 'brassage'; majPlateau();
    $('#consigne').innerHTML = 'Jetez vos cartes une par une, <b>dans l\'ordre</b>';
    return;
  }
  const m = (S.v5 ? MANCHES_V5 : MANCHES)[S.manche];
  const sous = S.v5 ? `Chacune sa recette secrète · main de 4 cartes · ${taille} ingrédients${S.expert ? ' · mode expert' : ''}` : `${taille} ingrédients · l'ordre compte`;
  if (S.v5) await rideau(`<div class="grand-titre">Manche ${S.manche + 1} · ${m.nom}</div><div class="sous-titre grand">${sous}</div>`, CONFIG.dureeRideau + 700);
  else await rideau(`<div class="icone">${'🔥'.repeat(S.manche + 1)}</div><div class="petit-titre">Manche ${S.manche + 1}</div><div class="grand-titre">${m.nom}</div><div class="sous-titre">${sous}</div>`, CONFIG.dureeRideau + 600);
  if (premiere && S.v5) {
    const cartes = S.pouvoirsPartie.map(id => POUVOIRS.find(p => p.id === id));
    await rideauBouton(`<div class="grand-titre">Pouvoirs de la partie</div><div class="sous-titre grand">Mélangez ces ${cartes.length} cartes pouvoir dans la pioche.</div>
      <div class="pouvoirs-partie">${cartes.map(p => `<div class="pouvoir-partie"><span class="emoji">${p.emoji}</span><b>${p.nom}</b><small>${p.texte}</small></div>`).join('')}</div>
      <div class="sous-titre">Pioché, un pouvoir se pose devant soi et on pioche une carte pour le remplacer. Un pouvoir par tour au maximum.</div>`, "C'est fait");
  }
  if (premiere) await parler('accueil');
  const annoncerInstables = () => S.instables.length ? parler('instables', { f1: FAMILLES[ING(S.instables[0]).fam].nom, f2: FAMILLES[ING(S.instables[1]).fam].nom }) : null;
  // la voix enregistrée correspond au nombre d'ingrédients (l'Archimage v5 en a 4, comme la Sorcière)
  await parler('manche', { manche: S.v5 ? (taille === 4 ? 'Sorcière' : taille === 3 ? 'Apprentie' : m.nom) : m.nom, n: taille });
  await annoncerInstables();
  S.toursDepuisMarche = 0;
  if (S.joueurs.length > 1 && !S.v5) await distribuerSecrets();
  await debutTour(S.v5);              // règles de 2 à 4 : le rideau rappelle l'appel de carte dès le premier tour
}

async function debutTour(avecRideau = true) {
  const j = S.joueurs[S.courant];
  S.annonceCeTour = false; S.pouvoirCeTour = false; S.sablier = false; S.secret = false; S.question = false;
  if (S.v5) { S.recette = j.recette; S.absents = j.absents; S.malPlaces = j.malPlaces; }
  S.brassage = []; S.phase = 'brassage';
  majSorcieres(); majPlateau(); majPouvoirs(); majActions('brassage');
  $('#consigne').innerHTML = S.v5 ? `<b>${j.nom}</b> : fais ton appel de carte, puis jette 3 cartes dans l'ordre`
    : `<b>${j.nom}</b> : cueille une carte, puis jette-en ${S.max > CONFIG.minBrassage ? CONFIG.minBrassage + ' à ' + S.max : S.max} dans l'ordre`;
  if (S.v5) {
    // écran « Au tour de… » : reste affiché jusqu'au bouton « Brasser »
    await rideauBouton(`<div class="grand-titre">Au tour de ${j.nom}</div><div class="sous-titre grand">Demande une carte à une adversaire.<br>Si elle l'a, elle te la donne et pioche une carte.</div>`, 'Brasser');
    parler('tour', { joueur: j.nom });
    return;
  }
  if (S.joueurs.length > 1) {
    const appel = '';
    if (avecRideau) await rideau(`<div class="portrait-tour">${portraitSorciere(S.courant)}</div><div class="petit-titre">Au tour de</div><div class="grand-titre">${j.nom}</div>${appel}`, CONFIG.dureeRideau + (S.v5 ? 2500 : 0));
    parler('tour', { joueur: j.nom });
  }
}

async function tourSuivant() {
  // après un tour de table complet, le marché se refait
  if (S.v5) await finDeTourV6();
  else {
    S.toursDepuisMarche = (S.toursDepuisMarche || 0) + 1;
    const enJeu = S.joueurs.filter(j => !j.eliminee).length;
    // marché retiré pour l'instant : plus de rappel « le marché se refait »
  }
  for (let k = 0; k < S.joueurs.length; k++) {
    S.courant = (S.courant + 1) % S.joueurs.length;
    const j = S.joueurs[S.courant];
    if (j.eliminee) continue;                       // chassée après une annonce fausse
    if (j.passe && S.joueurs.length > 1) { j.passe = false; majSorcieres(); await parler('passe', { joueur: j.nom }); continue; }
    j.passe = false; break;
  }
  colorerPotion(null);
  debutTour(true);
}
$('#btn-suivant').onclick = tourSuivant;

/* ---------- 4. BRASSER : LE CŒUR DU JEU ---------- */
function ajouterIngredient(n) {
  if (!ING(n)) return;
  Veille.activite();
  if (ecranDePassage()) return;              // rien ne se scanne pendant les écrans de passage
  if (S.question) return Pouvoirs.repondreSerpent(n);
  if (S.phase !== 'brassage') return;
  if (!enJeu(n)) { parler('horsJeu'); return; }
  if (S.brassage.includes(n)) { parler('doublon'); return; }
  if (S.brassage.length >= S.max) return;
  S.brassage.push(n);
  Sons.jouer('scan');
  montrerEnGrand(ING(n), S.brassage.length);
  Fumee.bouffee(varCSS('--fumee-repos'), 12);
  majPlateau(); majEtagere();
  if (S.brassage.length === S.max) { fermerTiroirs(); brasser(); }
}
$('#btn-retirer-main').onclick = () => $('#btn-retirer').onclick();
$('#btn-brasser-main').onclick = () => { fermerTiroirs(); brasser(); };
$('#btn-retirer').onclick = () => { if (S.phase === 'brassage') { S.brassage.pop(); majPlateau(); majEtagere(); } };
// toucher la dernière carte jetée la retire (comme le bouton ↩)
$('#plateau').onclick = e => { if (e.target.closest('.emplacement.retirable')) $('#btn-retirer').onclick(); };
$('#btn-brasser').onclick = () => { fermerTiroirs(); brasser(); };

// la règle : bulle = bonne place, sifflement = mauvaise place, pschitt = absent
// règles v5 : œil = pas dans ta recette, mais dans celle d'une autre sorcière
function calculerReponses(brassage, recette) {
  const autres = S.v5 ? new Set(S.joueurs.filter(j => j.recette !== recette).flatMap(j => j.recette)) : new Set();
  return brassage.map((n, i) => recette[i] === n ? 'bulle' : recette.includes(n) ? 'sifflement' : autres.has(n) ? 'oeil' : 'pschitt');
}

// fumée : une famille de la recette absente du brassage ; dorée si toutes y sont
function fumeeDe(ids, gagne) {
  if (gagne) return { couleur: varCSS('--fumee-victoire'), texte: TEXTES_FUMEE.victoire };
  const famRecette = [...new Set(S.recette.map(n => ING(n).fam))];
  const famJetees = new Set(ids.map(n => ING(n).fam));
  const manquantes = famRecette.filter(f => !famJetees.has(f));
  if (!manquantes.length) return { couleur: varCSS('--fumee-complete'), texte: TEXTES_FUMEE.complete };
  const f = hasard(manquantes);
  return { couleur: couleurFamille(f), texte: TEXTES_FUMEE.famille.replace('{couleur}', FAMILLES[f].fumee).replace('{famille}', FAMILLES[f].nom) };
}

async function brasser() {
  if (S.phase !== 'brassage' || S.brassage.length < Math.min(CONFIG.minBrassage, S.recette.length)) return;
  S.phase = 'reponse'; majActions('aucune');
  const j = S.joueurs[S.courant];
  const ids = [...S.brassage];
  j.essais++; S.essais++;
  await attendre(CONFIG.pauseAvantSons);          // on laisse le temps de voir les cartes jetées
  $('#scene').classList.add('agite');

  if (S.secret) {
    await fenetreBouton(`<h2>🦉 Œil de chouette</h2><p>Colle le téléphone à ton oreille, puis touche le bouton.</p>`, "J'écoute", true);
    $('#fenetre-boite').innerHTML = '<p style="font-size:3rem">🦉</p>';
  }

  // --- explosion ---
  if (S.instables.length && S.instables.every(n => ids.includes(n))) {
    const [a, b] = S.instables.map(n => ING(n).nom);
    $('#scene').classList.add('secoue'); setTimeout(() => $('#scene').classList.remove('secoue'), 700);
    Sons.jouer('explosion');
    colorerPotion(varCSS('--fumee-explosion'), S.secret ? '' : TEXTES_FUMEE.explosion); Fumee.bouffee(varCSS('--fumee-explosion'), 140);
    if (S.secret) { S.secret = false; fermerFenetre(); }
    ajouterJournal({ qui: j.nom, explosion: `${a} + ${b}` });
    S.derniere = { ids, res: ids.map(n => S.instables.includes(n) ? 'pschitt' : 'garde'), secret: false };   // on défausse les deux instables
    S.instables.forEach(n => S.defausse && S.defausse.add(n));
    await parler('explosion', { a, b });
    if (S.mode === 'concours') {
      if (j.pouvoirs.includes('amulette') && !j.utilises.has('amulette')) { j.utilises.add('amulette'); await parler('protege', { joueur: j.nom }); }
      else j.passe = true;
      majSorcieres();
    }
    return finDuBrassage();
  }

  // --- réponses ---
  const res = calculerReponses(ids, S.recette);
  const gagne = ids.length === S.recette.length && res.every(r => r === 'bulle');
  const secret = S.secret;

  if (!secret && !gagne) {
    const bete = ids.find((n, i) => S.absents.has(n) || (S.malPlaces[n] && S.malPlaces[n].has(i)));
    if (bete) await parler('moquerie', { ingredient: ING(bete).nom });
  }
  if (!secret) ids.forEach((n, i) => {
    if (res[i] === 'pschitt' || res[i] === 'oeil') S.absents.add(n);
    if (res[i] === 'sifflement') (S.malPlaces[n] ||= new Set()).add(i);
  });

  const { couleur, texte: texteFumee } = fumeeDe(ids, gagne);
  S.derniere = { res, secret, ids };
  // les cartes à défausser (croix rouge) ne peuvent plus être choisies avec la main pendant cette manche
  if (S.v5 && !secret) ids.forEach((n, i) => { if (res[i] === 'pschitt') S.defausse.add(n); });
  if (S.v5) {
    await jouerReponses(res, secret);                       // chaque son avec son icône…
    colorerPotion(couleur, secret ? '' : texteFumee); Fumee.bouffee(couleur, 70);   // …puis la fumée : une famille qui manque à sa recette
  } else {
    colorerPotion(couleur, secret ? '' : texteFumee); Fumee.bouffee(couleur, 70);
    await jouerReponses(res, secret);
  }

  await attendre(CONFIG.pauseApresSons);          // un temps de silence avant que le chaudron parle
  ajouterJournal(secret ? { qui: j.nom, secret: true } : { qui: S.mode === 'concours' ? j.nom : `Essai ${S.essais}`, ids, res, couleur, texteFumee, expert: S.expert });

  if (secret) { S.secret = false; colorerPotion(null); fermerFenetre(); majPlateau(); }
  if (gagne) return victoireManche();
  const bulles = res.filter(r => r === 'bulle').length;
  await parler(secret ? 'secret' : bulles >= S.recette.length - 1 ? 'presque' : 'rate');
  finDuBrassage();
}

async function jouerReponses(res, secret, sonsDabord = false) {
  const ordre = S.expert ? melanger(res).sort((a, b) => ORDRE_REP.indexOf(a) - ORDRE_REP.indexOf(b)) : res;
  $('#reponses-expert').innerHTML = '';
  if (sonsDabord) {
    for (let i = 0; i < ordre.length; i++) {
      Sons.jouer(ordre[i]);
      if (ordre[i] === 'bulle') Fumee.bouffee(Fumee.couleur, 30);
      await attendre(CONFIG.pauseEntreSons);
    }
    if (!secret) ordre.forEach((r, i) => afficherReponse(r, i));
    await attendre(400);
    return;
  }
  for (let i = 0; i < ordre.length; i++) {
    if (!secret) {
      if (S.expert) $('#reponses-expert').insertAdjacentHTML('beforeend', `<figure><img src="${imgReponse(ordre[i])}" alt=""><figcaption>${LIBELLES_REPONSES[ordre[i]]}</figcaption></figure>`);
      else {
        const el = $('#rep-' + i);
        if (el) { el.src = imgReponse(ordre[i]); el.classList.add('visible'); }
      }
    }
    Sons.jouer(ordre[i]);
    if (ordre[i] === 'bulle') Fumee.bouffee(Fumee.couleur, 30);
    await attendre(CONFIG.pauseEntreSons);
  }
}

function afficherReponse(r, i) {
  if (S.expert) { $('#reponses-expert').insertAdjacentHTML('beforeend', `<figure><img src="${imgReponse(r)}" alt=""><figcaption>${LIBELLES_REPONSES[r]}</figcaption></figure>`); return; }
  const el = $('#rep-' + i);
  if (el) { el.src = imgReponse(r); el.classList.add('visible'); }
}

async function finDuBrassage() {
  $('#scene').classList.remove('agite');
  if (S.mode === 'lune') {
    majTitre();
    const reste = CONFIG.essaisPleineLune - S.essais;
    if (reste <= 0) { await parler('lunePerdu', { recette: S.recette.map(n => ING(n).nom).join(', ') }); return finPartie(false); }
    await (reste === 1 ? parler('luneDerniere') : parler('lune', { n: reste }));
    await attendre(600);
    S.brassage = []; S.phase = 'brassage'; S.annonceCeTour = false; colorerPotion(null); majPlateau(); majActions('brassage');
    return;
  }
  const j = S.joueurs[S.courant];
  if (S.sablier && S.v5) {
    // ⏳ Sablier : on défausse, on refait sa main, puis on brasse une seconde fois
    S.sablier = false;
    const def = cartesADefausser();
    await rideauBouton(`<div class="grand-titre">⏳ Sablier · ${def.length ? 'Défausse' : 'Rien à défausser'}</div>${def.length ? cartesVisuels(def) : ''}<div class="sous-titre grand">Refais ta main à 4 cartes, puis brasse une seconde fois.</div>`, 'Brasser');
    S.brassage = []; S.phase = 'brassage'; colorerPotion(null);
    majPlateau(); majActions('brassage');
    return;
  }
  if (S.sablier) {
    S.sablier = false; S.brassage = []; S.phase = 'brassage';
    majPlateau(); majActions('brassage'); majPouvoirs();
    $('#consigne').innerHTML = `⏳ <b>${j.nom}</b> rejoue tout de suite !`;
    return;
  }
  S.phase = 'suite';
  majActions('suite'); majPouvoirs();
  const def = S.v5 ? cartesADefausser() : [];
  $('#consigne').innerHTML = S.v5 ? (def.length ? `Défausse : <b>${def.map(n => ING(n).nom).join(', ')}</b>, puis refais ta main à 4 cartes.` : 'Rien à défausser : refais ta main à 4 cartes.')
    : S.joueurs.length > 1 ? 'Notez la réponse dans vos grimoires…' : 'Note la réponse dans ton grimoire…';
}

/* ---------- 5. VICTOIRES ET FIN DE PARTIE ---------- */
const recetteHTML = () => `<div class="recette-revelee">${S.recette.map(n => `<span style="--c:${couleurFamille(ING(n).fam)}">${ING(n).nom}</span>`).join('')}</div>`;

async function victoireManche(k = S.courant, cle = 'victoire') {
  $('#scene').classList.remove('agite');
  Sons.jouer('victoire');
  Fumee.bouffee(varCSS('--fumee-victoire'), 160);
  colorerPotion(varCSS('--fumee-victoire'), TEXTES_FUMEE.victoire);
  const j = S.joueurs[k];
  if (S.mode === 'lune') { await parler('luneGagne'); return finPartie(true); }
  j.victoires++; majSorcieres();
  await parler(cle, { joueur: j.nom });

  const solo = S.joueurs.length === 1;
  const derniere = S.manche === MANCHES.length - 1;
  if (derniere || (!solo && j.victoires >= 2)) {
    if (!solo) await parler('grande', { joueur: meilleure().nom });
    return finPartie(true);
  }
  if (S.v5) {                                  // règles de 2 à 4 sorcières : pas de pouvoir pour l'instant
    await rideauBouton(`<div class="grand-titre">${j.nom} remporte la manche ${MANCHES[S.manche].nom} !</div>${cartesVisuels(S.recette)}`, 'Manche suivante');
    S.manche++;
    S.courant = (S.courant + 1) % S.joueurs.length;
    return nouvelleManche(false);
  }
  // choisir un pouvoir parmi 3
  const choixP = S.pouvoirsDispo.slice(0, 3).map(id => POUVOIRS.find(p => p.id === id));
  fenetre(`<h2>${j.nom} remporte la manche ${MANCHES[S.manche].nom} !</h2>${recetteHTML()}
    <p>Choisis un pouvoir et prends la carte :</p>
    <div class="cartes-pouvoirs">${choixP.map(p => `<button class="carte-pouvoir" data-p="${p.id}"><span class="emoji">${p.emoji}</span><span><b>${p.nom}</b><small>${p.texte}</small></span></button>`).join('')}</div>`);
  $$('#fenetre-boite [data-p]').forEach(b => b.onclick = () => {
    j.pouvoirs.push(b.dataset.p);
    S.pouvoirsDispo = S.pouvoirsDispo.filter(x => x !== b.dataset.p);
    fermerFenetre();
    S.manche++;
    S.courant = (S.courant + 1) % S.joueurs.length;
    nouvelleManche(false);
  });
}

/* ---------- INGRÉDIENT SECRET ----------
   En début de manche, chaque sorcière reçoit en secret un ingrédient de la recette
   (différent pour chacune tant que la recette est assez longue). */
async function distribuerSecrets() {
  const pioche = melanger(S.recette);
  for (let k = 0; k < S.joueurs.length; k++) {
    const j = S.joueurs[k], n = pioche[k % pioche.length];
    j.secret = n;
    await fenetreBouton(`<p style="font-size:2.6rem;margin:0">🤫</p><h2>Le secret de ${j.nom}</h2>
      <p>Donne le téléphone à <b>${j.nom}</b>. Les autres sorcières détournent les yeux.</p>`, `Je suis ${j.nom}`, true);
    const ing = ING(n);
    await fenetreBouton(`<p class="secret-titre">Un ingrédient de la recette est…</p>
      <div class="apercu-boite carte secret-carte" style="--c:${couleurFamille(ing.fam)}">${carteIngredient(ing)}</div>
      <p><small>Retiens-le (ou note-le en secret dans ton grimoire). Tu ne connais pas sa place.</small></p>`, "C'est noté", true);
  }
  fermerFenetre();
  await parler('secrets');
}

/* ---------- RÈGLES V5 : à la fin de chaque tour, défausse puis tout le monde passe une carte à gauche ---------- */
// Fin du tour (2 à 4 sorcières) : on défausse les cartes qui ne servent à aucune recette (pschitt), puis on refait sa main à 4 cartes.
const cartesADefausser = () => (S.derniere && S.derniere.ids && !S.derniere.secret) ? S.derniere.ids.filter((n, i) => S.derniere.res[i] === 'pschitt') : [];
async function finDeTourV6() {
  const j = S.joueurs[S.courant], def = cartesADefausser();
  if (S.derniere && S.derniere.secret)        // œil de chouette : elle seule sait quoi défausser
    return rideauBouton(`<div class="grand-titre">Fin du tour de ${j.nom} · Défausse</div><div class="sous-titre grand">Défausse en secret les cartes qui ont fait pschitt.</div>`, 'Au suivant');
  await rideauBouton(`<div class="grand-titre">Fin du tour de ${j.nom} · ${def.length ? 'Défausse' : 'Rien à défausser'}</div>${def.length ? cartesVisuels(def) : ''}`, 'Au suivant');
}
async function rappelGauche() {
  await rideau(`<div class="icone">🃏 ⬅</div><div class="petit-titre">Fin du tour</div><div class="grand-titre">Passez à gauche</div>
    <div class="sous-titre">Défausse pour revenir à 4 cartes (sous la pioche),<br>puis tout le monde donne en même temps<br>une carte face cachée à sa voisine de gauche.</div>`, CONFIG.dureeRappelGauche);
}

/* ---------- LE MARCHÉ SE REFAIT après chaque tour de table ---------- */
async function rappelMarche() {
  const fin = rideau(`<div class="icone">🧺</div><div class="petit-titre">Fin du tour de table</div><div class="grand-titre">Le marché se refait</div>
    <div class="sous-titre">Remettez les cartes du marché sous la pioche,<br>puis retournez 4 nouvelles cartes.</div>`, CONFIG.dureeRideau * 2.5);
  await parler('marche');
  await fin;
}

/* ---------- ANNONCE : gagner en annonçant la recette (comme au Cluedo) ----------
   Pendant son tour, au lieu de brasser, une sorcière peut annoncer la recette complète,
   en secret, sans avoir besoin des cartes. Juste : elle gagne la manche.
   Fausse : elle est chassée jusqu'à la fin de la manche (en solo et en Pleine Lune : pénalité). */
let annonceEnCours = [];
$('#btn-annonce').onclick = async () => {
  if (S.annonceCeTour) return;
  if (!(S.phase === 'brassage' && !S.brassage.length) && S.phase !== 'suite') return;
  S.phaseAvantAnnonce = S.phase;
  S.phase = 'annonce'; majActions('aucune');
  await parler('annonce');
  annonceEnCours = [];
  ouvrirAnnonce();
};

function ouvrirAnnonce() {
  const L = S.recette.length;
  const places = Array.from({ length: L }, (_, p) => {
    const n = annonceEnCours[p];
    return n ? `<span class="place-annonce pleine" style="--c:${couleurFamille(ING(n).fam)}"><small>${p + 1}</small>${ING(n).nom}</span>` : `<span class="place-annonce"><small>${p + 1}</small></span>`;
  }).join('');
  fenetre(`<h2>📜 Annonce secrète</h2>
    <p><small>Les autres sorcières détournent les yeux. Touche les ingrédients de la recette, dans l'ordre.</small></p>
    <div class="places-annonce">${places}</div>
    <div class="etagere" id="etagere-annonce"></div>
    <div class="actions">
      <button class="rond grand-rond" id="a-annuler" aria-label="Renoncer">✕</button>
      <button class="rond grand-rond" id="a-retirer" aria-label="Retirer">↩</button>
      <button class="bouton-or" id="a-valider" ${annonceEnCours.length === L ? '' : 'disabled'}>J'annonce !</button>
    </div>`, true);
  const box = $('#etagere-annonce');
  remplirEtagere(box);
  box.querySelectorAll('button').forEach(b => {
    const n = +b.dataset.n;
    if (annonceEnCours.includes(n)) b.classList.add('dedans');
    b.onclick = () => { if (annonceEnCours.length < L && !annonceEnCours.includes(n)) { annonceEnCours.push(n); Sons.jouer('scan'); ouvrirAnnonce(); } };
  });
  $('#a-retirer').onclick = () => { annonceEnCours.pop(); ouvrirAnnonce(); };
  $('#a-annuler').onclick = () => { fermerFenetre(); S.phase = S.phaseAvantAnnonce; majActions(S.phase); majPouvoirs(); };
  $('#a-valider').onclick = () => verifierAnnonce([...annonceEnCours]);
}

async function verifierAnnonce(proposition) {
  fermerFenetre();
  S.annonceCeTour = true;
  const j = S.joueurs[S.courant];
  $('#scene').classList.add('agite');
  await rideau(`<div class="icone">📜</div><div class="petit-titre">${S.mode === 'concours' ? j.nom : 'Le cercle'} annonce…</div><div class="grand-titre">…</div>`, 1600);
  $('#scene').classList.remove('agite');
  const juste = proposition.every((n, i) => n === S.recette[i]);
  if (juste) {
    ajouterJournal({ qui: j.nom, annonce: 'juste' });
    if (S.mode === 'lune') return victoireManche();
    return victoireManche(S.courant, 'annonceJuste');
  }
  // annonce fausse
  Sons.jouer('explosion');
  $('#scene').classList.add('secoue'); setTimeout(() => $('#scene').classList.remove('secoue'), 700);
  colorerPotion(varCSS('--fumee-explosion'), 'Annonce fausse');
  ajouterJournal({ qui: S.mode === 'concours' ? j.nom : `Essai ${S.essais + 1}`, annonce: 'fausse' });
  if (S.mode === 'lune') {
    S.essais += CONFIG.penaliteAnnonceLune;
    await parler('annonceFausseLune');
    return finDuBrassage();
  }
  if (S.joueurs.length === 1) {
    j.essais += CONFIG.penaliteAnnonceSolo;
    await parler('annonceFausseSolo');
    return finDuBrassage();
  }
  j.eliminee = true; majSorcieres();
  await parler('annonceFausse', { joueur: j.nom });
  const enLice = S.joueurs.map((s, k) => s.eliminee ? null : k).filter(k => k !== null);
  if (enLice.length === 1) return victoireManche(enLice[0], 'derniereEnLice');
  finDuBrassage();
}

const meilleure = () => S.joueurs.reduce((a, b) => b.victoires > a.victoires ? b : a);

function finPartie(gagne) {
  let html;
  if (S.mode === 'lune') {
    html = gagne ? `<h2>🌕 Potion réussie !</h2><p>En ${S.essais} essai(s), avant le lever de la lune.</p>${recetteHTML()}`
                 : `<h2>🌑 La lune s'est levée…</h2><p>La recette était :</p>${recetteHTML()}`;
  } else if (S.joueurs.length === 1) {
    html = `<h2>Partie terminée</h2><p><b>${S.joueurs[0].nom}</b> a réussi les 3 manches en <b>${S.joueurs[0].essais}</b> brassages.</p>`;
  } else {
    html = `<p style="font-size:3rem;margin:0">👑</p><h2>${meilleure().nom}</h2><p>est sacrée <b>Grande Sorcière</b> !</p>`;
  }
  fenetre(html + `<div class="actions"><button class="rond grand-rond" id="f-accueil" aria-label="Accueil">⌂</button><button class="bouton-or" id="f-rejouer">Rejouer</button></div>`);
  $('#f-accueil').onclick = () => { fermerFenetre(); quitter(); };
  $('#f-rejouer').onclick = () => { toutCouper(); demarrerPartie(); };
}

function toutCouper() {
  Partie.numero++;                                   // les tours en attente s'arrêtent
  viderParole();                                     // voix enregistrées + voix du téléphone
  Camera.arreter(); Ambiance.arreter(); Musique.arreter(); Veille.arreter();
  $('#rideau').classList.remove('visible'); $('#apercu-carte').classList.remove('visible');
  fermerFenetre(); fermerTiroirs(); colorerPotion(null);
}
function quitter() { Eclairage.regler(false); toutCouper(); Musique.cible = 'accueil'; montrer('ecran-titre'); }
$('#btn-quitter').onclick = async () => { if (await fenetreOuiNon('<h2>Éteindre le feu ?</h2><p>La partie en cours sera perdue.</p>')) quitter(); };

/* ---------- 6. POUVOIRS ---------- */
const Pouvoirs = {
  // Carte pouvoir scannée (QR CHAUDRON-P1 à P6, dans l'ordre de POUVOIRS)
  scanner(k) {
    const p = POUVOIRS[k - 1]; if (!p || !S.joueurs || S.mode === 'lune') return;
    if (S.v5) return this.scannerV6(p);
    Sons.jouer('scan');
    // 1. on choisit son pouvoir après avoir gagné une manche
    const choix = document.querySelector(`#fenetre.visible [data-p="${p.id}"]`);
    if (choix) return choix.click();
    if (document.querySelector('#fenetre.visible [data-p]')) return this.message(p, 'Ce pouvoir ne fait pas partie du choix.');
    // 2. on l'utilise pendant son tour, avant de jeter ses cartes
    const j = S.joueurs[S.courant];
    if (S.mode !== 'concours' || !j) return;
    if (!j.pouvoirs.includes(p.id)) return this.message(p, `Ce pouvoir n'appartient pas à ${j.nom}.`);
    if (j.utilises.has(p.id)) return this.message(p, 'Déjà utilisé pendant cette manche.');
    if (p.id === 'amulette') return this.message(p, "L'amulette agit toute seule en cas d'explosion.");
    if (S.phase !== 'brassage' || S.brassage.length) return this.message(p, 'Un pouvoir se joue au début du tour, avant de jeter ses cartes.');
    const bouton = [...$$('#actions-pouvoirs button')].find(b => b.dataset.id === p.id) || document.createElement('button');
    this.utiliser(p.id, bouton);
    this.message(p, p.app ? 'Pouvoir activé !' : 'Pouvoir validé : applique-le à la table.');
  },
  // Règles de 2 à 4 : n'importe quelle sorcière joue le pouvoir posé devant elle, une fois par tour, avant de jeter ses cartes
  scannerV6(p) {
    Sons.jouer('scan');
    if (!S.pouvoirsPartie.includes(p.id)) return this.message(p, "Ce pouvoir n'est pas dans la pioche de cette partie.");
    if (p.id === 'amulette') return this.message(p, "Elle se joue quand on te demande une carte : montre-la, l'appel est refusé. Pas besoin de la scanner.");
    if (S.pouvoirCeTour) return this.message(p, 'Un seul pouvoir par tour.');
    if (S.phase !== 'brassage' || S.brassage.length) return this.message(p, 'Un pouvoir se joue au début du tour, avant de jeter ses cartes.');
    S.pouvoirCeTour = true;
    if (p.id === 'chouette') { S.secret = true; parler('chouette'); }
    if (p.id === 'sablier') S.sablier = true;
    if (p.id === 'serpent') { S.question = true; this.ouvrirSerpent(); return; }
    this.message(p, (p.app ? 'Pouvoir activé ! ' : 'Applique-le à la table. ') + 'Puis défausse la carte.');
  },
  message(p, texte) {
    rideau(`<div class="icone">${p.emoji}</div><div class="grand-titre">${p.nom}</div><div class="sous-titre">${texte}</div>`, 1800);
  },
  utiliser(id, bouton) {
    const j = S.joueurs[S.courant];
    if (id === 'chouette') { S.secret = true; parler('chouette'); }
    if (id === 'sablier') { S.sablier = true; }
    if (id === 'serpent') { S.question = true; this.ouvrirSerpent(); }
    j.utilises.add(id); bouton.disabled = true; bouton.classList.add('on');
  },
  ouvrirSerpent() {
    fenetre(`<h2>🐍 Langue de serpent</h2><p>Montre <b>une</b> carte au chaudron (ou touche-la ci-dessous), téléphone à l'oreille.</p><div class="etagere" id="etagere-serpent"></div>`);
    remplirEtagere($('#etagere-serpent'));
  },
  async repondreSerpent(n) {
    S.question = false;
    fenetre(`<p style="font-size:3rem">🐍</p><p>Le chaudron chuchote…</p>`, true);
    const oui = S.recette.includes(n);
    Sons.jouer(oui ? 'bulle' : 'pschitt');
    if (oui && S.v5) await parler('serpentPlace', { place: ['première', 'deuxième', 'troisième', 'quatrième', 'cinquième'][S.recette.indexOf(n)] }, true);
    else await parler(oui ? 'serpentOui' : 'serpentNon', {}, true);
    await attendre(500);
    fermerFenetre();
    ajouterJournal({ qui: S.joueurs[S.courant].nom, serpent: true });
  },
};

function majPouvoirs() {
  const box = $('#actions-pouvoirs'); box.innerHTML = '';
  if (S.mode !== 'concours' || S.phase !== 'brassage') return;
  const j = S.joueurs[S.courant];
  j.pouvoirs.map(id => POUVOIRS.find(p => p.id === id)).filter(p => p.id !== 'amulette').forEach(p => {
    const b = document.createElement('button'); b.dataset.id = p.id;
    b.className = 'bouton-pouvoir'; b.textContent = `${p.emoji} ${p.nom}`;
    b.disabled = j.utilises.has(p.id);
    b.onclick = () => Pouvoirs.utiliser(p.id, b);
    box.appendChild(b);
  });
}

/* ---------- 7. AFFICHAGE ---------- */
function majTitre() {
  if (S.mode === 'lune') {
    $('#titre-manche').innerHTML = 'La Pleine Lune<small>coopératif</small>';
    $('#lunes').hidden = false; $('#sorcieres').hidden = true;
    $('#lunes').innerHTML = Array.from({ length: CONFIG.essaisPleineLune }, (_, i) => `<span class="${i < S.essais ? 'levee' : ''}"></span>`).join('');
  } else {
    $('#lunes').hidden = true; $('#sorcieres').hidden = false;
    const m = (S.v5 ? MANCHES_V5 : MANCHES)[S.manche];
    $('#titre-manche').innerHTML = `${m.nom}<small>Manche ${S.manche + 1} sur ${MANCHES.length} - ${S.recette.length} ingrédients${S.v5 && S.expert ? ' - expert' : ''}</small>`;
  }
}

function majSorcieres() {
  if (S.mode !== 'concours') return;
  $('#sorcieres').innerHTML = S.joueurs.map((j, k) => {
    const pv = j.pouvoirs.map(id => POUVOIRS.find(p => p.id === id).emoji).join('');
    return `<div class="sorciere ${k === S.courant ? 'active' : ''} ${j.passe ? 'suie' : ''} ${j.eliminee ? 'eliminee' : ''}"><span class="chapeau">${portraitSorciere(k)}</span><span class="nom-sorciere">${j.nom}</span><span class="trophees">${'★'.repeat(j.victoires)}</span>${pv}</div>`;
  }).join('');
}

// la carte qu'on vient de jeter apparaît en grand au centre, puis se range
let minuteurApercu = null;
function montrerEnGrand(ing, rang) {
  const a = $('#apercu-carte');
  a.style.setProperty('--c', couleurFamille(ing.fam));
  a.style.setProperty('--duree-apercu', CONFIG.dureeApercuCarte + 'ms');
  a.innerHTML = `<div class="apercu-boite carte" style="--c:${couleurFamille(ing.fam)}"><span class="rang"><span>${rang}</span></span>${carteIngredient(ing)}</div>`;
  a.classList.remove('visible'); void a.offsetWidth; a.classList.add('visible');
  clearTimeout(minuteurApercu);
  minuteurApercu = setTimeout(() => a.classList.remove('visible'), CONFIG.dureeApercuCarte);
}

// pas de coupure au milieu d'un mot : les traits d'union deviennent insécables
const sansCesure = t => t.replace(/-/g, '\u2011');
// si un nom ne tient pas dans son cadre, on réduit la police jusqu'à ce qu'il tienne
function ajusterNoms() {
  $$('.nom-sous').forEach(e => {
    e.style.fontSize = '';
    let t = parseFloat(getComputedStyle(e).fontSize);
    while (t > 9 && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) { t -= .5; e.style.fontSize = t + 'px'; }
  });
}
function majPlateau() {
  const box = $('#plateau'); box.innerHTML = '';
  box.style.setProperty('--nb', S.max);
  for (let i = 0; i < S.max; i++) {
    const n = S.brassage[i];
    if (n) {
      const ing = ING(n);
      box.insertAdjacentHTML('beforeend', `<div class="emplacement plein${i === S.brassage.length - 1 && S.phase === 'brassage' ? ' retirable' : ''}" style="--c:${couleurFamille(ing.fam)}">
        <span class="rang"><span>${i + 1}</span></span>${carteIngredient(ing)}
        <img class="reponse" id="rep-${i}" alt=""></div>`);
    } else {
      box.insertAdjacentHTML('beforeend', `<div class="emplacement">${i + 1}</div>`);
    }
  }
  $('#reponses-expert').innerHTML = '';
  $('#btn-brasser').disabled = S.phase !== 'brassage' || S.brassage.length < Math.min(CONFIG.minBrassage, S.recette.length);
  $('#btn-retirer').disabled = S.phase !== 'brassage' || !S.brassage.length;
  $('#btn-brasser-main').disabled = $('#btn-brasser').disabled;
  $('#btn-retirer-main').disabled = $('#btn-retirer').disabled;
  $('#main-compte').textContent = S.brassage.length ? S.brassage.map(n => ING(n).nom).join(' › ') : 'Touche les ingrédients dans l\'ordre';
  requestAnimationFrame(ajusterNoms);
}

function majActions(quoi) {
  S.mainPossible = quoi === 'brassage';
  // « Au suivant » et la main restent toujours à leur place
  $('#actions-brassage').hidden = false; $('#actions-suite').hidden = false;
  majMain();
  $('#btn-suivant').disabled = quoi !== 'suite';
  // le bouton d'annonce reste toujours à sa place : grisé quand on ne peut pas annoncer
  $('#actions-annonce').hidden = false;
  $('#actions-annonce').style.visibility = S.v5 ? 'hidden' : '';
  $('#btn-annonce').disabled = !(quoi === 'brassage' || quoi === 'suite') || !!S.annonceCeTour;
  $('#btn-annonce').textContent = quoi === 'suite' ? "J'annonce maintenant" : "J'annonce la recette";

  if (quoi !== 'brassage') $('#actions-pouvoirs').innerHTML = '';
  if (quoi !== 'brassage') $$('#plateau .retirable').forEach(e => e.classList.remove('retirable'));
}

function colorerPotion(couleur, texte = '') {
  const c = $('#ecran-jeu .grand-chaudron'), scene = $('#scene'), etiquette = $('#etiquette-fumee');
  etiquette.hidden = true;        // plus de texte de fumée : seule la couleur parle
  if (false) {
    etiquette.innerHTML = `<span class="pastille-fumee"></span><span>${texte.replace(/ ([:!?;])/g, '\u00a0$1')}</span>`;
    etiquette.style.setProperty('--c', couleur);
    etiquette.classList.remove('nouvelle'); void etiquette.offsetWidth; etiquette.classList.add('nouvelle');
  }
  if (!couleur) {
    c.style.removeProperty('--potion'); c.style.removeProperty('--potion-clair');
    scene.style.setProperty('--lueur', 'transparent'); Fumee.couleur = varCSS('--fumee-repos'); FondMagique.repos(); return;
  }
  c.style.setProperty('--potion', `color-mix(in srgb, ${couleur} 70%, black)`);
  c.style.setProperty('--potion-clair', couleur);
  scene.style.setProperty('--lueur', couleur);
  Fumee.couleur = couleur;
  FondMagique.couleur(couleur);
}

function ajouterJournal(e) { S.journal.unshift(e); majJournal(); }
function majJournal() {
  const box = $('#journal');
  if (!S.journal.length) { box.innerHTML = '<div class="vide">Les réponses du chaudron s\'écriront ici.</div>'; return; }
  box.innerHTML = S.journal.map(e => {
    let corps;
    if (e.explosion) corps = `💥 Explosion ! (${e.explosion})`;
    else if (e.secret) corps = '🦉 a écouté en secret';
    else if (e.serpent) corps = '🐍 a interrogé le chaudron';
    else if (e.annonce) corps = e.annonce === 'juste' ? '📜 a annoncé la bonne recette !' : '📜 a fait une annonce fausse';
    else if (e.expert ?? S.expert) corps = e.ids.map(n => `<span class="ing" style="--c:${couleurFamille(ING(n).fam)}">${ING(n).nom}</span>`).join(' ') +
      ` <span class="expert">${[...e.res].sort((a, b) => ORDRE_REP.indexOf(a) - ORDRE_REP.indexOf(b)).map(r => `<img src="${imgReponse(r)}" alt="">`).join('')}</span>`;
    else corps = e.ids.map((n, i) => `<span class="ing" style="--c:${couleurFamille(ING(n).fam)}"><img class="r" src="${imgReponse(e.res[i])}" alt="">${ING(n).nom}</span>`).join(' ');
    const fumee = e.couleur ? `<span class="fumee-journal" style="--c:${e.couleur}">${e.texteFumee || ''}</span>` : '';
    return `<div class="ligne-journal"><span class="qui">${e.qui}</span>${corps} ${fumee}</div>`;
  }).join('');
}

function remplirLegendeFumees() {
  $('#legende-fumees').innerHTML = Object.entries(FAMILLES).filter(([id]) => S.familles.includes(id)).map(([id, f]) => `<span style="--c:${couleurFamille(id)}">${f.nom}</span>`).join('') +
    `<span style="--c:${varCSS('--fumee-complete')}">Toutes là</span>`;
}

function remplirEtagere(box = $('#etagere')) {
  box.innerHTML = Object.entries(FAMILLES).filter(([id]) => !S.familles || S.familles.includes(id)).map(([id, f]) =>
    `<h4><img src="${imgFamille(id)}" alt="">${f.nom}</h4>` +
    INGREDIENTS.filter(i => i.fam === id).map(i => `<button data-n="${i.n}" style="--c:${couleurFamille(id)}">${i.nom}</button>`).join('')
  ).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => ajouterIngredient(+b.dataset.n));
}
function majEtagere() {
  $$('#etagere button').forEach(b => {
    const n = +b.dataset.n, def = !!(S.defausse && S.defausse.has(n));
    b.classList.toggle('dedans', S.brassage.includes(n));
    b.classList.toggle('defaussee', def); b.disabled = def;      // carte défaussée : plus possible de la choisir
  });
}

/* ---------- 8. RIDEAU, FENÊTRES, TIROIRS ---------- */
function rideau(html, duree) {
  return new Promise(r => {
    $('#rideau-contenu').innerHTML = html; $('#rideau').classList.add('visible');
    const n = Partie.numero;
    const fin = () => { clearTimeout(t); $('#rideau').classList.remove('visible'); $('#rideau').onclick = null; setTimeout(() => { if (n === Partie.numero) r(); }, 300); };
    const t = setTimeout(fin, duree); $('#rideau').onclick = fin;
  });
}
// Écran de passage qui reste affiché jusqu'à ce qu'on touche son bouton
function rideauBouton(html, texte) {
  return new Promise(r => {
    $('#rideau-contenu').innerHTML = html + `<div class="actions"><button class="bouton-or" id="rideau-ok">${texte}</button></div>`;
    $('#rideau').classList.add('visible'); $('#rideau').onclick = null;
    const n = Partie.numero;
    $('#rideau-ok').onclick = e => { e.stopPropagation(); $('#rideau').classList.remove('visible'); setTimeout(() => { if (n === Partie.numero) r(); }, 300); };
  });
}
// pendant les écrans de passage, rien ne peut être scanné
const ecranDePassage = () => $('#rideau').classList.contains('visible');
// le visuel des cartes, en petit, pour les écrans de passage
const cartesVisuels = ids => `<div class="cartes-rideau">${ids.map(n => `<div class="carte-rideau">${carteIngredient(ING(n))}</div>`).join('')}</div>`;
function fenetre(html, noire) { $('#fenetre-boite').innerHTML = html; $('#fenetre').classList.add('visible'); $('#fenetre').classList.toggle('noire', !!noire); }
function fermerFenetre() { $('#fenetre').classList.remove('visible', 'noire'); }
function fenetreBouton(html, texte, noire) {
  return new Promise(r => { fenetre(html + `<div class="actions"><button class="bouton-or" id="f-ok">${texte}</button></div>`, noire); $('#f-ok').onclick = () => r(); });
}
function fenetreOuiNon(html) {
  return new Promise(r => {
    fenetre(html + `<div class="actions"><button class="rond grand-rond" id="f-non">✕</button><button class="bouton-or" id="f-oui">Oui</button></div>`);
    $('#f-non').onclick = () => { fermerFenetre(); r(false); };
    $('#f-oui').onclick = () => { fermerFenetre(); r(true); };
  });
}
function ouvrirTiroir(id) { $(id).classList.add('ouvert'); }
function fermerTiroirs() { $$('.tiroir').forEach(t => t.classList.remove('ouvert')); }
$$('.tiroir').forEach(t => t.addEventListener('click', e => { if (e.target === t || e.target.closest('[data-fermer]')) fermerTiroirs(); }));
$('#btn-grimoire').onclick = () => ouvrirTiroir('#tiroir-grimoire');
// ⚙ : couper ou remettre les voix, la musique et l'ambiance pendant la partie
$('#btn-options').onclick = () => {
  fenetre(`<h2>Options</h2>
    <div class="options-partie">
      <label class="interrupteur"><input type="checkbox" id="o-voix" ${S.voix ? 'checked' : ''}><span><b>Voix du chaudron</b><small>Sans voix, les phrases restent écrites</small></span></label>
      <label class="interrupteur"><input type="checkbox" id="o-musique" ${Musique.actif ? 'checked' : ''}><span><b>Musique</b><small>Musique de la manche</small></span></label>
      <label class="interrupteur"><input type="checkbox" id="o-ambiance" ${Ambiance.actif ? 'checked' : ''}><span><b>Ambiance</b><small>Bouillonnement et feu de bois</small></span></label>
      <label class="interrupteur"><input type="checkbox" id="o-eclairage" ${Eclairage.actif ? 'checked' : ''}><span><b>Éclairer les cartes</b><small>Dans le noir, l'écran s'éclaire pour lire les QR codes</small></span></label>
    </div>
    <div class="actions"><button class="bouton-annonce" id="o-grimoire">Grimoire</button><button class="bouton-or" id="o-fermer">Fermer</button></div>`);
  $('#o-voix').onchange = e => { S.voix = e.target.checked; $('#opt-voix').checked = S.voix; if (!S.voix) Voix.arreter(); };
  $('#o-musique').onchange = e => { debloquerAudio(); $('#opt-musique').checked = e.target.checked; e.target.checked ? Musique.demarrer() : Musique.arreter(); };
  $('#o-ambiance').onchange = e => { debloquerAudio(); $('#opt-ambiance').checked = e.target.checked; e.target.checked ? Ambiance.demarrer() : Ambiance.arreter(); majBoutonAmbiance(); };
  $('#o-eclairage').onchange = e => { Eclairage.actif = e.target.checked; if (!Eclairage.actif) Eclairage.regler(false); };
  $('#o-grimoire').onclick = () => { fermerFenetre(); ouvrirTiroir('#tiroir-grimoire'); };
  $('#o-fermer').onclick = fermerFenetre;
};
$('#btn-main').onclick = () => { majEtagere(); ouvrirTiroir('#tiroir-main'); };

/* ---------- 9. SONS ---------- */
let AC = null;
function debloquerAudio() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  Musique.preparer();
}
function bruitBlanc(duree) {
  const buf = AC.createBuffer(1, Math.max(1, AC.sampleRate * duree), AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = AC.createBufferSource(); s.buffer = buf; return s;
}
function enveloppe(g, t, attaque, duree, vol) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attaque); g.gain.exponentialRampToValueAtTime(0.0001, t + duree); }
function bloup(t, f, vol = .45, sortie = AC.destination) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine';
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (2 + Math.random()), t + .12);
  enveloppe(g, t, .01, .16, vol); o.connect(g).connect(sortie); o.start(t); o.stop(t + .2);
}

const Sons = {
  synthes: {
    bulle() { const t = AC.currentTime, b = 240 + Math.random() * 160, nb = 2 + Math.floor(Math.random() * 3);
      for (let k = 0; k < nb; k++) bloup(t + k * (.08 + Math.random() * .07), b * (1 + k * .22)); },
    sifflement() {
      const t = AC.currentTime, d = .6 + Math.random() * .3, n = bruitBlanc(d), f = AC.createBiquadFilter(), g = AC.createGain(), bas = Math.random() < .5;
      f.type = 'bandpass'; f.Q.value = 16 + Math.random() * 10;
      f.frequency.setValueAtTime(bas ? 4300 : 2100, t); f.frequency.exponentialRampToValueAtTime(bas ? 1700 : 4700, t + d);
      enveloppe(g, t, .05, d, .9); n.connect(f).connect(g).connect(AC.destination); n.start(t); n.stop(t + d);
      const o = AC.createOscillator(), g2 = AC.createGain(); o.frequency.setValueAtTime(bas ? 1900 : 1250, t); o.frequency.linearRampToValueAtTime(bas ? 1250 : 1900, t + d);
      enveloppe(g2, t, .05, d, .07); o.connect(g2).connect(AC.destination); o.start(t); o.stop(t + d);
    },
    pschitt() {
      const t = AC.currentTime, d = .35 + Math.random() * .25, n = bruitBlanc(d), f = AC.createBiquadFilter(), g = AC.createGain();
      f.type = 'highpass'; f.frequency.value = 1100 + Math.random() * 1600;
      enveloppe(g, t, .005, d, .6); n.connect(f).connect(g).connect(AC.destination); n.start(t); n.stop(t + d);
      const o = AC.createOscillator(), g2 = AC.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(70, t + .25);
      enveloppe(g2, t, .005, .25, .2); o.connect(g2).connect(AC.destination); o.start(t); o.stop(t + .3);
    },
    explosion() {
      const t = AC.currentTime, d = 1.6, n = bruitBlanc(d), f = AC.createBiquadFilter(), g = AC.createGain();
      f.type = 'lowpass'; f.frequency.setValueAtTime(2000, t); f.frequency.exponentialRampToValueAtTime(70, t + d);
      enveloppe(g, t, .01, d, 1); n.connect(f).connect(g).connect(AC.destination); n.start(t); n.stop(t + d);
      const o = AC.createOscillator(), g2 = AC.createGain(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(28, t + .9);
      enveloppe(g2, t, .01, 1, .9); o.connect(g2).connect(AC.destination); o.start(t); o.stop(t + 1.1);
    },
    victoire() {
      const t = AC.currentTime;
      [523, 659, 784, 1047, 1319, 1568].forEach((f, k) => {
        const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = f;
        enveloppe(g, t + k * .11, .02, .9, .22); o.connect(g).connect(AC.destination); o.start(t + k * .11); o.stop(t + k * .11 + 1);
      });
      for (let k = 0; k < 8; k++) bloup(t + .6 + k * .07, 300 + Math.random() * 400, .25);
    },
    oeil() {
      const t = AC.currentTime;
      [880, 1318.5, 1760].forEach((f, k) => {
        const o = AC.createOscillator(), g = AC.createGain(), v = AC.createOscillator(), vg = AC.createGain();
        o.type = 'sine'; o.frequency.value = f; v.frequency.value = 6; vg.gain.value = f * .012;
        v.connect(vg).connect(o.frequency);
        enveloppe(g, t + k * .07, .01, .9, .18 - k * .04); o.connect(g).connect(AC.destination);
        o.start(t + k * .07); o.stop(t + k * .07 + 1); v.start(t); v.stop(t + 1.2);
      });
    },
    scan() { bloup(AC.currentTime, 520, .3); },
  },
  jouer(nom) {
    if (!$('#ecran-jeu').classList.contains('actif')) return;   // partie quittée : silence
    const fichiers = CONFIG.fichiersSons[nom];
    if (fichiers && fichiers.length) { new Audio(hasard(fichiers)).play().catch(() => {}); return; }
    if (!AC) return;
    try { this.synthes[nom](); } catch (e) {}
  },
};

// Ambiance : bouillonnement doux + crépitement du feu
const Ambiance = {
  actif: false, minuteur: null, sortie: null, audio: null,
  demarrer() {
    if (this.actif) return; this.actif = true;
    const f = CONFIG.fichiersSons.ambiance;
    if (f && f.length) { this.audio = new Audio(hasard(f)); this.audio.loop = true; this.audio.volume = .5; this.audio.play().catch(() => {}); return; }
    if (!AC) return;
    this.sortie = AC.createGain(); this.sortie.gain.value = .35; this.sortie.connect(AC.destination);
    const boucle = () => {
      if (!this.actif) return;
      const t = AC.currentTime;
      if (Math.random() < .7) bloup(t, 110 + Math.random() * 120, .12 + Math.random() * .12, this.sortie);
      if (Math.random() < .35) { // crépitement
        const n = bruitBlanc(.03), fl = AC.createBiquadFilter(), g = AC.createGain();
        fl.type = 'bandpass'; fl.frequency.value = 1500 + Math.random() * 2500; enveloppe(g, t, .002, .03, .25);
        n.connect(fl).connect(g).connect(this.sortie); n.start(t); n.stop(t + .04);
      }
      this.minuteur = setTimeout(boucle, 120 + Math.random() * 380);
    };
    boucle();
  },
  arreter() {
    this.actif = false; clearTimeout(this.minuteur);
    if (this.sortie) { this.sortie.disconnect(); this.sortie = null; }
    if (this.audio) { this.audio.pause(); this.audio = null; }
  },
};
/* Musique de fond : tes fichiers (CONFIG.fichiersMusique) ou une musique composée par l'app */
const Musique = {
  actif: false, sortie: null, source: null, morceaux: {}, trouves: [], minuteur: null, prete: null,
  cible: 'accueil',     // quelle musique : accueil, manche1, manche2, manche3, lune
  lecteurs: {},         // fichier -> { audio, gain } (lus en continu, sans tout charger en mémoire)
  element: null, compo: 0,

  // au lancement : on cherche les fichiers de musique
  charger() {
    this.prete = Promise.all(CONFIG.fichiersMusique.map(async f => {
      try {
        const r = await fetch(f);
        const type = r.headers.get('content-type') || '';
        if (!r.ok || type.includes('text/html')) return;
        this.morceaux[f] = await r.arrayBuffer();
        this.trouves.push(f);
      } catch (e) {}
    })).then(() => {
      $('#musique-info').textContent = Object.values(CONFIG.musiques || {}).some(Boolean) ? 'Une musique par manche'
        : this.trouves.length
        ? `${this.trouves.length} morceau(x) trouvé(s)`
        : (CONFIG.musiqueComposee ? "Musique composée par l'app (aucun fichier trouvé)" : 'Aucun fichier trouvé');
    });
  },

  async demarrer() {
    if (this.actif || !AC) return;
    this.actif = true; majBoutonMusique();
    this.sortie = AC.createGain(); this.sortie.gain.value = 0.0001; this.sortie.connect(AC.destination);
    this.sortie.gain.exponentialRampToValueAtTime(CONFIG.volumeMusique, AC.currentTime + 2.5); // fondu d'entrée
    await this.prete;
    if (!this.actif) return;
    this.lancer();
  },

  // change de musique (fondu) : appelé à chaque nouvelle manche
  piste(cle) {
    const fichier = k => (CONFIG.musiques || {})[k] || '';
    this.cible = cle;
    if (this.enCours === cle) return;               // c'est déjà cette musique qui joue
    // même fichier (ex. accueil et manche 1) : la musique continue sans recommencer
    if (this.enCours && fichier(cle) && fichier(this.enCours) === fichier(cle) && this.element) { this.enCours = cle; return; }
    if (this.actif) this.lancer();
  },
  lancer() {
    this.couperPiste();
    this.enCours = this.cible;
    const f = (CONFIG.musiques || {})[this.cible];
    if (f) this.lireFichier(f);
    else this.musiqueDeSecours();
  },
  musiqueDeSecours() {
    if (this.trouves.length) this.morceauSuivant(); else if (CONFIG.musiqueComposee) this.composer();
  },
  // Sur iPhone, un son ne peut démarrer plus tard que s'il a été « réveillé » pendant un toucher :
  // on prépare donc les lecteurs au premier toucher (debloquerAudio).
  preparer() {
    if (!AC) return;
    Object.values(CONFIG.musiques || {}).filter(Boolean).forEach(f => {
      if (this.lecteurs[f]) return;
      const audio = new Audio(f); audio.loop = true; audio.preload = 'none';
      const gain = AC.createGain(); gain.gain.value = 0;
      try { AC.createMediaElementSource(audio).connect(gain); } catch (e) {}
      const essai = audio.play(); if (essai) essai.catch(() => {}); audio.pause();   // réveil pendant le toucher, sans rien jouer
      this.lecteurs[f] = { audio, gain, panne: false };
    });
  },
  lireFichier(f) {
    this.preparer();
    const l = this.lecteurs[f];
    if (!l || l.panne) return this.musiqueDeSecours();
    const { audio, gain } = l, t = AC.currentTime;
    try { gain.disconnect(); } catch (e) {}
    gain.connect(this.sortie);
    gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(1, t + 2);
    audio.onerror = () => { l.panne = true; if (this.element === audio) { this.element = null; this.musiqueDeSecours(); } };
    audio.preload = 'auto'; audio.currentTime = 0;
    this.element = audio;
    audio.play().catch(() => {});
  },
  couperPiste() {
    clearTimeout(this.minuteur); this.minuteur = null; this.compo++;
    if (this.source) { const src = this.source; this.source = null; src.onended = null; try { src.stop(AC.currentTime + .8); } catch (e) {} }
    if (this.element) {
      const a = this.element, l = Object.values(this.lecteurs).find(x => x.audio === a); this.element = null;
      if (l && AC) { const g = l.gain.gain, t = AC.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 1); }
      setTimeout(() => { if (this.element !== a) a.pause(); }, 1100);
    }
  },

  async morceauSuivant() {
    if (!this.actif) return;
    const f = hasard(this.trouves);
    try {
      if (!(this.morceaux[f] instanceof AudioBuffer)) this.morceaux[f] = await new Promise((ok, ko) => AC.decodeAudioData(this.morceaux[f].slice(0), ok, ko));
    } catch (e) { return; }
    if (!this.actif) return;
    const src = AC.createBufferSource(); src.buffer = this.morceaux[f];
    src.loop = this.trouves.length === 1;
    src.connect(this.sortie); src.start();
    src.onended = () => { if (this.source === src) this.morceauSuivant(); };
    this.source = src;
  },

  // petite musique mystérieuse : nappe grave + arpèges en ré mineur avec écho
  composer() {
    const sortie = this.sortie;
    const echo = AC.createDelay(); echo.delayTime.value = .42;
    const retour = AC.createGain(); retour.gain.value = .38;
    const filtreEcho = AC.createBiquadFilter(); filtreEcho.type = 'lowpass'; filtreEcho.frequency.value = 2200;
    echo.connect(filtreEcho).connect(retour).connect(echo); retour.connect(sortie);
    const accords = [ [62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64] ];   // Rém, Sib, Solm, La
    const hz = n => 440 * Math.pow(2, (n - 69) / 12);
    let mesure = 0;
    const nappe = (t, accord, duree) => accord.forEach(n => [-6, 6].forEach(desaccord => {
      const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
      o.type = 'sawtooth'; o.frequency.value = hz(n - 24); o.detune.value = desaccord;
      f.type = 'lowpass'; f.frequency.value = 420;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.085, t + 2); g.gain.linearRampToValueAtTime(0.0001, t + duree);
      o.connect(f).connect(g).connect(sortie); o.start(t); o.stop(t + duree + .1);
    }));
    const note = (t, n, vol) => {
      const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = hz(n);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g); g.connect(sortie); g.connect(echo); o.start(t); o.stop(t + 1.5);
    };
    const tempsMesure = 4.8, pas = tempsMesure / 8;
    const id = this.compo;
    const boucle = () => {
      if (!this.actif || id !== this.compo) return;
      const t0 = AC.currentTime + .05, accord = accords[Math.floor(mesure / 2) % accords.length];
      if (mesure % 2 === 0) nappe(t0, accord, tempsMesure * 2 + 1);
      const gamme = [...accord, accord[0] + 12, accord[1] + 12];
      for (let k = 0; k < 8; k++) if (Math.random() < (k % 2 ? .35 : .75)) note(t0 + k * pas, hasard(gamme), .13 + Math.random() * .08);
      mesure++;
      this.minuteur = setTimeout(boucle, tempsMesure * 1000);
    };
    boucle();
  },

  arreter() {
    if (!this.actif) return;
    this.actif = false; this.couperPiste(); this.enCours = null; majBoutonMusique();
    const s = this.sortie, src = this.source; this.sortie = null; this.source = null;
    if (s && AC) { s.gain.cancelScheduledValues(AC.currentTime); s.gain.setValueAtTime(s.gain.value, AC.currentTime); s.gain.linearRampToValueAtTime(0, AC.currentTime + .8); }
    setTimeout(() => { try { src?.stop(); } catch (e) {} s?.disconnect(); }, 900);
  },

  // la musique baisse pendant que le chaudron parle
  baisser(oui) {
    if (!this.sortie || !AC) return;
    const g = this.sortie.gain, t = AC.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(Math.max(g.value, 0.0001), t);
    g.linearRampToValueAtTime(CONFIG.volumeMusique * (oui ? CONFIG.baisseMusiqueVoix : 1), t + (oui ? .3 : 1.2));
  },
};
function majBoutonMusique() { $('#btn-musique').classList.toggle('eteint', !Musique.actif); }
$('#btn-musique').onclick = () => { debloquerAudio(); Musique.actif ? Musique.arreter() : Musique.demarrer(); };
$('#opt-musique').onchange = e => { debloquerAudio(); e.target.checked ? Musique.demarrer() : Musique.arreter(); };
// on coupe le son quand l'app passe en arrière-plan
document.addEventListener('visibilitychange', () => {
  if (!AC) return;
  if (document.visibilityState === 'hidden') AC.suspend(); else AC.resume();
});

function majBoutonAmbiance() { $('#btn-ambiance').classList.toggle('eteint', !Ambiance.actif); }
$('#btn-ambiance').onclick = () => { debloquerAudio(); Ambiance.actif ? Ambiance.arreter() : Ambiance.demarrer(); majBoutonAmbiance(); };

/* ---------- 10. VOIX DU CHAUDRON ----------
   parler('moquerie', { ingredient: 'Soufre' }) :
   - affiche la phrase complète (avec les noms) à l'écran ;
   - joue un enregistrement du dossier voix/ s'il existe pour ce moment,
     sinon le téléphone lit la phrase lui-même.                        */
const Voix = {
  trouvees: new Set(),   // noms des fichiers présents dans voix/
  donnees: {},           // fichier -> contenu brut
  tampons: {},           // fichier -> son décodé
  enCours: null,

  // au démarrage : on cherche chaque fichier listé dans VOIX (et on le garde en mémoire)
  async charger() {
    const noms = [...new Set(Object.values(VOIX).flat())];
    await Promise.all(noms.map(async nom => {
      try {
        const r = await fetch(`${CONFIG.dossierVoix}${nom}.${CONFIG.formatVoix}`);
        const type = r.headers.get('content-type') || '';
        if (!r.ok || type.includes('text/html')) return;
        this.donnees[nom] = await r.arrayBuffer();
        this.trouvees.add(nom);
      } catch (e) {}
    }));
    const info = $('#voix-info');
    if (info) info.textContent = this.trouvees.size
      ? `${this.trouvees.size} voix enregistrée(s) trouvée(s), le téléphone lit les autres`
      : 'Le téléphone lit les phrases (aucune voix enregistrée trouvée)';
  },

  async tampon(nom) {
    if (this.tampons[nom]) return this.tampons[nom];
    const copie = this.donnees[nom].slice(0);
    this.tampons[nom] = await new Promise((ok, ko) => AC.decodeAudioData(copie, ok, ko));
    return this.tampons[nom];
  },

  async jouer(nom) {
    if (!AC) return false;
    const gen = Parole.generation;
    try {
      const buf = await this.tampon(nom);
      if (gen !== Parole.generation) return true;
      return await new Promise(r => {
        const src = AC.createBufferSource(), g = AC.createGain();
        g.gain.value = CONFIG.volumeVoix;
        src.buffer = buf; src.connect(g).connect(AC.destination);
        src.onended = () => { this.enCours = null; r(true); };
        this.enCours = src; src.start();
      });
    } catch (e) { return false; }
  },

  arreter() { try { this.enCours?.stop(); } catch (e) {} this.enCours = null; speechSynthesis?.cancel(); },
};

const enLettres = n => ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'][n] ?? (n ?? '');
const sansAccent = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// le moment qui correspond aux listes de VOIX (les nombres et les manches ont leurs propres fichiers)
function momentVoix(cle, vars) {
  if (cle === 'manche') return 'manche-' + sansAccent(vars.manche);
  if (cle === 'luneDeux') return 'lune-reste-2';
  if (cle === 'lune') return 'lune-reste-' + vars.n;
  if (cle === 'luneDebut') return 'lune-debut-' + vars.n;
  return cle;
}

function parler(cle, vars = {}, discret = false) {
  if (cle === 'lune' && +vars.n === 2 && PHRASES.luneDeux) cle = 'luneDeux';
  vars = { ...vars, nMot: enLettres(vars.n), essaisMot: enLettres(vars.essais) };
  const textes = PHRASES[cle];
  const liste = VOIX[momentVoix(cle, vars)] || [];
  const dispo = liste.filter(f => Voix.trouvees.has(f));
  let i, fichier = null;
  if (dispo.length) { fichier = hasard(dispo); i = liste.indexOf(fichier) % textes.length; }
  else i = Math.floor(Math.random() * textes.length);
  const texte = textes[i].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  const posture = POSTURES[fichier || liste[i % Math.max(1, liste.length)]] || POSTURE_PAR_DEFAUT;
  return dire(texte, discret, fichier, posture);
}

// Les phrases passent l'une après l'autre (jamais en même temps),
// avec CONFIG.pauseEntrePhrases de silence entre deux phrases.
const Parole = { file: Promise.resolve(), finDerniere: 0, generation: 0, enCours: 0 };
// la main ne s'active que quand le chaudron a fini de parler
function majMain() { const b = $('#btn-main'); if (b) b.disabled = !S.mainPossible || Parole.enCours > 0; }

function dire(texte, discret = false, fichier = null, posture = null) {
  const gen = Parole.generation;
  if (!discret) { Parole.enCours++; majMain(); }
  const tour = Parole.file.then(async () => {
    if (gen !== Parole.generation) return;               // partie quittée entre-temps
    const attente = Parole.finDerniere + CONFIG.pauseEntrePhrases - Date.now();
    if (attente > 0) await attendre(attente);
    if (gen !== Parole.generation) return;
    const p = $('#parole');
    if (!discret) { p.textContent = texte; p.classList.remove('nouvelle'); void p.offsetWidth; p.classList.add('nouvelle'); Perso.montrer(posture); }
    if (!S.voix) await attendre(900 + texte.length * 30);
    else {
      Musique.baisser(true);
      try { await parlerVraiment(texte, fichier); } finally { Musique.baisser(false); }
    }
    Parole.finDerniere = Date.now();
  });
  Parole.file = tour.catch(() => {});
  if (!discret) tour.finally(() => { if (gen === Parole.generation) { Parole.enCours = Math.max(0, Parole.enCours - 1); majMain(); } }).catch(() => {});
  return tour;
}
/* Le personnage du chaudron : une image par posture (images/chaudron/<posture>.png).
   Quand une phrase commence, la posture prévue arrive avec un petit glissement de gauche à droite. */
const Perso = {
  src: nom => `images/chaudron/${nom}.png`,
  pret: new Set(),
  charger() {
    const noms = new Set([POSTURE_REPOS, POSTURE_PAR_DEFAUT, ...Object.values(POSTURES)]);
    noms.forEach(nom => { const im = new Image(); im.onload = () => this.pret.add(nom); im.src = this.src(nom); });
  },
  montrer(nom) {
    if (!nom) return;
    const box = $('#perso'), img = $('#perso-img');
    if (!box || !img) return;
    if (!this.pret.has(nom) && this.pret.has(POSTURE_PAR_DEFAUT)) nom = POSTURE_PAR_DEFAUT;   // image pas encore livrée
    img.src = this.src(nom);
    box.dataset.posture = nom;
    box.classList.remove('glisse'); void box.offsetWidth; box.classList.add('glisse');
  },
  repos() { const img = $('#perso-img'); if (!img) return; img.src = this.src(this.pret.has(POSTURE_REPOS) ? POSTURE_REPOS : POSTURE_PAR_DEFAUT); $('#perso').classList.remove('glisse'); },
};
// rappel permanent en bas de la boîte de dialogue
function majRappelInstables() {
  const r = $('#rappel-instables'); if (!r) return;
  if (!S.instables || S.instables.length < 2) { r.hidden = true; return; }
  const [f1, f2] = S.instables.map(n => ING(n).fam);
  r.innerHTML = `<span>⚠ Instables</span> <img src="${imgFamille(f1)}" alt="${FAMILLES[f1].nom}"><span class="et">✕</span><img src="${imgFamille(f2)}" alt="${FAMILLES[f2].nom}">`;
  r.title = `Un ingrédient des ${FAMILLES[f1].nom} et un des ${FAMILLES[f2].nom} ne se supportent pas`;
  r.hidden = false;
}
function viderParole() { Parole.generation++; Parole.enCours = 0; majMain(); Parole.file = Promise.resolve(); Parole.finDerniere = 0; Voix.arreter(); }

async function parlerVraiment(texte, fichier) {
  const gen = Parole.generation;
  if (fichier && await Voix.jouer(fichier)) return;
  if (gen !== Parole.generation) return;
  if (!('speechSynthesis' in window)) return attendre(900 + texte.length * 30);
  return new Promise(r => {
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = 'fr-FR'; u.rate = CONFIG.voixVitesse; u.pitch = CONFIG.voixHauteur;
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('fr'));
    if (v) u.voice = v;
    const secours = setTimeout(r, 1500 + texte.length * 95);
    u.onend = u.onerror = () => { clearTimeout(secours); r(); };
    speechSynthesis.speak(u);
  });
}

/* ---------- 11. FUMÉE ANIMÉE ---------- */
const Fumee = (() => {
  const cv = $('#fumee'), ctx = cv.getContext('2d'); let parts = [];
  const obj = { couleur: '#7a6f86' };
  let origineY = .62, largeurBouche = .32;
  const ajuster = () => {
    const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio;
    const ch = $('#ecran-jeu .grand-chaudron').getBoundingClientRect();
    if (r.height && ch.height) { origineY = (ch.top + ch.height * .3 - r.top) / r.height; largeurBouche = ch.width * .7 / r.width; }
  };
  addEventListener('resize', ajuster);
  function particule(c, force = 1) {
    const w = cv.width, h = cv.height, d = devicePixelRatio;
    parts.push({ x: w / 2 + (Math.random() - .5) * w * largeurBouche, y: h * origineY, r: (10 + Math.random() * 16) * d,
      vx: (Math.random() - .5) * .7 * d * force, vy: -(.6 + Math.random() * 1.1) * d * force, vie: 1, c });
  }
  obj.bouffee = (c, n) => { if (window.FondMagique) FondMagique.bouillon(n); if (!cv.offsetParent) return; for (let i = 0; i < n; i++) particule(c, 1.9); };
  (function boucle() {
    if (cv.offsetParent) {
      if (!cv.width || cv.width !== Math.round(cv.getBoundingClientRect().width * devicePixelRatio)) ajuster();
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (Math.random() < .55) particule(obj.couleur);
      for (const p of parts) {
        p.x += p.vx + Math.sin(p.y / 45) * .35; p.y += p.vy; p.r *= 1.009; p.vie -= .0065;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, p.c); g.addColorStop(1, 'transparent');
        ctx.globalAlpha = Math.max(0, p.vie) * .5; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      parts = parts.filter(p => p.vie > 0 && p.y > -p.r);
      if (parts.length > 450) parts.splice(0, parts.length - 450);
    }
    requestAnimationFrame(boucle);
  })();
  return obj;
})();


/* ---------- 11 bis. LE FOND MAGIQUE : le chaudron vu de haut ----------
   Le tourbillon (images/fond.jpg) tourne lentement sous une surface liquide, avec des bulles.
   Écran titre et préparation : couleurs de l'image.
   En jeu, quand la fumée a une couleur : une brume de cette couleur part du centre,
   et l'image perd 60 % de ses couleurs (--desaturation-potion dans theme.css). */
const FondMagique = (() => {
  const obj = { couleur() {}, repos() {}, ecran() {}, bouillon() {} };
  const cv = $('#fond-magique'), bc = $('#bulles-magiques');
  if (!cv || !bc) return obj;
  const gl = cv.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  const bx = bc.getContext('2d');
  const hex = h => { const m = /^#?([0-9a-f]{6})$/i.exec((h || '').trim()); if (!m) return [.94, .54, .17];
    return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255); };
  let A = hex('#f08a2c'), B = A, front = 2, potion = 0, cible = 0, sat = 1, cibleSat = 1, vague = 0, enJeu = false;
  const desat = () => { const d = parseFloat(varCSS('--desaturation-potion')); return isNaN(d) ? .6 : d; };

  obj.couleur = c => { A = potion > .5 ? B : hex(c); B = hex(c); front = 0; vague = 1; cible = 1; cibleSat = 1 - desat(); };
  obj.repos = () => { cible = 0; cibleSat = 1; };
  obj.ecran = id => { enJeu = id === 'ecran-jeu'; if (!enJeu) obj.repos(); };
  obj.bouillon = n => { for (let i = 0; i < Math.min(12, n / 10); i++) nouvelleBulle(); };

  /* ----- dessin du tourbillon (WebGL) ----- */
  let pret = false, U = {};
  if (gl) {
    const VS = 'attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
    const FS = `precision mediump float; varying vec2 uv;
uniform sampler2D img; uniform float t, angle, aspect, front, potion, sat, vague; uniform vec3 coulA, coulB;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int k = 0; k < 5; k++){ s += a * n(p); p = p * 2.02 + 2.7; a *= .5; } return s; }
vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c*p.x - s*p.y, s*p.x + c*p.y); }
void main(){
  vec2 p = uv - .5; p.x *= aspect; float r = length(p);
  vec2 w = rot(p, t * .04) * 7.;
  float ph1 = w.x * 1.3 + t * 1.1, ph2 = w.y * 1.7 - t * .9, ph3 = (w.x - w.y) * .8 + t * 1.3;
  float vagues = sin(ph1) * .5 + sin(ph2) * .35 + sin(ph3) * .3;
  vec2 pente = vec2(cos(ph1) * .65 + cos(ph3) * .24, cos(ph2) * .6 - cos(ph3) * .24);
  float tour = angle + .35 * sin(t * .12) * exp(-r * 2.5);
  vec2 q = rot(p, tour) * .82 + pente * .005;
  q += (vec2(fbm(q * 3. + t * .05), fbm(q * 3. - t * .05)) - .5) * .02;
  vec3 col = texture2D(img, clamp(vec2(-q.x, q.y) + .5, 0., 1.)).rgb * .85;
  vec3 nrm = normalize(vec3(-pente * .9, 1.));
  float reflet = pow(max(dot(reflect(vec3(0., 0., -1.), nrm), normalize(vec3(-.35, .45, .82))), 0.), 18.);
  float caustique = (vagues * .5 + .5) * .05;
  float l = dot(col, vec3(.299, .587, .114));
  col = mix(vec3(l), col, sat);
  float bruit = (fbm(p * 4. + t * .15) - .5) * .18;
  float dedans = smoothstep(front, front - .3, r + bruit);
  vec3 c = mix(coulA, coulB, dedans);
  col = mix(col, c * (l * 1.25 + .3), .9 * potion);            // la potion prend franchement la couleur de la famille
  vec2 m = rot(p, t * .08) * 1.6;
  float nuage = smoothstep(.12, .48, fbm(m * 1.8 + vec2(t * .05, t * .03)) * fbm(m * 3.1 - vec2(t * .07, 0.)));
  float onde = exp(-pow((r + bruit - front) * 4.5, 2.)) * vague;
  float densite = nuage * (potion * .28 + onde * .95);
  col = mix(col, mix(vec3(.96, .9, .92), c, .55 + .35 * potion), clamp(densite, 0., .85));
  vec2 f = rot(p, t * .18 + r * 3.2);
  float v = smoothstep(.2, .52, fbm(f * 2.6 + vec2(t * .06, -t * .09)) * fbm(f * 1.4 - t * .04));
  col = mix(col, mix(vec3(.93, .82, .86), c * 1.15, potion * .85), v * (.28 + .12 * potion));
  col += vec3(1., .95, .9) * reflet * .22 + col * caustique;
  gl_FragColor = vec4(col, 1.);
}`;
    const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const lp = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      ['img', 't', 'angle', 'aspect', 'front', 'potion', 'sat', 'vague', 'coulA', 'coulB'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
      const image = new Image();
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        pret = true; cv.style.background = 'none';
      };
      image.src = 'images/fond.jpg';
    }
  }
  function taille() {
    const d = Math.min(1, devicePixelRatio || 1) * .8;     // fond flou : 80 % de la résolution suffit, et le téléphone chauffe moins
    const E = ecranPortrait();
    cv.width = E.w * d; cv.height = E.h * d; if (gl) gl.viewport(0, 0, cv.width, cv.height);
    const d2 = Math.min(1.5, devicePixelRatio || 1); BW = E.w; BH = E.h;
    bc.width = BW * d2; bc.height = BH * d2; bx.setTransform(d2, 0, 0, d2, 0, 0);
  }

  /* ----- bulles de surface (elles naissent, gonflent, suivent le tourbillon et éclatent) ----- */
  let BW = 0, BH = 0, bulles = [], eclats = [];
  function nouvelleBulle() {
    const a = Math.random() * Math.PI * 2, dist = Math.sqrt(Math.random()) * Math.max(BW, BH) * .6;
    bulles.push({ x: BW / 2 + Math.cos(a) * dist, y: BH / 2 + Math.sin(a) * dist, r: 0, max: 6 + Math.random() ** 2 * 24,
      vie: 0, duree: 3 + Math.random() * 5, ph: Math.random() * 6 });
  }
  function dessinerBulles(dt, coul) {
    bx.clearRect(0, 0, BW, BH);
    const teinte = coul.map(v => Math.round(v * 255)).join(',');
    if (Math.random() < (2.2 + potion * 3 + vague * 14) * dt) nouvelleBulle();
    for (const b of bulles) {
      b.vie += dt / b.duree;
      b.r = b.max * Math.min(1, b.vie * 3.5) * (1 + .05 * Math.sin(b.ph + b.vie * 20));
      const dx = b.x - BW / 2, dy = b.y - BH / 2, d = Math.hypot(dx, dy) + 1, vit = (14 + 40 * Math.exp(-d / 160)) * dt;
      b.x += (-dy / d) * vit + Math.sin(b.ph + b.vie * 6) * .2; b.y += (dx / d) * vit;
      const x = b.x, y = b.y, r = b.r, a = Math.min(1, (1 - b.vie) * 4) * .9;
      if (r < .5) continue;
      const g = bx.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${.18 * a})`); g.addColorStop(.7, `rgba(${teinte},${.16 * a})`); g.addColorStop(1, `rgba(255,240,230,${.7 * a})`);
      bx.fillStyle = g; bx.beginPath(); bx.arc(x, y, r, 0, 7); bx.fill();
      bx.strokeStyle = `rgba(255,245,235,${.8 * a})`; bx.lineWidth = Math.max(1, r * .08); bx.stroke();
      bx.fillStyle = `rgba(255,255,255,${.85 * a})`; bx.beginPath(); bx.ellipse(x - r * .38, y - r * .42, r * .2, r * .12, -.6, 0, 7); bx.fill();
      if (b.vie >= 1) eclats.push({ x, y, r, vie: 1 });
    }
    bulles = bulles.filter(b => b.vie < 1);
    for (const e of eclats) {
      e.vie -= dt * 2.4; const k = 1 - e.vie;
      bx.strokeStyle = `rgba(255,240,230,${.6 * e.vie})`; bx.lineWidth = 1.2;
      bx.beginPath(); bx.ellipse(e.x, e.y, e.r * (1 + k * 1.6), e.r * (1 + k * 1.6) * .8, 0, 0, 7); bx.stroke();
      bx.fillStyle = `rgba(255,245,235,${.7 * e.vie})`;
      for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2; bx.beginPath(); bx.arc(e.x + Math.cos(an) * e.r * (1 + k * 2.2), e.y + Math.sin(an) * e.r * (1 + k * 2.2), 1.2, 0, 7); bx.fill(); }
    }
    eclats = eclats.filter(e => e.vie > 0);
    if (bulles.length > 70) bulles.splice(0, bulles.length - 70);
  }

  addEventListener('resize', taille); taille();
  for (let i = 0; i < 18; i++) { nouvelleBulle(); bulles[bulles.length - 1].vie = Math.random() * .8; }
  const t0 = performance.now(); let avant = t0;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function boucle(now) {
    now = now || performance.now();
    if (now - avant < 31) { requestAnimationFrame(boucle); return; }   // 30 images/s : bien assez pour un fond, deux fois moins de calcul
    const dt = Math.min(70, now - avant) / 1000; avant = now;
    if (!document.hidden) {
      front = Math.min(2, front + dt * .42);
      const cp = enJeu ? cible : 0, cs = enJeu ? cibleSat : 1;
      potion += (cp - potion) * Math.min(1, dt * 1.6);
      sat += (cs - sat) * Math.min(1, dt * 1.6);
      vague = Math.max(0, vague - dt * .35);
      if (pret) {
        const sec = calme ? 0 : (now - t0) / 1000;
        gl.uniform1i(U.img, 0); gl.uniform1f(U.t, sec % 1256.637); gl.uniform1f(U.angle, (sec * .05) % 6.283185);
        gl.uniform1f(U.aspect, cv.width / cv.height);
        gl.uniform1f(U.front, front); gl.uniform1f(U.potion, potion); gl.uniform1f(U.sat, sat); gl.uniform1f(U.vague, vague);
        gl.uniform3fv(U.coulA, A); gl.uniform3fv(U.coulB, B);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      if (!calme) dessinerBulles(dt, potion > .1 ? B : [1, .85, .8]);
    }
    requestAnimationFrame(boucle);
  })();
  return obj;
})();
window.FondMagique = FondMagique;

/* ---------- 12. CAMÉRA ET QR CODES ---------- */
const Camera = {
  flux: null, actif: false, dernier: '', quand: 0, tour: 0, detecteur: null,
  async demarrer() {
    $('#oeil').hidden = false; $('#oeil-etat').textContent = '…';
    try {
      // meilleure image : 1280 × 720 si possible, mise au point continue
      this.flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      const piste = this.flux.getVideoTracks()[0];
      try { await piste.applyConstraints({ advanced: [{ focusMode: 'continuous' }, { exposureMode: 'continuous' }] }); } catch (e) {}
      const v = $('#video'); v.srcObject = this.flux; await v.play();
      // détecteur intégré au téléphone quand il existe (Android) : plus rapide et plus fiable que jsQR
      try { if ('BarcodeDetector' in window && (await BarcodeDetector.getSupportedFormats()).includes('qr_code')) this.detecteur = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) {}
      $('#oeil-etat').textContent = ''; this.actif = true; this.boucle();
    } catch (e) {
      $('#oeil').hidden = true;
      $('#consigne').innerHTML = 'Pas de caméra : touche ✋ pour choisir les ingrédients';
    }
  },
  arreter() { this.actif = false; if (this.flux) this.flux.getTracks().forEach(t => t.stop()); this.flux = null; },
  /* jsQR : à chaque image, une « passe » différente, pour lire les cartes de près, de loin et dans le noir.
     zone = part de l'image analysée (1 = toute l'image), centre = où la prendre, w = largeur analysée.
     Une petite zone analysée en grand = un zoom (cartes loin) ; toute l'image en petit = cartes très près ou floues. */
  passes: [
    { zone: 1,   w: 560 },                     // l'image entière
    { zone: .6,  w: 600 },                     // le centre
    { zone: 1,   w: 320 },                     // carte très près ou floue : l'image en petit
    { zone: .38, w: 560 },                     // carte loin : zoom ×2,5 sur le centre
    { zone: .55, w: 560, tuile: true },        // carte loin et décalée : un quart de l'image à tour de rôle
    { zone: .26, w: 480 },                     // carte très loin : zoom ×4
  ],
  lireJsQR(v) {
    const c = $('#canvas-scan'), ctx = c.getContext('2d', { willReadFrequently: true });
    const vw = v.videoWidth, vh = v.videoHeight, n = this.tour++;
    const P = this.passes[n % this.passes.length];
    let sw = vw * P.zone, sh = vh * P.zone, cx = .5, cy = .5;
    if (P.zone < 1) { sw = sh = Math.min(vw, vh) * P.zone * (P.tuile ? 1.6 : 1); sw = Math.min(sw, vw); sh = Math.min(sh, vh); }
    if (P.tuile) { const q = Math.floor(n / this.passes.length) % 4; cx = q % 2 ? .72 : .28; cy = q < 2 ? .3 : .7; }
    const sx = Math.max(0, Math.min(vw - sw, vw * cx - sw / 2)), sy = Math.max(0, Math.min(vh - sh, vh * cy - sh / 2));
    const w = Math.round(P.w), h = Math.round(w * sh / sw);
    c.width = w; c.height = h;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(v.image || v, sx, sy, sw, sh, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    this.eclairage(img.data);
    const r = jsQR(img.data, w, h, { inversionAttempts: n % 5 === 4 ? 'attemptBoth' : 'dontInvert' });
    return r && r.data;
  },
  /* Image sombre ou terne : on étire le contraste (du gris le plus sombre au plus clair) et on éclaircit les ombres.
     On mesure aussi la lumière pour proposer l'éclairage par l'écran. */
  eclairage(d) {
    const hist = new Uint32Array(256), N = d.length / 4;
    for (let i = 0; i < d.length; i += 16) hist[(d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8]++;
    const total = N / 4; let acc = 0, bas = 0, haut = 255, somme = 0;
    for (let k = 0; k < 256; k++) { somme += k * hist[k]; }
    for (let k = 0; k < 256; k++) { acc += hist[k]; if (acc > total * .02) { bas = k; break; } }
    acc = 0; for (let k = 255; k >= 0; k--) { acc += hist[k]; if (acc > total * .02) { haut = k; break; } }
    const moyenne = somme / total; this.lumiere = this.lumiere == null ? moyenne : this.lumiere * .9 + moyenne * .1;
    Eclairage.mesure(this.lumiere);
    if (haut - bas > 150 && moyenne > 70) return;                     // image correcte : on n'y touche pas
    const gamma = moyenne < 60 ? .6 : moyenne < 100 ? .8 : 1, table = new Uint8ClampedArray(256), ecart = Math.max(24, haut - bas);
    for (let k = 0; k < 256; k++) table[k] = 255 * Math.pow(Math.min(1, Math.max(0, (k - bas) / ecart)), gamma);
    for (let i = 0; i < d.length; i += 4) {
      const g = table[(d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8];
      d[i] = d[i + 1] = d[i + 2] = g;
    }
  },
  async boucle() {
    if (!this.actif) return;
    const v = $('#video');
    if (v.readyState >= 2 && v.videoWidth) {
      let txt = null;
      try {
        if (this.detecteur && this.tour % 2 === 0) { this.tour++; const r = await this.detecteur.detect(v); txt = r[0] && r[0].rawValue; }
        else if (window.jsQR) txt = this.lireJsQR(v);
      } catch (e) { if (window.jsQR) txt = this.lireJsQR(v); }
      if (txt) this.lu(txt.trim());
    }
    setTimeout(() => requestAnimationFrame(() => this.boucle()), 50);
  },
  lu(txt) {
    const now = Date.now();
    if (txt === this.dernier && now - this.quand < 2500) return;   // même carte encore devant l'œil
    this.dernier = txt; this.quand = now;
    const T = txt.toUpperCase();
    if (!T.startsWith(CONFIG.prefixeQR)) return;
    $('#oeil').classList.add('lu'); setTimeout(() => $('#oeil').classList.remove('lu'), 400);
    Veille.activite();
    if (ecranDePassage()) return;
    const p = T.match(/-P(\d)\s*$/);                    // carte pouvoir : CHAUDRON-P1 … CHAUDRON-P6
    if (p) return Pouvoirs.scanner(+p[1]);
    const m = T.match(/(\d{1,2})\s*$/);
    if (m) ajouterIngredient(parseInt(m[1], 10));
  },
};
/* Quand il fait sombre, l'écran éclaire les cartes : un halo blanc s'allume sur les bords (réglable dans ⚙). */
const Eclairage = {
  actif: true, allume: false,
  mesure(l) {
    if (!this.actif || !$('#ecran-jeu').classList.contains('actif')) return this.regler(false);
    if (l < 55 && !this.allume) this.regler(true);
    else if (l > 95 && this.allume) this.regler(false);
  },
  regler(oui) { this.allume = oui; document.body.classList.toggle('eclairage', oui); },
};
async function garderEcranAllume() { try { Veille.verrou = await navigator.wakeLock.request('screen'); } catch (e) {} }

/* ---------- VEILLE : sans carte scannée pendant 3 minutes, l'app s'endort ----------
   Caméra, musique, ambiance et voix s'arrêtent, l'écran peut s'éteindre. Un toucher réveille tout. */
const Veille = {
  minuteur: null, endormie: false, verrou: null, ambiance: false,
  activite() { if (this.endormie) return; clearTimeout(this.minuteur); if (!$('#ecran-jeu').classList.contains('actif')) return;
    this.minuteur = setTimeout(() => this.dormir(), CONFIG.veilleMinutes * 60000); },
  dormir() {
    if (!$('#ecran-jeu').classList.contains('actif') || this.endormie) return;
    this.endormie = true; this.ambiance = Ambiance.actif;
    Camera.arreter(); Musique.arreter(); Ambiance.arreter(); Voix.arreter(); Eclairage.regler(false);
    try { this.verrou && this.verrou.release(); } catch (e) {} this.verrou = null;
    $('#veille').hidden = false;
  },
  reveil() {
    const dormait = this.endormie;
    this.endormie = false; $('#veille').hidden = true;
    if (dormait) {
      debloquerAudio();
      if ($('#opt-camera').checked) Camera.demarrer();
      if ($('#opt-musique').checked) Musique.demarrer();
      if (this.ambiance) Ambiance.demarrer();
      majBoutonMusique(); majBoutonAmbiance(); garderEcranAllume();
    }
    this.activite();
  },
  arreter() { clearTimeout(this.minuteur); this.endormie = false; $('#veille').hidden = true; },
};
$('#veille').addEventListener('pointerdown', e => { e.preventDefault(); Veille.reveil(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && $('#ecran-jeu').classList.contains('actif') && !Veille.endormie) garderEcranAllume(); });

/* ---------- 13. VERSION ET MISES À JOUR ---------- */
const dateFr = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function afficherVersion() {
  $('#btn-version').textContent = `Version ${VERSION.numero} · ${dateFr(VERSION.date)}`;
}
$('#btn-version').onclick = () => {
  fenetre(`<h2>Historique des versions</h2><div class="historique">${HISTORIQUE.map(v => `
    <div class="${v.numero === VERSION.numero ? 'actuelle' : ''}"><h4>Version ${v.numero} <small>· ${dateFr(v.date)}</small></h4>
    <ul>${v.nouveautes.map(n => `<li>${n}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="actions"><button class="bouton-or" id="f-fermer">Fermer</button></div>`);
  $('#f-fermer').onclick = fermerFenetre;
};

// Va lire version.js sur le serveur : si le numéro a changé, on propose de mettre à jour.
async function versionEnLigne() {
  const r = await fetch('version.js?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) return null;
  const m = (await r.text()).match(/numero:\s*'([^']+)'/);
  return m ? m[1] : null;
}
async function verifierMiseAJour() {
  try {
    const enLigne = await versionEnLigne();
    let attendue = null; try { attendue = sessionStorage.getItem('chaudron-maj'); } catch (e) {}
    if (attendue && attendue === VERSION.numero) { try { sessionStorage.removeItem('chaudron-maj'); } catch (e) {} }
    if (!enLigne || enLigne === VERSION.numero) { $('#bandeau-maj').hidden = true; return; }
    $('#maj-texte').textContent = attendue === enLigne
      ? `La version ${enLigne} n'est pas encore arrivée sur ce téléphone. Réessaie dans une minute.`
      : `Nouvelle version ${enLigne} disponible`;
    $('#bandeau-maj').hidden = false;
  } catch (e) {}
}

// Les fichiers de l'app à retélécharger lors d'une mise à jour
function fichiersDeLApp() {
  return ['./', 'index.html', 'version.js', 'contenu.js', 'moteur.js', 'theme.css', 'manifest.json', 'sw.js',
    ...Object.keys(FAMILLES).map(imgFamille), ...ORDRE_REP.map(imgReponse)];
}

// Mise à jour forcée : on retélécharge chaque fichier depuis GitHub (sans passer par la mémoire
// du téléphone), on vide les copies hors ligne, puis on recharge l'app.
async function mettreAJour() {
  const b = $('#btn-recharger'); b.disabled = true; b.textContent = 'Mise à jour…';
  let cible = null;
  try { cible = await versionEnLigne(); } catch (e) {}
  try { if (cible) { sessionStorage.setItem('chaudron-maj', cible); localStorage.setItem('chaudron-version', cible); } } catch (e) {}
  try {
    const regs = await navigator.serviceWorker?.getRegistrations();
    await Promise.all((regs || []).map(r => r.unregister()));
  } catch (e) {}
  try { const noms = await caches.keys(); await Promise.all(noms.filter(n => n.startsWith('chaudron')).map(n => caches.delete(n))); } catch (e) {}
  await Promise.all(fichiersDeLApp().map(f => fetch(f, { cache: 'reload' }).catch(() => {})));
  location.replace(location.pathname + '?v=' + encodeURIComponent((cible || 'maj') + '-' + Date.now()));
}
$('#btn-recharger').onclick = mettreAJour;
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verifierMiseAJour(); });

/* ---------- 14. LANCEMENT ---------- */
// copie le dessin du chaudron partout où il y a [data-chaudron] (avec des id uniques)
$$('[data-chaudron]').forEach((el, k) => { el.innerHTML = $('#modele-chaudron').innerHTML.replace(/(g-corps|g-potion|clip-potion)/g, `$1-${k}`); });
majSaisieSorcieres();
Perso.charger();
poseAccueil();
// image de secours si un fichier n'est pas (encore) livré, par ex. repos.png
function secours(im, src) {
  const mettre = () => { im.onerror = null; im.src = src; };
  im.onerror = mettre;
  if (im.complete && !im.naturalWidth) mettre();       // l'erreur a pu arriver avant ce code
}
$$('img[data-secours]').forEach(im => secours(im, im.dataset.secours));
secours($('#perso-img'), Perso.src(POSTURE_PAR_DEFAUT));
Voix.charger();
Musique.charger();
afficherVersion();
try { localStorage.setItem('chaudron-version', VERSION.numero); } catch (e) {}
verifierMiseAJour();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
if (location.search.includes('v=')) history.replaceState(null, '', location.pathname);   // on nettoie l'adresse après une mise à jour
