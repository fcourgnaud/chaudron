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
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const hasard = arr => arr[Math.floor(Math.random() * arr.length)];
const melanger = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const attendre = ms => new Promise(r => setTimeout(r, ms));
const ING = n => INGREDIENTS.find(i => i.n === n);
const codeQR = n => CONFIG.prefixeQR + String(n).padStart(2, '0');
const varCSS = nom => getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || '#888';
const couleurFamille = f => varCSS('--fam-' + f);
const phrase = (cle, vars = {}) => hasard(PHRASES[cle]).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const ORDRE_REP = ['bulle', 'sifflement', 'pschitt'];
const imgReponse = r => `images/rep-${r}.svg`;
const imgFamille = f => `images/fam-${f}.svg`;
// illustration de l'ingrédient si elle existe, sinon l'icône de sa famille
const imgIngredient = (i, classe = '') =>
  `<img class="${classe}" src="images/ingredients/${codeQR(i.n)}.${FORMAT_ILLUSTRATIONS}" alt="" onerror="this.onerror=null;this.src='${imgFamille(i.fam)}'">`;

let R = { mode: 'concours', nb: 2, taille: 4 };   // réglages choisis
let S = {};                                         // état de la partie

/* ---------- 2. NAVIGATION ET PRÉPARATION ---------- */
function montrer(id) { $$('.ecran').forEach(e => e.classList.toggle('actif', e.id === id)); window.scrollTo(0, 0); }

$$('#ecran-titre [data-mode]').forEach(b => b.onclick = () => {
  debloquerAudio();
  if ($('#opt-musique').checked) Musique.demarrer();
  R.mode = b.dataset.mode;
  $('#prep-titre').textContent = R.mode === 'concours' ? 'Le Concours' : 'La Pleine Lune';
  $('#prep-sorcieres').hidden = R.mode !== 'concours';
  $('#prep-taille').hidden = R.mode !== 'lune';
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
choix('#choix-nombre', 'n', v => { R.nb = +v; majSaisieSorcieres(); });
choix('#choix-taille', 't', v => { R.taille = +v; });

function majSaisieSorcieres() {
  const box = $('#liste-sorcieres');
  const anciens = [...box.querySelectorAll('input')].map(i => i.value);
  box.innerHTML = '';
  for (let i = 0; i < R.nb; i++) {
    box.insertAdjacentHTML('beforeend', `<label class="sorciere-saisie"><span class="chapeau">🧙‍♀️</span><input maxlength="12" value="${anciens[i] || NOMS_PAR_DEFAUT[i]}"></label>`);
  }
}

$('#btn-allumer').onclick = () => { debloquerAudio(); demarrerPartie(); };

/* ---------- 3. PARTIE : MANCHES ET TOURS ---------- */
function demarrerPartie() {
  const noms = [...$('#liste-sorcieres').querySelectorAll('input')].map((i, k) => i.value.trim() || NOMS_PAR_DEFAUT[k]);
  S = {
    mode: R.mode,
    expert: $('#opt-expert').checked,
    voix: $('#opt-voix').checked,
    joueurs: (R.mode === 'concours' ? noms : ['Le cercle']).map(nom => ({ nom, victoires: 0, pouvoirs: [], utilises: new Set(), passe: false, essais: 0, eliminee: false })),
    courant: 0,
    manche: 0,
    pouvoirsDispo: melanger(POUVOIRS.map(p => p.id)),
  };
  montrer('ecran-jeu');
  remplirEtagere(); remplirLegendeFumees();
  if ($('#opt-ambiance').checked) Ambiance.demarrer(); majBoutonAmbiance();
  if ($('#opt-musique').checked) Musique.demarrer(); else Musique.arreter();
  majBoutonMusique();
  if ($('#opt-camera').checked) Camera.demarrer(); else $('#oeil').hidden = true;
  garderEcranAllume();
  nouvelleManche(true);
}

async function nouvelleManche(premiere) {
  const taille = S.mode === 'lune' ? R.taille : MANCHES[S.manche].taille;
  const tirage = melanger(INGREDIENTS.map(i => i.n));
  S.recette = tirage.slice(0, taille);
  // 2 ingrédients instables, hors recette, de familles différentes
  const reste = tirage.slice(taille);
  S.instables = [reste[0], reste.find(n => ING(n).fam !== ING(reste[0]).fam)];
  S.max = Math.max(CONFIG.maxBrassage, taille);
  S.brassage = []; S.journal = []; S.absents = new Set(); S.malPlaces = {};
  S.essais = 0; S.phase = 'attente'; S.derniere = null;
  S.secret = false; S.question = false; S.sablier = false;
  S.joueurs.forEach(j => { j.passe = false; j.eliminee = false; j.utilises = new Set(); });
  colorerPotion(null);
  majTitre(); majSorcieres(); majPlateau(); majJournal(); majPouvoirs(); majActions('brassage');

  if (S.mode === 'lune') {
    await rideau(`<div class="icone">🌕</div><div class="petit-titre">Mode coopératif</div><div class="grand-titre">La Pleine Lune</div><div class="sous-titre">${taille} ingrédients · ${CONFIG.essaisPleineLune} essais</div>`, CONFIG.dureeRideau + 600);
    await parler('luneDebut', { n: taille, essais: CONFIG.essaisPleineLune });
    S.phase = 'brassage'; majPlateau();
    $('#consigne').innerHTML = 'Jetez vos cartes une par une, <b>dans l\'ordre</b>';
    return;
  }
  const m = MANCHES[S.manche];
  await rideau(`<div class="icone">${'🔥'.repeat(S.manche + 1)}</div><div class="petit-titre">Manche ${S.manche + 1}</div><div class="grand-titre">${m.nom}</div><div class="sous-titre">${taille} ingrédients · l'ordre compte</div>`, CONFIG.dureeRideau + 600);
  if (premiere) await parler('accueil');
  await parler('manche', { manche: m.nom, n: taille });
  S.toursDepuisMarche = 0;
  if (S.joueurs.length > 1) await distribuerSecrets();
  await debutTour(false);
}

async function debutTour(avecRideau = true) {
  const j = S.joueurs[S.courant];
  S.annonceCeTour = false;
  S.brassage = []; S.phase = 'brassage';
  majSorcieres(); majPlateau(); majPouvoirs(); majActions('brassage');
  $('#consigne').innerHTML = `<b>${j.nom}</b> : cueille une carte, puis jette-en 3 ou ${S.max} dans l'ordre`;
  if (S.joueurs.length > 1) {
    if (avecRideau) await rideau(`<div class="icone">🧙‍♀️</div><div class="petit-titre">Au tour de</div><div class="grand-titre">${j.nom}</div>`, CONFIG.dureeRideau);
    parler('tour', { joueur: j.nom });
  }
}

async function tourSuivant() {
  // après un tour de table complet, le marché se refait
  S.toursDepuisMarche = (S.toursDepuisMarche || 0) + 1;
  const enJeu = S.joueurs.filter(j => !j.eliminee).length;
  if (S.toursDepuisMarche >= enJeu) { S.toursDepuisMarche = 0; await rappelMarche(); }
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
  if (S.question) return Pouvoirs.repondreSerpent(n);
  if (S.phase !== 'brassage') return;
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
$('#btn-brasser').onclick = () => { fermerTiroirs(); brasser(); };

// la règle : bulle = bonne place, sifflement = mauvaise place, pschitt = absent
function calculerReponses(brassage, recette) {
  return brassage.map((n, i) => recette[i] === n ? 'bulle' : recette.includes(n) ? 'sifflement' : 'pschitt');
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
  $('#scene').classList.add('agite');

  if (S.secret) {
    await fenetreBouton(`<h2>🦉 Œil de chouette</h2><p>Colle le téléphone à ton oreille, puis touche le bouton.</p>`, "J'écoute", true);
    $('#fenetre-boite').innerHTML = '<p style="font-size:3rem">🦉</p>';
  }

  // --- explosion ---
  if (S.instables.every(n => ids.includes(n))) {
    const [a, b] = S.instables.map(n => ING(n).nom);
    $('#scene').classList.add('secoue'); setTimeout(() => $('#scene').classList.remove('secoue'), 700);
    Sons.jouer('explosion');
    colorerPotion(varCSS('--fumee-explosion'), S.secret ? '' : TEXTES_FUMEE.explosion); Fumee.bouffee(varCSS('--fumee-explosion'), 140);
    if (S.secret) { S.secret = false; fermerFenetre(); }
    ajouterJournal({ qui: j.nom, explosion: `${a} + ${b}` });
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
    if (res[i] === 'pschitt') S.absents.add(n);
    if (res[i] === 'sifflement') (S.malPlaces[n] ||= new Set()).add(i);
  });

  const { couleur, texte: texteFumee } = fumeeDe(ids, gagne);
  S.derniere = { res, secret };
  colorerPotion(couleur, secret ? '' : texteFumee); Fumee.bouffee(couleur, 70);
  await jouerReponses(res, secret);

  ajouterJournal(secret ? { qui: j.nom, secret: true } : { qui: S.mode === 'concours' ? j.nom : `Essai ${S.essais}`, ids, res, couleur, texteFumee });

  if (secret) { S.secret = false; colorerPotion(null); fermerFenetre(); majPlateau(); }
  if (gagne) return victoireManche();
  const bulles = res.filter(r => r === 'bulle').length;
  await parler(secret ? 'secret' : bulles >= S.recette.length - 1 ? 'presque' : 'rate');
  finDuBrassage();
}

async function jouerReponses(res, secret) {
  const ordre = S.expert ? melanger(res).sort((a, b) => ORDRE_REP.indexOf(a) - ORDRE_REP.indexOf(b)) : res;
  $('#reponses-expert').innerHTML = '';
  for (let i = 0; i < ordre.length; i++) {
    if (!secret) {
      if (S.expert) $('#reponses-expert').insertAdjacentHTML('beforeend', `<figure><img src="${imgReponse(ordre[i])}" alt=""><figcaption>${LIBELLES_REPONSES[ordre[i]]}</figcaption></figure>`);
      else {
        const el = $('#rep-' + i), lib = $('#lib-' + i);
        if (el) { el.src = imgReponse(ordre[i]); el.classList.add('visible'); }
        if (lib) { lib.textContent = LIBELLES_REPONSES[ordre[i]]; lib.className = 'libelle visible ' + ordre[i]; }
      }
    }
    Sons.jouer(ordre[i]);
    if (ordre[i] === 'bulle') Fumee.bouffee(Fumee.couleur, 30);
    await attendre(CONFIG.pauseEntreSons);
  }
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
  if (S.sablier) {
    S.sablier = false; S.brassage = []; S.phase = 'brassage';
    majPlateau(); majActions('brassage'); majPouvoirs();
    $('#consigne').innerHTML = `⏳ <b>${j.nom}</b> rejoue tout de suite !`;
    return;
  }
  S.phase = 'suite';
  majActions('suite'); majPouvoirs();
  $('#consigne').innerHTML = S.joueurs.length > 1 ? 'Notez la réponse dans vos grimoires…' : 'Note la réponse dans ton grimoire…';
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
      <div class="apercu-boite secret-carte" style="--c:${couleurFamille(ing.fam)}">${imgIngredient(ing, 'vignette')}<b>${ing.nom}</b><small>${FAMILLES[ing.fam].nom}</small></div>
      <p><small>Retiens-le (ou note-le en secret dans ton grimoire). Tu ne connais pas sa place.</small></p>`, "C'est noté", true);
  }
  fermerFenetre();
  await parler('secrets');
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
  $('#f-rejouer').onclick = () => { fermerFenetre(); Camera.arreter(); viderParole(); demarrerPartie(); };
}

function quitter() { Camera.arreter(); Ambiance.arreter(); viderParole(); montrer('ecran-titre'); }
$('#btn-quitter').onclick = async () => { if (await fenetreOuiNon('<h2>Éteindre le feu ?</h2><p>La partie en cours sera perdue.</p>')) quitter(); };

/* ---------- 6. POUVOIRS ---------- */
const Pouvoirs = {
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
    await parler(oui ? 'serpentOui' : 'serpentNon', {}, true);
    await attendre(500);
    fermerFenetre();
    ajouterJournal({ qui: S.joueurs[S.courant].nom, serpent: true });
  },
};

function majPouvoirs() {
  const box = $('#actions-pouvoirs'); box.innerHTML = '';
  if (S.mode !== 'concours' || S.phase !== 'brassage') return;
  const j = S.joueurs[S.courant];
  j.pouvoirs.map(id => POUVOIRS.find(p => p.id === id)).filter(p => p.app && p.id !== 'amulette').forEach(p => {
    const b = document.createElement('button');
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
    $('#titre-manche').innerHTML = `${MANCHES[S.manche].nom}<small>Manche ${S.manche + 1} sur ${MANCHES.length} · ${S.recette.length} ingrédients</small>`;
  }
}

function majSorcieres() {
  if (S.mode !== 'concours') return;
  $('#sorcieres').innerHTML = S.joueurs.map((j, k) => {
    const pv = j.pouvoirs.map(id => POUVOIRS.find(p => p.id === id).emoji).join('');
    return `<div class="sorciere ${k === S.courant ? 'active' : ''} ${j.passe ? 'suie' : ''} ${j.eliminee ? 'eliminee' : ''}"><span class="chapeau">${j.eliminee ? '✖' : '🧙‍♀️'}</span>${j.nom}<span class="trophees">${'★'.repeat(j.victoires)}</span>${pv}</div>`;
  }).join('');
}

// la carte qu'on vient de jeter apparaît en grand au centre, puis se range
let minuteurApercu = null;
function montrerEnGrand(ing, rang) {
  const a = $('#apercu-carte');
  a.style.setProperty('--c', couleurFamille(ing.fam));
  a.style.setProperty('--duree-apercu', CONFIG.dureeApercuCarte + 'ms');
  a.innerHTML = `<div class="apercu-boite"><span class="rang">${rang}</span>${imgIngredient(ing, 'vignette')}<b>${ing.nom}</b><small>${FAMILLES[ing.fam].nom}</small></div>`;
  a.classList.remove('visible'); void a.offsetWidth; a.classList.add('visible');
  clearTimeout(minuteurApercu);
  minuteurApercu = setTimeout(() => a.classList.remove('visible'), CONFIG.dureeApercuCarte);
}

function majPlateau() {
  const box = $('#plateau'); box.innerHTML = '';
  box.style.setProperty('--nb', S.max);
  for (let i = 0; i < S.max; i++) {
    const n = S.brassage[i];
    if (n) {
      const ing = ING(n);
      box.insertAdjacentHTML('beforeend', `<div class="emplacement plein" style="--c:${couleurFamille(ing.fam)}">
        <span class="rang">${i + 1}</span>${imgIngredient(ing, 'vignette')}<span class="nom">${ing.nom}</span>
        <img class="reponse" id="rep-${i}" alt=""><span class="libelle" id="lib-${i}"></span></div>`);
    } else {
      box.insertAdjacentHTML('beforeend', `<div class="emplacement">${i + 1}${i >= CONFIG.minBrassage ? '<span class="facultatif">facultatif</span>' : ''}</div>`);
    }
  }
  $('#reponses-expert').innerHTML = '';
  $('#btn-brasser').disabled = S.phase !== 'brassage' || S.brassage.length < Math.min(CONFIG.minBrassage, S.recette.length);
  $('#btn-retirer').disabled = S.phase !== 'brassage' || !S.brassage.length;
  $('#btn-brasser-main').disabled = $('#btn-brasser').disabled;
  $('#btn-retirer-main').disabled = $('#btn-retirer').disabled;
  $('#main-compte').textContent = S.brassage.length ? S.brassage.map(n => ING(n).nom).join(' › ') : 'Touche les ingrédients dans l\'ordre';
}

function majActions(quoi) {
  $('#actions-brassage').hidden = quoi !== 'brassage';
  $('#actions-annonce').hidden = !(quoi === 'brassage' || quoi === 'suite') || S.annonceCeTour;
  $('#btn-annonce').textContent = quoi === 'suite' ? "📜 J'annonce maintenant" : "📜 J'annonce la recette";
  $('#actions-suite').hidden = quoi !== 'suite';
  if (quoi !== 'brassage') $('#actions-pouvoirs').innerHTML = '';
}

function colorerPotion(couleur, texte = '') {
  const c = $('#ecran-jeu .grand-chaudron'), scene = $('#scene'), etiquette = $('#etiquette-fumee');
  etiquette.hidden = !(couleur && texte);
  if (couleur && texte) {
    etiquette.innerHTML = `<span class="pastille-fumee"></span><span>${texte.replace(/ ([:!?;])/g, '\u00a0$1')}</span>`;
    etiquette.style.setProperty('--c', couleur);
    etiquette.classList.remove('nouvelle'); void etiquette.offsetWidth; etiquette.classList.add('nouvelle');
  }
  if (!couleur) {
    c.style.removeProperty('--potion'); c.style.removeProperty('--potion-clair');
    scene.style.setProperty('--lueur', 'transparent'); Fumee.couleur = varCSS('--fumee-repos'); return;
  }
  c.style.setProperty('--potion', `color-mix(in srgb, ${couleur} 70%, black)`);
  c.style.setProperty('--potion-clair', couleur);
  scene.style.setProperty('--lueur', couleur);
  Fumee.couleur = couleur;
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
    else if (S.expert) corps = e.ids.map(n => `<span class="ing" style="--c:${couleurFamille(ING(n).fam)}">${ING(n).nom}</span>`).join(' ') +
      ` <span class="expert">${[...e.res].sort((a, b) => ORDRE_REP.indexOf(a) - ORDRE_REP.indexOf(b)).map(r => `<img src="${imgReponse(r)}" alt="">`).join('')}</span>`;
    else corps = e.ids.map((n, i) => `<span class="ing" style="--c:${couleurFamille(ING(n).fam)}"><img class="r" src="${imgReponse(e.res[i])}" alt="">${ING(n).nom}</span>`).join(' ');
    const fumee = e.couleur ? `<span class="fumee-journal" style="--c:${e.couleur}">${e.texteFumee || ''}</span>` : '';
    return `<div class="ligne-journal"><span class="qui">${e.qui}</span>${corps} ${fumee}</div>`;
  }).join('');
}

function remplirLegendeFumees() {
  $('#legende-fumees').innerHTML = Object.entries(FAMILLES).map(([id, f]) => `<span style="--c:${couleurFamille(id)}">${f.nom}</span>`).join('') +
    `<span style="--c:${varCSS('--fumee-complete')}">Toutes là</span>`;
}

function remplirEtagere(box = $('#etagere')) {
  box.innerHTML = Object.entries(FAMILLES).map(([id, f]) =>
    `<h4><img src="${imgFamille(id)}" alt="">${f.nom}</h4>` +
    INGREDIENTS.filter(i => i.fam === id).map(i => `<button data-n="${i.n}" style="--c:${couleurFamille(id)}">${i.nom}</button>`).join('')
  ).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => ajouterIngredient(+b.dataset.n));
}
function majEtagere() { $$('#etagere button').forEach(b => b.classList.toggle('dedans', S.brassage.includes(+b.dataset.n))); }

/* ---------- 8. RIDEAU, FENÊTRES, TIROIRS ---------- */
function rideau(html, duree) {
  return new Promise(r => {
    $('#rideau-contenu').innerHTML = html; $('#rideau').classList.add('visible');
    const fin = () => { clearTimeout(t); $('#rideau').classList.remove('visible'); $('#rideau').onclick = null; setTimeout(r, 300); };
    const t = setTimeout(fin, duree); $('#rideau').onclick = fin;
  });
}
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
$('#btn-main').onclick = () => { majEtagere(); ouvrirTiroir('#tiroir-main'); };

/* ---------- 9. SONS ---------- */
let AC = null;
function debloquerAudio() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
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
    scan() { bloup(AC.currentTime, 520, .3); },
  },
  jouer(nom) {
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
      $('#musique-info').textContent = this.trouves.length
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
    if (this.trouves.length) this.morceauSuivant(); else if (CONFIG.musiqueComposee) this.composer();
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
    const boucle = () => {
      if (!this.actif) return;
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
    this.actif = false; clearTimeout(this.minuteur); majBoutonMusique();
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
    try {
      const buf = await this.tampon(nom);
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

const sansAccent = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// le moment qui correspond aux listes de VOIX (les nombres et les manches ont leurs propres fichiers)
function momentVoix(cle, vars) {
  if (cle === 'manche') return 'manche-' + sansAccent(vars.manche);
  if (cle === 'lune') return 'lune-reste-' + vars.n;
  if (cle === 'luneDebut') return 'lune-debut-' + vars.n;
  return cle;
}

function parler(cle, vars = {}, discret = false) {
  const textes = PHRASES[cle];
  const liste = VOIX[momentVoix(cle, vars)] || [];
  const dispo = liste.filter(f => Voix.trouvees.has(f));
  let i, fichier = null;
  if (dispo.length) { fichier = hasard(dispo); i = liste.indexOf(fichier) % textes.length; }
  else i = Math.floor(Math.random() * textes.length);
  const texte = textes[i].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return dire(texte, discret, fichier);
}

// Les phrases passent l'une après l'autre (jamais en même temps),
// avec CONFIG.pauseEntrePhrases de silence entre deux phrases.
const Parole = { file: Promise.resolve(), finDerniere: 0, generation: 0 };

function dire(texte, discret = false, fichier = null) {
  const gen = Parole.generation;
  const tour = Parole.file.then(async () => {
    if (gen !== Parole.generation) return;               // partie quittée entre-temps
    const attente = Parole.finDerniere + CONFIG.pauseEntrePhrases - Date.now();
    if (attente > 0) await attendre(attente);
    if (gen !== Parole.generation) return;
    const p = $('#parole');
    if (!discret) { p.textContent = texte; p.classList.remove('nouvelle'); void p.offsetWidth; p.classList.add('nouvelle'); }
    if (!S.voix) await attendre(900 + texte.length * 30);
    else {
      Musique.baisser(true);
      try { await parlerVraiment(texte, fichier); } finally { Musique.baisser(false); }
    }
    Parole.finDerniere = Date.now();
  });
  Parole.file = tour.catch(() => {});
  return tour;
}
function viderParole() { Parole.generation++; Parole.file = Promise.resolve(); Parole.finDerniere = 0; Voix.arreter(); }

async function parlerVraiment(texte, fichier) {
  if (fichier && await Voix.jouer(fichier)) return;
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
  obj.bouffee = (c, n) => { for (let i = 0; i < n; i++) particule(c, 1.9); };
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

/* ---------- 12. CAMÉRA ET QR CODES ---------- */
const Camera = {
  flux: null, actif: false, dernier: '', quand: 0,
  async demarrer() {
    $('#oeil').hidden = false; $('#oeil-etat').textContent = '…';
    try {
      this.flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      const v = $('#video'); v.srcObject = this.flux; await v.play();
      $('#oeil-etat').textContent = ''; this.actif = true; this.boucle();
    } catch (e) {
      $('#oeil').hidden = true;
      $('#consigne').innerHTML = 'Pas de caméra : touche ✋ pour choisir les ingrédients';
    }
  },
  arreter() { this.actif = false; if (this.flux) this.flux.getTracks().forEach(t => t.stop()); this.flux = null; },
  boucle() {
    if (!this.actif) return;
    const v = $('#video'), c = $('#canvas-scan');
    if (v.readyState >= 2 && window.jsQR && v.videoWidth) {
      const w = 360, h = Math.round(w * v.videoHeight / v.videoWidth);
      c.width = w; c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(v, 0, 0, w, h);
      const r = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'attemptBoth' });
      if (r && r.data) this.lu(r.data.trim());
    }
    setTimeout(() => requestAnimationFrame(() => this.boucle()), 120);
  },
  lu(txt) {
    const now = Date.now();
    if (txt === this.dernier && now - this.quand < 2500) return;   // même carte encore devant l'œil
    this.dernier = txt; this.quand = now;
    const T = txt.toUpperCase(), m = T.match(/(\d{1,2})\s*$/);
    if (!T.startsWith(CONFIG.prefixeQR) || !m) return;
    $('#oeil').classList.add('lu'); setTimeout(() => $('#oeil').classList.remove('lu'), 400);
    ajouterIngredient(parseInt(m[1], 10));
  },
};
async function garderEcranAllume() { try { await navigator.wakeLock.request('screen'); } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && $('#ecran-jeu').classList.contains('actif')) garderEcranAllume(); });

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
Voix.charger();
Musique.charger();
afficherVersion();
try { localStorage.setItem('chaudron-version', VERSION.numero); } catch (e) {}
verifierMiseAJour();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
if (location.search.includes('v=')) history.replaceState(null, '', location.pathname);   // on nettoie l'adresse après une mise à jour
