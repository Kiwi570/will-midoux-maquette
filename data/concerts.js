// Toutes les dates de concert de Will, au même endroit.
// Le site trie tout seul : les dates à venir d'un côté, les dates passées de l'autre.
// Pour ajouter une date : copier un bloc, changer les valeurs, enregistrer.
// status : "ok" ou "annule" · time : "21:00" ou null · lat/lon : position sur la carte
// label : côté du nom de ville sur la carte (n, s, e, w), facultatif.

export const concerts = [
  {
    date: '2026-05-10', time: null, status: 'annule',
    city: 'Reims', dept: '51', country: 'France',
    venue: 'Burn Outs (Hippodrome)',
    lat: 49.2583, lon: 4.0317,
  },
  {
    date: '2026-06-13', time: '19:30', status: 'ok',
    city: 'Les Ayvelles', dept: '08', country: 'France',
    venue: 'Juca Ranch',
    note: { fr: 'Uniquement sur réservation', en: 'Reservation only' },
    booking: 'https://www.facebook.com/profile.php?id=100027965993621',
    lat: 49.7199, lon: 4.7639, label: 'w',
  },
  {
    date: '2026-06-19', time: '19:00', status: 'ok',
    city: 'Douzy', dept: '08', country: 'France',
    venue: 'Fête de la Musique',
    lat: 49.6697, lon: 5.0436, label: 'e',
  },
  {
    date: '2026-07-17', time: null, status: 'annule',
    city: 'Noyers-Pont-Maugis', dept: '08', country: 'France',
    venue: 'La Taverne de Maugis',
    lat: 49.6681, lon: 4.9667, label: 's',
  },
  {
    date: '2026-11-20', time: '21:00', status: 'ok',
    city: 'Sedan', dept: '08', country: 'France',
    venue: "Chop N'Rock",
    lat: 49.7019, lon: 4.9403, label: 'n',
  },
  {
    date: '2027-03-14', time: '18:30', status: 'ok',
    city: 'Chauny', dept: '02', country: 'France',
    venue: 'Beer Monkey Bar',
    lat: 49.6156, lon: 3.2194,
  },
];

// Lieux et événements déjà joués (sources : profil Gigstarter de Will et photos du site actuel).
export const scenes = [
  { name: 'Fête de la Moto', city: 'Mouzon (08)', year: '2024' },
  { name: 'Fête de la Bière', city: 'Charleville-Mézières (08)', year: '2024' },
  { name: 'Le Petit Rustique', city: 'Doisches', year: '2024' },
  { name: 'Rassemblement Motos et Mobylettes', city: 'Aubrives (08)' },
  { name: 'Foodtrucks, Beer & Music Fest', city: 'Charleville-Mézières (08)' },
  { name: 'Journée Country', city: 'Rouvroy-sur-Audry (08)' },
  { name: "Les Soirées Inoubliables d'Argy", city: 'Argy' },
  { name: 'Au Bureau', city: 'Charleville-Mézières (08)' },
  { name: 'Concert privé', name_en: 'Private concert', city: 'Sprimont (Belgique)', city_en: 'Sprimont (Belgium)' },
];

// Fuseau horaire des concerts (France).
export const TZ_OFFSET = { winter: '+01:00', summer: '+02:00' };
