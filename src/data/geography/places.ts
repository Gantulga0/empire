import type { Place } from "@/types/history";

/**
 * Places. Coordinates: modern city centres from GeoNames, rounded to ~0.01°.
 * `occupations` lists Japanese *military* occupation only; colonial / leased /
 * puppet-state status is derived at runtime from the territory polygons.
 * Occupation dates with precision "month" are given to the month only.
 */
const END = "1945-08-15";

export const PLACES: Place[] = [
  // ── Tier 1 ───────────────────────────────────────────────
  {
    id: "tokyo", name: "Токио", lng: 139.76, lat: 35.68, tier: 1, kind: "capital",
    note: "Японы эзэнт гүрний нийслэл.",
  },
  {
    id: "beijing", name: "Бээжин", alt: "Бэйпин (1928–1949)", lng: 116.41, lat: 39.9, tier: 1, kind: "capital",
    occupations: [{ from: "1937-07-29", to: END, precision: "day" }],
    note: "1928 он хүртэл Хятадын нийслэл. 1937 оны 7-р сард эзлэгдэж, 1937–1940 онд «Түр засгийн газар» гэх хүүхэлдэй засгийн суудал болов.",
  },
  {
    id: "taipei", name: "Тайбэй", alt: "Тайхоку", lng: 121.57, lat: 25.03, tier: 1, kind: "city",
    note: "Японы Тайванийн Ерөнхий захирагчийн газрын төв, 1895–1945.",
  },
  {
    id: "qingdao", name: "Чиндао", alt: "Цинтао", lng: 120.38, lat: 36.07, tier: 1, kind: "city",
    occupations: [
      { from: "1914-11-07", to: "1922-12-10", precision: "day", note: "Германаас булаан авч эзэлсэн" },
      { from: "1938-01-10", to: END, precision: "day" },
    ],
    port: { kind: "leased-port", label: "Түрээсийн боомт (Герман 1898–1914)", from: "1898-03-06", to: "1922-12-10" },
    note: "Германы түрээсийн Жяожоу булангийн гол боомт. 1914 онд Японд эзлэгдсэн.",
  },
  {
    id: "lushun", name: "Люйшунь", alt: "Порт-Артур / Рёжюн", lng: 121.25, lat: 38.81, tier: 1, kind: "city",
    occupations: [{ from: "1894-11-21", to: "1895-11-08", precision: "day", note: "Нэгдүгээр дайны үеэр эзлэгдсэн" }],
    port: { kind: "leased-port", label: "Цэргийн тэнгисийн бааз (Орос 1898–1905, Япон 1905–1945)", from: "1898-03-27" },
    note: "Бохайн тэнгисийн үүд дэх стратегийн цэргийн боомт. 1894 онд Япон эзэлж, 1904–1905 онд Оросоос дахин булаан авсан.",
  },
  {
    id: "dalian", name: "Далянь", alt: "Дальний / Дайрэн", lng: 121.61, lat: 38.91, tier: 1, kind: "city",
    port: { kind: "leased-port", label: "Худалдааны чөлөөт боомт, Өмнөд Манжуурын төмөр замын эхлэл", from: "1898-03-27" },
    note: "Өмнөд Манжуурын төмөр замын компанийн төв, Манжуурын гол экспортын боомт.",
  },
  {
    id: "shenyang", name: "Шэньян", alt: "Мукден / Фэнтянь", lng: 123.43, lat: 41.8, tier: 1, kind: "city",
    occupations: [{ from: "1931-09-19", to: "1932-03-01", precision: "day" }],
    note: "Манжуурын гол хот. 1931 оны 9-р сарын 18-ны Мукдены хэрэг эндээс эхэлсэн.",
  },
  {
    id: "changchun", name: "Чанчунь", alt: "Шинкё (Манж Го-гийн нийслэл)", lng: 125.32, lat: 43.82, tier: 1, kind: "capital",
    occupations: [{ from: "1931-09-19", to: "1932-03-01", precision: "day" }],
    note: "Өмнөд Манжуурын төмөр замын хойд төгсгөл. 1932–1945 онд Манж Го-гийн нийслэл «Шинкё».",
  },
  {
    id: "tianjin", name: "Тяньжин", alt: "Тяньцзинь", lng: 117.2, lat: 39.08, tier: 1, kind: "city",
    occupations: [{ from: "1937-07-30", to: END, precision: "day" }],
    port: { kind: "concession", label: "Японы концесс, 1898–1945", from: "1898-08-29" },
    note: "Олон гүрний концесс бүхий худалдааны боомт. Японы концесс 1898 онд байгуулагдсан.",
  },
  {
    id: "shanghai", name: "Шанхай", lng: 121.47, lat: 31.23, tier: 1, kind: "city",
    occupations: [
      { from: "1937-11-12", to: END, precision: "day", note: "Хятадын хэсэг. Олон улсын суурин 1941.12.08-нд эзлэгдэв" },
    ],
    port: { kind: "treaty-port", label: "Гэрээт боомт; Олон улсын суурин (Японы иргэдийн том нийгэмлэг)" },
    note: "Хятадын хамгийн том боомт, санхүүгийн төв. 1932, 1937 онд ширүүн тулалдааны талбар болов.",
  },
  {
    id: "nanjing", name: "Нанжин", alt: "Нанкин", lng: 118.8, lat: 32.06, tier: 1, kind: "capital",
    occupations: [{ from: "1937-12-13", to: END, precision: "day" }],
    note: "1927–1937 онд Дундад Иргэн Улсын нийслэл. 1940–1945 онд Ван Жинвэйн хүүхэлдэй засгийн суудал.",
  },
  {
    id: "wuhan", name: "Ухань", alt: "Ханькоу, Учан, Ханьян", lng: 114.3, lat: 30.59, tier: 1, kind: "city",
    occupations: [{ from: "1938-10-25", to: END, precision: "day" }],
    port: { kind: "concession", label: "Ханькоу дахь Японы концесс, 1898–1943", from: "1898-07-16" },
    note: "Нанжин унасны дараа 1938 онд Гоминданы засгийн газрын түр төв болсон.",
  },
  {
    id: "guangzhou", name: "Гуанжоу", alt: "Кантон", lng: 113.26, lat: 23.13, tier: 1, kind: "city",
    occupations: [{ from: "1938-10-21", to: END, precision: "day" }],
    note: "Өмнөд Хятадын гол боомт. Эзлэгдсэнээр Хятадын гадаад хангамжийн чухал зам тасарсан.",
  },
  {
    id: "harbin", name: "Харбин", lng: 126.64, lat: 45.76, tier: 1, kind: "city",
    occupations: [{ from: "1932-02-05", to: "1932-03-01", precision: "day" }],
    note: "Хятадын зүүн төмөр замын (КВЖД) уулзвар, Оросын нөлөө хүчтэй хот.",
  },
  {
    id: "chongqing", name: "Чунцин", lng: 106.55, lat: 29.56, tier: 1, kind: "capital",
    note: "1938–1946 онд Дундад Иргэн Улсын дайны үеийн нийслэл. Япон эзэлж чадаагүй ч агаараас бөмбөгдсөн.",
  },
  {
    id: "seoul", name: "Сөүл", alt: "Кэйжо", lng: 126.98, lat: 37.57, tier: 1, kind: "city",
    note: "Японы Солонгосын Ерөнхий захирагчийн газрын төв, 1910–1945.",
  },

  // ── Tier 2 ───────────────────────────────────────────────
  {
    id: "shimonoseki", name: "Шимоносеки", lng: 130.94, lat: 33.96, tier: 2, kind: "city",
    note: "1895 оны энх тайвны гэрээ байгуулагдсан газар.",
  },
  {
    id: "pyongyang", name: "Пхеньян", lng: 125.76, lat: 39.04, tier: 2, kind: "city",
    note: "1894 оны 9-р сарын 15-нд Японы арми Чин улсын цэргийг бут цохисон газар.",
  },
  {
    id: "busan", name: "Пусан", lng: 129.08, lat: 35.18, tier: 3, kind: "city",
    port: { kind: "colonial-port", label: "Колонийн боомт — Японтой холбох усан онгоцны гарам" },
  },
  {
    id: "weihai", name: "Вэйхайвэй", lng: 122.12, lat: 37.51, tier: 2, kind: "city",
    occupations: [
      { from: "1895-02-12", to: "1898-05-24", precision: "day", note: "Нөхөн төлбөрийн баталгаа болгон барьж байсан" },
      { from: "1938-03-07", to: END, precision: "month" },
    ],
    port: { kind: "leased-port", label: "Их Британийн түрээс, 1898–1930", from: "1898-07-01", to: "1930-10-01" },
    note: "Бэйяны флотын бааз. 1895 онд флот нь бууж өгсөн.",
  },
  {
    id: "jinan", name: "Жинань", lng: 117.12, lat: 36.65, tier: 2, kind: "city",
    occupations: [
      { from: "1928-05-03", to: "1929-05-20", precision: "month", note: "Жинаний хэргийн дараах эзлэлт" },
      { from: "1937-12-27", to: END, precision: "day" },
    ],
    note: "Шаньдуны нийслэл, хоёр төмөр замын уулзвар.",
  },
  {
    id: "jilin", name: "Гирин", alt: "Жилинь", lng: 126.55, lat: 43.84, tier: 2, kind: "city",
    occupations: [{ from: "1931-09-21", to: "1932-03-01", precision: "day" }],
  },
  {
    id: "qiqihar", name: "Цицикар", lng: 123.92, lat: 47.35, tier: 2, kind: "city",
    occupations: [{ from: "1931-11-19", to: "1932-03-01", precision: "day" }],
    note: "Хэйлунжян мужийн төв. Нонни голын гүүрний тулалдааны дараа эзлэгдэв.",
  },
  {
    id: "jinzhou", name: "Жинжоу", alt: "Чинчоу", lng: 121.13, lat: 41.1, tier: 2, kind: "city",
    occupations: [{ from: "1932-01-03", to: "1932-03-01", precision: "day" }],
    note: "Жан Сюэлиангийн засаг захиргааны сүүлчийн түшиц газар Манжуурт.",
  },
  {
    id: "chengde", name: "Чэндэ", alt: "Жэхэ", lng: 117.96, lat: 40.95, tier: 2, kind: "city",
    note: "Жэхэ мужийн төв, 1933 оны 3-р сарын 4-нд эзлэгдсэн.",
  },
  {
    id: "andong", name: "Аньдун", alt: "Даньдун", lng: 124.35, lat: 40.0, tier: 2, kind: "city",
    occupations: [{ from: "1931-09-19", to: "1932-03-01", precision: "day" }],
    note: "Ялу голын гүүрээр Солонгосын төмөр замтай холбогддог хилийн хот.",
  },
  {
    id: "yingkou", name: "Инкоу", alt: "Нючжуан", lng: 122.24, lat: 40.67, tier: 2, kind: "city",
    occupations: [{ from: "1931-09-19", to: "1932-03-01", precision: "day" }],
    port: { kind: "treaty-port", label: "Гэрээт боомт (1861 оноос)" },
  },
  {
    id: "zhangjiakou", name: "Жанжякоу", alt: "Калган", lng: 114.89, lat: 40.77, tier: 2, kind: "city",
    occupations: [{ from: "1937-08-27", to: END, precision: "day" }],
    note: "1939 оноос Дэмчигдонровын тэргүүлсэн Мэнжян хүүхэлдэй засгийн суудал.",
  },
  {
    id: "xuzhou", name: "Сюйжоу", lng: 117.28, lat: 34.2, tier: 2, kind: "city",
    occupations: [{ from: "1938-05-19", to: END, precision: "day" }],
    note: "Тяньжин–Пукоу ба Лунхайн төмөр замын уулзвар.",
  },
  {
    id: "baoding", name: "Баодин", lng: 115.46, lat: 38.87, tier: 2, kind: "city",
    occupations: [{ from: "1937-09-24", to: END, precision: "day" }],
  },
  {
    id: "shijiazhuang", name: "Шижяжуан", lng: 114.51, lat: 38.04, tier: 2, kind: "city",
    occupations: [{ from: "1937-10-10", to: END, precision: "day" }],
  },
  {
    id: "taiyuan", name: "Тайюань", lng: 112.55, lat: 37.87, tier: 2, kind: "city",
    occupations: [{ from: "1937-11-08", to: END, precision: "day" }],
    note: "Шаньси мужийн төв.",
  },
  {
    id: "datong", name: "Датун", lng: 113.3, lat: 40.08, tier: 3, kind: "city",
    occupations: [{ from: "1937-09-13", to: END, precision: "day" }],
  },
  {
    id: "hohhot", name: "Хөх хот", alt: "Гүйсүй", lng: 111.67, lat: 40.82, tier: 3, kind: "city",
    occupations: [{ from: "1937-10-14", to: END, precision: "month" }],
  },
  {
    id: "hangzhou", name: "Ханжоу", lng: 120.16, lat: 30.27, tier: 2, kind: "city",
    occupations: [{ from: "1937-12-24", to: END, precision: "day" }],
  },
  {
    id: "xiamen", name: "Сямэнь", alt: "Амой", lng: 118.09, lat: 24.48, tier: 2, kind: "city",
    occupations: [{ from: "1938-05-13", to: END, precision: "day" }],
    port: { kind: "treaty-port", label: "Гэрээт боомт (1842 оноос)" },
  },
  {
    id: "anqing", name: "Аньчин", lng: 117.06, lat: 30.54, tier: 3, kind: "city",
    occupations: [{ from: "1938-06-12", to: END, precision: "day" }],
  },
  {
    id: "jiujiang", name: "Жюжян", lng: 116.0, lat: 29.71, tier: 3, kind: "city",
    occupations: [{ from: "1938-07-26", to: END, precision: "day" }],
  },
  {
    id: "nanchang", name: "Наньчан", lng: 115.86, lat: 28.68, tier: 2, kind: "city",
    occupations: [{ from: "1939-03-27", to: END, precision: "day" }],
  },
  {
    id: "changsha", name: "Чанша", lng: 112.94, lat: 28.23, tier: 2, kind: "city",
    occupations: [{ from: "1944-06-18", to: END, precision: "day" }],
    note: "1939–1942 онд гурван удаа довтолгоог няцааж, 1944 оны Ичи-Го ажиллагаагаар эзлэгдэв.",
  },
  {
    id: "hengyang", name: "Хэнян", lng: 112.57, lat: 26.89, tier: 3, kind: "city",
    occupations: [{ from: "1944-08-08", to: END, precision: "day" }],
  },
  {
    id: "guilin", name: "Гуйлинь", lng: 110.29, lat: 25.27, tier: 2, kind: "city",
    occupations: [{ from: "1944-11-10", to: END, precision: "day" }],
  },
  {
    id: "hongkong", name: "Хонконг", lng: 114.17, lat: 22.3, tier: 2, kind: "city",
    occupations: [{ from: "1941-12-25", to: END, precision: "day", note: "Их Британийн колони байсныг эзэлсэн" }],
    port: { kind: "colonial-port", label: "Их Британийн колони" },
  },
  {
    id: "kaifeng", name: "Кайфэн", lng: 114.31, lat: 34.8, tier: 3, kind: "city",
    occupations: [{ from: "1938-06-06", to: END, precision: "day" }],
  },
  {
    id: "zhengzhou", name: "Жэнжоу", lng: 113.63, lat: 34.75, tier: 2, kind: "city",
    occupations: [{ from: "1944-04-22", to: END, precision: "month", note: "1941 оны 10-р сард богино хугацаанд эзлэгдэж байсан" }],
  },
  {
    id: "luoyang", name: "Лоян", lng: 112.45, lat: 34.62, tier: 3, kind: "city",
    occupations: [{ from: "1944-05-25", to: END, precision: "day" }],
  },
  {
    id: "xinyang", name: "Синьян", lng: 114.09, lat: 32.15, tier: 3, kind: "city",
    occupations: [{ from: "1938-10-12", to: END, precision: "day" }],
  },
  {
    id: "tongzhou", name: "Тунжоу", lng: 116.66, lat: 39.91, tier: 3, kind: "city",
    occupations: [{ from: "1937-07-29", to: END, precision: "day" }],
    note: "1935–1937 онд Зүүн Хэбэйн хүүхэлдэй засгийн суудал.",
  },
  { id: "keelung", name: "Кээлүн", alt: "Кийрюү", lng: 121.74, lat: 25.13, tier: 3, kind: "city",
    port: { kind: "colonial-port", label: "Колонийн боомт (Тайвань)" } },
  { id: "kaohsiung", name: "Гаосюн", alt: "Такао", lng: 120.3, lat: 22.63, tier: 3, kind: "city",
    port: { kind: "colonial-port", label: "Колонийн боомт (Тайвань)" } },
  { id: "magong", name: "Пэнху", alt: "Пескадорын арлууд", lng: 119.58, lat: 23.57, tier: 3, kind: "city" },
  {
    id: "haikou", name: "Хайкоу", alt: "Хайнань арал", lng: 110.2, lat: 20.04, tier: 3, kind: "city",
    occupations: [{ from: "1939-02-10", to: END, precision: "day" }],
  },
  {
    id: "yueyang", name: "Юэян", lng: 113.13, lat: 29.36, tier: 3, kind: "city",
    occupations: [{ from: "1938-11-11", to: END, precision: "month" }],
  },
  {
    id: "hefei", name: "Хэфэй", lng: 117.23, lat: 31.82, tier: 3, kind: "city",
    occupations: [{ from: "1938-05-14", to: END, precision: "month" }],
  },
  {
    id: "wuhu", name: "Үху", lng: 118.38, lat: 31.33, tier: 3, kind: "city",
    occupations: [{ from: "1937-12-10", to: END, precision: "day" }],
  },
  {
    id: "shaoguan", name: "Шаогуань", lng: 113.6, lat: 24.81, tier: 3, kind: "city",
    occupations: [{ from: "1945-01-27", to: END, precision: "month" }],
  },

  // ── Railway nodes (tier 3) ────────────────────────────────
  { id: "kinchow", name: "Кинчоу", alt: "Жиньжоу (Далянь)", lng: 121.71, lat: 39.1, tier: 3, kind: "city" },
  { id: "wafangdian", name: "Вафандянь", lng: 122.01, lat: 39.63, tier: 3, kind: "city" },
  { id: "dashiqiao", name: "Дашичяо", lng: 122.51, lat: 40.64, tier: 3, kind: "city" },
  { id: "haicheng", name: "Хайчэн", lng: 122.69, lat: 40.88, tier: 3, kind: "city" },
  { id: "anshan", name: "Аньшань", lng: 122.99, lat: 41.11, tier: 3, kind: "city", note: "Японы төмөрлөгийн том үйлдвэр (Шова сталь)." },
  { id: "liaoyang", name: "Ляоян", lng: 123.24, lat: 41.27, tier: 3, kind: "city" },
  { id: "tieling", name: "Тиелин", lng: 123.84, lat: 42.29, tier: 3, kind: "city" },
  { id: "kaiyuan", name: "Кайюань", lng: 124.04, lat: 42.55, tier: 3, kind: "city" },
  { id: "siping", name: "Сыпин", lng: 124.35, lat: 43.17, tier: 3, kind: "city" },
  { id: "gongzhuling", name: "Гунжулин", lng: 124.82, lat: 43.5, tier: 3, kind: "city" },
  { id: "fenghuang", name: "Фэнхуанчэн", lng: 124.07, lat: 40.45, tier: 3, kind: "city" },
  { id: "benxi", name: "Бэньси", lng: 123.77, lat: 41.29, tier: 3, kind: "city" },
  { id: "manzhouli", name: "Манжуур", alt: "Маньчжоули", lng: 117.38, lat: 49.6, tier: 3, kind: "city" },
  { id: "hailar", name: "Хайлаар", lng: 119.77, lat: 49.21, tier: 3, kind: "city" },
  { id: "mudanjiang", name: "Муданьжян", lng: 129.63, lat: 44.55, tier: 3, kind: "city" },
  { id: "suifenhe", name: "Суйфэньхэ", lng: 131.15, lat: 44.4, tier: 3, kind: "city" },
  { id: "gaomi", name: "Гаоми", lng: 119.76, lat: 36.38, tier: 3, kind: "city",
    occupations: [{ from: "1938-01-15", to: END, precision: "month" }] },
  { id: "weifang", name: "Вэйфан", alt: "Вэйсянь", lng: 119.16, lat: 36.71, tier: 3, kind: "city",
    occupations: [{ from: "1938-01-15", to: END, precision: "month" }] },
  { id: "zhoucun", name: "Жоуцунь", lng: 117.87, lat: 36.8, tier: 3, kind: "city",
    occupations: [{ from: "1938-01-05", to: END, precision: "month" }] },
  { id: "cangzhou", name: "Цанжоу", lng: 116.84, lat: 38.3, tier: 3, kind: "city",
    occupations: [{ from: "1937-09-24", to: END, precision: "month" }] },
  { id: "dezhou", name: "Дэжоу", lng: 116.36, lat: 37.44, tier: 3, kind: "city",
    occupations: [{ from: "1937-10-03", to: END, precision: "month" }] },
  { id: "taian", name: "Тайань", lng: 117.09, lat: 36.2, tier: 3, kind: "city",
    occupations: [{ from: "1937-12-31", to: END, precision: "month" }] },
  { id: "bengbu", name: "Бэнбу", lng: 117.39, lat: 32.92, tier: 3, kind: "city",
    occupations: [{ from: "1938-02-02", to: END, precision: "month" }] },
  { id: "suzhou", name: "Сүжоу", lng: 120.59, lat: 31.3, tier: 3, kind: "city",
    occupations: [{ from: "1937-11-19", to: END, precision: "day" }] },
  { id: "wuxi", name: "Үси", lng: 120.31, lat: 31.49, tier: 3, kind: "city",
    occupations: [{ from: "1937-11-25", to: END, precision: "month" }] },
  { id: "changzhou", name: "Чанжоу", lng: 119.97, lat: 31.81, tier: 3, kind: "city",
    occupations: [{ from: "1937-11-29", to: END, precision: "month" }] },
  { id: "zhenjiang", name: "Жэньжян", lng: 119.43, lat: 32.19, tier: 3, kind: "city",
    occupations: [{ from: "1937-12-08", to: END, precision: "month" }] },
  { id: "tangshan", name: "Таншань", lng: 118.18, lat: 39.63, tier: 3, kind: "city",
    occupations: [{ from: "1937-07-30", to: END, precision: "month" }] },
  { id: "shanhaiguan", name: "Шаньхайгуань", lng: 119.75, lat: 40.0, tier: 3, kind: "city",
    occupations: [{ from: "1933-01-03", to: END, precision: "day" }],
    note: "Цагаан хэрэм тэнгист тулдаг цэг — Манжуур ба Хятадын хоорондох хаалга." },
  { id: "xinmin", name: "Синьминь", lng: 122.83, lat: 41.99, tier: 3, kind: "city",
    occupations: [{ from: "1931-12-28", to: "1932-03-01", precision: "month" }] },
  { id: "xinxiang", name: "Синьсян", lng: 113.93, lat: 35.3, tier: 3, kind: "city",
    occupations: [{ from: "1938-02-17", to: END, precision: "month" }] },
  { id: "kaesong", name: "Кэсон", lng: 126.55, lat: 37.97, tier: 3, kind: "city" },
  { id: "sinuiju", name: "Синыйжу", lng: 124.4, lat: 40.1, tier: 3, kind: "city" },
  { id: "daegu", name: "Тэгү", lng: 128.6, lat: 35.87, tier: 3, kind: "city" },
  { id: "daejeon", name: "Тэжон", lng: 127.39, lat: 36.35, tier: 3, kind: "city" },

  // ── Historical sites ─────────────────────────────────────
  {
    id: "liutiaohu", name: "Лютяоху", alt: "Мукдены хэргийн газар", lng: 123.45, lat: 41.85, tier: 2, kind: "site",
    note: "1931.09.18-нд Японы офицерууд төмөр замд жижиг дэлбэрэлт хийж, Хятадыг буруутган Манжуурын эзлэлтийг эхлүүлсэн.",
  },
  {
    id: "lugou", name: "Лугоучяо гүүр", alt: "Марко Пологийн гүүр", lng: 116.21, lat: 39.85, tier: 2, kind: "site",
    note: "1937.07.07-ны шөнийн мөргөлдөөн бүрэн хэмжээний дайныг эхлүүлсэн.",
  },
  {
    id: "yalu-sea", name: "Ялугийн тэнгисийн тулалдаан", lng: 123.5, lat: 39.3, tier: 3, kind: "site", approximate: true,
    note: "1894.09.17. Байршил ойролцоо — Ялу голын амсрын өмнөд тэнгис.",
  },
  {
    id: "taierzhuang", name: "Тайэржуан", lng: 117.73, lat: 34.56, tier: 3, kind: "site",
    note: "1938 оны 4-р сард Хятадын арми томоохон ялалт байгуулсан газар.",
  },
  {
    id: "huayuankou", name: "Хуаюанькоу", alt: "Шар мөрний далан", lng: 113.66, lat: 34.91, tier: 3, kind: "site",
    note: "1938.06.09-нд Гоминданы арми Японы давшилтыг зогсоохоор Шар мөрний даланг эвдсэн газар.",
  },
  { id: "longkou", name: "Лункоу", lng: 120.48, lat: 37.65, tier: 3, kind: "site", note: "1914 оны 9-р сард Японы цэрэг газардсан газар." },
  { id: "jinshanwei", name: "Жиньшаньвэй", lng: 121.33, lat: 30.72, tier: 3, kind: "site", note: "1937.11.05-нд Японы 10-р арми Ханжоугийн буланд газардсан газар." },
  { id: "daya-bay", name: "Дая булан", alt: "Биас бэй", lng: 114.6, lat: 22.7, tier: 3, kind: "site", note: "1938.10.12-нд Японы цэрэг Гуанжоуг эзлэхээр газардсан." },
];

export const PLACE_BY_ID: Record<string, Place> = Object.fromEntries(PLACES.map((p) => [p.id, p]));
