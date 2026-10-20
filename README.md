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
