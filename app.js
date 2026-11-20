// ==========================================
// CONFIGURATION
// ==========================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzTOPyMjnSfq_to3G5CPebbbNuPlnb-Rmh9BOjcfIWxB7K53uAzymmlFz3SWSeyuiSl/exec';
// ลิงก์หน้า view.html บน GitHub Pages สำหรับสร้าง Smart Single QR
const PUBLIC_VIEW_URL = 'https://mwabr04s00-nont.github.io/safety-equipment/view.html';

let APP_DATA = { assets: [], checkpoints: [], inspections: [], workOrders: [], approvals: [], users: [] };
let currentFontSize = 16;
let selectedAssetCategory = 'ALL';
let selectedQrIds = new Set();
let trendChartInstance = null;
let donutChartInstance = null;

// ข้อมูลตัวอย่าง (ทำงานอัตโนมัติหากยังไม่ใส่ API_URL)
const DEMO_DATA = {
  assets: [
    { assetId: 'FE-001', serialNo: 'SN-2023-C02-098', name: 'ถังดับเพลิง CO2 10 lbs', type: 'ถังดับเพลิง', standard: 'มอก. 332-2537 Class B/C', building: 'อาคาร 1 ชั้น 1', location: 'เสา 4 โซน A (ข้างแผงสวิตช์ไฟ)', installDate: '15/01/2023', expiryDate: '15/01/2028', inspectCycle: 'ตรวจทุกเดือน', lastInspected: '18/09/2026 11:47', lastInspector: 'จป. เบล', status: 'ปกติ', alertNote: '' },
    { assetId: 'FE-002', serialNo: 'SN-2022-DRY-441', name: 'ถังดับเพลิงเคมีแห้ง 15 lbs', type: 'ถังดับเพลิง', standard: 'มอก. 332-2537', building: 'อาคาร 1 ชั้น 1', location: 'เสา C4 (โซนคลังสินค้าหลัก)', installDate: '10/08/2022', expiryDate: 'ส่งบรรจุใหม่: ด่วน', inspectCycle: 'ตรวจทุกเดือน', lastInspected: '18/09/2026 11:37', lastInspector: 'จป. เบล', status: 'พบข้อบกพร่อง', alertNote: 'เกจวัดแรงดันตกใต้ขีดสีเขียว' },
    { assetId: 'EL-001', serialNo: 'SN-2024-EML-102', name: 'ไฟฉุกเฉิน Dual LED 9W', type: 'ไฟฉุกเฉิน', standard: 'แบตเตอรี่สำรอง 12V 2.9Ah (2 ชม.)', building: 'อาคาร 1 ทางเดินหลัก', location: 'เหนือตู้ควบคุมไฟฟ้าเบอร์ MDB-01', installDate: '05/03/2024', expiryDate: 'เปลี่ยนแบตเตอรี่: 03/2027', inspectCycle: 'ตรวจทุกเดือน', lastInspected: '-', lastInspector: '-', status: 'ยังไม่ตรวจ', alertNote: '' },
    { assetId: 'EX-001', serialNo: 'SN-2023-EXT-889', name: 'ป้ายไฟทางออกฉุกเฉิน LED', type: 'ป้ายไฟทางออก', standard: 'วสท. 021004-18', building: 'อาคาร 1 ชั้น 1 ทางเดินหลัก', location: 'ทางเดินหลัก หน้าบันไดหนีไฟทิศเหนือ', installDate: '12/11/2023', expiryDate: 'เปลี่ยนหลอดไฟสำรอง', inspectCycle: 'ตรวจทุกเดือน', lastInspected: '18/09/2026 11:57', lastInspector: 'จป. เบล', status: 'พบข้อบกพร่อง', alertNote: 'หลอดไฟกระพริบต่อเนื่อง' }
  ],
  checkpoints: [
    { checkpointId: 'CP-WH-01', zone: 'Zone WH-A', assetId: 'FE-002', building: 'อาคาร 1 คลังสินค้า', locationDetail: 'เสา C4 ชั้น 1 ข้างลิฟต์ขนของ', lat: '13.7563', lng: '100.5018', radius: 15, stickerStatus: 'Active', scanCount: 28 },
    { checkpointId: 'CP-WH-02', zone: 'Zone WH-A', assetId: 'EX-001', building: 'อาคาร 1 คลังสินค้า', locationDetail: 'ประตูหนีไฟ D2 ทิศตะวันออก', lat: '13.7561', lng: '100.5022', radius: 15, stickerStatus: 'Active', scanCount: 31 },
    { checkpointId: 'CP-PD-05', zone: 'Zone PD-02', assetId: 'EL-001', building: 'อาคาร 2 สายการผลิต', locationDetail: 'แนวเสา P-12 โรงเชื่อม', lat: '13.7558', lng: '100.5030', radius: 20, stickerStatus: 'Damaged', scanCount: 14 },
    { checkpointId: 'CP-OF-01', zone: 'Zone Admin', assetId: 'FE-001', building: 'อาคารสำนักงาน', locationDetail: 'โถงต้อนรับ ชั้น 1 หน้าลิฟต์', lat: '13.7570', lng: '100.5010', radius: 10, stickerStatus: 'Pending', scanCount: 0 }
  ],
  inspections: [
    {
      inspectionId: 'INS-202609-01', monthRound: '2026-09', timestamp: '18/09/2026 11:37', assetId: 'FE-002', inspector: 'จป. เบล', deviceId: '#OP-8821', lat: '13.7563', lng: '100.5018', result: 'พบข้อบกพร่อง',
      checklistJson: JSON.stringify([
        { label: '1. สภาพสายฉีดและหัวฉีด (Nozzle)', pass: true, detail: 'ผ่าน (ไม่แตกร้าว)' },
        { label: '2. ซีลล็อคและสลักนิรภัย (Safety Pin)', pass: true, detail: 'ผ่าน (ซีลสมบูรณ์)' },
        { label: '3. สภาพตัวถังภายนอก (Cylinder)', pass: true, detail: 'ผ่าน (ไม่ผุกร่อน)' },
        { label: '4. เกจวัดความดัน (Pressure Gauge)', pass: false, detail: 'เข็มตกอยู่ในแถบสีแดง (ต่ำกว่า 100 PSI)' }
      ]),
      photosJson: '[]', note: 'เกจวัดแรงดันตก เข็มแดงต่ำกว่า 100 psi ไม่พร้อมใช้งาน แขวนป้ายรอซ่อมแล้ว', workOrderId: 'WO-2026-089'
    },
    {
      inspectionId: 'INS-202609-03', monthRound: '2026-09', timestamp: '18/09/2026 11:47', assetId: 'FE-001', inspector: 'จป. เบล', deviceId: '#OP-8821', lat: '13.7564', lng: '100.5020', result: 'ปกติ',
      checklistJson: JSON.stringify([
        { label: '1. สภาพสายฉีดและกระบอกปากแตร (Horn)', pass: true, detail: 'ผ่าน' },
        { label: '2. ลวดซีลตะกั่วและสลักล็อคคันบีบ', pass: true, detail: 'ผ่าน' },
        { label: '3. ชั่งน้ำหนักสาร CO2 ตามสเปก', pass: true, detail: 'ผ่าน (น้ำหนักไม่ตก)' },
        { label: '4. ความสะอาด ป้ายกำกับการใช้งาน', pass: true, detail: 'ผ่าน' }
      ]),
      photosJson: '[]', note: 'ถัง CO2 สภาพเรียบร้อยดีมาก น้ำหนักถังรวม 18.2 กก.', workOrderId: ''
    }
  ],
  workOrders: [
    { woId: 'WO-2026-089', dateReported: '18/09/2026', dueDate: '20/09/2026', dateClosed: '', assetId: 'FE-002', location: 'อาคาร 1 คลัง C4', priority: 'เร่งด่วนมาก', symptom: 'เกจวัดแรงดันตกต่ำกว่าเกณฑ์', actionTaken: 'ส่งอัดแรงดัน / เติมสารเคมีใหม่', partReplaced: 'อัดก๊าซไนโตรเจน + ชุดซีลโอริง', technician: 'บจก. เซฟตี้ไทยฯ', technicianPhone: '02-000-0001', cost: 450, status: 'กำลังซ่อม' },
    { woId: 'WO-2026-091', dateReported: '18/09/2026', dueDate: '21/09/2026', dateClosed: '', assetId: 'EX-001', location: 'อาคาร 1 ประตูหนีไฟทิศเหนือ', priority: 'เร่งด่วน', symptom: 'หลอดไฟ LED กระพริบ แบตเสื่อม', actionTaken: 'เปลี่ยนอะไหล่', partReplaced: 'แบตสำรอง 12V 2.9Ah', technician: 'ช่างเอกชัย (ทีมไฟฟ้า)', technicianPhone: '081-000-0002', cost: 820, status: 'รอจัดสรรช่าง' },
    { woId: 'WO-2026-085', dateReported: '12/09/2026', dueDate: '15/09/2026', dateClosed: '14/09/2026', assetId: 'FE-001', location: 'อาคารสำนักงาน', priority: 'ปานกลาง', symptom: 'ผงเคมีจับตัวเป็นก้อน', actionTaken: 'ส่งอัดแรงดัน / เติมสารเคมีใหม่', partReplaced: 'เปลี่ยนสารเคมี Dry Chemical ABC', technician: 'ทีมซ่อมบำรุงภายใน', technicianPhone: '081-000-0003', cost: 550, status: 'ปิดงานแล้ว' }
  ],
  approvals: [],
  users: []
};

// ==========================================
// INITIALIZATION & AUTH
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  if (API_URL === 'YOUR_GAS_WEB_APP_URL') {
    document.getElementById('demoBanner').classList.remove('hidden');
  }
  if (sessionStorage.getItem('safety_admin_auth') === '1') {
    document.getElementById('loginOverlay').classList.add('hidden');
    loadAllData();
  }
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('globalSearch').addEventListener('input', (e) => {
    document.getElementById('ovFilterText').value = e.target.value;
    document.getElementById('assetSearch').value = e.target.value;
    renderOverview();
    renderAssets();
  });
});

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('adminPassword').value.trim();
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  errEl.classList.add('hidden');

  if (API_URL === 'YOUR_GAS_WEB_APP_URL') {
    if (password === 'admin1234') {
      sessionStorage.setItem('safety_admin_auth', '1');
      document.getElementById('loginOverlay').classList.add('hidden');
      loadAllData();
    } else {
      errEl.textContent = 'รหัสผ่านไม่ถูกต้อง (โหมดตัวอย่างใช้: admin1234)';
      errEl.classList.remove('hidden');
    }
    return;
  }

  btn.disabled = true;
  btn.textContent = 'กำลังตรวจสอบ...';
  try {
    const res = await postToGas({ action: 'login', password });
    if (res.status === 'success') {
      sessionStorage.setItem('safety_admin_auth', '1');
      document.getElementById('loginOverlay').classList.add('hidden');
      loadAllData();
    } else {
      errEl.textContent = res.message || 'รหัสผ่านไม่ถูกต้อง';
      errEl.classList.remove('hidden');
    }
  } catch (err) {
    errEl.textContent = 'ไม่สามารถเชื่อมต่อ GAS ได้: ' + err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'เข้าสู่ระบบ';
  }
}

function logout() {
  sessionStorage.removeItem('safety_admin_auth');
  location.reload();
}

function adjustFontSize(delta) {
  currentFontSize = delta === 0 ? 16 : Math.min(20, Math.max(13, currentFontSize + delta));
  document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px');
}

// ==========================================
// DATA FETCHING (GAS API)
// ==========================================
async function loadAllData(showSpin = false) {
  const icon = document.getElementById('refreshIcon');
  if (showSpin) icon.classList.add('animate-spin');

  try {
    if (API_URL === 'YOUR_GAS_WEB_APP_URL') {
      APP_DATA = JSON.parse(JSON.stringify(DEMO_DATA));
    } else {
      const res = await fetch(`${API_URL}?action=getAll`);
      const json = await res.json();
      if (json.status === 'success') APP_DATA = json.data;
    }
    renderAll();
  } catch (err) {
    alert('โหลดข้อมูลไม่สำเร็จ: ' + err.message);
  } finally {
    icon.classList.remove('animate-spin');
  }
}

async function postToGas(payload) {
  if (API_URL === 'YOUR_GAS_WEB_APP_URL') {
    if (payload.action === 'saveAsset') {
      const idx = APP_DATA.assets.findIndex(a => a.assetId === payload.payload.assetId);
      if (idx > -1) APP_DATA.assets[idx] = payload.payload;
      else APP_DATA.assets.push(payload.payload);
    } else if (payload.action === 'saveCheckpoint') {
      const idx = APP_DATA.checkpoints.findIndex(c => c.checkpointId === payload.payload.checkpointId);
      if (idx > -1) APP_DATA.checkpoints[idx] = payload.payload;
      else APP_DATA.checkpoints.push(payload.payload);
    } else if (payload.action === 'saveWorkOrder') {
      APP_DATA.workOrders.unshift(payload.payload);
    } else if (payload.action === 'saveApproval') {
      APP_DATA.approvals.unshift({ ...payload.payload, digitalHash: 'SHA256:DEMO99A8F1', timestamp: new Date().toLocaleString('th-TH') });
    }
    return { status: 'success' };
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

// ==========================================
// NAVIGATION & RENDER ALL
// ==========================================
function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-pill').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.getElementById(`nav-${tabId}`).classList.add('active');
  lucide.createIcons();
}

function switchDashboardSub(sub) {
  const isOverview = sub === 'overview';
  document.getElementById('dash-overview').classList.toggle('hidden', !isOverview);
  document.getElementById('dash-annual').classList.toggle('hidden', isOverview);
  document.getElementById('sub-overview').className = isOverview ? 'px-4 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white transition' : 'px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition';
  document.getElementById('sub-annual').className = !isOverview ? 'px-4 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white transition' : 'px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition';
  if (!isOverview) renderAnnualAnalytics();
}

function renderAll() {
  const defects = APP_DATA.assets.filter(a => a.status === 'พบข้อบกพร่อง').length;
  document.getElementById('defectBadge').textContent = defects;
  renderOverview();
  renderAssets();
  renderInspections();
  renderCheckpoints();
  lucide.createIcons();
}

// ==========================================
// TAB 1A: OVERVIEW
// ==========================================
function renderOverview() {
  const assets = APP_DATA.assets;
  const total = assets.length;
  const normal = assets.filter(a => a.status === 'ปกติ').length;
  const defect = assets.filter(a => a.status === 'พบข้อบกพร่อง').length;
  const pending = assets.filter(a => a.status === 'ยังไม่ตรวจ').length;
  const checked = normal + defect;
  const pct = (n) => total ? Math.round((n / total) * 100) : 0;

  document.getElementById('overviewKpiCards').innerHTML = `
    <div class="rounded-2xl p-5 text-white bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
      <div class="text-sm font-medium opacity-90">อุปกรณ์ทั้งหมด</div>
      <div class="mt-3 flex items-baseline gap-2"><span class="text-4xl font-bold">${total}</span><span class="text-xs opacity-90">รายการที่ลงทะเบียน</span></div>
    </div>
    <div class="rounded-2xl p-5 text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
      <div class="text-sm font-medium opacity-90">ตรวจสอบแล้ว (ปกติ)</div>
      <div class="mt-3 flex items-baseline gap-2"><span class="text-4xl font-bold">${normal}</span><span class="text-xs opacity-90">พร้อมใช้งาน ${pct(normal)}%</span></div>
    </div>
    <div class="rounded-2xl p-5 text-white bg-gradient-to-br from-red-500 to-rose-600 shadow-md">
      <div class="flex justify-between items-center"><span class="text-sm font-medium opacity-90">พบข้อบกพร่อง</span><span class="text-[10px] px-2 py-0.5 bg-white/20 rounded-full">ต้องแก้ไข</span></div>
      <div class="mt-3 flex items-baseline gap-2"><span class="text-4xl font-bold">${defect}</span><span class="text-xs opacity-90">จุดที่ต้องซ่อมบำรุง</span></div>
    </div>
    <div class="rounded-2xl p-5 text-white bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
      <div class="text-sm font-medium opacity-90">ยังไม่ได้ตรวจสอบ</div>
      <div class="mt-3 flex items-baseline gap-2"><span class="text-4xl font-bold">${pending}</span><span class="text-xs opacity-90">ค้างตรวจในรอบ</span></div>
    </div>
  `;

  const fType = document.getElementById('ovFilterType').value;
  const fStatus = document.getElementById('ovFilterStatus').value;
  const fText = document.getElementById('ovFilterText').value.toLowerCase();

  const filtered = assets.filter(a =>
    (fType === 'ALL' || a.type === fType) &&
    (fStatus === 'ALL' || a.status === fStatus) &&
    (`${a.assetId} ${a.name} ${a.building} ${a.location}`.toLowerCase().includes(fText))
  );

  document.getElementById('ovTableCount').textContent = `แสดง ${filtered.length} จากทั้งหมด ${total} รายการ`;
  document.getElementById('ovTableBody').innerHTML = filtered.map(a => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="px-4 py-3 font-bold text-slate-900">${a.assetId}</td>
      <td class="px-4 py-3"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadgeClass(a.type)}">${a.type}</span></td>
      <td class="px-4 py-3 text-slate-600">${a.building}</td>
      <td class="px-4 py-3 text-slate-600">${a.lastInspected || '-'}</td>
      <td class="px-4 py-3 text-slate-600">${a.lastInspector || '-'}</td>
      <td class="px-4 py-3">${statusBadge(a.status)}</td>
      <td class="px-4 py-3 text-right">
        <button onclick="openHistoryDrawer('${a.assetId}')" class="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">ตรวจ/ดูประวัติ</button>
      </td>
    </tr>
  `).join('');

  document.getElementById('ovProgressText').textContent = `${pct(checked)}% (${checked}/${total} อุปกรณ์)`;
  document.getElementById('ovProgressBar').innerHTML = `
    <div style="width:${pct(normal)}%" class="bg-emerald-500 h-full"></div>
    <div style="width:${pct(defect)}%" class="bg-red-500 h-full"></div>
    <div style="width:${pct(pending)}%" class="bg-slate-200 h-full"></div>
  `;
  document.getElementById('ovProgressLegend').innerHTML = `
    <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ปกติ (${pct(normal)}%)</span>
    <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span> พบข้อบกพร่อง (${pct(defect)}%)</span>
    <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span> รอดำเนินการ (${pct(pending)}%)</span>
  `;

  const defectItems = assets.filter(a => a.status === 'พบข้อบกพร่อง');
  document.getElementById('urgentCountBadge').textContent = `${defectItems.length} รายการ`;
  document.getElementById('urgentDefectsList').innerHTML = defectItems.length ? defectItems.map(a => `
    <div class="p-3.5 rounded-xl bg-red-50/70 border border-red-100 space-y-1.5">
      <div class="flex justify-between items-start gap-2">
        <div class="font-bold text-red-700 text-sm">${a.assetId} (${a.name})</div>
        <span class="text-[11px] text-slate-500 shrink-0">${(a.lastInspected || '').split(' ')[0]}</span>
      </div>
      <p class="text-xs text-slate-600">${a.alertNote || 'พบความผิดปกติจากการตรวจสอบ'}</p>
      <div class="flex justify-between items-center pt-1 text-xs">
        <span class="text-slate-500">${a.building}</span>
        <button onclick="openWorkOrderModal('${a.assetId}')" class="font-semibold text-indigo-600 hover:underline">ส่งใบแจ้งซ่อม →</button>
      </div>
    </div>
  `).join('') : '<p class="text-xs text-slate-400 text-center py-6">ไม่มีรายการชำรุดค้างแก้ไข</p>';

  const byBuilding = {};
  assets.forEach(a => {
    const b = a.building || 'ไม่ระบุอาคาร';
    if (!byBuilding[b]) byBuilding[b] = { total: 0, done: 0 };
    byBuilding[b].total++;
    if (a.status !== 'ยังไม่ตรวจ') byBuilding[b].done++;
  });
  document.getElementById('buildingStatsList').innerHTML = Object.entries(byBuilding).map(([b, s]) => {
    const p = Math.round((s.done / s.total) * 100);
    return `
      <div>
        <div class="flex justify-between text-xs font-semibold mb-1.5"><span>${b}</span><span class="text-indigo-600">${s.done}/${s.total} ตรวจแล้ว</span></div>
        <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-indigo-600 rounded-full" style="width:${p}%"></div></div>
      </div>
    `;
  }).join('');
}

// ==========================================
// TAB 1B: ANNUAL ANALYTICS
// ==========================================
function renderAnnualAnalytics() {
  const wos = APP_DATA.workOrders;
  const closed = wos.filter(w => w.status === 'ปิดงานแล้ว').length;
  const rate = wos.length ? ((closed / wos.length) * 100).toFixed(1) : '100';

  document.getElementById('annualKpiCards').innerHTML = `
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80"><div class="text-xs text-slate-500">จำนวนอุปกรณ์ที่ดูแล</div><div class="text-3xl font-bold text-slate-900 mt-2">${APP_DATA.assets.length} <span class="text-sm font-normal">ชุด</span></div></div>
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80"><div class="text-xs text-slate-500">สถิติชำรุดสะสมทั้งปี</div><div class="text-3xl font-bold text-red-600 mt-2">${wos.length} <span class="text-sm font-normal">ครั้ง</span></div></div>
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80"><div class="text-xs text-slate-500">อัตราการแก้ไขสำเร็จ</div><div class="text-3xl font-bold text-emerald-600 mt-2">${rate}%</div></div>
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80"><div class="text-xs text-slate-500">ระยะเวลาเฉลี่ยซ่อมปิดงาน (MTTR)</div><div class="text-3xl font-bold text-indigo-600 mt-2">2.4 <span class="text-sm font-normal">วัน</span></div></div>
  `;

  document.getElementById('woTableBody').innerHTML = wos.map(w => `
    <tr class="hover:bg-slate-50">
      <td class="px-4 py-3 font-bold text-indigo-600">${w.woId}</td>
      <td class="px-4 py-3 text-slate-600">${w.dateReported}</td>
      <td class="px-4 py-3 font-semibold">${w.assetId}</td>
      <td class="px-4 py-3 text-red-600 text-xs">${w.symptom}</td>
      <td class="px-4 py-3 text-slate-600 text-xs">${w.actionTaken || w.partReplaced || '-'}</td>
      <td class="px-4 py-3 text-slate-600 text-xs">${w.technician || '-'}</td>
      <td class="px-4 py-3 font-semibold">฿${Number(w.cost || 0).toLocaleString()}</td>
      <td class="px-4 py-3">${statusBadge(w.status)}</td>
    </tr>
  `).join('');

  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(document.getElementById('monthlyTrendChart'), {
    type: 'bar',
    data: {
      labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
      datasets: [{ label: 'จำนวนแจ้งซ่อม', data: [1, 2, 1, 3, 1, 2, 1, 2, 2, 1, 1, 0], backgroundColor: '#4338ca', borderRadius: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });

  const typeCounts = { 'ถังดับเพลิง': 0, 'ไฟฉุกเฉิน': 0, 'ป้ายไฟทางออก': 0 };
  APP_DATA.assets.forEach(a => { if (typeCounts[a.type] !== undefined) typeCounts[a.type]++; });
  if (donutChartInstance) donutChartInstance.destroy();
  donutChartInstance = new Chart(document.getElementById('assetDonutChart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(typeCounts),
      datasets: [{ data: Object.values(typeCounts), backgroundColor: ['#4338ca', '#10b981', '#ef4444'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%' }
  });
}

// ==========================================
// TAB 2: ASSETS REGISTRY
// ==========================================
function renderAssets() {
  const assets = APP_DATA.assets;
  const counts = {
    ALL: assets.length,
    'ถังดับเพลิง': assets.filter(a => a.type === 'ถังดับเพลิง').length,
    'ไฟฉุกเฉิน': assets.filter(a => a.type === 'ไฟฉุกเฉิน').length,
    'ป้ายไฟทางออก': assets.filter(a => a.type === 'ป้ายไฟทางออก').length
  };

  document.getElementById('assetKpiCards').innerHTML = `
    <div class="rounded-2xl p-5 bg-indigo-700 text-white shadow-sm"><div class="text-xs opacity-80">อุปกรณ์ทั้งหมด</div><div class="text-3xl font-bold mt-2">${counts.ALL} ชิ้น</div></div>
    <div class="rounded-2xl p-5 bg-white border border-slate-200"><div class="text-xs text-slate-500">ถังดับเพลิง (Fire Extinguisher)</div><div class="text-3xl font-bold text-slate-900 mt-2">${counts['ถังดับเพลิง']} ถัง</div></div>
    <div class="rounded-2xl p-5 bg-white border border-slate-200"><div class="text-xs text-slate-500">ไฟฉุกเฉิน (Emergency Light)</div><div class="text-3xl font-bold text-slate-900 mt-2">${counts['ไฟฉุกเฉิน']} โคม</div></div>
    <div class="rounded-2xl p-5 bg-white border border-slate-200"><div class="text-xs text-slate-500">ป้ายไฟทางออก (Exit Sign)</div><div class="text-3xl font-bold text-slate-900 mt-2">${counts['ป้ายไฟทางออก']} ป้าย</div></div>
  `;

  document.getElementById('assetCategoryPills').innerHTML = Object.entries(counts).map(([k, v]) => `
    <button onclick="selectedAssetCategory='${k}'; renderAssets();" class="px-3 py-1 rounded-full text-xs font-semibold transition ${selectedAssetCategory === k ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
      ${k === 'ALL' ? 'ทั้งหมด' : k} (${v})
    </button>
  `).join('');

  const q = (document.getElementById('assetSearch').value || '').toLowerCase();
  const filtered = assets.filter(a =>
    (selectedAssetCategory === 'ALL' || a.type === selectedAssetCategory) &&
    (`${a.assetId} ${a.serialNo} ${a.name} ${a.location}`.toLowerCase().includes(q))
  );

  document.getElementById('assetTableBody').innerHTML = filtered.map(a => `
    <tr class="hover:bg-slate-50">
      <td class="px-4 py-3 font-bold text-indigo-700">${a.assetId}</td>
      <td class="px-4 py-3">
        <div class="font-bold text-slate-900">${a.name}</div>
        <div class="text-xs text-slate-500">S/N: ${a.serialNo} • ${a.standard}</div>
        ${a.alertNote ? `<div class="text-xs text-red-600 font-semibold mt-0.5">แจ้งเตือน: ${a.alertNote}</div>` : ''}
      </td>
      <td class="px-4 py-3"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadgeClass(a.type)}">${a.type}</span></td>
      <td class="px-4 py-3 text-xs"><div class="font-semibold text-slate-800">${a.building}</div><div class="text-slate-500">${a.location}</div></td>
      <td class="px-4 py-3 text-xs text-slate-600">ติดตั้ง: ${a.installDate}<br><span class="font-semibold text-indigo-700">${a.expiryDate}</span></td>
      <td class="px-4 py-3">${statusBadge(a.status)}</td>
      <td class="px-4 py-3 text-right space-x-1">
        <button onclick="openHistoryDrawer('${a.assetId}')" class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="ดูประวัติ"><i data-lucide="history" class="w-4 h-4"></i></button>
        <button onclick="openAssetModal('${a.assetId}')" class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="แก้ไข"><i data-lucide="pencil" class="w-4 h-4"></i></button>
      </td>
    </tr>
  `).join('');
  lucide.createIcons();
}

// ==========================================
// TAB 3: INSPECTIONS AUDIT TRAIL
// ==========================================
function renderInspections() {
  const container = document.getElementById('inspectionCardsContainer');
  if (!APP_DATA.inspections.length) {
    container.innerHTML = '<div class="bg-white rounded-2xl p-10 text-center text-slate-400">ยังไม่มีบันทึกผลตรวจในรอบนี้</div>';
    return;
  }

  container.innerHTML = APP_DATA.inspections.map(ins => {
    const asset = APP_DATA.assets.find(a => a.assetId === ins.assetId) || {};
    let checklist = [];
    try { checklist = JSON.parse(ins.checklistJson || '[]'); } catch (e) {}
    let photos = [];
    try { photos = JSON.parse(ins.photosJson || '[]'); } catch (e) {}
    const isDefect = ins.result === 'พบข้อบกพร่อง';

    return `
      <div class="bg-white rounded-2xl border ${isDefect ? 'border-red-200' : 'border-emerald-200'} shadow-xs overflow-hidden">
        <div class="px-5 py-3 ${isDefect ? 'bg-red-50/70' : 'bg-emerald-50/70'} border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs">
          <div class="flex items-center gap-2 font-bold ${isDefect ? 'text-red-700' : 'text-emerald-700'}">
            <span>${isDefect ? '● พบข้อบกพร่อง (Defect Detected)' : '✔ ปกติ (Pass 100%)'}</span>
            <span class="px-2 py-0.5 bg-white rounded-full text-slate-700 border border-slate-200">${asset.type || '-'}</span>
          </div>
          <div class="text-slate-600">เวลา: <b>${ins.timestamp}</b> • ผู้ตรวจ: <b>${ins.inspector}</b> (${ins.deviceId || 'LIFF'})</div>
        </div>

        <div class="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="space-y-2 text-xs">
            <div class="text-[11px] text-slate-400 font-semibold">EQUIPMENT ID</div>
            <div class="text-2xl font-bold text-slate-900">${ins.assetId}</div>
            <div class="font-semibold text-slate-700">${asset.name || ''}</div>
            <div class="text-slate-500">พิกัด: ${asset.building || ''} ${asset.location || ''}</div>
            <div class="text-slate-500">GPS: ${ins.lat || '-'}, ${ins.lng || '-'}</div>
            ${ins.workOrderId ? `<div class="mt-3 p-2.5 bg-indigo-50 rounded-xl text-indigo-700 font-semibold">ใบแจ้งซ่อม: #${ins.workOrderId}</div>` : ''}
          </div>

          <div class="space-y-2">
            <div class="text-xs font-bold text-slate-700 mb-2">รายการตรวจสอบตามมาตรฐาน ${asset.standard || ''}</div>
            ${checklist.map(c => `
              <div class="flex justify-between items-center p-2.5 rounded-xl text-xs ${c.pass ? 'bg-slate-50 text-slate-700' : 'bg-red-50 text-red-700 border border-red-200'}">
                <span class="font-medium">${c.label}</span>
                <span class="font-bold shrink-0 ml-2">${c.pass ? 'ผ่าน' : 'ไม่ผ่าน'}</span>
              </div>
            `).join('')}
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 mt-2">
              <b>บันทึกหน้างาน:</b> ${ins.note || '-'}
            </div>
          </div>

          <div>
            <div class="text-xs font-bold text-slate-700 mb-2">หลักฐานรูปถ่ายหน้างาน (${photos.length} รูป)</div>
            ${photos.length ? `
              <div class="grid grid-cols-2 gap-2">
                ${photos.map(p => `<a href="${p.url}" target="_blank" class="block rounded-xl overflow-hidden border border-slate-200"><img src="${p.url}" class="w-full h-28 object-cover"></a>`).join('')}
              </div>
            ` : `<div class="h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">รูปถ่ายจะอัปโหลดจากฝั่ง LINE LIFF ลง Google Drive</div>`}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (APP_DATA.approvals.length) {
    const latest = APP_DATA.approvals[0];
    document.getElementById('approvalStatusText').innerHTML = `อนุมัติแล้วโดย <b>${latest.approverName}</b> เมื่อ ${latest.timestamp} • รหัสลายเซ็นดิจิทัล: <code class="bg-white px-1.5 py-0.5 rounded">${latest.digitalHash}</code>`;
  }
}

// ==========================================
// TAB 4: SMART SINGLE QR & CHECKPOINTS
// ==========================================
function renderCheckpoints() {
  const cps = APP_DATA.checkpoints;
  document.getElementById('checkpointTableBody').innerHTML = cps.map(cp => {
    const asset = APP_DATA.assets.find(a => a.assetId === cp.assetId) || {};
    const checked = selectedQrIds.has(cp.checkpointId) ? 'checked' : '';
    return `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-3"><input type="checkbox" ${checked} onchange="toggleQrSelection('${cp.checkpointId}', this.checked)"></td>
        <td class="px-4 py-3"><div class="font-bold text-indigo-700">${cp.checkpointId}</div><div class="text-xs text-slate-400">${cp.zone}</div></td>
        <td class="px-4 py-3"><span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold text-xs">${cp.assetId}</span><div class="text-xs text-slate-600 mt-0.5">${asset.name || ''}</div></td>
        <td class="px-4 py-3 text-xs"><div class="font-semibold text-slate-800">${cp.locationDetail}</div><div class="text-slate-400">${cp.lat}, ${cp.lng} (รัศมี ±${cp.radius} ม.)</div></td>
        <td class="px-4 py-3">${statusBadge(cp.stickerStatus)}</td>
        <td class="px-4 py-3 text-right">
          <button onclick="previewSticker('${cp.checkpointId}')" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg">ดูฉลาก</button>
        </td>
      </tr>
    `;
  }).join('');

  if (cps.length) previewSticker(cps[0].checkpointId);
  document.getElementById('selectedQrCount').textContent = selectedQrIds.size;
}

function previewSticker(cpId) {
  const cp = APP_DATA.checkpoints.find(c => c.checkpointId === cpId);
  if (!cp) return;
  const asset = APP_DATA.assets.find(a => a.assetId === cp.assetId) || {};
  document.getElementById('prevCpId').textContent = cp.checkpointId;
  document.getElementById('prevAssetId').textContent = cp.assetId;
  document.getElementById('prevAssetName').textContent = asset.name || '-';
  document.getElementById('prevLocation').textContent = cp.locationDetail;
  document.getElementById('prevGps').textContent = `GPS ±${cp.radius} ม.`;

  const qrBox = document.getElementById('previewQrBox');
  qrBox.innerHTML = '';
  new QRCode(qrBox, {
    text: `${PUBLIC_VIEW_URL}?cp=${cp.checkpointId}&asset=${cp.assetId}`,
    width: 84,
    height: 84,
    correctLevel: QRCode.CorrectLevel.M
  });
}

function toggleQrSelection(cpId, isChecked) {
  if (isChecked) selectedQrIds.add(cpId);
  else selectedQrIds.delete(cpId);
  document.getElementById('selectedQrCount').textContent = selectedQrIds.size;
}

function toggleAllQr(isChecked) {
  selectedQrIds.clear();
  if (isChecked) APP_DATA.checkpoints.forEach(c => selectedQrIds.add(c.checkpointId));
  renderCheckpoints();
}

function printSelectedStickers() {
  const list = selectedQrIds.size
    ? APP_DATA.checkpoints.filter(c => selectedQrIds.has(c.checkpointId))
    : APP_DATA.checkpoints;
  if (!list.length) return alert('ไม่มีจุดตรวจสำหรับพิมพ์');

  const mode = document.querySelector('input[name="printMode"]:checked').value;
  const area = document.getElementById('printStickerArea');
  area.innerHTML = `<div class="${mode === 'thermal' ? 'sticker-grid-thermal' : 'sticker-grid-a4'}">
    ${list.map((cp, i) => {
      const asset = APP_DATA.assets.find(a => a.assetId === cp.assetId) || {};
      return `
        <div class="sticker-card">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;font-size:11px;font-weight:700;">
            <span>ระบบตรวจสอบอุปกรณ์ความปลอดภัย (จป.)</span><span>มอก./OSHA</span>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
            <div id="print-qr-${i}"></div>
            <div style="font-size:11px;line-height:1.4;">
              <div style="font-size:16px;font-weight:700;color:#3730a3;">${cp.checkpointId}</div>
              <div><b>อุปกรณ์:</b> ${cp.assetId}</div>
              <div>${asset.name || ''}</div>
              <div style="color:#64748b;">${cp.locationDetail}</div>
            </div>
          </div>
        </div>
      `;
    }).join('')}
  </div>`;

  list.forEach((cp, i) => {
    new QRCode(document.getElementById(`print-qr-${i}`), {
      text: `${PUBLIC_VIEW_URL}?cp=${cp.checkpointId}&asset=${cp.assetId}`,
      width: 90, height: 90
    });
  });

  setTimeout(() => window.print(), 300);
}

// ==========================================
// DRAWER & MODALS
// ==========================================
function openHistoryDrawer(assetId) {
  const asset = APP_DATA.assets.find(a => a.assetId === assetId);
  if (!asset) return;
  const logs = APP_DATA.inspections.filter(i => i.assetId === assetId);
  const wos = APP_DATA.workOrders.filter(w => w.assetId === assetId);

  document.getElementById('drawerContent').innerHTML = `
    <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
      <div class="flex justify-between items-start">
        <div class="text-xl font-bold text-indigo-800">${asset.assetId}</div>
        ${statusBadge(asset.status)}
      </div>
      <div class="font-bold text-slate-900 mt-1">${asset.name}</div>
      <div class="text-xs text-slate-600 mt-1">${asset.building} • ${asset.location}</div>
    </div>

    <div>
      <h4 class="font-bold text-sm text-slate-800 mb-3">ไทม์ไลน์การตรวจล่าสุด</h4>
      <div class="space-y-4 border-l-2 border-slate-200 pl-4 ml-2">
        ${logs.length ? logs.map(l => `
          <div class="relative">
            <span class="w-3 h-3 rounded-full ${l.result === 'ปกติ' ? 'bg-emerald-500' : 'bg-red-500'} absolute -left-[23px] top-1 ring-4 ring-white"></span>
            <div class="text-xs font-bold text-slate-800">${l.timestamp} โดย ${l.inspector}</div>
            <div class="text-xs font-semibold ${l.result === 'ปกติ' ? 'text-emerald-600' : 'text-red-600'}">${l.result}</div>
            <p class="text-xs text-slate-600 mt-1">${l.note || '-'}</p>
          </div>
        `).join('') : '<p class="text-xs text-slate-400">ยังไม่มีประวัติการตรวจ</p>'}
      </div>
    </div>

    ${wos.length ? `
      <div class="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
        <div class="text-xs font-bold text-red-700">สถานะงานซ่อมบำรุงล่าสุด (${wos[0].woId})</div>
        <p class="text-xs text-slate-700">${wos[0].symptom} — สถานะ: <b>${wos[0].status}</b></p>
      </div>
    ` : ''}
  `;
  document.getElementById('historyDrawer').classList.remove('hidden');
}

function closeHistoryDrawer() {
  document.getElementById('historyDrawer').classList.add('hidden');
}

function openAssetModal(editId = null) {
  const a = editId ? APP_DATA.assets.find(x => x.assetId === editId) : {};
  document.getElementById('modalTitle').textContent = editId ? `แก้ไขอุปกรณ์ ${editId}` : 'ลงทะเบียนอุปกรณ์ความปลอดภัยใหม่';
  const form = document.getElementById('modalForm');
  form.innerHTML = `
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-xs font-semibold">รหัสอุปกรณ์ *</label><input name="assetId" required value="${a.assetId || ''}" ${editId ? 'readonly' : ''} class="input-text mt-1" placeholder="เช่น FE-003"></div>
      <div><label class="text-xs font-semibold">ประเภท *</label>
        <select name="type" class="input-select mt-1">
          <option ${a.type === 'ถังดับเพลิง' ? 'selected' : ''}>ถังดับเพลิง</option>
          <option ${a.type === 'ไฟฉุกเฉิน' ? 'selected' : ''}>ไฟฉุกเฉิน</option>
          <option ${a.type === 'ป้ายไฟทางออก' ? 'selected' : ''}>ป้ายไฟทางออก</option>
        </select>
      </div>
    </div>
    <div><label class="text-xs font-semibold">ชื่อรุ่น / รายละเอียด *</label><input name="name" required value="${a.name || ''}" class="input-text mt-1"></div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-xs font-semibold">รหัสซีเรียล</label><input name="serialNo" value="${a.serialNo || ''}" class="input-text mt-1"></div>
      <div><label class="text-xs font-semibold">มาตรฐาน มอก./สเปก</label><input name="standard" value="${a.standard || ''}" class="input-text mt-1"></div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-xs font-semibold">อาคาร / ชั้น</label><input name="building" value="${a.building || ''}" class="input-text mt-1"></div>
      <div><label class="text-xs font-semibold">พิกัดติดตั้ง</label><input name="location" value="${a.location || ''}" class="input-text mt-1"></div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div><label class="text-xs font-semibold">วันที่ติดตั้ง</label><input name="installDate" value="${a.installDate || ''}" class="input-text mt-1" placeholder="dd/mm/yyyy"></div>
      <div><label class="text-xs font-semibold">วันหมดอายุ</label><input name="expiryDate" value="${a.expiryDate || ''}" class="input-text mt-1"></div>
      <div><label class="text-xs font-semibold">รอบตรวจ</label>
        <select name="inspectCycle" class="input-select mt-1">
          <option ${a.inspectCycle === 'ตรวจทุกเดือน' ? 'selected' : ''}>ตรวจทุกเดือน</option>
          <option ${a.inspectCycle === 'บำรุงทุก 6 เดือน' ? 'selected' : ''}>บำรุงทุก 6 เดือน</option>
        </select>
      </div>
    </div>
    <div class="pt-3 flex justify-end gap-2">
      <button type="button" onclick="closeModal()" class="btn-outline">ยกเลิก</button>
      <button type="submit" class="btn-primary">บันทึกข้อมูล</button>
    </div>
  `;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    fd.status = a.status || 'ยังไม่ตรวจ';
    fd.lastInspected = a.lastInspected || '-';
    fd.lastInspector = a.lastInspector || '-';
    await postToGas({ action: 'saveAsset', payload: fd });
    closeModal();
    loadAllData(true);
  };
  document.getElementById('appModal').classList.remove('hidden');
}

function openCheckpointModal() {
  document.getElementById('modalTitle').textContent = 'สร้างจุดตรวจ & QR Code ใหม่';
  const form = document.getElementById('modalForm');
  form.innerHTML = `
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-xs font-semibold">รหัสจุดตรวจ *</label><input name="checkpointId" required class="input-text mt-1" placeholder="เช่น CP-WH-05"></div>
      <div><label class="text-xs font-semibold">โซน</label><input name="zone" class="input-text mt-1" placeholder="Zone WH-A"></div>
    </div>
    <div><label class="text-xs font-semibold">ผูกกับอุปกรณ์ *</label>
      <select name="assetId" class="input-select mt-1">${APP_DATA.assets.map(a => `<option value="${a.assetId}">${a.assetId} - ${a.name}</option>`).join('')}</select>
    </div>
    <div><label class="text-xs font-semibold">พิกัดจุดสังเกต</label><input name="locationDetail" required class="input-text mt-1"></div>
    <div class="grid grid-cols-3 gap-3">
      <div><label class="text-xs font-semibold">Latitude</label><input name="lat" class="input-text mt-1" value="13.7563"></div>
      <div><label class="text-xs font-semibold">Longitude</label><input name="lng" class="input-text mt-1" value="100.5018"></div>
      <div><label class="text-xs font-semibold">รัศมี (เมตร)</label><input name="radius" type="number" class="input-text mt-1" value="15"></div>
    </div>
    <div class="pt-3 flex justify-end gap-2">
      <button type="button" onclick="closeModal()" class="btn-outline">ยกเลิก</button>
      <button type="submit" class="btn-primary">สร้างจุดตรวจ</button>
    </div>
  `;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    fd.stickerStatus = 'Active';
    fd.scanCount = 0;
    await postToGas({ action: 'saveCheckpoint', payload: fd });
    closeModal();
    loadAllData(true);
  };
  document.getElementById('appModal').classList.remove('hidden');
}

function openWorkOrderModal(assetId = '') {
  document.getElementById('modalTitle').textContent = 'เปิดใบแจ้งซ่อม (Work Order)';
  const form = document.getElementById('modalForm');
  form.innerHTML = `
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-xs font-semibold">เลขที่ใบงาน</label><input name="woId" required value="WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random()*900)}" class="input-text mt-1"></div>
      <div><label class="text-xs font-semibold">รหัสอุปกรณ์</label><input name="assetId" required value="${assetId}" class="input-text mt-1"></div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-xs font-semibold">ความเร่งด่วน</label>
        <select name="priority" class="input-select mt-1">
          <option>เร่งด่วนมาก</option><option>เร่งด่วน</option><option>ปานกลาง</option>
        </select>
      </div>
      <div><label class="text-xs font-semibold">สถานะใบงาน</label>
        <select name="status" class="input-select mt-1">
          <option>รอจัดสรรช่าง</option><option>กำลังซ่อม</option><option>เสร็จแล้ว-รอตรวจรับ</option><option>ปิดงานแล้ว</option>
        </select>
      </div>
    </div>
    <div><label class="text-xs font-semibold">อาการชำรุด *</label><input name="symptom" required class="input-text mt-1"></div>
    <div><label class="text-xs font-semibold">การดำเนินการ</label><input name="actionTaken" class="input-text mt-1" placeholder="เช่น ส่งอัดแรงดัน / เปลี่ยนอะไหล่"></div>
    <div class="grid grid-cols-3 gap-3">
      <div><label class="text-xs font-semibold">ผู้รับผิดชอบ / ช่าง</label><input name="technician" class="input-text mt-1"></div>
      <div><label class="text-xs font-semibold">เบอร์โทรช่าง</label><input name="technicianPhone" class="input-text mt-1"></div>
      <div><label class="text-xs font-semibold">ค่าใช้จ่าย (บาท)</label><input name="cost" type="number" value="0" class="input-text mt-1"></div>
    </div>
    <div class="pt-3 flex justify-end gap-2">
      <button type="button" onclick="closeModal()" class="btn-outline">ยกเลิก</button>
      <button type="submit" class="btn-primary">บันทึกใบแจ้งซ่อม</button>
    </div>
  `;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    fd.dateReported = new Date().toLocaleDateString('th-TH');
    await postToGas({ action: 'saveWorkOrder', payload: fd });
    closeModal();
    loadAllData(true);
  };
  document.getElementById('appModal').classList.remove('hidden');
}

function openApprovalModal() {
  document.getElementById('modalTitle').textContent = 'ลงนามอนุมัติผลตรวจประจำเดือน (สป.1)';
  const form = document.getElementById('modalForm');
  form.innerHTML = `
    <div><label class="text-xs font-semibold">รอบเดือนที่รับรอง</label><input name="period" required value="กันยายน 2569" class="input-text mt-1"></div>
    <div><label class="text-xs font-semibold">ชื่อ-สกุล จป. วิชาชีพ</label><input name="approverName" required value="นายสมศักดิ์ มั่นคง" class="input-text mt-1"></div>
    <div><label class="text-xs font-semibold">เลขที่ใบอนุญาต จป.</label><input name="licenseNo" required value="จป.ว-55941" class="input-text mt-1"></div>
    <div class="pt-3 flex justify-end gap-2">
      <button type="button" onclick="closeModal()" class="btn-outline">ยกเลิก</button>
      <button type="submit" class="btn-primary">ยืนยันลงนามดิจิทัล</button>
    </div>
  `;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    fd.approvalId = 'APP-' + Date.now();
    fd.type = 'สป.1';
    fd.status = 'อนุมัติแล้ว';
    await postToGas({ action: 'saveApproval', payload: fd });
    closeModal();
    loadAllData(true);
  };
  document.getElementById('appModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('appModal').classList.add('hidden');
}

// ==========================================
// EXPORT & UI HELPERS
// ==========================================
function exportExcel(type) {
  const rows = type === 'assets' ? APP_DATA.assets : APP_DATA.inspections;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type);
  XLSX.writeFile(wb, `Safety_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function statusBadge(status) {

  const cls = map[status] || 'bg-slate-100 text-slate-600';
  return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold ${cls}">${status || '-'}</span>`;
}

function typeBadgeClass(type) {
  if (type === 'ถังดับเพลิง') return 'bg-indigo-50 text-indigo-700';
  if (type === 'ไฟฉุกเฉิน') return 'bg-sky-50 text-sky-700';
  return 'bg-emerald-50 text-emerald-700';
}
  const map = {
    'ปกติ': 'bg-emerald-100 text-emerald-700',
    'Active': 'bg-emerald-100 text-emerald-700',
    'ปิดงานแล้ว': 'bg-emerald-100 text-emerald-700',
    'เสร็จแล้ว-รอตรวจรับ': 'bg-teal-100 text-teal-700',
    'กำลังซ่อม': 'bg-indigo-100 text-indigo-700',
    'รอจัดสรรช่าง': 'bg-amber-100 text-amber-700',
    'พบข้อบกพร่อง': 'bg-red-100 text-red-700',
    'Damaged': 'bg-red-100 text-red-700',
    'ยังไม่ตรวจ': 'bg-amber-100 text-amber-700',
    'Pending': 'bg-amber-100 text-amber-700'
  };
