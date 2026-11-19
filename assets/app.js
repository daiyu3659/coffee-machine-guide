import * as THREE from 'three';
import { GLTFLoader } from './loaders/GLTFLoader.js';

/* =========================================================
   ECAM350.55.B Dinamica — 三维操作指南（技术可行性验证）
   坐标：X 宽、Y 高、Z 前（+Z 为正面）。单位：米。
   ========================================================= */

const P = {
  W: 0.236, D: 0.330, H: 0.348, BOT: 0.014,
  FRONT: 0.165, BACK: -0.165,
  PZ: 0.213, PW: 0.080, PH: 0.170, R: 0.26,
  PANEL_SHELL_Z: 0.173
};
const CENTER = new THREE.Vector3(0, 0.174, 0.055);

/* ---------------- renderer / scene ---------------- */
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x14151a, 1.7, 3.4);

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.01, 12);

/* ---------------- studio environment ---------------- */
function makeEnvTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 0, 512);
  lg.addColorStop(0, '#a9b0bd');
  lg.addColorStop(0.42, '#5c6270');
  lg.addColorStop(0.55, '#2c3038');
  lg.addColorStop(1, '#111318');
  g.fillStyle = lg; g.fillRect(0, 0, 1024, 512);
  // soft boxes
  const blobs = [
    [210, 130, 170, 0.55], [760, 100, 150, 0.42], [520, 330, 220, 0.16]
  ];
  blobs.forEach((b) => {
    const rg = g.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]);
    rg.addColorStop(0, 'rgba(255,255,255,' + b[3] + ')');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(b[0] - b[2], b[1] - b[2], b[2] * 2, b[2] * 2);
  });
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.encoding = THREE.sRGBEncoding;
  return t;
}
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromEquirectangular(makeEnvTexture()).texture;
scene.environment = envTex;

/* ---------------- lights ---------------- */
const key = new THREE.DirectionalLight(0xfff2e2, 2.1);
key.position.set(0.55, 0.95, 0.85);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 0.1;
key.shadow.camera.far = 3.2;
key.shadow.camera.left = -0.45;
key.shadow.camera.right = 0.45;
key.shadow.camera.top = 0.55;
key.shadow.camera.bottom = -0.35;
key.shadow.bias = -0.0008;
key.shadow.radius = 3;
scene.add(key);

const rim = new THREE.DirectionalLight(0x9fb4d8, 1.5);
rim.position.set(-0.85, 0.55, -0.75);
scene.add(rim);

const fill = new THREE.DirectionalLight(0xffffff, 0.45);
fill.position.set(0.2, 0.3, -1.2);
scene.add(fill);

scene.add(new THREE.HemisphereLight(0xcfd6e4, 0x1a1a1f, 0.55));

/* ---------------- materials ---------------- */
const MAT = {
  body: new THREE.MeshPhysicalMaterial({ color: 0x040406, metalness: 0.35, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.42 }),
  panel: new THREE.MeshPhysicalMaterial({ color: 0x030304, metalness: 0.2, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 0.55 }),
  chrome: new THREE.MeshPhysicalMaterial({ color: 0xdfe3e8, metalness: 1.0, roughness: 0.12, envMapIntensity: 1.5 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x040507, metalness: 0.1, roughness: 0.62, envMapIntensity: 0.1 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x1c1f24, metalness: 0.8, roughness: 0.52, envMapIntensity: 0.45 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 0.96, thickness: 0.006,
    ior: 1.5, side: THREE.DoubleSide, envMapIntensity: 0.9
  }),
  milk: new THREE.MeshPhysicalMaterial({ color: 0xcac4b4, roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.6 }),
  bean: new THREE.MeshStandardMaterial({ color: 0x1c0f06, roughness: 0.55, metalness: 0.05 }),
  ceramic: new THREE.MeshPhysicalMaterial({ color: 0xf2efe8, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
  coffee: new THREE.MeshPhysicalMaterial({ color: 0x2b1509, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.15 }),
  button: new THREE.MeshStandardMaterial({ color: 0x0b0c0f, metalness: 0.3, roughness: 0.32, envMapIntensity: 0.3 }),
  trayMat: new THREE.MeshStandardMaterial({ color: 0x030406, metalness: 0.05, roughness: 0.85, envMapIntensity: 0.06 }),
  led: new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb75c, emissiveIntensity: 0.25, roughness: 0.3 })
};

/* ---------------- geometry helpers ---------------- */
function roundedBox(w, h, d, r, seg) {
  seg = seg || 4;
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const pos = g.attributes.position;
  const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const cx = Math.min(hw, Math.max(-hw, v.x));
    const cy = Math.min(hh, Math.max(-hh, v.y));
    const cz = Math.min(hd, Math.max(-hd, v.z));
    const dx = v.x - cx, dy = v.y - cy, dz = v.z - cz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    pos.setXYZ(i, cx + dx / len * r, cy + dy / len * r, cz + dz / len * r);
  }
  g.computeVertexNormals();
  return g;
}

function mesh(geo, mat, name) {
  const m = new THREE.Mesh(geo, mat);
  if (name) m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cylinderBetween(p1, p2, r, mat) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, 16, 1, false);
  const m = new THREE.Mesh(g, mat);
  m.position.copy(p1).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

/* ---------------- canvas artwork (vector, high-dpi) ---------------- */
function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c) {
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.needsUpdate = true;
  return t;
}

/* LCD */
const lcdCanvas = document.createElement('canvas');
lcdCanvas.width = 768; lcdCanvas.height = 456;
const lcdCtx = lcdCanvas.getContext('2d');
const lcdTex = tex(lcdCanvas);
const mirrorCanvas = document.getElementById('mirrorCanvas');
const mirrorCtx = mirrorCanvas ? mirrorCanvas.getContext('2d') : null;

/* ---------------- machine screen state machine ----------------
   菜单层级参照 DINAMICA ECAM350.55 手册：主界面选饮品，
   ESC 返回，上下键浏览，OK 确认，AROMA 调浓度，SETTINGS 进设置。
   ------------------------------------------------------------- */
const UI = {
  mode: 'home',        // home | list | strength | setting | brew | rinse | descale | alert
  title: '',
  items: [],
  cursor: 0,
  listKind: '',
  strength: 3,
  temp: 'HIGH',
  msg: '',
  msgUntil: 0,
  msgAlert: false,
  brew: null,
  rinseUntil: 0,
  descaleStep: 0
};
const MENUS = {
  drinks: ['ESPRESSO', 'COFFEE', 'CAPPUCCINO', 'LATTE MACCHIATO', 'HOT MILK', 'HOT WATER', 'TEA'],
  my: ['MY ESPRESSO', 'MY CAPPUCCINO'],
  settings: ['WATER HARDNESS', 'SET TEMPERATURE', 'AUTO-OFF', 'ENERGY SAVING', 'DESCALE', 'DEFAULT VALUES', 'LANGUAGE']
};
const MENU_TITLES = { drinks: 'DRINK MENU', my: 'MY MENU', settings: 'SETTINGS' };
const DRINK_NAMES = { espresso: 'ESPRESSO', coffee: 'COFFEE', cappuccino: 'CAPPUCCINO', latte: 'LATTE MACCHIATO' };

function tankIn() { return parts.tank.t < 0.5; }
function groundsIn() { return parts.grounds.t < 0.5; }
function carafeIn() { return parts.carafe.t > 0.5; }

function setMsg(text, ms, alert) {
  UI.msg = text;
  UI.msgUntil = performance.now() + (ms || 2400);
  UI.msgAlert = !!alert;
  renderScreen();
}
function openMenu(kind) {
  UI.mode = 'list';
  UI.listKind = kind;
  UI.title = MENU_TITLES[kind];
  UI.items = MENUS[kind].slice();
  UI.cursor = 0;
  UI.msg = '';
  renderScreen();
}
function goHome() {
  UI.mode = 'home';
  UI.msg = '';
  UI.brew = null;
  renderScreen();
}
function onKey(id) {
  const now = performance.now();
  if (UI.mode === 'brew' || UI.mode === 'rinse' || UI.mode === 'descale') {
    if (id === 'rinse' && UI.mode !== 'brew') { goHome(); setMsg('已退出'); }
    return;
  }
  if (UI.mode === 'alert') {
    UI.mode = 'home'; UI.msg = ''; renderScreen(); return;
  }
  if (UI.mode === 'list') {
    if (id === 'down') { UI.cursor = Math.min(UI.items.length - 1, UI.cursor + 1); renderScreen(); return; }
    if (id === 'up') { UI.cursor = Math.max(0, UI.cursor - 1); renderScreen(); return; }
    if (id === 'ok') { selectMenuItem(); return; }
    if (id === 'rinse') { goHome(); return; }
    return;
  }
  if (UI.mode === 'strength') {
    if (id === 'up') { UI.strength = Math.min(5, UI.strength + 1); renderScreen(); return; }
    if (id === 'down') { UI.strength = Math.max(1, UI.strength - 1); renderScreen(); return; }
    if (id === 'ok' || id === 'aroma' || id === 'rinse') {
      UI.mode = 'home'; setMsg('AROMA ' + UI.strength + ' / 5 · READY'); return;
    }
    return;
  }
  if (UI.mode === 'setting') {
    if (id === 'ok') { UI.mode = 'list'; setMsg('SAVED · ' + UI.title); return; }
    if (id === 'rinse') { openMenu('settings'); return; }
    return;
  }
  switch (id) {
    case 'down': case 'up': openMenu('drinks'); break;
    case 'ok':
      UI.msg = '';
      setMsg(tankIn() ? 'READY · SELECT BEVERAGE' : 'FILL WATER TANK', 2200, !tankIn());
      break;
    case 'settings': openMenu('settings'); break;
    case 'aroma': UI.mode = 'strength'; UI.msg = ''; renderScreen(); break;
    case 'drink': openMenu('drinks'); break;
    case 'my': openMenu('my'); break;
    case 'rinse': startRinse(); break;
    case 'espresso': case 'coffee': case 'cappuccino': case 'latte': startBrew(id); break;
  }
}
function selectMenuItem() {
  const item = UI.items[UI.cursor];
  if (UI.listKind === 'settings') {
    if (item === 'SET TEMPERATURE') {
      UI.temp = UI.temp === 'HIGH' ? 'LOW' : UI.temp === 'LOW' ? 'MED' : 'HIGH';
      setMsg('TEMP · ' + UI.temp);
      return;
    }
    if (item === 'DESCALE') { UI.mode = 'descale'; UI.descaleStep = 0; UI.msg = ''; renderScreen(); return; }
    UI.mode = 'setting';
    UI.title = item;
    renderScreen();
    return;
  }
  const map = {
    'ESPRESSO': 'espresso', 'COFFEE': 'coffee', 'CAPPUCCINO': 'cappuccino',
    'LATTE MACCHIATO': 'latte', 'MY ESPRESSO': 'espresso', 'MY CAPPUCCINO': 'cappuccino'
  };
  if (map[item]) startBrew(map[item]);
  else { UI.mode = 'home'; setMsg(item + ' · READY'); }
}
function startBrew(id) {
  if (!tankIn()) { setMsg('FILL WATER TANK', 2800, true); return; }
  if (!groundsIn()) { setMsg('EMPTY GROUNDS CONTAINER', 2800, true); return; }
  if ((id === 'cappuccino' || id === 'latte') && !carafeIn()) {
    setMsg('INSERT MILK CARAFE', 2800, true);
    return;
  }
  UI.mode = 'brew';
  UI.brew = { id, name: DRINK_NAMES[id], from: performance.now(), dur: 3000 };
  UI.msg = '';
  renderScreen();
}
function startRinse() {
  if (!tankIn()) { setMsg('FILL WATER TANK', 2800, true); return; }
  UI.mode = 'rinse';
  UI.rinseUntil = performance.now() + 2400;
  UI.msg = '';
  renderScreen();
}
function finishBrew() {
  const name = UI.brew ? UI.brew.name : 'COFFEE';
  UI.mode = 'home';
  UI.brew = null;
  setMsg('YOUR ' + name + ' IS READY', 3200);
}
function finishRinse() {
  UI.mode = 'home';
  setMsg('RINSING COMPLETE · READY', 2600);
}

function renderScreen() {
  const g = lcdCtx, W = 768, H = 456, now = performance.now();
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#18244d'); bg.addColorStop(1, '#0a1028');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,150,220,.32)'; g.lineWidth = 4; g.strokeRect(8, 8, W - 16, H - 16);

  g.textAlign = 'left';
  g.fillStyle = 'rgba(198,212,244,.6)';
  g.font = '500 24px -apple-system, Helvetica, Arial';
  g.fillText("De'Longhi", 32, 52);
  g.textAlign = 'right';
  g.fillText('ECAM 350.55', W - 32, 52);
  g.strokeStyle = 'rgba(140,165,220,.22)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(32, 72); g.lineTo(W - 32, 72); g.stroke();

  // status row
  const busy = UI.mode === 'brew' || UI.mode === 'rinse' || UI.mode === 'descale';
  const status = busy ? (UI.mode === 'brew' ? 'BREWING' : 'RINSING') : 'READY';
  g.textAlign = 'left';
  g.fillStyle = busy ? 'rgba(240,180,122,.95)' : 'rgba(160,210,190,.9)';
  g.beginPath(); g.arc(40, 100, 5, 0, Math.PI * 2); g.fill();
  g.font = '600 22px -apple-system, Helvetica, Arial';
  g.fillText(status, 54, 108);
  g.textAlign = 'right';
  g.fillStyle = 'rgba(190,204,236,.6)';
  g.fillText('AROMA ' + UI.strength + '  ·  TEMP ' + UI.temp, W - 32, 108);

  const showMsg = UI.msg && now < UI.msgUntil;
  g.textAlign = 'left';

  if (showMsg && UI.mode !== 'brew' && UI.mode !== 'rinse' && UI.mode !== 'descale') {
    g.fillStyle = UI.msgAlert ? '#f0b47a' : '#f3f0e9';
    const mfs = UI.msg.length > 14 ? 34 : 46;
    g.font = '600 ' + mfs + 'px -apple-system, "PingFang SC", Helvetica, Arial';
    wrapText(g, UI.msg, 40, 210, W - 80, mfs + 10);
    g.fillStyle = 'rgba(198,209,236,.55)';
    g.font = '400 24px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText('按 OK 返回', 40, 400);
  } else if (UI.mode === 'list') {
    g.fillStyle = 'rgba(190,204,236,.66)';
    g.font = '500 26px -apple-system, Helvetica, Arial';
    g.fillText(UI.title, 40, 152);
    const first = Math.min(Math.max(0, UI.cursor - 1), Math.max(0, UI.items.length - 3));
    for (let i = 0; i < 3; i++) {
      const idx = first + i;
      if (idx >= UI.items.length) break;
      const y = 202 + i * 68;
      const on = idx === UI.cursor;
      if (on) {
        g.fillStyle = 'rgba(120,150,220,.16)';
        g.fillRect(28, y - 36, W - 56, 56);
        g.fillStyle = '#f3f0e9';
        g.beginPath(); g.arc(48, y - 8, 6, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = on ? '#f3f0e9' : 'rgba(190,204,236,.52)';
      g.font = (on ? '600 ' : '400 ') + '34px -apple-system, Helvetica, Arial';
      g.fillText(UI.items[idx], 70, y);
    }
    g.fillStyle = 'rgba(198,209,236,.4)';
    g.font = '400 20px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText('▲▼ 浏览 · OK 选择 · ESC 返回', 40, 412);
  } else if (UI.mode === 'strength') {
    g.fillStyle = 'rgba(190,204,236,.66)';
    g.font = '500 26px -apple-system, Helvetica, Arial';
    g.fillText('AROMA · 咖啡浓度', 40, 152);
    const bw = 108, gap = 12;
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * (bw + gap);
      const on = i < UI.strength;
      g.fillStyle = on ? '#eed9bf' : 'rgba(160,180,220,.18)';
      g.fillRect(x, 210, bw, 34);
    }
    g.fillStyle = '#f3f0e9';
    g.font = '600 44px -apple-system, Helvetica, Arial';
    g.fillText(UI.strength + ' / 5', 40, 316);
    g.fillStyle = 'rgba(198,209,236,.5)';
    g.font = '400 22px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText('▲▼ 调整 · OK 确认', 40, 400);
  } else if (UI.mode === 'setting') {
    g.fillStyle = 'rgba(190,204,236,.66)';
    g.font = '500 26px -apple-system, Helvetica, Arial';
    g.fillText('SETTINGS', 40, 152);
    g.fillStyle = '#f3f0e9';
    g.font = '600 40px -apple-system, Helvetica, Arial';
    g.fillText(UI.title, 40, 226);
    g.fillStyle = 'rgba(198,209,236,.5)';
    g.font = '400 22px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText('OK 保存 · ESC 返回', 40, 400);
  } else if (UI.mode === 'descale') {
    g.fillStyle = '#f3f0e9';
    g.font = '600 44px -apple-system, Helvetica, Arial';
    g.fillText('DESCALE', 40, 190);
    g.fillStyle = 'rgba(240,215,190,.85)';
    g.font = '400 30px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText(UI.descaleStep === 0 ? '加入除垢剂与清水，放好容器' : '清水冲洗回路，等待完成', 40, 250);
    g.fillStyle = 'rgba(198,209,236,.5)';
    g.font = '400 22px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText('ESC 退出', 40, 400);
  } else if (UI.mode === 'rinse') {
    g.fillStyle = '#f3f0e9';
    g.font = '600 46px -apple-system, Helvetica, Arial';
    g.fillText('RINSING', 40, 190);
    const p = Math.min(1, 1 - (UI.rinseUntil - now) / 2400);
    g.fillStyle = 'rgba(240,180,122,.9)';
    g.fillRect(40, 224, 420 * p, 6);
    g.fillStyle = 'rgba(198,209,236,.6)';
    g.font = '400 24px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText('出水口正在冲洗 · 请勿触碰', 40, 274);
  } else if (UI.mode === 'brew') {
    const b = UI.brew;
    const p = Math.min(1, (now - b.from) / b.dur);
    g.fillStyle = '#f3f0e9';
    g.font = '600 46px -apple-system, Helvetica, Arial';
    g.fillText(b.name, 40, 190);
    g.fillStyle = 'rgba(240,180,122,.9)';
    g.fillRect(40, 224, 420 * p, 6);
    g.fillStyle = 'rgba(198,209,236,.6)';
    g.font = '400 24px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText('BREWING · AROMA ' + UI.strength, 40, 274);
  } else {
    g.fillStyle = '#f3f0e9';
    g.font = '600 52px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText('SELECT', 40, 196);
    g.fillText('BEVERAGE', 40, 258);
    g.fillStyle = 'rgba(198,209,236,.55)';
    g.font = '400 24px -apple-system, "PingFang SC", Helvetica, Arial';
    g.fillText('ESPRESSO · COFFEE · CAPPUCCINO · LATTE', 40, 316);
    g.fillText(tankIn() ? 'WATER OK' : 'FILL WATER TANK', 40, 400);
  }

  // water / grounds footer icons
  g.textAlign = 'right';
  g.font = '400 20px -apple-system, Helvetica, Arial';
  g.fillStyle = tankIn() ? 'rgba(160,210,190,.85)' : 'rgba(240,180,122,.95)';
  g.fillText(tankIn() ? 'H2O ●' : 'H2O ○', W - 32, 400);
  g.fillStyle = groundsIn() ? 'rgba(160,210,190,.85)' : 'rgba(240,180,122,.95)';
  g.fillText(groundsIn() ? 'GROUNDS OK' : 'GROUNDS FULL', W - 118, 400);
  g.textAlign = 'left';

  lcdTex.needsUpdate = true;
  if (mirrorCtx) mirrorCtx.drawImage(lcdCanvas, 0, 0);
}

function wrapText(g, text, x, y, maxW, lh) {
  let line = '', yy = y;
  for (const ch of text) {
    if (g.measureText(line + ch).width > maxW) { g.fillText(line, x, yy); line = ch; yy += lh; }
    else line += ch;
  }
  if (line) g.fillText(line, x, yy);
}

/* logo */
function logoTexMake() {
  const [c, g] = cv(640, 280);
  g.clearRect(0, 0, 640, 280);
  g.strokeStyle = 'rgba(238,240,244,.92)'; g.lineWidth = 5;
  g.beginPath(); g.ellipse(320, 104, 238, 74, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(245,246,250,.96)';
  g.textAlign = 'center';
  g.font = 'italic 600 74px Georgia, "Times New Roman", serif';
  g.fillText("De'Longhi", 320, 128);
  g.font = '500 52px -apple-system, Helvetica, Arial';
  g.letterSpacing = '10px';
  g.fillStyle = 'rgba(214,217,224,.9)';
  g.fillText('DINAMICA', 320, 228);
  return tex(c);
}
const logoTex = logoTexMake();

/* button icons */
const ICONS = {
  down: (g, W, H) => chevron(g, W, H, 1),
  up: (g, W, H) => chevron(g, W, H, -1),
  ok: (g, W, H) => { g.fillStyle = '#f2efe9'; g.textAlign = 'center'; g.font = '600 74px -apple-system, Helvetica, Arial'; g.fillText('OK', W / 2, H / 2 + 26); },
  rinse: (g, W, H) => { cup(g, W, H, 0.5); arcArrow(g, W, H); },
  settings: (g, W, H) => gear(g, W, H),
  aroma: (g, W, H) => bean(g, W, H),
  espresso: (g, W, H) => { cup(g, W, H, 0.62); saucer(g, W, H); },
  coffee: (g, W, H) => { mug(g, W, H); },
  cappuccino: (g, W, H) => { cup(g, W, H, 0.68); foam(g, W, H); saucer(g, W, H); },
  latte: (g, W, H) => glass(g, W, H),
  drink: (g, W, H) => { cup(g, W, H, 0.34, 0.18, 0.5); label(g, W, H, 'DRINK', 'MENU'); },
  my: (g, W, H) => { person(g, W, H); label(g, W, H, 'my', 'MENU'); }
};

function chevron(g, W, H, dir) {
  g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(W * 0.28, H * 0.5 + dir * H * 0.16);
  g.lineTo(W * 0.5, H * 0.5 - dir * H * 0.18);
  g.lineTo(W * 0.72, H * 0.5 + dir * H * 0.16);
  g.stroke();
}
function cup(g, W, H, s, oy, ox) {
  s = s || 0.6; oy = oy || 0.22; ox = ox || 0.5;
  const w = W * 0.42 * s, h = H * 0.34 * s;
  const x = W * ox - w / 2, y = H * (0.5 - 0.05) - h * 0.15 + H * (oy - 0.22);
  g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x, y); g.lineTo(x + w, y);
  g.lineTo(x + w * 0.86, y + h);
  g.quadraticCurveTo(x + w / 2, y + h * 1.28, x + w * 0.14, y + h);
  g.closePath(); g.stroke();
}
function saucer(g, W, H) {
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(W * 0.3, H * 0.79); g.lineTo(W * 0.7, H * 0.79); g.stroke();
}
function mug(g, W, H) {
  const x = W * 0.34, y = H * 0.36, w = W * 0.32, h = H * 0.4, r = 8;
  g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w * 0.9, y + h - r); g.quadraticCurveTo(x + w * 0.88, y + h, x + w * 0.8, y + h);
  g.lineTo(x + w * 0.18, y + h); g.quadraticCurveTo(x + w * 0.1, y + h, x + w * 0.08, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.stroke();
  g.beginPath(); g.arc(x + w + 4, y + h * 0.42, w * 0.26, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
}
function foam(g, W, H) {
  g.strokeStyle = '#ffffff'; g.lineWidth = 9;
  g.beginPath(); g.arc(W * 0.5, H * 0.36, W * 0.2, Math.PI * 1.04, Math.PI * 1.96); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(W * 0.42, H * 0.22); g.quadraticCurveTo(W * 0.36, H * 0.14, W * 0.42, H * 0.08); g.stroke();
  g.beginPath(); g.moveTo(W * 0.58, H * 0.22); g.quadraticCurveTo(W * 0.52, H * 0.14, W * 0.58, H * 0.08); g.stroke();
}
function glass(g, W, H) {
  g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(W * 0.36, H * 0.24); g.lineTo(W * 0.32, H * 0.78);
  g.lineTo(W * 0.68, H * 0.78); g.lineTo(W * 0.64, H * 0.24);
  g.closePath(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(W * 0.35, H * 0.46); g.lineTo(W * 0.66, H * 0.46); g.stroke();
}
function bean(g, W, H) {
  const cx = W * 0.5, cy = H * 0.48;
  g.save(); g.translate(cx, cy); g.rotate(-0.42);
  g.strokeStyle = '#ffffff'; g.lineWidth = 9;
  g.beginPath(); g.ellipse(0, 0, W * 0.19, H * 0.27, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath();
  g.moveTo(0, -H * 0.2); g.bezierCurveTo(W * 0.1, -H * 0.1, -W * 0.1, H * 0.1, 0, H * 0.2);
  g.stroke(); g.restore();
}
function gear(g, W, H) {
  const cx = W / 2, cy = H / 2, r1 = W * 0.17, r2 = W * 0.22, n = 8;
  g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineJoin = 'round';
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? r2 : r1;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.closePath(); g.stroke();
  g.beginPath(); g.arc(cx, cy, W * 0.055, 0, Math.PI * 2); g.stroke();
}
function arcArrow(g, W, H) {
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.arc(W * 0.72, H * 0.42, W * 0.13, Math.PI * 0.7, Math.PI * 1.9); g.stroke();
  g.beginPath(); g.moveTo(W * 0.86, H * 0.31); g.lineTo(W * 0.88, H * 0.44); g.lineTo(W * 0.76, H * 0.41); g.stroke();
}
function person(g, W, H) {
  g.strokeStyle = '#ffffff'; g.lineWidth = 9;
  g.beginPath(); g.arc(W * 0.34, H * 0.38, W * 0.075, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(W * 0.34, H * 0.78, W * 0.15, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
}
function label(g, W, H, a, b) {
  g.fillStyle = '#f0ede6'; g.textAlign = 'left';
  g.font = '600 50px -apple-system, Helvetica, Arial';
  g.fillText(a, W * 0.5, H * 0.44);
  g.font = '500 40px -apple-system, Helvetica, Arial';
  g.fillStyle = 'rgba(240,237,230,.68)';
  g.fillText(b, W * 0.5, H * 0.78);
}

function iconTexture(name, aspect) {
  const W = 512, H = Math.max(160, Math.round(512 / aspect));
  const [c, g] = cv(W, H);
  // outline
  g.strokeStyle = 'rgba(255,255,255,.16)';
  g.lineWidth = 3;
  const r = Math.min(W, H) * 0.13;
  g.beginPath();
  g.moveTo(12 + r, 12); g.lineTo(W - 12 - r, 12); g.quadraticCurveTo(W - 12, 12, W - 12, 12 + r);
  g.lineTo(W - 12, H - 12 - r); g.quadraticCurveTo(W - 12, H - 12, W - 12 - r, H - 12);
  g.lineTo(12 + r, H - 12); g.quadraticCurveTo(12, H - 12, 12, H - 12 - r);
  g.lineTo(12, 12 + r); g.quadraticCurveTo(12, 12, 12 + r, 12);
  g.stroke();
  (ICONS[name] || ICONS.ok)(g, W, H);
  return tex(c);
}

/* halo ring used to point at the key the current step needs */
function haloTexture(aspect) {
  const W = 320, H = Math.max(110, Math.round(320 / aspect));
  const [c, g] = cv(W, H);
  const pad = 15, rad = Math.min(W, H) * 0.24;
  function rr(x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }
  g.shadowColor = 'rgba(201,139,94,.95)';
  g.shadowBlur = 24;
  g.strokeStyle = 'rgba(226,166,118,.95)';
  g.lineWidth = 10;
  rr(pad, pad, W - pad * 2, H - pad * 2, rad); g.stroke();
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(201,139,94,.4)';
  g.lineWidth = 4;
  rr(pad + 9, pad + 9, W - pad * 2 - 18, H - pad * 2 - 18, rad * 0.8); g.stroke();
  return tex(c);
}

/* ---------------- machine ---------------- */
const machine = new THREE.Group();
machine.position.copy(CENTER).multiplyScalar(-1);
scene.add(machine);

const shellProc = new THREE.Group(); shellProc.name = 'ShellProcedural';
const carafeProc = new THREE.Group(); carafeProc.name = 'CarafeProcedural';
machine.add(shellProc);

/* --- body --- */
const body = mesh(roundedBox(P.W, 0.300, P.D, 0.012, 7), MAT.body, 'Body');
body.position.y = P.BOT + 0.150;
shellProc.add(body);

const base = mesh(roundedBox(P.W + 0.006, 0.014, P.D + 0.004, 0.005, 3), MAT.dark, 'BasePlate');
base.position.y = 0.007;
shellProc.add(base);

/* --- control column --- */
const panelShell = mesh(roundedBox(0.088, 0.178, 0.024, 0.009, 4), MAT.panel, 'PanelShell');
panelShell.position.set(0, P.PZ, P.PANEL_SHELL_Z);
shellProc.add(panelShell);

const panelBack = mesh(roundedBox(0.072, 0.162, 0.010, 0.004, 2), MAT.dark, 'PanelBack');
panelBack.position.set(0, P.PZ, 0.182);
shellProc.add(panelBack);

/* 面板本体与铬边框由 refine.glb 的 Shell_PanelColumn 提供；
   旧程序化版本没有纵向定位（停在机身原点下方），已移除 */

/* --- buttons --- */
const BTN = [
  { id: 'down', u: -0.0215, v: 0.0305, w: 0.0135, h: 0.0105, icon: 'down' },
  { id: 'ok', u: 0.0000, v: 0.0305, w: 0.0170, h: 0.0105, icon: 'ok' },
  { id: 'up', u: 0.0215, v: 0.0305, w: 0.0135, h: 0.0105, icon: 'up' },
  { id: 'rinse', u: -0.0225, v: 0.0105, w: 0.0170, h: 0.0130, icon: 'rinse' },
  { id: 'settings', u: 0.0000, v: 0.0105, w: 0.0170, h: 0.0130, icon: 'settings' },
  { id: 'aroma', u: 0.0225, v: 0.0105, w: 0.0170, h: 0.0130, icon: 'aroma' },
  { id: 'espresso', u: -0.0135, v: -0.0110, w: 0.0240, h: 0.0130, icon: 'espresso' },
  { id: 'coffee', u: 0.0135, v: -0.0110, w: 0.0240, h: 0.0130, icon: 'coffee' },
  { id: 'cappuccino', u: -0.0135, v: -0.0325, w: 0.0240, h: 0.0130, icon: 'cappuccino' },
  { id: 'latte', u: 0.0135, v: -0.0325, w: 0.0240, h: 0.0130, icon: 'latte' },
  { id: 'drink', u: -0.0135, v: -0.0545, w: 0.0245, h: 0.0125, icon: 'drink' },
  { id: 'my', u: 0.0135, v: -0.0545, w: 0.0245, h: 0.0125, icon: 'my' }
];
const buttons = [];
const pickables = [];
const Z_BTN = 0.1897;
BTN.forEach((b) => {
  const a = b.u / P.R;
  const x = P.R * Math.sin(a);
  const z = Z_BTN - P.R * (1 - Math.cos(a));
  const g = new THREE.Group();
  g.position.set(x, P.PZ + b.v, z);
  g.rotation.y = a;
  const inner = new THREE.Group();
  const plateMat = MAT.button.clone();
  const plate = mesh(roundedBox(b.w, b.h, 0.0035, 0.0011, 2), plateMat, 'Btn_' + b.id);
  inner.add(plate);
  const iconMat = new THREE.MeshBasicMaterial({
    map: iconTexture(b.icon, b.w / b.h), transparent: true, depthWrite: false, opacity: 1, toneMapped: false
  });
  const icon = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 0.94, b.h * 0.86), iconMat);
  icon.position.z = 0.0021;
  icon.raycast = () => {};
  inner.add(icon);

  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTexture((b.w * 1.62) / (b.h * 1.9)), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 1.62, b.h * 1.9), haloMat);
  halo.position.z = 0.0026;
  halo.raycast = () => {};
  inner.add(halo);

  g.add(inner);
  shellProc.add(g);
  plate.userData = { action: 'btn', id: b.id };
  pickables.push(plate);
  buttons.push({ id: b.id, group: g, inner, plate, plateMat, iconMat, halo, haloMat, press: 0 });
});

/* LCD */
const lcd = new THREE.Mesh(
  new THREE.PlaneGeometry(0.054, 0.032),
  new THREE.MeshBasicMaterial({ map: lcdTex, toneMapped: false })
);
lcd.position.set(0, 0.272, 0.1882);
lcd.raycast = () => {};
shellProc.add(lcd);

/* status LED */
const led = mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.0024, 16), MAT.led, 'StatusLED');
led.rotation.x = Math.PI / 2;
led.position.set(0.0305, 0.3005, 0.1862);
shellProc.add(led);

/* logo */
const logo = new THREE.Mesh(
  new THREE.PlaneGeometry(0.062, 0.0272),
  new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, depthWrite: false, toneMapped: false })
);
logo.position.set(0.077, 0.272, P.FRONT + 0.0009);
logo.raycast = () => {};
shellProc.add(logo);

/* --- spout --- */
const spout = new THREE.Group();
const spoutHouse = mesh(roundedBox(0.072, 0.040, 0.050, 0.008, 3), MAT.panel, 'SpoutHousing');
spoutHouse.position.set(0, 0.108, 0.189);
spout.add(spoutHouse);
const spoutPlate = mesh(roundedBox(0.062, 0.010, 0.030, 0.004, 2), MAT.chrome, 'SpoutChrome');
spoutPlate.position.set(0, 0.092, 0.196);
spout.add(spoutPlate);
[-1, 1].forEach((sx) => {
  const n = mesh(new THREE.CylinderGeometry(0.0048, 0.0044, 0.024, 20), MAT.chrome, 'Nozzle');
  n.position.set(sx * 0.017, 0.077, 0.196);
  spout.add(n);
});
const hot = mesh(new THREE.CylinderGeometry(0.0040, 0.0040, 0.030, 16), MAT.chrome, 'HotWaterSpout');
hot.rotation.x = 0.22;
hot.position.set(0.056, 0.104, 0.186);
spout.add(hot);
shellProc.add(spout);

/* --- drip tray --- */
const trayGroup = new THREE.Group();
trayGroup.name = 'Tray';
const TRAY_X = 0.034;
const trayBase = mesh(roundedBox(0.166, 0.044, 0.130, 0.006, 3), MAT.trayMat, 'TrayBody');
trayBase.position.set(TRAY_X, 0.036, 0.180);
trayGroup.add(trayBase);
const trayLip = mesh(roundedBox(0.168, 0.030, 0.012, 0.004, 2), MAT.trayMat, 'TrayLip');
trayLip.position.set(TRAY_X, 0.041, 0.243);
trayGroup.add(trayLip);
/* drawer shank: stays inside the machine when the tray is pulled out */
const trayShank = mesh(roundedBox(0.150, 0.030, 0.160, 0.004, 2), MAT.dark, 'TrayShank');
trayShank.position.set(TRAY_X, 0.032, 0.052);
trayGroup.add(trayShank);
const grilleBase = mesh(roundedBox(0.148, 0.005, 0.120, 0.002, 2), MAT.dark, 'TrayGrilleBase');
grilleBase.position.set(TRAY_X, 0.0585, 0.181);
trayGroup.add(grilleBase);
for (let i = 0; i < 6; i++) {
  const s = mesh(roundedBox(0.0055, 0.0035, 0.116, 0.0012, 2), MAT.steel, 'TraySlat' + i);
  s.position.set(TRAY_X - 0.052 + i * 0.021, 0.0618, 0.181);
  trayGroup.add(s);
}
trayBase.userData = { action: 'tray' };
pickables.push(trayBase);
machine.add(trayGroup);

/* --- grounds container (sits behind the drip tray) --- */
const groundsGroup = new THREE.Group();
groundsGroup.name = 'GroundsGroup';
const groundsBody = mesh(roundedBox(0.120, 0.070, 0.092, 0.008, 3), MAT.dark, 'GroundsContainer');
groundsBody.position.set(0, 0.082, 0.035);
groundsBody.userData = { action: 'grounds' };
pickables.push(groundsBody);
groundsGroup.add(groundsBody);
const groundsFill = mesh(roundedBox(0.100, 0.012, 0.070, 0.02, 2), new THREE.MeshStandardMaterial({
  color: 0x241305, roughness: 1, metalness: 0
}), 'GroundsFill');
groundsFill.position.set(0, 0.114, 0.035);
groundsGroup.add(groundsFill);
const groundsHandle = mesh(roundedBox(0.046, 0.007, 0.012, 0.002, 2), MAT.steel, 'GroundsHandle');
groundsHandle.position.set(0, 0.122, 0.077);
groundsGroup.add(groundsHandle);
machine.add(groundsGroup);

/* --- top / hopper --- */
const topStrips = [];
const topPlate = mesh(roundedBox(0.230, 0.0355, 0.067, 0.003, 2), MAT.body, 'TopFront');
topPlate.position.set(0, 0.33175, 0.1275);
shellProc.add(topPlate); topStrips.push(topPlate);
const topBack = mesh(roundedBox(0.230, 0.0355, 0.049, 0.003, 2), MAT.body, 'TopBack');
topBack.position.set(0, 0.33175, -0.1365);
shellProc.add(topBack); topStrips.push(topBack);
[-1, 1].forEach((sx) => {
  const side = mesh(roundedBox(0.017, 0.0355, 0.206, 0.002, 2), MAT.body, 'TopSide');
  side.position.set(sx * 0.1065, 0.33175, 0.009);
  shellProc.add(side); topStrips.push(side);
});

const cavity = new THREE.Group();
const cavMat = MAT.dark;
const cw = 0.176, cd = 0.186;
[[-1, 0], [1, 0]].forEach((v) => {
  const w = mesh(new THREE.BoxGeometry(0.006, 0.034, cd), cavMat, 'CavityWall');
  w.position.set(v[0] * cw / 2, 0.3305, 0.010);
  cavity.add(w);
});
[[0, -1], [0, 1]].forEach((v) => {
  const w = mesh(new THREE.BoxGeometry(cw, 0.034, 0.006), cavMat, 'CavityWall');
  w.position.set(0, 0.3305, 0.010 + v[1] * cd / 2);
  cavity.add(w);
});
const cavFloor = mesh(new THREE.BoxGeometry(cw, 0.006, cd), cavMat, 'CavityFloor');
cavFloor.position.set(0, 0.317, 0.010);
cavity.add(cavFloor);
shellProc.add(cavity);

/* beans */
const beanBed = mesh(roundedBox(0.166, 0.006, 0.176, 0.02, 3), new THREE.MeshStandardMaterial({
  color: 0x0e0702, roughness: 0.9, metalness: 0
}), 'BeanBed');
beanBed.position.set(0, 0.3225, 0.010);
shellProc.add(beanBed);
const beanGeo = new THREE.SphereGeometry(0.0048, 10, 8);
beanGeo.scale(1, 0.72, 0.58);
const beanMesh = new THREE.InstancedMesh(beanGeo, MAT.bean, 160);
{
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  let i = 0;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (; i < 160; i++) {
    v.set((rnd() - 0.5) * 0.156, 0.3265 + rnd() * 0.008, 0.010 + (rnd() - 0.5) * 0.166);
    q.setFromEuler(new THREE.Euler(rnd() * 3.14, rnd() * 3.14, rnd() * 3.14));
    m4.compose(v, q, s);
    beanMesh.setMatrixAt(i, m4);
  }
  beanMesh.castShadow = false;
}
shellProc.add(beanMesh);

/* grinding dial */
const dialBase = mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.010, 28), MAT.dark, 'GrindDialBase');
dialBase.position.set(-0.066, 0.332, -0.046);
shellProc.add(dialBase);
const dial = mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.014, 28), MAT.chrome, 'GrindDial');
dial.position.set(-0.066, 0.341, -0.046);
shellProc.add(dial);
const pointer = mesh(new THREE.BoxGeometry(0.005, 0.004, 0.017), MAT.dark, 'GrindPointer');
pointer.position.set(-0.066, 0.349, -0.056);
shellProc.add(pointer);

/* hopper lid (hinged at rear) */
const lidGroup = new THREE.Group();
lidGroup.position.set(0, 0.350, -0.112);
const lid = mesh(roundedBox(0.204, 0.018, 0.214, 0.006, 4), MAT.body, 'HopperLid');
lid.position.set(0, 0.003, 0.106);
lidGroup.add(lid);
const lidHandle = mesh(roundedBox(0.050, 0.005, 0.012, 0.002, 2), MAT.dark, 'LidHandle');
lidHandle.position.set(0, 0.017, 0.190);
lidGroup.add(lidHandle);
/* vent grille on the lid, per official top-view photo */
const lidVent = mesh(roundedBox(0.060, 0.0022, 0.038, 0.0012, 2), MAT.dark, 'LidVent');
lidVent.position.set(0.050, 0.0122, 0.146);
lidGroup.add(lidVent);
for (let i = 0; i < 4; i++) {
  const slat = mesh(roundedBox(0.048, 0.0016, 0.0034, 0.0008, 1), MAT.steel, 'LidVentSlat');
  slat.position.set(0.050, 0.0136, 0.132 + i * 0.0095);
  lidGroup.add(slat);
}
/* grind-adjust dial inside the hopper */
const grindDial = mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.008, 24), MAT.dark, 'GrindDial');
grindDial.position.set(-0.058, 0.3345, -0.056);
shellProc.add(grindDial);
const grindPointer = mesh(new THREE.BoxGeometry(0.003, 0.002, 0.011), MAT.steel, 'GrindPointer');
grindPointer.position.set(-0.058, 0.3392, -0.046);
shellProc.add(grindPointer);
lid.userData = { action: 'lid' };
pickables.push(lid);
shellProc.add(lidGroup);

/* cup warmer */
const warmer = mesh(roundedBox(0.180, 0.004, 0.078, 0.002, 2), MAT.dark, 'CupWarmer');
warmer.position.set(0, 0.3487, -0.129);
shellProc.add(warmer);
for (let i = 0; i < 3; i++) {
  const rail = mesh(roundedBox(0.170, 0.003, 0.004, 0.0012, 1), MAT.steel, 'WarmerRail');
  rail.position.set(0, 0.3516, -0.150 + i * 0.022);
  shellProc.add(rail);
}

/* --- rear water tank (slides out backwards, lid lifts) --- */
const tankGroup = new THREE.Group();
tankGroup.name = 'TankGroup';
const tankMat = new THREE.MeshPhysicalMaterial({
  color: 0x18242d, metalness: 0.1, roughness: 0.14, transparent: true, opacity: 0.6,
  clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 0.5
});
const tank = mesh(roundedBox(0.206, 0.286, 0.030, 0.006, 3), tankMat, 'WaterTank');
tank.position.set(0, 0.171, P.BACK + 0.002);
tank.castShadow = false;
tank.userData = { action: 'tank' };
pickables.push(tank);
tankGroup.add(tank);
const tankWater = mesh(new THREE.BoxGeometry(0.190, 0.150, 0.016), new THREE.MeshPhysicalMaterial({
  color: 0x2f6f8a, metalness: 0, roughness: 0.12, transparent: true, opacity: 0.55, envMapIntensity: 0.35
}), 'TankWater');
tankWater.position.set(0, 0.126, P.BACK + 0.002);
tankWater.castShadow = false;
tankWater.raycast = () => {};
tankGroup.add(tankWater);
const tankLid = mesh(roundedBox(0.210, 0.008, 0.032, 0.003, 2), MAT.dark, 'WaterTankLid');
tankLid.position.set(0, 0.347, P.BACK + 0.002);
tankGroup.add(tankLid);
const tankSeam = mesh(new THREE.BoxGeometry(0.208, 0.284, 0.002), MAT.dark, 'TankSeam');
tankSeam.position.set(0, 0.171, P.BACK + 0.018);
tankGroup.add(tankSeam);
shellProc.add(tankGroup);

/* rear power */
const pwr = mesh(new THREE.BoxGeometry(0.026, 0.020, 0.008), MAT.dark, 'PowerSwitch');
pwr.position.set(0.070, 0.058, P.BACK - 0.002);
shellProc.add(pwr);

/* door seams */
[-1, 1].forEach((s) => {
  const seam = mesh(new THREE.BoxGeometry(0.0025, 0.235, 0.003), MAT.panel, 'DoorSeam');
  seam.position.set(s * 0.0555, 0.185, P.FRONT + 0.0012);
  shellProc.add(seam);
});

/* --- milk carafe (procedural placeholder, refined by Blender） --- */
const carafeGroup = new THREE.Group();
carafeGroup.name = 'CarafeGroup';
carafeGroup.position.set(-0.086, 0.014, 0.172);
carafeProc.position.set(0, 0, 0);
shellProc.add(carafeProc);
carafeProc.add(carafeGroup);

const cGlass = mesh(roundedBox(0.078, 0.148, 0.082, 0.008, 4), MAT.glass, 'CarafeGlass');
cGlass.position.set(0, 0.074, 0);
cGlass.castShadow = false;
cGlass.userData = { action: 'carafe' };
carafeGroup.add(cGlass);
pickables.push(cGlass);

const cMilk = mesh(roundedBox(0.054, 0.052, 0.054, 0.010, 3), MAT.milk, 'CarafeMilk');
cMilk.position.set(0, 0.032, 0);
carafeGroup.add(cMilk);

const cLid = mesh(roundedBox(0.082, 0.022, 0.086, 0.006, 3), MAT.dark, 'CarafeLid');
cLid.position.set(0, 0.159, 0);
carafeGroup.add(cLid);
const cTop = mesh(roundedBox(0.066, 0.009, 0.070, 0.003, 2), MAT.panel, 'CarafeTop');
cTop.position.set(0, 0.1745, 0);
carafeGroup.add(cTop);
const cDial = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.011, 28), MAT.chrome, 'CarafeDial');
cDial.position.set(0, 0.1845, 0);
carafeGroup.add(cDial);
const cPtr = mesh(new THREE.BoxGeometry(0.005, 0.004, 0.016), MAT.dark, 'CarafePointer');
cPtr.position.set(0, 0.1905, -0.0075);
carafeGroup.add(cPtr);

/* curved handle */
const handleCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.039, 0.143, 0.000),
  new THREE.Vector3(-0.058, 0.131, 0.000),
  new THREE.Vector3(-0.064, 0.093, 0.000),
  new THREE.Vector3(-0.060, 0.057, 0.000),
  new THREE.Vector3(-0.040, 0.044, 0.000)
]);
const handle = mesh(new THREE.TubeGeometry(handleCurve, 40, 0.0056, 10, false), MAT.dark, 'CarafeHandle');
carafeGroup.add(handle);

/* fixed milk connector + tube on machine */
const connector = mesh(roundedBox(0.030, 0.046, 0.040, 0.006, 3), MAT.dark, 'MilkConnector');
connector.position.set(-0.126, 0.178, 0.176);
shellProc.add(connector);
const milkTube = cylinderBetween(
  new THREE.Vector3(-0.126, 0.184, 0.182),
  new THREE.Vector3(-0.108, 0.192, 0.192),
  0.0058, MAT.dark
);
shellProc.add(milkTube);

/* --- cup --- */
const cupGroup = new THREE.Group();
const cupBody = mesh(new THREE.CylinderGeometry(0.030, 0.024, 0.052, 40, 1, true), MAT.ceramic, 'Cup');
cupBody.position.y = 0.026;
cupGroup.add(cupBody);
const cupBottom = mesh(new THREE.CircleGeometry(0.024, 32), MAT.ceramic, 'CupBottom');
cupBottom.rotation.x = -Math.PI / 2;
cupBottom.position.y = 0.001;
cupGroup.add(cupBottom);
const coffee = mesh(new THREE.CircleGeometry(0.0282, 32), MAT.coffee, 'Coffee');
coffee.rotation.x = -Math.PI / 2;
coffee.position.y = 0.047;
cupGroup.add(coffee);
const cupHandle = mesh(new THREE.TorusGeometry(0.014, 0.0035, 10, 24, Math.PI * 1.35), MAT.ceramic, 'CupHandle');
cupHandle.position.set(0.030, 0.028, 0);
cupHandle.rotation.y = Math.PI / 2;
cupHandle.rotation.z = -0.4;
cupGroup.add(cupHandle);
cupGroup.position.set(0, 0.063, 0.198);
machine.add(cupGroup);

/* --- studio floor (shadow only) --- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.ShadowMaterial({ opacity: 0.38 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.174;
floor.receiveShadow = true;
scene.add(floor);

/* ---------------- camera rig (trackball + view cube) ---------------- */
const BOX_W = 0.26, BOX_H = 0.37, BOX_D = 0.56;
const AX_X = new THREE.Vector3(1, 0, 0);
const AX_Y = new THREE.Vector3(0, 1, 0);
const AX_Z = new THREE.Vector3(0, 0, 1);
const targetQ = new THREE.Quaternion();
const curQ = new THREE.Quaternion();
let baseDist = 1;
let zoomFactor = 1;
let targetZoom = 1;
let manualView = false;   // 用户手动调过视角后，切步骤只做收敛式微调
const homeDir = new THREE.Vector3(0.52, 0.30, 1).normalize();

// 由“相机所在方向”构造正立朝向：与药盒项目一致，屏幕内滚转一并归零
function quatFromDir(dir, out) {
  const z = dir.clone().normalize();
  const x = new THREE.Vector3().crossVectors(AX_Y, z);
  if (x.lengthSq() < 1e-6) x.set(1, 0, 0);   // 正上/正下方：取一个稳定横轴
  x.normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  return (out || new THREE.Quaternion())
    .setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

function poseCam(cam, dist, q, roll) {
  cam.position.copy(AX_Z).applyQuaternion(q).multiplyScalar(dist);
  cam.quaternion.copy(q);
  if (roll) cam.rotateZ(roll);   // 仅取景探测时用于模拟 +/-90° 屏幕内旋转
}

function applyView(immediate) {
  const q = immediate ? targetQ : curQ;
  const dist = baseDist * (immediate ? targetZoom : zoomFactor);
  poseCam(camera, dist, q, 0);
}

const probeCam = new THREE.PerspectiveCamera(camera.fov, 1, 0.01, 100);
const boxCorners = [];
for (let i = 0; i < 8; i++) {
  boxCorners.push(new THREE.Vector3(
    (i & 1 ? 1 : -1) * BOX_W / 2,
    (i & 2 ? 1 : -1) * BOX_H / 2,
    (i & 4 ? 1 : -1) * BOX_D / 2
  ));
}

// 依据真实投影迭代取景距离：任意朝向、任意屏幕内旋转都能完整容纳盒体
function fitDistance(q, roll) {
  const vFov = camera.fov * Math.PI / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  let d = Math.max(
    (BOX_H / 2) / Math.tan(vFov / 2),
    Math.sqrt(BOX_W * BOX_W / 4 + BOX_D * BOX_D / 4) / Math.tan(hFov / 2)
  ) * 1.1;

  probeCam.fov = camera.fov;
  probeCam.aspect = camera.aspect;
  probeCam.updateProjectionMatrix();

  for (let k = 0; k < 4; k++) {
    poseCam(probeCam, d, q, roll);
    probeCam.updateMatrixWorld();
    let m = 0;
    for (let j = 0; j < 8; j++) {
      const p = boxCorners[j].clone().project(probeCam);
      m = Math.max(m, Math.abs(p.x), Math.abs(p.y));
    }
    if (m < 0.001) break;
    d *= m / 0.84;
  }
  return d;
}

// 取景距离同时兼顾正立与屏幕内旋转 90°，转 90° 时不会推近拉远、也不会被裁切
function fitDistanceAny() {
  return Math.max(fitDistance(targetQ, 0), fitDistance(targetQ, Math.PI / 2));
}

targetQ.copy(quatFromDir(homeDir));
curQ.copy(targetQ);
baseDist = fitDistanceAny();
applyView(true);

/* drag */
const dom = renderer.domElement;
let dragging = false, moved = 0, lastX = 0, lastY = 0;
dom.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  dragging = true; moved = 0;
  lastX = e.clientX; lastY = e.clientY;
  dom.setPointerCapture(e.pointerId);
  dom.classList.add('dragging');
});
dom.addEventListener('pointermove', (e) => {
  if (!dragging) { hover(e); return; }
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  moved += Math.abs(dx) + Math.abs(dy);
  if (moved > 6) manualView = true;   // 只有真正的拖动才算“手动调过机位”
  orbitBy(dx, dy);
});
dom.addEventListener('pointerup', (e) => {
  if (!dragging) return;
  dragging = false;
  dom.classList.remove('dragging');
  if (moved < 6) pick(e);
});
dom.addEventListener('pointercancel', () => { dragging = false; dom.classList.remove('dragging'); });
dom.addEventListener('wheel', (e) => {
  e.preventDefault();
  targetZoom = Math.min(2.4, Math.max(0.42, targetZoom * (1 + e.deltaY * 0.0012)));
}, { passive: false });

// 轨迹球：拖拽增量取负 = 盒子跟手；滚转已并入 targetQ，任意朝向下轴向都不会错
const _axisRight = new THREE.Vector3();
const _axisUp = new THREE.Vector3();
const _qStep = new THREE.Quaternion();
function orbitBy(dx, dy) {
  _axisRight.copy(AX_X).applyQuaternion(targetQ);
  _axisUp.copy(AX_Y).applyQuaternion(targetQ);
  targetQ.premultiply(_qStep.setFromAxisAngle(_axisUp, -dx * 0.0072));
  targetQ.premultiply(_qStep.setFromAxisAngle(_axisRight, -dy * 0.0062));
  targetQ.normalize();
}

/* raycast */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function hitAt(e) {
  const r = dom.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  return hits.length ? hits[0].object : null;
}
function hover(e) {
  const o = hitAt(e);
  const a = o && o.userData ? o.userData.action : null;
  dom.style.cursor = a ? 'pointer' : 'grab';
  if (a === 'btn') showTip('btn:' + o.userData.id, BTN_INFO[o.userData.id], e.clientX, e.clientY);
  else if (a && PART_INFO[a]) showTip('part:' + a, PART_INFO[a], e.clientX, e.clientY);
  else hideTip();
}
function pick(e) {
  const o = hitAt(e);
  if (!o || !o.userData || !o.userData.action) { hideTip(); return; }
  const a = o.userData.action;
  const touch = e.pointerType === 'touch' || e.pointerType === 'pen';
  if (a === 'btn') {
    if (touch) {
      const key = 'btn:' + o.userData.id;
      if (tipFor === key) { hideTip(); return; }
      showTipAtButton(key, BTN_INFO[o.userData.id], o.userData.id, true);
      return;
    }
    hideTip();
    pressButton(o.userData.id);
  } else if (a === 'lid' || a === 'carafe' || a === 'tray' || a === 'tank' || a === 'grounds') {
    hideTip();
    togglePart(a);
    if (touch) showTipAtObject('part:' + a, PART_INFO[a], o);
  }
}

/* ---------------- tooltip ---------------- */
const tipEl = document.getElementById('tip');
const tipName = document.getElementById('tipName');
const tipDesc = document.getElementById('tipDesc');
const tipActEl = document.getElementById('tipAct');
let tipFor = null;
let tipBtnId = null;

function showTip(key, info, x, y, touch) {
  if (!info) { hideTip(); return; }
  if (tipFor !== key) {
    tipName.textContent = info[0];
    tipDesc.textContent = info[1];
  }
  tipFor = key;
  tipEl.classList.toggle('touch', !!touch);
  if (!touch) tipBtnId = null;
  tipEl.classList.add('on');
  tipEl.setAttribute('aria-hidden', 'false');
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let left = x + 16;
  let top = y - h - 14;
  if (left + w > window.innerWidth - 10) left = x - w - 16;
  if (left < 10) left = 10;
  if (top < 10) top = y + 20;
  if (top + h > window.innerHeight - 10) top = window.innerHeight - 10 - h;
  tipEl.style.left = Math.round(left) + 'px';
  tipEl.style.top = Math.round(top) + 'px';
}
function showTipAtButton(key, info, id, touch) {
  const b = buttons.find((x) => x.id === id);
  if (!b) { showTip(key, info, window.innerWidth / 2, window.innerHeight / 2, touch); return; }
  const v = new THREE.Vector3(0, 0, 0);
  b.group.updateWorldMatrix(true, false);
  b.group.localToWorld(v);
  v.project(camera);
  const x = (v.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
  tipBtnId = touch ? id : null;
  showTip(key, info, x, y - 30, touch);
}
function showTipAtObject(key, info, obj) {
  const v = new THREE.Vector3();
  obj.getWorldPosition(v);
  v.project(camera);
  const x = (v.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
  showTip(key, info, x, y - 10, false);
}
function hideTip() {
  if (!tipFor) return;
  tipFor = null;
  tipBtnId = null;
  tipEl.classList.remove('on');
  tipEl.classList.remove('touch');
  tipEl.setAttribute('aria-hidden', 'true');
}
tipActEl.addEventListener('click', (e) => {
  e.stopPropagation();
  const id = tipBtnId;
  hideTip();
  if (id) pressButton(id);
});

/* zoom smoothing */
const clock = new THREE.Clock();

/* ---------------- button behaviour ---------------- */
const BTN_INFO = {
  down: ['▼ 向下', '向下浏览饮品或设置项，逐项切换。'],
  up: ['▲ 向上', '向上浏览饮品或设置项，返回上一项。'],
  ok: ['OK', '确认当前选择，或确认提示后返回主界面。'],
  rinse: ['RINSE / ESC', '冲洗内部回路；在菜单里等于返回上一级。'],
  settings: ['SETTINGS', '进入设置：水硬度、温度、自动关机、除垢。'],
  aroma: ['AROMA', '调整咖啡浓度，共五档，数字越大越浓。'],
  espresso: ['ESPRESSO', '出一杯约 40 ml 的意式浓缩。'],
  coffee: ['COFFEE', '出一杯约 180 ml 的咖啡。'],
  cappuccino: ['CAPPUCCINO', '自动完成咖啡加奶泡，需要先装奶壶。'],
  latte: ['LATTE MACCHIATO', '先出奶再出咖啡，需要先装奶壶。'],
  drink: ['DRINK MENU', '打开全部饮品列表，用上下键选择。'],
  my: ['MY MENU', '调用你保存的自定义配方。']
};
const PART_INFO = {
  lid: ['豆仓盖', '掀开加咖啡豆，盖上后机器才允许磨豆。'],
  carafe: ['LatteCrema 奶壶', '挂到左侧奶路接头，负责打发牛奶。'],
  tray: ['滴水盘', '接住滴水和残渣，可整盘抽出清洗。'],
  tank: ['水箱', '在机身后侧，抽出后加清水至 MAX 线。'],
  grounds: ['豆渣盒', '藏在滴水盘后方，抽出倒渣后机器才复位提示。']
};
let ledFlash = 1.2;

/* ---------------- inline feedback ---------------- */
const feedEl = document.getElementById('stepFeed');
let feedTimer = 0;
function setFeed(text, warn) {
  feedEl.textContent = text;
  feedEl.classList.toggle('warn', !!warn);
  feedEl.classList.add('on');
  clearTimeout(feedTimer);
  feedTimer = setTimeout(() => feedEl.classList.remove('on'), 4200);
}
function clearFeed() {
  clearTimeout(feedTimer);
  feedEl.classList.remove('on');
}
function keyName(id) { return BTN_INFO[id] ? BTN_INFO[id][0] : id; }
function recoveryHint(id) {
  if (UI.mode === 'list' || UI.mode === 'strength' || UI.mode === 'setting') return '先按 RINSE 返回，再按 ' + keyName(id);
  if (UI.mode === 'alert') return '先按 OK 确认提示，再按 ' + keyName(id);
  if (UI.mode === 'brew' || UI.mode === 'rinse') return '等屏幕提示完成后再按 ' + keyName(id);
  return '这一步要按 ' + keyName(id);
}
function afterTaskDone(name) {
  const s = STEPS[stepIdx];
  const tail = UI.msg ? ' · ' + UI.msg : '';
  if (taskDone.every(Boolean)) setFeed('✓ ' + name + tail + ' · 本步完成', false);
  else setFeed('✓ ' + name + tail + ' · 下一步：' + s.tasks[taskIdx].label, false);
}

function pressButton(id) {
  const b = buttons.find((x) => x.id === id);
  if (!b) return;
  b.press = 1;
  ledFlash = 1;
  const t = STEPS[stepIdx].tasks[taskIdx];
  onKey(id);
  // 出杯键只有真的进入冲泡状态才算完成，报警/菜单里按下不算
  const brewed = id === 'espresso' || id === 'coffee' || id === 'cappuccino' || id === 'latte';
  const done = (brewed && UI.mode !== 'brew') ? false : completeTask('btn', id);
  if (done) afterTaskDone(keyName(id));
  else if (t && t.k === 'btn' && t.id !== id) {
    setFeed(recoveryHint(t.id) + '，高亮的就是它。', true);
  } else if (t && t.k === 'btn' && t.id === id) {
    setFeed(recoveryHint(id) + '。', true);
  }
}

/* ---------------- parts ---------------- */
const parts = {
  lid: { v: 0, t: 0 },
  carafe: { v: 0, t: 0 },
  tray: { v: 0, t: 0 },
  tank: { v: 0, t: 0 },
  grounds: { v: 0, t: 0 }
};
const PART_KEYS = ['lid', 'carafe', 'tray', 'grounds', 'tank'];
const chipEls = {
  lid: document.getElementById('chipLid'),
  carafe: document.getElementById('chipCarafe'),
  tray: document.getElementById('chipTray'),
  grounds: document.getElementById('chipGrounds'),
  tank: document.getElementById('chipTank')
};
function togglePart(k) {
  parts[k].t = parts[k].t > 0.5 ? 0 : 1;
  const on = parts[k].t > 0.5;
  chipEls[k].classList.toggle('on', on);
  if (k === 'carafe') setMsg(on ? 'MILK CARAFE READY' : 'MILK CARAFE REMOVED', 2400, !on);
  if (k === 'lid') setMsg(on ? 'ADD COFFEE BEANS' : 'BEANS OK', 2200, false);
  if (k === 'tray') setMsg(on ? 'DRIP TRAY OUT' : 'DRIP TRAY IN', 2000, false);
  if (k === 'tank') setMsg(on ? 'FILL WATER TANK · MAX' : 'WATER OK · READY', 2800, on);
  if (k === 'grounds') setMsg(on ? 'EMPTY GROUNDS CONTAINER' : 'GROUNDS RESET · READY', 2800, on);
  const t = STEPS[stepIdx].tasks[taskIdx];
  const done = completeTask('part', k, on ? 1 : 0);
  if (done) afterTaskDone(t.label);
  else if (t && t.k === 'part') {
    if (t.id !== k) setFeed('这一步先「' + t.label + '」', true);
    else setFeed('继续：' + t.label + (t.to === 0 ? '（装回）' : '（抽出）'), true);
  }
}
function setPart(k, on) {
  parts[k].t = on ? 1 : 0;
  chipEls[k].classList.toggle('on', !!on);
}
PART_KEYS.forEach((k) => {
  chipEls[k].addEventListener('click', () => togglePart(k));
});

/* ---------------- steps ---------------- */
const STEPS = [
  {
    t: '开机准备', s: '放杯 · 开机',
    d: '把杯子放到出水口下方，按 OK 键开机；屏幕出现 SELECT BEVERAGE 即可使用。',
    n: '首次使用或久置后，先按 RINSE 冲洗回路。',
    dir: [0.36, 0.28, 1], zoom: 1.0,
    setup: () => { setPart('lid', false); setPart('carafe', false); setPart('tray', false); setPart('tank', false); setPart('grounds', false); },
    mark: [0.0, 0.356, 0.055],
    tasks: [{ k: 'btn', id: 'ok', label: '按 OK 键开机' }]
  },
  {
    t: '加清水', s: '日常维护 · 加水',
    d: '水箱在机身后侧：抽出水箱、取下水箱盖，加清水到 MAX 线后装回并推到底。',
    n: '只加清水，不要超过 MAX 线；水箱没推到底时屏幕会一直提示加水。',
    dir: [0.52, 0.42, -1], zoom: 1.62,
    setup: () => { setPart('lid', false); setPart('carafe', false); setPart('tray', false); setPart('tank', false); setPart('grounds', false); },
    mark: [0.0, 0.24, -0.235],
    tasks: [
      { k: 'part', id: 'tank', to: 1, label: '抽出水箱，加水至 MAX', mark: [0.0, 0.24, -0.235] },
      { k: 'part', id: 'tank', to: 0, label: '装回水箱，向上推到底', mark: [0.0, 0.24, -0.20] }
    ]
  },
  {
    t: '研磨咖啡豆', s: '开盖 · 选浓度',
    d: '掀开顶部豆仓盖确认有豆，再按 AROMA 键选择 1–5 档浓度。',
    n: '研磨度旋钮只在磨豆运行时微调，停机时不要硬转。',
    dir: [0.36, 0.74, 0.85], zoom: 0.98,
    setup: () => { setPart('lid', false); setPart('carafe', false); setPart('tray', false); setPart('tank', false); setPart('grounds', false); },
    mark: [-0.066, 0.352, -0.046],
    tasks: [
      { k: 'part', id: 'lid', to: 1, label: '掀开顶部豆仓盖', mark: [0.0, 0.372, 0.070] },
      { k: 'btn', id: 'aroma', label: '按 AROMA 键选浓度' }
    ]
  },
  {
    t: '萃取咖啡', s: '选饮品 · 一键出杯',
    d: '按 ESPRESSO 键出浓缩，按 COFFEE 键出大杯；出液口高度可调以适配杯高。',
    n: '出液过程中不要抽出滴水盘；渣盒满时屏幕会提示。',
    dir: [0.16, 0.16, 1], zoom: 0.92,
    setup: () => { setPart('lid', false); setPart('carafe', false); setPart('tray', false); setPart('tank', false); setPart('grounds', false); },
    mark: [0.0, 0.10, 0.21],
    tasks: [{ k: 'btn', id: 'espresso', label: '按 ESPRESSO 键出杯' }]
  },
  {
    t: '打奶泡', s: '装奶壶 · 选奶咖',
    d: '把 LatteCrema 奶壶挂到左侧接头，再按 CAPPUCCINO 键一键完成。',
    n: '牛奶不要超过 MAX 线；用完后把旋钮转到 CLEAN 并立即清洗奶路。',
    dir: [0.46, 0.26, 1], zoom: 0.96,
    setup: () => { setPart('lid', false); setPart('carafe', false); setPart('tray', false); setPart('tank', false); setPart('grounds', false); },
    mark: [-0.086, 0.175, 0.172],
    tasks: [
      { k: 'part', id: 'carafe', to: 1, label: '把奶壶挂到左侧接头', mark: [-0.086, 0.175, 0.172] },
      { k: 'btn', id: 'cappuccino', label: '按 CAPPUCCINO 键' }
    ]
  },
  {
    t: '清洗与除垢', s: '冲洗 · 除垢',
    d: '按 RINSE 键冲洗回路；屏幕出现除垢提示时进 SETTINGS 执行。',
    n: '除垢剂用德龙原厂或同等产品；除垢后必须用清水完整冲洗一遍。',
    dir: [0.34, 0.22, 1], zoom: 0.94,
    setup: () => { setPart('lid', false); setPart('carafe', false); setPart('tray', false); setPart('tank', false); setPart('grounds', false); },
    mark: [0.0, 0.062, 0.225],
    tasks: [{ k: 'btn', id: 'rinse', label: '按 RINSE 键冲洗' }]
  },
  {
    t: '取出豆渣盒', s: '日常维护 · 清渣',
    d: '先抽出滴水盘，豆渣盒就在它后方；取出倒渣、装回，再把滴水盘推到底。',
    n: '倒空豆渣盒后机器才复位“渣盒满”提示；托盘要推到底。',
    dir: [0.34, 0.26, 1], zoom: 1.14, hideCup: true,
    setup: () => { setPart('lid', false); setPart('carafe', false); setPart('tray', false); setPart('tank', false); setPart('grounds', false); },
    mark: [0.034, 0.075, 0.235],
    tasks: [
      { k: 'part', id: 'tray', to: 1, label: '抽出滴水盘', mark: [0.034, 0.08, 0.235] },
      { k: 'part', id: 'grounds', to: 1, label: '取出豆渣盒并倒渣', mark: [0.0, 0.12, 0.10] },
      { k: 'part', id: 'grounds', to: 0, label: '装回豆渣盒', mark: [0.0, 0.12, 0.10] },
      { k: 'part', id: 'tray', to: 0, label: '把滴水盘推回到底', mark: [0.034, 0.08, 0.235] }
    ]
  }
];
let stepIdx = 0;
let taskIdx = 0;
let taskDone = [];
let targetBtn = null;
let markerPart = null;
const stepsEl = document.getElementById('steps');
STEPS.forEach((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'step';
  b.innerHTML = '<span class="n">' + String(i + 1).padStart(2, '0') + '</span><span>' + s.t + '</span><em>' + s.s + '</em>';
  b.addEventListener('click', () => gotoStep(i));
  stepsEl.appendChild(b);
});

/* 窗口偏矮时步骤列表会在左栏内滚动，给一个淡出提示表示还有内容 */
const syncStepsFade = () => stepsEl.classList.toggle('more', stepsEl.scrollHeight > stepsEl.clientHeight + 2);
window.addEventListener('resize', syncStepsFade);
syncStepsFade();

const elIdx = document.getElementById('stepIdx');
const elTotal = document.getElementById('stepTotal');
const elTitle = document.getElementById('stepTitle');
const elDesc = document.getElementById('stepDesc');
const elNote = document.getElementById('stepNote');
const tasksEl = document.getElementById('tasks');
elTotal.textContent = String(STEPS.length).padStart(2, '0');

function renderTasks() {
  const s = STEPS[stepIdx];
  let html = '';
  s.tasks.forEach((t, i) => {
    const done = taskDone[i];
    const cur = !done && i === taskIdx;
    html += '<div class="task' + (done ? ' done' : cur ? ' on' : '') + (i === justIdx ? ' just' : '') + '">' +
      '<i class="tk">' + (done ? '✓' : String(i + 1)) + '</i>' +
      '<span class="tx">' + t.label + '</span>' +
      (cur ? '<b class="tb">现在</b>' : '') + '</div>';
  });
  if (taskDone.length && taskDone.every(Boolean)) {
    if (stepIdx < STEPS.length - 1) {
      html += '<button class="task-next" type="button" data-next="' + (stepIdx + 1) + '">下一步 · ' + STEPS[stepIdx + 1].t + ' →</button>';
    } else {
      html += '<div class="task-all">全部步骤已完成</div>';
    }
  }
  tasksEl.innerHTML = html;
  syncStepsFade();
}

/* point at exactly one object: the key the current task needs, or the part */
function applyHighlight() {
  const s = STEPS[stepIdx];
  const t = s.tasks[taskIdx];
  targetBtn = t && t.k === 'btn' ? t.id : null;
  const part = t && t.k === 'part' ? t : null;
  markerPart = part ? part.id : null;
  marker.visible = !!part;
  if (part) marker.position.fromArray(part.mark || s.mark);
  PART_KEYS.forEach((k) => {
    chipEls[k].classList.toggle('target', !!part && part.id === k);
  });
}

let justIdx = -1;
let justTimer = 0;
function completeTask(kind, id, state) {
  const s = STEPS[stepIdx];
  const t = s.tasks[taskIdx];
  if (!t || t.k !== kind || t.id !== id) return false;
  if (kind === 'part') {
    const want = t.to === undefined ? 1 : t.to;
    if (state !== want) return false;
  }
  taskDone[taskIdx] = true;
  justIdx = taskIdx;
  taskIdx += 1;
  renderTasks();
  applyHighlight();
  clearTimeout(justTimer);
  justTimer = setTimeout(() => { justIdx = -1; renderTasks(); }, 1100);
  return true;
}
tasksEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.task-next');
  if (btn) gotoStep(Number(btn.dataset.next));
});

const markerTex = (() => {
  const [c, g] = cv(256, 256);
  g.strokeStyle = 'rgba(201,139,94,.95)'; g.lineWidth = 7;
  g.beginPath(); g.arc(128, 128, 88, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(201,139,94,.5)'; g.lineWidth = 3;
  g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(201,139,94,.95)';
  g.beginPath(); g.arc(128, 128, 8, 0, Math.PI * 2); g.fill();
  return tex(c);
})();
const marker = new THREE.Sprite(new THREE.SpriteMaterial({
  map: markerTex, transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.AdditiveBlending, opacity: 0.9
}));
marker.renderOrder = 20;
marker.scale.set(0.055, 0.055, 1);
marker.visible = false;
machine.add(marker);

function gotoStep(i) {
  stepIdx = i;
  const s = STEPS[i];
  clearFeed();
  justIdx = -1;
  clearTimeout(justTimer);
  [...stepsEl.children].forEach((el, k) => {
    el.classList.toggle('on', k === i);
    el.classList.toggle('done', k < i);
  });
  elIdx.textContent = String(i + 1).padStart(2, '0');
  elTitle.textContent = s.t;
  elDesc.textContent = s.d;
  elNote.textContent = s.n;
  // 切步骤只调朝向：距离与缩放完全不动；手动调过视角后不再自动转向，避免把手动机位拉走
  if (!manualView) {
    targetQ.copy(quatFromDir(new THREE.Vector3(s.dir[0], s.dir[1], s.dir[2])));
  }
  hideTip();
  s.setup();
  cupGroup.visible = !s.hideCup;
  taskIdx = 0;
  taskDone = s.tasks.map(() => false);
  renderTasks();
  applyHighlight();
  UI.mode = 'home';
  UI.msg = '';
  UI.brew = null;
  renderScreen();
}
gotoStep(0);

/* ---------------- view cube ---------------- */
const vcCanvas = document.getElementById('vc-canvas');
const vcRenderer = new THREE.WebGLRenderer({ canvas: vcCanvas, antialias: true, alpha: true });
vcRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
vcRenderer.outputEncoding = THREE.sRGBEncoding;
const vcScene = new THREE.Scene();
const VC_DIST = 3.3;
const vcCam = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
vcCam.position.set(0, 0, VC_DIST);
vcCam.lookAt(0, 0, 0);
const vcGroup = new THREE.Group();
vcScene.add(vcGroup);
vcScene.add(new THREE.HemisphereLight(0xffffff, 0x333344, 1.8));
const vcKey = new THREE.DirectionalLight(0xffffff, 1.4);
vcKey.position.set(1.4, 2, 2.4);
vcScene.add(vcKey);

function faceTexture(label) {
  const [c, g] = cv(160, 160);
  g.fillStyle = 'rgba(28,30,36,.94)'; g.fillRect(0, 0, 160, 160);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 6; g.strokeRect(3, 3, 154, 154);
  g.fillStyle = 'rgba(240,236,229,.9)';
  g.font = '500 46px -apple-system, "PingFang SC", Helvetica, Arial';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, 80, 84);
  return tex(c);
}
const VC_LABELS = { px: '右', nx: '左', py: '顶', ny: '底', pz: '前', nz: '后' };
const faceMats = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map((k) => new THREE.MeshBasicMaterial({
  map: faceTexture(VC_LABELS[k]), transparent: false
}));
const vcCube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), faceMats);
vcCube.visible = true;
vcGroup.add(vcCube);
const vcEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0xc98b5e, transparent: true, opacity: 0.45 })
);
vcGroup.add(vcEdges);

/* invisible corner / edge proxies */
const proxies = [];
const proxyMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
function addProxy(pos, dir) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), proxyMat);
  p.position.copy(pos);
  p.userData.dir = dir.clone().normalize();
  vcGroup.add(p);
  proxies.push(p);
}
for (let sx = -1; sx <= 1; sx += 2)
  for (let sy = -1; sy <= 1; sy += 2)
    for (let sz = -1; sz <= 1; sz += 2)
      addProxy(new THREE.Vector3(sx * 0.5, sy * 0.5, sz * 0.5), new THREE.Vector3(sx, sy, sz));
const EDGE_DIRS = [
  [1, 1, 0], [1, -1, 0], [1, 0, 1], [1, 0, -1],
  [-1, 1, 0], [-1, -1, 0], [-1, 0, 1], [-1, 0, -1],
  [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1]
];
EDGE_DIRS.forEach((d) => {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), proxyMat);
  p.position.set(d[0] * 0.5, d[1] * 0.5, d[2] * 0.5);
  p.userData.dir = new THREE.Vector3(d[0], d[1], d[2]).normalize();
  vcGroup.add(p);
  proxies.push(p);
});

const VC_SIZE = 112;
function resizeVC() {
  const el = document.getElementById('viewcube');
  const s = Math.max(64, el.clientWidth);
  vcRenderer.setSize(s, s, false);
  vcCam.aspect = 1;
  vcCam.updateProjectionMatrix();
}
resizeVC();

const FACE_DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const vcRay = new THREE.Raycaster();
const vcNDC = new THREE.Vector2();
const vcTargets = proxies.concat([vcCube]);

// 命中面/棱/角；射线没命中时按屏幕距离吸附最近的棱/角，触控下更好点
function vcPick(e) {
  const r = vcCanvas.getBoundingClientRect();
  if (!r.width) return null;
  vcNDC.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1
  );
  vcRay.setFromCamera(vcNDC, vcCam);
  const hits = vcRay.intersectObjects(vcTargets, false);
  if (hits.length) {
    const o = hits[0].object;
    if (o === vcCube) {
      if (hits[0].faceIndex == null) return null;
      return new THREE.Vector3().fromArray(FACE_DIRS[Math.floor(hits[0].faceIndex / 2)]);
    }
    return o.userData.dir.clone();
  }

  const px = e.clientX - r.left, py = e.clientY - r.top;
  const tol = Math.max(11, r.width * 0.1);
  const camDir = vcCam.position.clone().normalize();
  let best = null, bestD = tol;
  const v = new THREE.Vector3();
  for (let i = 0; i < proxies.length; i++) {
    const o = proxies[i];
    if (o.userData.dir.dot(camDir) <= 0) continue;   // 只吸附朝向镜头的一侧
    v.copy(o.position).project(vcCam);
    const sd = Math.hypot(
      (v.x * 0.5 + 0.5) * r.width - px,
      (-v.y * 0.5 + 0.5) * r.height - py
    );
    if (sd < bestD) { bestD = sd; best = o; }
  }
  return best ? best.userData.dir.clone() : null;
}

// 点击面/棱/角：朝向正立，屏幕滚转一并归零
function vcGoTo(dir) {
  manualView = true;
  quatFromDir(dir, targetQ);
}

// 立方体自身可拨动：按住拖动＝转视角；没移动的点击＝切到对应视角
let vcDown = null;
const VC_DRAG_MIN = 4;

vcCanvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  vcCanvas.setPointerCapture(e.pointerId);
  vcDown = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, id: e.pointerId, moved: false };
});

vcCanvas.addEventListener('pointermove', (e) => {
  if (vcDown && vcDown.id === e.pointerId) {
    if (!vcDown.moved && Math.hypot(e.clientX - vcDown.x, e.clientY - vcDown.y) > VC_DRAG_MIN) {
      vcDown.moved = true;                 // 超过阈值即视为拖动
      vcCanvas.style.cursor = 'grabbing';
    }
    if (vcDown.moved) { manualView = true; orbitBy(e.clientX - vcDown.lx, e.clientY - vcDown.ly); }
    vcDown.lx = e.clientX; vcDown.ly = e.clientY;
    return;
  }
  vcCanvas.style.cursor = vcPick(e) ? 'pointer' : 'default';
});

vcCanvas.addEventListener('pointerleave', () => {
  if (!vcDown) vcCanvas.style.cursor = 'default';
});

vcCanvas.addEventListener('pointerup', (e) => {
  if (!vcDown || vcDown.id !== e.pointerId) return;
  const wasMoved = vcDown.moved;
  vcDown = null;
  vcCanvas.style.cursor = 'default';
  if (wasMoved) return;                    // 拖动结束：停在当前朝向，不触发切面
  const dir = vcPick(e);
  if (dir) vcGoTo(dir);
});

vcCanvas.addEventListener('pointercancel', () => {
  vcDown = null;
  vcCanvas.style.cursor = 'default';
});

// 左右按钮：在当前视角的屏幕平面内原地转 90°，相机位置与观察方向都不变
// 距离固定不变，盒子在屏幕上只转向、不缩放
function spinScreen(dir) {
  manualView = true;
  targetQ.multiply(new THREE.Quaternion().setFromAxisAngle(AX_Z, dir * Math.PI / 2));
  targetQ.normalize();
}
document.getElementById('vc-left').addEventListener('click', () => spinScreen(-1));
document.getElementById('vc-right').addEventListener('click', () => spinScreen(1));
document.getElementById('vc-reset').addEventListener('click', () => {
  manualView = true;
  targetQ.copy(quatFromDir(homeDir));
});

/* ---------------- resize ---------------- */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  baseDist = fitDistanceAny();
  resizeVC();
}
window.addEventListener('resize', onResize);
onResize();

/* ---------------- optional refined parts from Blender ---------------- */
let refinedLoaded = false;
const loader = new GLTFLoader();
loader.load('assets/refine.glb', (gltf) => {
  const root = gltf.scene;
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const n = o.name.toLowerCase();
    if (n.indexOf('shell') >= 0 || n.indexOf('body') >= 0) {
      o.material = MAT.body;
    } else if (n.indexOf('carafe') >= 0 && (n.indexOf('glass') >= 0 || n.indexOf('body') >= 0)) {
      o.material = MAT.glass;
    } else if (n.indexOf('handle') >= 0) {
      o.material = MAT.dark;
    }
  });
  machine.add(root);
  const cr = root.getObjectByName('CarafeRoot');
  if (cr) { carafeGroup.add(cr); cr.position.set(0, 0, 0); }
  refinedLoaded = true;
  body.visible = false;
  panelShell.visible = false;
  topStrips.forEach((o) => { o.visible = false; });
  cGlass.visible = false;
  handle.visible = false;
}, undefined, (err) => {
  console.warn('[refine] 未加载 refine.glb，继续使用程序化外壳/奶壶', err);
});

/* ---------------- loop ---------------- */
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, clock.getDelta());
  const ease = 1 - Math.exp(-dt * 9);
  curQ.slerp(targetQ, ease);
  zoomFactor += (targetZoom - zoomFactor) * ease;
  applyView(false);

  // parts
  PART_KEYS.forEach((k) => {
    const s = parts[k];
    s.v += (s.t - s.v) * (1 - Math.exp(-dt * 7));
  });
  lidGroup.rotation.x = -1.95 * parts.lid.v;
  carafeGroup.position.z = 0.172 + 0.080 * parts.carafe.v;
  carafeGroup.position.x = -0.086 - 0.020 * parts.carafe.v;
  carafeGroup.position.y = 0.014 + 0.004 * parts.carafe.v;
  trayGroup.position.z = 0.098 * parts.tray.v;
  tankGroup.position.z = -0.108 * parts.tank.v;
  tankGroup.position.y = 0.020 * parts.tank.v;
  tankLid.position.y = 0.347 + 0.042 * parts.tank.v;
  tankLid.rotation.x = -0.55 * parts.tank.v;
  groundsGroup.position.z = 0.165 * parts.grounds.v;
  groundsGroup.position.y = 0.030 * parts.grounds.v;

  // buttons: dim the rest, pulse the one the current task needs
  const tsec = performance.now() * 0.001;
  buttons.forEach((b) => {
    const isTarget = b.id === targetBtn;
    const baseOp = isTarget ? 1 : targetBtn ? 0.32 : 0.72;
    if (b.press > 0) {
      b.press = Math.max(0, b.press - dt / 0.34);
      const s = Math.sin((1 - b.press) * Math.PI);
      b.inner.position.z = -0.0019 * s;
      b.plateMat.emissive = new THREE.Color(0xb06a3a);
      b.plateMat.emissiveIntensity = 0.09 * s;
      b.iconMat.opacity = baseOp * (0.75 + 0.25 * s);
    } else {
      b.inner.position.z += (0 - b.inner.position.z) * ease;
      b.plateMat.emissiveIntensity *= 0.9;
      b.iconMat.opacity += (baseOp - b.iconMat.opacity) * ease;
    }
    const haloWant = isTarget ? 0.55 + 0.34 * Math.sin(tsec * 3.1) : 0;
    b.haloMat.opacity += (haloWant - b.haloMat.opacity) * (isTarget ? 0.28 : 0.14);
    const hs = isTarget ? 1 + 0.035 * Math.sin(tsec * 3.1) : 1;
    b.halo.scale.set(hs, hs, 1);
  });

  ledFlash = Math.max(0, ledFlash - dt * 1.4);
  MAT.led.emissiveIntensity = 0.25 + ledFlash * 1.9;

  // marker follows the part it points at
  if (marker.visible && markerPart) {
    const v = parts[markerPart].v;
    if (markerPart === 'tank') marker.position.set(0, 0.235 + 0.02 * v, -0.185 - 0.108 * v);
    else if (markerPart === 'grounds') marker.position.set(0, 0.112, 0.09 + 0.165 * v);
    else if (markerPart === 'tray') marker.position.set(0.034, 0.085, 0.17 + 0.098 * v);
    else if (markerPart === 'lid') marker.position.set(0, 0.366, 0.062 - 0.09 * v);
    else if (markerPart === 'carafe') marker.position.set(-0.086 - 0.02 * v, 0.176, 0.172 + 0.08 * v);
  }

  // marker pulse
  if (marker.visible) {
    const t = performance.now() * 0.001;
    const s = 1 + Math.sin(t * 2.2) * 0.08;
    marker.scale.set(0.055 * s, 0.055 * s, 1);
    marker.material.opacity = 0.55 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2.2));
  }

  // machine-screen timers
  const nowMs = performance.now();
  if (UI.mode === 'brew' && UI.brew && nowMs >= UI.brew.from + UI.brew.dur) finishBrew();
  else if (UI.mode === 'rinse' && nowMs >= UI.rinseUntil) finishRinse();
  else if (UI.msg && nowMs >= UI.msgUntil) { UI.msg = ''; renderScreen(); }
  if (UI.mode === 'brew' || UI.mode === 'rinse') renderScreen();

  // mini 视角立方体：立方体留在世界坐标，副相机跟随主相机朝向
  vcCam.position.copy(camera.position).normalize().multiplyScalar(VC_DIST);
  vcCam.quaternion.copy(camera.quaternion);
  vcCam.updateMatrixWorld();
  vcRenderer.render(vcScene, vcCam);
  renderer.render(scene, camera);
}
tick();

/* mobile: the enlarged screen collapses so it never covers the model */
const mirrorEl = document.getElementById('mirror');
const mirrorToggle = document.getElementById('mirrorToggle');
function setMirror(open) {
  mirrorEl.classList.toggle('collapsed', !open);
  mirrorToggle.textContent = open ? '收起' : '屏幕';
  mirrorToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}
mirrorToggle.addEventListener('click', () => {
  setMirror(mirrorEl.classList.contains('collapsed'));
});
setMirror(window.innerWidth > 820);

/* loader fade */
setTimeout(() => {
  const l = document.getElementById('loader');
  l.classList.add('hide');
  setTimeout(() => l.remove(), 800);
}, 520);

/* expose for automated checks */
function screenOf(id) {
  const b = buttons.find((x) => x.id === id);
  if (!b) return null;
  const v = new THREE.Vector3(0, 0, 0);
  b.group.updateWorldMatrix(true, false);
  b.group.localToWorld(v);
  v.project(camera);
  return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
}

window.__app = {
  camera, scene, machine, targetQ, curQ, buttons, steps: STEPS, gotoStep,
  setPart, togglePart, orbitBy, parts, pressButton, ui: UI, renderScreen, screenOf,
  get stepIdx() { return stepIdx; },
  get taskIdx() { return taskIdx; },
  get targetBtn() { return targetBtn; },
  get tipFor() { return tipFor; },
  get taskDone() { return taskDone.slice(); },
  get zoom() { return targetZoom; },
  set zoom(v) { targetZoom = v; },
  get dist() { return baseDist; }
};
