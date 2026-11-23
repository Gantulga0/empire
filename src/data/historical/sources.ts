import type { Source } from "@/types/history";

/**
 * Bibliography. Book references are listed without URLs on purpose — use a
 * library catalogue. Treaty texts are widely reproduced (e.g. Wikisource,
 * the Avalon Project, national archives).
 */
export const SOURCES: Source[] = [
  {
    id: "shimonoseki",
    kind: "primary",
    citation: "Treaty of Shimonoseki (Treaty of Peace between China and Japan), 17 April 1895 — Art. 1–4, 6.",
    note: "Article 2 defines the ceded Liaodong area by the line Yalu – An-ping – Fenghuang – Haicheng – Yingkou.",
  },
  {
    id: "retrocession",
    kind: "primary",
    citation: "Convention for the Retrocession of the Southern Portion of the Fengtien Peninsula, 8 November 1895.",
  },
  {
    id: "portsmouth",
    kind: "primary",
    citation: "Treaty of Portsmouth between Japan and Russia, 5 September 1905 — Art. II, V, VI, IX.",
    note: "Art. V transfers the Port Arthur / Talien lease; Art. VI the Changchun–Port Arthur railway; Art. IX southern Sakhalin below 50°N.",
  },
  {
    id: "peking-1905",
    kind: "primary",
    citation: "Sino-Japanese Treaty relating to Manchuria (Treaty of Peking), 22 December 1905.",
  },
  {
    id: "twentyone",
    kind: "primary",
    citation: "Treaties and Notes respecting Shantung and South Manchuria and Eastern Inner Mongolia, 25 May 1915 (the accepted part of the Twenty-One Demands).",
  },
  {
    id: "lytton",
    kind: "primary",
    citation: "League of Nations, Report of the Commission of Enquiry (Lytton Report), Geneva, 1932.",
  },
  {
    id: "imtfe",
    kind: "primary",
    citation: "International Military Tribunal for the Far East, Judgment, Tokyo, November 1948.",
  },
  {
    id: "paine-1894",
    kind: "scholarly",
    citation: "S. C. M. Paine, The Sino-Japanese War of 1894–1895: Perceptions, Power, and Primacy. Cambridge University Press, 2003.",
  },
  {
    id: "paine-wars",
    kind: "scholarly",
    citation: "S. C. M. Paine, The Wars for Asia, 1911–1949. Cambridge University Press, 2012.",
  },
  {
    id: "myers-peattie",
    kind: "scholarly",
    citation: "Ramon H. Myers & Mark R. Peattie (eds.), The Japanese Colonial Empire, 1895–1945. Princeton University Press, 1984.",
  },
  {
    id: "duus",
    kind: "scholarly",
    citation: "Peter Duus, Ramon H. Myers & Mark R. Peattie (eds.), The Japanese Informal Empire in China, 1895–1937. Princeton University Press, 1989.",
  },
  {
    id: "matsusaka",
    kind: "scholarly",
    citation: "Yoshihisa Tak Matsusaka, The Making of Japanese Manchuria, 1904–1932. Harvard University Asia Center, 2001.",
  },
  {
    id: "young",
    kind: "scholarly",
    citation: "Louise Young, Japan's Total Empire: Manchuria and the Culture of Wartime Imperialism. University of California Press, 1998.",
  },
  {
    id: "dickinson",
    kind: "scholarly",
    citation: "Frederick R. Dickinson, War and National Reinvention: Japan in the Great War, 1914–1919. Harvard University Press, 1999.",
  },
  {
    id: "mitter",
    kind: "scholarly",
    citation: "Rana Mitter, Forgotten Ally: China's World War II, 1937–1945. Houghton Mifflin Harcourt, 2013.",
  },
  {
    id: "battle-for-china",
    kind: "scholarly",
    citation: "Mark Peattie, Edward Drea & Hans van de Ven (eds.), The Battle for China: Essays on the Military History of the Sino-Japanese War of 1937–1945. Stanford University Press, 2011.",
  },
  {
    id: "muscolino",
    kind: "scholarly",
    citation: "Micah S. Muscolino, The Ecology of War in China: Henan Province, the Yellow River, and Beyond, 1938–1950. Cambridge University Press, 2015.",
  },
  {
    id: "glantz",
    kind: "scholarly",
    citation: "David M. Glantz, The Soviet Strategic Offensive in Manchuria, 1945: 'August Storm'. Frank Cass, 2003.",
  },
  {
    id: "britannica",
    kind: "reference",
    citation: "Encyclopaedia Britannica — entries 'First Sino-Japanese War', 'Twenty-One Demands', 'Mukden Incident', 'Manchukuo', 'Second Sino-Japanese War'.",
    url: "https://www.britannica.com",
  },
  {
    id: "natural-earth",
    kind: "dataset",
    citation: "Natural Earth — 1:50m and 1:10m cultural and physical vectors (public domain).",
    url: "https://www.naturalearthdata.com",
    note: "Modern coastlines, rivers, lakes, modern borders and modern provincial outlines.",
  },
  {
    id: "geonames",
    kind: "dataset",
    citation: "GeoNames gazetteer — modern city-centre coordinates (CC BY 4.0).",
    url: "https://www.geonames.org",
    note: "Coordinates are rounded to ~0.01°. Historical city cores may differ slightly.",
  },
  {
    id: "terrain-tiles",
    kind: "dataset",
    citation: "Terrain Tiles (Mapzen / Tilezen), AWS Open Data Registry — terrarium elevation tiles.",
    url: "https://registry.opendata.aws/terrain-tiles/",
    note: "Pre-rendered at build time (zoom 5) into the shaded-relief image. Includes data from SRTM, GMTED2010, ETOPO1 and others.",
  },
];

export const SOURCE_BY_ID: Record<string, Source> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
