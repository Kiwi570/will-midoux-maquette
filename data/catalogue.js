// Discographie et boutique (prix et références de la boutique HelloAsso Mezcal Nation Prod).
// Port offert sur toute la boutique.

export const SHOP_URL = 'https://www.helloasso.com/associations/mezcal-nation-prod/boutiques/mezcal-nation-prod-shop';

export const releases = [
  {
    id: 'fctr', title: 'From Country To Rock', artist: 'Will', year: 2026, released: '2026-09-12',
    type: { fr: 'EP, 5 titres', en: 'EP, 5 tracks' }, cover: 'pochette-from-country-to-rock', coverSizes: [400, 800, 1400],
    products: [{ id: 'MN008', format: 'cd', price: 7 }],
    links: {
      spotify: 'https://open.spotify.com/intl-fr/album/3rJASZ1erkFY0FyJOcdYiu',
      deezer: 'https://link.deezer.com/s/34xY25h6bq7o1ksjYCkBF',
      amazon: 'https://music.amazon.fr/albums/B0HJ696HB3',
    },
  },
  {
    id: 'share', title: 'Share', artist: 'Will', year: 2023, released: '2023-05-13',
    type: { fr: 'Album, 10 titres', en: 'Album, 10 tracks' }, cover: 'pochette-share', coverSizes: [400, 800, 1400],
    products: [{ id: 'MN006', format: 'cd', price: 13 }, { id: 'MN006D', format: 'digital', price: 8, note: { fr: 'MP3 HQ + livret numérique de 9 pages', en: 'HQ MP3 + 9-page digital booklet' } }],
    links: {
      spotify: 'https://open.spotify.com/intl-fr/album/2Qbth1eZJFONsCajxoPosN',
      deezer: 'https://deezer.page.link/1cPENpQeSo914JEr8',
      amazon: 'https://amazon.fr/music/player/albums/B0BZHCPTWC',
      youtube: 'https://youtube.com/playlist?list=PLuzXP3yONHLLyunrXwsLnHtThChrxUgGq',
    },
  },
  {
    id: 'notalone', title: 'Not Alone', artist: 'Will', year: 2021, released: '2021-05-29',
    type: { fr: 'Album, 11 titres', en: 'Album, 11 tracks' }, cover: 'pochette-not-alone', coverSizes: [400, 800, 1400],
    products: [{ id: 'MN004', format: 'cd', price: 12 }, { id: 'MN004D', format: 'digital', price: 7, note: { fr: 'MP3 HQ + livret numérique de 9 pages', en: 'HQ MP3 + 9-page digital booklet' } }],
    links: {
      spotify: 'https://open.spotify.com/intl-fr/album/6ekqEp1mIzdAWkTPiOKYPQ',
      deezer: 'https://deezer.page.link/6Joc5sdpbrS7o4rCA',
      amazon: 'https://amazon.fr/music/player/albums/B095HZW2YK',
      youtube: 'https://youtu.be/k6432pH9cOg',
    },
  },
  {
    id: 'christmas', title: "It's Time For Christmas", artist: 'Will', year: 2021,
    type: { fr: 'Single, versions anglaise et française (« C’est Noël Ce Soir »)', en: 'Single, English and French versions (“C’est Noël Ce Soir”)' }, cover: 'pochette-its-time-for-christmas', coverSizes: [300],
    products: [{ id: 'MN005D', format: 'digital', price: 2, note: { fr: 'Les 2 versions + pochette + paroles', en: 'Both versions + cover + lyrics' } }],
    links: {},
  },
  {
    id: 'secondlife', title: 'Second Life', artist: 'Will', year: 2019, released: '2019-05-11',
    type: { fr: 'Album, 10 titres', en: 'Album, 10 tracks' }, cover: 'pochette-second-life', coverSizes: [400, 800, 1247],
    products: [{ id: 'MN003', format: 'cd', price: 10 }, { id: 'MN003D', format: 'digital', price: 6, note: { fr: 'MP3 HQ + pochette recto verso', en: 'HQ MP3 + front and back cover' } }],
    links: {
      spotify: 'https://open.spotify.com/intl-fr/album/0HewZj7QuRkxPE159F7Gpb',
      deezer: 'https://deezer.page.link/FNES4KjCGMD3cddm6',
      amazon: 'https://amazon.fr/music/player/albums/B07RT1G31K',
      youtube: 'https://youtu.be/SawUSxkSM_E',
    },
  },
  {
    id: 'liveunplugged', title: 'Live Unplugged', artist: 'Mezcal', year: 2017,
    type: { fr: 'EP live, 6 titres, en première partie de Ian Scott', en: 'Live EP, 6 tracks, opening for Ian Scott' }, cover: 'pochette-mezcal-live-unplugged', coverSizes: [300],
    products: [{ id: 'MN002D', format: 'digital', price: 5, note: { fr: 'MP3 HQ + pochette', en: 'HQ MP3 + cover' } }],
    links: {},
  },
  {
    id: 'whiteandred', title: 'White & Red', artist: 'Mezcal', year: 2015,
    type: { fr: 'Album studio, 12 titres', en: 'Studio album, 12 tracks' }, cover: 'pochette-mezcal-white-and-red', coverSizes: [300],
    products: [{ id: 'MN001', format: 'cd', price: 8 }, { id: 'MN001D', format: 'digital', price: 6, note: { fr: 'MP3 HQ + pochette recto verso', en: 'HQ MP3 + front and back cover' } }],
    links: {},
  },
];

export const merch = [
  { id: 'MNM001', title: { fr: 'Porte-clés Will', en: 'Will keyring' }, detail: { fr: 'Acier brossé, gravure laser, livré avec son anneau.', en: 'Brushed steel, laser engraved, ring included.' }, price: 4, img: 'porte-cles-acier', size: 300 },
  { id: 'MNM002', title: { fr: 'Porte-clés « Share »', en: '“Share” keyring' }, detail: { fr: 'Cuir de cactus, livré avec son anneau.', en: 'Cactus leather, ring included.' }, price: 4, img: 'porte-cles-cuir-cactus', size: 208 },
];

// Index de tous les articles vendables, par référence HelloAsso.
export const products = {};
for (const r of releases) for (const p of r.products) {
  products[p.id] = {
    id: p.id, price: p.price, img: r.cover, imgSize: r.coverSizes[0],
    title: { fr: `${r.artist === 'Will' ? '' : r.artist + ' – '}${r.title} (${p.format === 'cd' ? 'CD' : 'numérique'})`, en: `${r.artist === 'Will' ? '' : r.artist + ' – '}${r.title} (${p.format === 'cd' ? 'CD' : 'digital'})` },
  };
}
for (const m of merch) products[m.id] = { id: m.id, price: m.price, img: m.img, imgSize: m.size, title: m.title };
