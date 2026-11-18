// Palmera Heat - tuning, palette and names in one place.
export const WORLD = { size: 3600, roadEvery: 450, roadWidth: 92, blockInset: 26 };
export const STEP = 1 / 60;
export const VIEW = { width: 1280, height: 720 };
export const PALETTE = {
  skyTop: '#ffd9a0', skyBottom: '#ff9e7d', sea: '#2ec4b6', sand: '#f4d58d',
  grass: '#7bc47f', road: '#3a3f4a', roadLine: '#ffd166', sidewalk: '#d9c7a7',
};
export const CAR_TYPES = {
  ventura: { name: 'Ventura', w: 44, h: 22, top: 300, accel: 210, grip: 5.2, color: '#ef476f' },
  kestrel: { name: 'Kestrel', w: 46, h: 22, top: 380, accel: 300, grip: 6.0, color: '#ffd166' },
  bulto: { name: 'Bulto', w: 52, h: 26, top: 230, accel: 150, grip: 4.2, color: '#06d6a0' },
  marea: { name: 'Marea', w: 44, h: 22, top: 275, accel: 195, grip: 5.0, color: '#118ab2' },
  police: { name: 'Patrol', w: 46, h: 23, top: 360, accel: 285, grip: 5.8, color: '#f8f9fa' },
};
export const CAR_COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#f78c6b', '#c77dff', '#90e0a8', '#ffb703'];
export const DISTRICTS = [
  { id: 'downtown', name: 'Downtown Palmera', x: 1350, y: 1100, w: 1000, h: 1100 },
  { id: 'port', name: 'Puerto Este', x: 2500, y: 900, w: 1000, h: 1500 },
  { id: 'suburb', name: 'Las Lomas', x: 100, y: 900, w: 1100, h: 1500 },
  { id: 'beach', name: 'Playa Sol', x: 100, y: 2900, w: 3400, h: 650 },
];
export const SAVE_KEY = 'palmera-heat-save-v1';
