import type { MapLabel, Regime } from "@/types/history";

/**
 * Collaborationist / puppet administrations whose borders were fluid or
 * undocumented. They are shown as seats (points), not as polygons.
 */
export const REGIMES: Regime[] = [
  {
    id: "east-hebei",
    name: "Зүүн Хэбэйн автономит засаг",
    seatPlaceId: "tongzhou",
    from: "1935-11-25",
    to: "1938-02-01",
    summary: "Тангүгийн хэлэлцээрийн цэрэггүй бүсэд Японы дэмжлэгээр байгуулагдсан. Дараа нь Түр засгийн газарт нэгдсэн.",
    sourceIds: ["paine-wars"],
  },
  {
    id: "mengjiang",
    name: "Мэнжян (Дэмчигдонровын засаг)",
    seatPlaceId: "zhangjiakou",
    from: "1936-05-12",
    to: "1945-08-19",
    summary:
      "Өвөр Монголын ван Дэмчигдонров (Дэ ван) Японы дэмжлэгтэй байгуулсан засаг. 1939 оноос Мэнжяны нэгдсэн автономит засгийн газар гэж нэрлэгдэж, Калганд төвлөрсөн. Хил хязгаар нь тогтворгүй байсан тул цэгээр харуулав.",
    sourceIds: ["paine-wars"],
  },
  {
    id: "provisional",
    name: "Бүгд Найрамдах Хятад Улсын түр засгийн газар",
    seatPlaceId: "beijing",
    from: "1937-12-14",
    to: "1940-03-30",
    summary: "Хойд Хятадад Японы армийн байгуулсан хүүхэлдэй засаг. 1940 онд Ван Жинвэйн засгийн газарт нэгдсэн.",
    sourceIds: ["mitter"],
  },
  {
    id: "reformed",
    name: "Бүгд Найрамдах Хятад Улсын шинэчилсэн засгийн газар",
    seatPlaceId: "nanjing",
    from: "1938-03-28",
    to: "1940-03-30",
    summary: "Төв Хятадад Японы байгуулсан хүүхэлдэй засаг.",
    sourceIds: ["mitter"],
  },
  {
    id: "wang-jingwei",
    name: "Ван Жинвэйн Нанжингийн засгийн газар",
    seatPlaceId: "nanjing",
    from: "1940-03-30",
    to: "1945-08-16",
    summary: "Гоминданы хуучин удирдагч Ван Жинвэй Японтой хамтран байгуулсан, эзлэгдсэн бүс нутгийг нэрлэсэн байдлаар захирсан засгийн газар.",
    sourceIds: ["mitter"],
  },
];

/** Map labels. Time-bounded labels appear only within their dates. */
export const MAP_LABELS: MapLabel[] = [
  { id: "qing", text: "ЧИН УЛС", lng: 111.5, lat: 32.5, kind: "state", to: "1912-02-12" },
  { id: "roc", text: "ДУНДАД ИРГЭН УЛС", sub: "Бүгд Найрамдах Хятад Улс", lng: 111.5, lat: 32.5, kind: "state", from: "1912-02-12" },
  { id: "japan", text: "ЯПОН", sub: "Японы эзэнт гүрэн", lng: 138.2, lat: 37.2, kind: "state" },
  { id: "korea", text: "СОЛОНГОС", lng: 128.3, lat: 36.3, kind: "state" },
  { id: "taiwan", text: "ТАЙВАНЬ", lng: 121.0, lat: 23.65, kind: "territory", minZoom: 4.2 },
  { id: "manchuria", text: "МАНЖУУР", lng: 127.6, lat: 47.6, kind: "territory", to: "1932-03-01" },
  { id: "manchukuo", text: "МАНЖ ГО", sub: "хүүхэлдэй улс", lng: 127.6, lat: 47.6, kind: "territory", from: "1932-03-01", to: "1945-08-18" },
  { id: "outer-mongolia", text: "ГАДААД МОНГОЛ", sub: "Чин улсын захиргаанд", lng: 104, lat: 46.6, kind: "state", to: "1911-12-29" },
  { id: "bogd", text: "БОГД ХААНТ МОНГОЛ УЛС", lng: 104, lat: 46.6, kind: "state", from: "1911-12-29", to: "1924-11-26" },
  { id: "bnmau", text: "БНМАУ", sub: "Бүгд Найрамдах Монгол Ард Улс", lng: 104, lat: 46.6, kind: "state", from: "1924-11-26" },
  { id: "russia", text: "ОРОСЫН ЭЗЭНТ ГҮРЭН", lng: 124, lat: 53.2, kind: "state", to: "1917-11-07" },
  { id: "soviet-russia", text: "ЗӨВЛӨЛТ ОРОС", lng: 124, lat: 53.2, kind: "state", from: "1917-11-07", to: "1922-12-30" },
  { id: "ussr", text: "ЗХУ", lng: 124, lat: 53.2, kind: "state", from: "1922-12-30" },
  { id: "yellow-sea", text: "Шар тэнгис", lng: 123.6, lat: 35.6, kind: "sea" },
  { id: "bohai", text: "Бохай", lng: 120.0, lat: 38.85, kind: "sea", minZoom: 5 },
  { id: "east-china-sea", text: "Зүүн Хятадын тэнгис", lng: 125.2, lat: 29.0, kind: "sea" },
  { id: "sea-of-japan", text: "Японы тэнгис", lng: 134.5, lat: 40.6, kind: "sea" },
  { id: "south-china-sea", text: "Өмнөд Хятадын тэнгис", lng: 115.5, lat: 18.5, kind: "sea" },
  { id: "pacific", text: "Номхон далай", lng: 145.0, lat: 30.0, kind: "sea" },
];
