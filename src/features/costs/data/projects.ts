export const ESTIMATE_PROJECTS = [
  { id: 'cal-konut', location: 'Çal / Denizli', name: 'Çal Konut Projesi' },
  {
    id: 'merkez-ofis',
    location: 'Merkezefendi / Denizli',
    name: 'Merkez Ofis Renovasyonu',
  },
  { id: 'villa-uygulama', location: 'Pamukkale / Denizli', name: 'Villa Uygulama Projesi' },
] as const;

export type EstimateProjectId = (typeof ESTIMATE_PROJECTS)[number]['id'];
