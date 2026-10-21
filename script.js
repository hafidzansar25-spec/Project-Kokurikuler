// ==================== STATE & STORAGE UTAMA ====================
let dataSampah = JSON.parse(localStorage.getItem('eco_data_sampah')) || {
  paruh1: Array(15).fill(null),
  paruh2: Array(15).fill(null)
};

let arsipTahunan = JSON.parse(localStorage.getItem('eco_arsip_tahunan')) || [];

let chartInstance = null;

// ==================== INISIALISASI SAAT DOM READY ====================
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  renderTableRows();
  loadSavedDataToInput();
  updateProgressAndState();
  initChart();
  renderArsipTahunan();
  setupEventListeners();
});

// ==================== 1. NAVIGASI RESPONSIF (DRAWER MOBILE) ====================
function initNavbar() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
    });
  }

  if (closeDrawerBtn && mobileDrawer) {
    closeDrawerBtn.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
    });
  }

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
    });
  });
}

// ==================== 2. GENERATE ROW TABEL PARUH HARI ====================
function renderTableRows() {
  const tbody1 = document.getElementById('tbodyParuh1');
  const tbody2 = document.getElementById('tbodyParuh2');
  
  const today = new Date();
  const currentMonth = today.toLocaleString('id-ID', { month: 'short' });

  // Generate 15 Hari Paruh Pertama
  let html1 = '';
  for (let i = 1; i <= 15; i++) {
    html1 += `
      <tr>
        <td>Hari ${i}</td>
        <td>${i} ${currentMonth}</td>
        <td>
          <input type="number" step="0.1" min="0" 
            class="input-weight" 
            data-paruh="1" 
            data-index="${i - 1}" 
            placeholder="0.0">
        </td>
      </tr>
    `;
  }
  tbody1.innerHTML = html1;

  // Generate 15 Hari Paruh Kedua
  let html2 = '';
  for (let i = 16; i <= 30; i++) {
    html2 += `
      <tr>
        <td>Hari ${i}</td>
        <td>${i} ${currentMonth}</td>
        <td>
          <input type="number" step="0.1" min="0" 
            class="input-weight" 
            data-paruh="2" 
            data-index="${i - 16}" 
            placeholder="0.0">
        </td>
      </tr>
    `;
  }
  tbody2.innerHTML = html2;
}

// ==================== 3. SYNC INPUT DENGAN STORAGE ====================
function loadSavedDataToInput() {
  const inputs = document.querySelectorAll('.input-weight');
  inputs.forEach(input => {
    const paruh = input.dataset.paruh;
    const index = parseInt(input.dataset.index);
    const value = paruh === '1' ? dataSampah.paruh1[index] : dataSampah.paruh2[index];
    
    if (value !== null && value !== undefined) {
      input.value = value;
    }
  });
}

function handleInputChange(e) {
  const input = e.target;
  const paruh = input.dataset.paruh;
  const index = parseInt(input.dataset.index);
  const val = input.value !== '' ? parseFloat(input.value) : null;

  if (paruh === '1') {
    dataSampah.paruh1[index] = val;
  } else {
    dataSampah.paruh2[index] = val;
  }

  // Simpan ke local storage
  localStorage.setItem('eco_data_sampah', JSON.stringify(dataSampah));
  updateProgressAndState();
}

// ==================== 4. PROGRES & OTOMATISASI UNLOCK ====================
function updateProgressAndState() {
  const count1 = dataSampah.paruh1.filter(v => v !== null && v >= 0 && v !== '').length;
  const count2 = dataSampah.paruh2.filter(v => v !== null && v >= 0 && v !== '').length;
  const totalCount = count1 + count2;

  // Update UI Progres
  const percentProgress = Math.round((totalCount / 30) * 100);
  document.getElementById('progressText').innerText = `${totalCount} / 30 Hari`;
  document.getElementById('progressBarFill').style.width = `${percentProgress}%`;

  const cardParuh2 = document.getElementById('cardParuh2');
  const badgeParuh2 = document.getElementById('badgeParuh2');
  const btnHitung = document.getElementById('btnHitung');

  // Jika Paruh Pertama Lengkap (15 hari) -> Buka Paruh Kedua
  if (count1 >= 15) {
    cardParuh2.classList.remove('table-locked');
    badgeParuh2.className = 'badge badge-active';
    badgeParuh2.innerText = 'Sedang Aktif';
  } else {
    cardParuh2.classList.add('table-locked');
    badgeParuh2.className = 'badge badge-locked';
    badgeParuh2.innerText = 'Terkunci';
  }

  // Jika Data 30 Hari Lengkap -> Aktifkan Tombol Hitung
  if (totalCount >= 30) {
    btnHitung.disabled = false;
  } else {
    btnHitung.disabled = true;
  }
}

// ==================== 5. ALGORITMA KALKULASI ====================
function calculateResult() {
  const sum1 = dataSampah.paruh1.reduce((acc, curr) => acc + (curr || 0), 0);
  const sum2 = dataSampah.paruh2.reduce((acc, curr) => acc + (curr || 0), 0);

  const avg1 = sum1 / 15;
  const avg2 = sum2 / 15;

  let percent = 0;
  if (avg1 > 0) {
    percent = ((avg2 - avg1) / avg1) * 100;
  }

  // Element UI Hasil
  const resultCard = document.getElementById('resultCard');
  const statusBadge = document.getElementById('statusBadge');
  const avgParuh1El = document.getElementById('avgParuh1');
  const avgParuh2El = document.getElementById('avgParuh2');
  const percentChangeEl = document.getElementById('percentChange');
  const evalMessageEl = document.getElementById('evalMessage');

  avgParuh1El.innerText = `${avg1.toFixed(2)} kg/hari`;
  avgParuh2El.innerText = `${avg2.toFixed(2)} kg/hari`;
  percentChangeEl.innerText = `${Math.abs(percent).toFixed(1)}%`;

  if (percent < 0) {
    statusBadge.className = 'status-badge status-green';
    statusBadge.innerText = 'BERHASIL BERKURANG';
    evalMessageEl.innerText = `Sangat baik! Volume sampah berkurang ${Math.abs(percent).toFixed(1)}% di paruh kedua. Program pemilahan sampah di sekolah berjalan efektif.`;
  } else if (percent > 0) {
    statusBadge.className = 'status-badge status-red';
    statusBadge.innerText = 'VOLUME BERTAMBAH';
    evalMessageEl.innerText = `Perhatian! Terjadi kenaikan volume sampah sebesar ${percent.toFixed(1)}%. Disarankan untuk mengevaluasi kembali penggunaan kemasan sekali pakai di lingkungan sekolah.`;
  } else {
    statusBadge.className = 'status-badge';
    statusBadge.innerText = 'STABIL';
    evalMessageEl.innerText = `Volume sampah tergolong stabil tanpa perubahan signifikan dibanding paruh pertama.`;
  }

  resultCard.classList.remove('hidden');
  resultCard.scrollIntoView({ behavior: 'smooth' });
}

// ==================== 6. EKSKUSI PDF ====================
function generatePDF() {
  const element = document.getElementById('resultCard');
  const opt = {
    margin:       10,
    filename:     'Laporan_Sampah_Bulanan_EcoTracker.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

// ==================== 7. MANAJEMEN ARSIP TAHUNAN ====================
function saveToYearlyArchive() {
  const sum1 = dataSampah.paruh1.reduce((acc, curr) => acc + (curr || 0), 0);
  const sum2 = dataSampah.paruh2.reduce((acc, curr) => acc + (curr || 0), 0);
  const totalKg = Math.round(sum1 + sum2);

  const namaBulanList = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const bulanIndex = arsipTahunan.length % 12;
  const namaBulan = namaBulanList[bulanIndex];

  const avg1 = sum1 / 15;
  const avg2 = sum2 / 15;
  let statusText = 'Stabil';
  if (avg2 < avg1) statusText = 'Berkurang';
  if (avg2 > avg1) statusText = 'Bertambah';

  arsipTahunan.push({
    bulan: namaBulan,
    total: totalKg,
    status: statusText
  });

  localStorage.setItem('eco_arsip_tahunan', JSON.stringify(arsipTahunan));

  // Reset data harian
  dataSampah = { paruh1: Array(15).fill(null), paruh2: Array(15).fill(null) };
  localStorage.setItem('eco_data_sampah', JSON.stringify(dataSampah));

  loadSavedDataToInput();
  updateProgressAndState();
  document.getElementById('resultCard').classList.add('hidden');
  renderArsipTahunan();
  updateChart();

  alert(`Data bulan ${namaBulan} berhasil disimpan ke Arsip Tahunan! Tracker harian telah di-reset.`);
}

function renderArsipTahunan() {
  const tbody = document.getElementById('tbodyArsipTahunan');
  if (!tbody) return;

  if (arsipTahunan.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#888;">Belum ada arsip bulanan.</td></tr>`;
    return;
  }

  let html = '';
  arsipTahunan.forEach(item => {
    html += `
      <tr>
        <td>${item.bulan}</td>
        <td>${item.total} kg</td>
        <td><strong>${item.status}</strong></td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// ==================== 8. CHART.JS INTEGRATION ====================
function initChart() {
  const ctx = document.getElementById('yearlyChart');
  if (!ctx) return;

  const labels = arsipTahunan.map(item => item.bulan);
  const data = arsipTahunan.map(item => item.total);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Belum Ada Data'],
      datasets: [{
        label: 'Total Sampah (kg)',
        data: data.length ? data : [0],
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function updateChart() {
  if (!chartInstance) return;
  chartInstance.data.labels = arsipTahunan.map(item => item.bulan);
  chartInstance.data.datasets[0].data = arsipTahunan.map(item => item.total);
  chartInstance.update();
}

function resetYearlyData() {
  if (confirm('Apakah kamu yakin ingin mengosongkan seluruh arsip data tahunan?')) {
    arsipTahunan = [];
    localStorage.removeItem('eco_arsip_tahunan');
    renderArsipTahunan();
    updateChart();
    alert('Arsip data tahunan berhasil di-reset.');
  }
}

// ==================== 9. EVENT LISTENERS SETUP ====================
function setupEventListeners() {
  const inputs = document.querySelectorAll('.input-weight');
  inputs.forEach(input => {
    input.addEventListener('input', handleInputChange);
  });

  const btnHitung = document.getElementById('btnHitung');
  if (btnHitung) btnHitung.addEventListener('click', calculateResult);

  const btnDownloadPDF = document.getElementById('btnDownloadPDF');
  if (btnDownloadPDF) btnDownloadPDF.addEventListener('click', generatePDF);

  const btnSimpanKeArsip = document.getElementById('btnSimpanKeArsip');
  if (btnSimpanKeArsip) btnSimpanKeArsip.addEventListener('click', saveToYearlyArchive);

  const btnResetTahunan = document.getElementById('btnResetTahunan');
  if (btnResetTahunan) btnResetTahunan.addEventListener('click', resetYearlyData);

  const btnDownloadYearlyPDF = document.getElementById('btnDownloadYearlyPDF');
  if (btnDownloadYearlyPDF) {
    btnDownloadYearlyPDF.addEventListener('click', () => {
      const element = document.querySelector('.summary-card');
      html2pdf().from(element).save('Laporan_Tahunan_EcoTracker.pdf');
    });
  }
}
