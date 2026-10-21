// ==================== STATE MANAGEMENT ====================
let dataSampah = JSON.parse(localStorage.getItem('eco_data_sampah')) || {
  paruh1: Array(15).fill(null),
  paruh2: Array(15).fill(null)
};

let arsipTahunan = JSON.parse(localStorage.getItem('eco_arsip_tahunan')) || [];
let chartInstance = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  renderTableRows();
  loadSavedInputs();
  updateProgressAndState();
  initChart();
  renderArsipTahunan();
});

// ==================== 1. MULTI-PAGE SPA NAVIGATION ====================
function switchPage(pageId) {
  // Navigation active state
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(pageId));
  });

  // Page view visibility
  document.querySelectorAll('.page-view').forEach(page => {
    page.classList.remove('active');
  });

  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Close mobile drawer if open
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) drawer.classList.remove('open');

  // Scroll to top smooth
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNavbar() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawer = document.getElementById('mobileDrawer');

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => drawer.classList.add('open'));
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => drawer.classList.remove('open'));
}

// ==================== 2. RENDER TABLES & INPUT UX ====================
function renderTableRows() {
  const tbody1 = document.getElementById('tbodyParuh1');
  const tbody2 = document.getElementById('tbodyParuh2');
  
  const today = new Date();
  const monthName = today.toLocaleString('id-ID', { month: 'short' });

  // Paruh 1 (Hari 1 - 15)
  let html1 = '';
  for (let i = 1; i <= 15; i++) {
    html1 += `
      <tr>
        <td><strong>Hari ${i}</strong></td>
        <td style="color:#64748b;">${i} ${monthName}</td>
        <td>
          <input type="number" step="0.1" min="0" 
            class="input-num" 
            data-paruh="1" 
            data-index="${i - 1}" 
            placeholder="0.0">
        </td>
      </tr>
    `;
  }
  tbody1.innerHTML = html1;

  // Paruh 2 (Hari 16 - 30)
  let html2 = '';
  for (let i = 16; i <= 30; i++) {
    html2 += `
      <tr>
        <td><strong>Hari ${i}</strong></td>
        <td style="color:#64748b;">${i} ${monthName}</td>
        <td>
          <input type="number" step="0.1" min="0" 
            class="input-num" 
            data-paruh="2" 
            data-index="${i - 16}" 
            placeholder="0.0">
        </td>
      </tr>
    `;
  }
  tbody2.innerHTML = html2;

  setupInputUXListeners();
}

// Mencegah scroll mouse wheel mengubah angka & Tombol Enter untuk berpindah baris
function setupInputUXListeners() {
  const inputs = Array.from(document.querySelectorAll('.input-num'));

  inputs.forEach((input, idx) => {
    // 1. Matikan perubahan nilai akibat scroll wheel mouse
    input.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });

    // 2. Event Input Change
    input.addEventListener('input', handleInputChange);

    // 3. Tombol Enter untuk berpindah ke baris input berikutnya
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (idx + 1 < inputs.length) {
          inputs[idx + 1].focus();
          inputs[idx + 1].select();
        } else {
          input.blur();
        }
      }
    });
  });
}

function loadSavedInputs() {
  const inputs = document.querySelectorAll('.input-num');
  inputs.forEach(input => {
    const paruh = input.dataset.paruh;
    const idx = parseInt(input.dataset.index);
    const val = paruh === '1' ? dataSampah.paruh1[idx] : dataSampah.paruh2[idx];
    if (val !== null && val !== undefined) {
      input.value = val;
    }
  });
}

function handleInputChange(e) {
  const input = e.target;
  const paruh = input.dataset.paruh;
  const idx = parseInt(input.dataset.index);
  const val = input.value !== '' ? parseFloat(input.value) : null;

  if (paruh === '1') {
    dataSampah.paruh1[idx] = val;
  } else {
    dataSampah.paruh2[idx] = val;
  }

  localStorage.setItem('eco_data_sampah', JSON.stringify(dataSampah));
  updateProgressAndState();
}

// ==================== 3. PROGRESS & LOCKING ====================
function updateProgressAndState() {
  const count1 = dataSampah.paruh1.filter(v => v !== null && v >= 0 && v !== '').length;
  const count2 = dataSampah.paruh2.filter(v => v !== null && v >= 0 && v !== '').length;
  const total = count1 + count2;

  document.getElementById('progressText').innerText = `${total} / 30 Hari`;
  document.getElementById('progressBarFill').style.width = `${(total / 30) * 100}%`;

  const cardParuh2 = document.getElementById('cardParuh2');
  const badgeParuh2 = document.getElementById('badgeParuh2');
  const btnHitung = document.getElementById('btnHitung');

  // Buka Paruh 2 jika Paruh 1 penuh (15 Hari)
  if (count1 >= 15) {
    cardParuh2.classList.remove('locked');
    badgeParuh2.className = 'badge badge-active';
    badgeParuh2.innerText = 'Aktif';
  } else {
    cardParuh2.classList.add('locked');
    badgeParuh2.className = 'badge badge-locked';
    badgeParuh2.innerText = 'Terkunci';
  }

  btnHitung.disabled = total < 30;
}

// ==================== 4. FITUR RESET ====================
function resetParuh(paruhNum) {
  if (confirm(`Apakah Anda yakin ingin menghapus semua data Paruh ${paruhNum}?`)) {
    if (paruhNum === 1) {
      dataSampah.paruh1 = Array(15).fill(null);
    } else {
      dataSampah.paruh2 = Array(15).fill(null);
    }
    localStorage.setItem('eco_data_sampah', JSON.stringify(dataSampah));
    loadSavedInputs();
    updateProgressAndState();
    document.getElementById('resultCard').classList.add('hidden');
  }
}

function resetSemuaBulanIni() {
  if (confirm('Apakah Anda yakin ingin mengosongkan seluruh data input bulan ini?')) {
    dataSampah = { paruh1: Array(15).fill(null), paruh2: Array(15).fill(null) };
    localStorage.setItem('eco_data_sampah', JSON.stringify(dataSampah));
    
    document.querySelectorAll('.input-num').forEach(inp => inp.value = '');
    updateProgressAndState();
    document.getElementById('resultCard').classList.add('hidden');
  }
}

// ==================== 5. CALCULATIONS ====================
function calculateResult() {
  const sum1 = dataSampah.paruh1.reduce((acc, c) => acc + (c || 0), 0);
  const sum2 = dataSampah.paruh2.reduce((acc, c) => acc + (c || 0), 0);

  const avg1 = sum1 / 15;
  const avg2 = sum2 / 15;

  let percent = 0;
  if (avg1 > 0) {
    percent = ((avg2 - avg1) / avg1) * 100;
  }

  document.getElementById('avgParuh1').innerText = `${avg1.toFixed(2)} kg/hari`;
  document.getElementById('avgParuh2').innerText = `${avg2.toFixed(2)} kg/hari`;
  document.getElementById('percentChange').innerText = `${Math.abs(percent).toFixed(1)}%`;

  const statusBadge = document.getElementById('statusBadge');
  const evalMsg = document.getElementById('evalMessage');

  if (percent < 0) {
    statusBadge.className = 'status-pill green';
    statusBadge.innerText = 'BERHASIL BERKURANG';
    evalMsg.innerText = `Sangat Baik! Terjadi penurunan volume sampah sebesar ${Math.abs(percent).toFixed(1)}% di paruh kedua. Program pencegahan sampah berjalan efektif.`;
  } else if (percent > 0) {
    statusBadge.className = 'status-pill red';
    statusBadge.innerText = 'VOLUME BERTAMBAH';
    evalMsg.innerText = `Perhatian! Volume sampah meningkat ${percent.toFixed(1)}%. Disarankan melakukan evaluasi ulang terhadap penggunaan plastik/kemasan di sekolah.`;
  } else {
    statusBadge.className = 'status-pill';
    statusBadge.innerText = 'STABIL';
    evalMsg.innerText = `Volume sampah dalam kondisi stabil tanpa kenaikan atau penurunan signifikan.`;
  }

  const resultCard = document.getElementById('resultCard');
  resultCard.classList.remove('hidden');
  resultCard.scrollIntoView({ behavior: 'smooth' });
}

// ==================== 6. EKSKUSI PDF BULANAN & TAHUNAN (CLEAN RENDER) ====================
function renderPDFTemplate(title, monthName, avg1, avg2, totalKg, percent, statusText, p1Data, p2Data) {
  let tableRows = '';
  for (let i = 0; i < 15; i++) {
    const v1 = p1Data && p1Data[i] !== null ? p1Data[i] : '-';
    const v2 = p2Data && p2Data[i] !== null ? p2Data[i] : '-';
    tableRows += `
      <tr>
        <td style="padding:6px; border:1px solid #cbd5e1;">Hari ${i + 1}</td>
        <td style="padding:6px; border:1px solid #cbd5e1; text-align:center;">${v1} kg</td>
        <td style="padding:6px; border:1px solid #cbd5e1;">Hari ${i + 16}</td>
        <td style="padding:6px; border:1px solid #cbd5e1; text-align:center;">${v2} kg</td>
      </tr>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; padding:20px; color:#0f172a; background:#fff;">
      <div style="border-bottom:2px solid #10b981; padding-bottom:12px; margin-bottom:16px;">
        <h2 style="color:#047857; margin:0;">${title}</h2>
        <p style="margin:4px 0 0; color:#64748b; font-size:14px;">Platform Eco-Tracker — Laporan Resmi Sekolah</p>
      </div>

      <table style="width:100%; margin-bottom:16px; font-size:13px; background:#f8fafc; padding:10px; border-radius:6px;">
        <tr>
          <td><strong>Periode Laporan:</strong> ${monthName}</td>
          <td><strong>Total Akumulasi:</strong> ${totalKg} kg</td>
        </tr>
        <tr>
          <td><strong>Rata-Rata Paruh 1:</strong> ${avg1.toFixed(2)} kg/hari</td>
          <td><strong>Rata-Rata Paruh 2:</strong> ${avg2.toFixed(2)} kg/hari</td>
        </tr>
        <tr>
          <td><strong>Status Hasil:</strong> ${statusText} (${Math.abs(percent).toFixed(1)}%)</td>
          <td><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID')}</td>
        </tr>
      </table>

      <h4 style="margin-bottom:8px; color:#0f172a;">Rincian Data Input Harian (30 Hari)</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
        <thead>
          <tr style="background:#e2e8f0; color:#0f172a;">
            <th style="padding:6px; border:1px solid #cbd5e1;">Hari (Paruh 1)</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Berat</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Hari (Paruh 2)</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Berat</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div style="margin-top:30px; text-align:right; font-size:12px;">
        <p style="margin-bottom:50px;">Mengetahui, <br><strong>Pembina Lingkungan Sekolah</strong></p>
        <p>__________________________</p>
      </div>
    </div>
  `;
}

function downloadCurrentMonthPDF() {
  const sum1 = dataSampah.paruh1.reduce((acc, c) => acc + (c || 0), 0);
  const sum2 = dataSampah.paruh2.reduce((acc, c) => acc + (c || 0), 0);
  const avg1 = sum1 / 15;
  const avg2 = sum2 / 15;
  const total = sum1 + sum2;
  const percent = avg1 > 0 ? ((avg2 - avg1) / avg1) * 100 : 0;
  const status = percent < 0 ? "BERHASIL BERKURANG" : (percent > 0 ? "VOLUME BERTAMBAH" : "STABIL");

  const monthName = new Date().toLocaleString('id-ID', { month: 'Long', year: 'numeric' });
  const htmlContent = renderPDFTemplate("LAPORAN EVALUASI SAMPAH BULANAN", monthName, avg1, avg2, total.toFixed(1), percent, status, dataSampah.paruh1, dataSampah.paruh2);

  const container = document.getElementById('pdfExportContainer');
  container.innerHTML = htmlContent;
  container.style.display = 'block';

  const opt = {
    margin: 8,
    filename: `Laporan_Sampah_${monthName.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).save().then(() => {
    container.style.display = 'none';
  });
}

// Download PDF untuk bulan spesifik dari Arsip
function downloadArchivedMonthPDF(index) {
  const item = arsipTahunan[index];
  if (!item) return;

  const htmlContent = renderPDFTemplate("LAPORAN HISTORI ARSIP BULANAN", item.bulan, item.avg1, item.avg2, item.total, item.percent, item.status, item.p1Data, item.p2Data);

  const container = document.getElementById('pdfExportContainer');
  container.innerHTML = htmlContent;
  container.style.display = 'block';

  const opt = {
    margin: 8,
    filename: `Arsip_Laporan_${item.bulan}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).save().then(() => {
    container.style.display = 'none';
  });
}

// ==================== 7. ARSIP TAHUNAN & CHART ====================
function saveToYearlyArchive() {
  const sum1 = dataSampah.paruh1.reduce((acc, c) => acc + (c || 0), 0);
  const sum2 = dataSampah.paruh2.reduce((acc, c) => acc + (c || 0), 0);
  const avg1 = sum1 / 15;
  const avg2 = sum2 / 15;
  const totalKg = Math.round(sum1 + sum2);
  const percent = avg1 > 0 ? ((avg2 - avg1) / avg1) * 100 : 0;

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentMonthName = monthNames[arsipTahunan.length % 12];

  let statusText = 'Stabil';
  if (percent < 0) statusText = 'Berkurang';
  if (percent > 0) statusText = 'Bertambah';

  // Simpan lengkap beserta snapshot data harian agar PDF per bulan bisa dirender kapan saja nanti
  arsipTahunan.push({
    bulan: `${currentMonthName} ${new Date().getFullYear()}`,
    total: totalKg,
    avg1: avg1,
    avg2: avg2,
    percent: percent,
    status: statusText,
    p1Data: [...dataSampah.paruh1],
    p2Data: [...dataSampah.paruh2]
  });

  localStorage.setItem('eco_arsip_tahunan', JSON.stringify(arsipTahunan));

  // Reset input bulan aktif
  dataSampah = { paruh1: Array(15).fill(null), paruh2: Array(15).fill(null) };
  localStorage.setItem('eco_data_sampah', JSON.stringify(dataSampah));

  loadSavedInputs();
  updateProgressAndState();
  document.getElementById('resultCard').classList.add('hidden');
  renderArsipTahunan();
  updateChart();

  alert(`Data bulan ${currentMonthName} telah berhasil dikunci & masuk Arsip Tahunan! PDF Laporan bulan tersebut sekarang bisa diunduh kapan saja di menu Arsip Tahunan.`);
  switchPage('arsip');
}

function renderArsipTahunan() {
  const tbody = document.getElementById('tbodyArsipTahunan');
  if (!tbody) return;

  if (arsipTahunan.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px;">Belum ada arsip bulanan yang disimpan.</td></tr>`;
    return;
  }

  let html = '';
  arsipTahunan.forEach((item, idx) => {
    html += `
      <tr>
        <td><strong>${item.bulan}</strong></td>
        <td>${item.avg1.toFixed(2)} kg/hr</td>
        <td>${item.avg2.toFixed(2)} kg/hr</td>
        <td><strong>${item.total} kg</strong></td>
        <td><span class="badge ${item.status === 'Berkurang' ? 'badge-active' : 'badge-locked'}">${item.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="downloadArchivedMonthPDF(${idx})">
            <i class="fa-solid fa-file-pdf"></i> Unduh PDF Bulan Ini
          </button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function initChart() {
  const ctx = document.getElementById('yearlyChart');
  if (!ctx) return;

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: arsipTahunan.length ? arsipTahunan.map(a => a.bulan) : ['Belum Ada Data'],
      datasets: [{
        label: 'Total Sampah Bulanan (kg)',
        data: arsipTahunan.length ? arsipTahunan.map(a => a.total) : [0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function updateChart() {
  if (!chartInstance) return;
  chartInstance.data.labels = arsipTahunan.map(a => a.bulan);
  chartInstance.data.datasets[0].data = arsipTahunan.map(a => a.total);
  chartInstance.update();
}

function resetYearlyData() {
  if (confirm('Apakah Anda yakin ingin menghapus SELURUH histori arsip tahunan?')) {
    arsipTahunan = [];
    localStorage.removeItem('eco_arsip_tahunan');
    renderArsipTahunan();
    updateChart();
  }
}

function downloadYearlyPDF() {
  if (arsipTahunan.length === 0) {
    alert('Belum ada data arsip bulanan untuk diunduh.');
    return;
  }

  let tableRows = '';
  arsipTahunan.forEach(item => {
    tableRows += `
      <tr>
        <td style="padding:8px; border:1px solid #cbd5e1;">${item.bulan}</td>
        <td style="padding:8px; border:1px solid #cbd5e1;">${item.avg1.toFixed(2)} kg/hr</td>
        <td style="padding:8px; border:1px solid #cbd5e1;">${item.avg2.toFixed(2)} kg/hr</td>
        <td style="padding:8px; border:1px solid #cbd5e1;">${item.total} kg</td>
        <td style="padding:8px; border:1px solid #cbd5e1;">${item.status} (${Math.abs(item.percent).toFixed(1)}%)</td>
      </tr>
    `;
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding:20px; color:#0f172a; background:#fff;">
      <h2 style="color:#047857; margin-bottom:4px;">REKAPITULASI LAPORAN TAHUNAN SAMPAH SEKOLAH</h2>
      <p style="color:#64748b; font-size:13px; margin-bottom:20px;">Platform Eco-Tracker — Laporan Konsolidasi 12 Bulan</p>
      
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
        <thead>
          <tr style="background:#e2e8f0; color:#0f172a;">
            <th style="padding:8px; border:1px solid #cbd5e1;">Bulan</th>
            <th style="padding:8px; border:1px solid #cbd5e1;">Rata-Rata Paruh 1</th>
            <th style="padding:8px; border:1px solid #cbd5e1;">Rata-Rata Paruh 2</th>
            <th style="padding:8px; border:1px solid #cbd5e1;">Total Sampah</th>
            <th style="padding:8px; border:1px solid #cbd5e1;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;

  const container = document.getElementById('pdfExportContainer');
  container.innerHTML = htmlContent;
  container.style.display = 'block';

  html2pdf().set({
    margin: 10,
    filename: 'Rekapitulasi_Tahunan_EcoTracker.pdf',
    html2canvas: { scale: 2 }
  }).from(container).save().then(() => {
    container.style.display = 'none';
  });
}
