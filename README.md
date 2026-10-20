# Will – maquette « A Cabin In The Woods »

Site statique (HTML, CSS, JavaScript), sans étape de construction, prêt pour Vercel.

## Pages
- `index.html` : accueil (EP, lecteur, disques, histoire, W-Team, vidéos, concerts, porte-clés, contact)
- `concerts.html` : dates à venir et passées, compte à rebours, carte, infos pratiques
- `programmateurs.html` : formules, kit presse, demande de date

## Modifier le contenu
- Dates de concert : `data/concerts.js` (un bloc par date, le tri est automatique)
- Disques, prix et porte-clés : `data/catalogue.js`
- Textes anglais : `js/i18n.js` (le français est dans les pages HTML)

## Bon à savoir
- Panier, réservation et demande de date sont simulés : rien n’est envoyé.
- Le bouton « Mode calme » coupe les animations (activé d’office si le système demande moins d’animations).
- `?nowebgl` à la fin de l’adresse force la version des braises sans WebGL.
- Image de partage (réseaux sociaux) : l’adresse `https://will-midoux-maquette.vercel.app/img/og-will.jpg` est écrite dans les trois pages ; à changer si le site prend un autre nom de domaine.

## Version 2 (audit)
- Polices allégées et polices de secours aux mêmes proportions (pas de saut de texte au chargement).
- En-tête toujours visible (bouton « Mode calme » accessible en permanence), menu mobile avec tabulation contenue.
- Le feu réagit vraiment à la musique (lueur qui respire, sans clignotement), mini-lecteur flottant sur téléphone.
- Section concerts sur papier kraft, citation de Will sur bandeau vert sapin, photo de Will dès l'ouverture.
- Images d'ambiance signalées comme telles, panier marqué « démonstration », moyens de paiement en texte.
- Kit presse en haute définition (`img/presse/`), page 404, données structurées des concerts pour Google.
