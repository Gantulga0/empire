import type { StoryChapter } from "@/types/history";

/**
 * Story-mode chapters. Each chapter animates the timeline from `timeFrom`
 * to `time`, so territories, railways and advance arrows evolve on screen
 * in their real chronological order.
 */
export const STORY: StoryChapter[] = [
  { eventId: "war-1894", timeFrom: "1894-07-01", time: "1894-10-31", camera: { center: [125.2, 38.8], zoom: 5.2, pitch: 35, bearing: -8 } },
  { eventId: "port-arthur-1894", timeFrom: "1894-10-20", time: "1894-11-22", camera: { center: [121.9, 39.25], zoom: 7.1, pitch: 40, bearing: 10 } },
  { eventId: "shimonoseki-1895", timeFrom: "1895-01-15", time: "1895-04-18", camera: { center: [123.6, 31.2], zoom: 4.3, pitch: 20 } },
  { eventId: "triple-1895", timeFrom: "1895-04-18", time: "1895-11-09", camera: { center: [122.6, 39.7], zoom: 6.3, pitch: 35 } },
  { eventId: "portsmouth-1905", timeFrom: "1904-02-08", time: "1905-09-06", camera: { center: [123.6, 41.4], zoom: 5.4, pitch: 40, bearing: -10 } },
  { eventId: "qingdao-1914", timeFrom: "1914-08-20", time: "1914-11-08", camera: { center: [119.4, 36.6], zoom: 6.5, pitch: 35 } },
  { eventId: "twentyone-1915", timeFrom: "1914-11-08", time: "1915-05-26", camera: { center: [120.0, 35.5], zoom: 4.3, pitch: 15 } },
  { eventId: "mukden-1931", timeFrom: "1931-09-10", time: "1932-02-06", camera: { center: [124.8, 44.0], zoom: 4.9, pitch: 35, bearing: -6 } },
  { eventId: "manchukuo-1932", timeFrom: "1932-02-06", time: "1933-06-01", camera: { center: [123.5, 45.0], zoom: 4.2, pitch: 25 } },
  { eventId: "marco-polo-1937", timeFrom: "1937-07-01", time: "1937-10-11", camera: { center: [116.3, 39.0], zoom: 6.3, pitch: 40 } },
  { eventId: "shanghai-1937", timeFrom: "1937-08-10", time: "1937-11-27", camera: { center: [120.8, 31.3], zoom: 6.9, pitch: 40, bearing: 8 } },
  { eventId: "nanjing-1937", timeFrom: "1937-11-27", time: "1937-12-28", camera: { center: [119.0, 32.0], zoom: 6.6, pitch: 40 } },
  { eventId: "wuhan-1938", timeFrom: "1938-01-01", time: "1938-10-28", camera: { center: [115.6, 31.6], zoom: 5.6, pitch: 30 } },
  { eventId: "surrender-1945", timeFrom: "1944-04-01", time: "1945-08-16", camera: { center: [119.0, 35.0], zoom: 3.9, pitch: 10 } },
];
