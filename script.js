document.addEventListener('DOMContentLoaded', function () {
    // === ELEMEN DOM ===
    const auditorNameEl = document.getElementById('auditorName');
    const lineEl = document.getElementById('productionLine');
    const modelEl = document.getElementById('productModel');
    const styleEl = document.getElementById('productStyle');

    const addRowBtn = document.getElementById('add-row-btn');
    const tableBody = document.getElementById('audit-table-body');

    const totalItemsEl = document.getElementById('total-items');
    const totalMaxValueEl = document.getElementById('total-max-value');
    const totalActualScoreEl = document.getElementById('total-actual-score');
    const finalScoreEl = document.getElementById('final-score');

    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');

    let rowCounter = 0;

    // === FUNGSI-FUNGSI UTAMA ===

    /**
     * Menambahkan baris baru ke tabel audit.
     * Inisialisasi baris dengan nilai default dan event listener.
     */
    function addAuditRow() {
        rowCounter++;
        const row = document.createElement('tr');
        row.setAttribute('data-row-id', rowCounter);
        row.innerHTML = `
            <td class="col-no">${rowCounter}</td>
            <td class="col-category">
                <input type="text" class="category-input" placeholder="e.g., Kebersihan Area">
            </td>
            <td class="col-audit">
                <input type="text" class="audit-point-input" placeholder="e.g., Lantai bebas dari debu">
            </td>
            <td class="col-value">
                <input type="number" class="max-value-input" min="0" value="10">
            </td>
            <td class="col-score">
                <input type="number" class="actual-score-input" min="0" value="0">
            </td>
            <td class="col-action">
                <button class="delete-row-btn" title="Hapus Baris"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        tableBody.appendChild(row);

        // Tambahkan event listener untuk tombol hapus pada baris baru
        row.querySelector('.delete-row-btn').addEventListener('click', function() {
            row.remove();
            updateSummary();
            renumberRows();
        });

        // Tambahkan event listener untuk input nilai agar summary terupdate
        row.querySelectorAll('.max-value-input, .actual-score-input').forEach(input => {
            input.addEventListener('input', updateSummary);
        });

        updateSummary();
    }

    /**
     * Mengatur ulang nomor urut pada tabel setelah baris dihapus.
     */
    function renumberRows() {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.querySelector('.col-no').textContent = index + 1;
        });
        rowCounter = rows.length;
    }

    /**
     * Memperbarui ringkasan skor (total item, total nilai, skor akhir).
     * Dipanggil setiap kali ada perubahan pada nilai di tabel.
     */
    function updateSummary() {
        const rows = tableBody.querySelectorAll('tr');
        let totalItems = rows.length;
        let totalMaxValue = 0;
        let totalActualScore = 0;

        rows.forEach(row => {
            const maxValue = parseFloat(row.querySelector('.max-value-input').value) || 0;
            const actualScore = parseFloat(row.querySelector('.actual-score-input').value) || 0;

            // Validasi agar nilai diberikan tidak melebihi nilai max
            const actualScoreInput = row.querySelector('.actual-score-input');
            if (actualScore > maxValue) {
                actualScoreInput.value = maxValue;
                totalActualScore += maxValue;
            } else {
                totalActualScore += actualScore;
            }

            totalMaxValue += maxValue;
        });

        const finalScore = (totalMaxValue > 0) ? (totalActualScore / totalMaxValue) * 100 : 0;

        totalItemsEl.textContent = totalItems;
        totalMaxValueEl.textContent = totalMaxValue;
        totalActualScoreEl.textContent = totalActualScore;
        finalScoreEl.textContent = `${finalScore.toFixed(2)}%`;
    }

    /**
     * Memvalidasi form informasi utama.
     * @returns {boolean} True jika valid, false jika tidak.
     */
    function validateInfoForm() {
        if (!auditorNameEl.value || !lineEl.value || !modelEl.value || !styleEl.value) {
            alert('Harap lengkapi semua informasi Auditor dan Produksi sebelum mengunduh laporan.');
            return false;
        }
        return true;
    }

    /**
     * Fungsi inti untuk mengunduh data sebagai file Excel.
     * Menggunakan library SheetJS (xlsx.js).
     */
    function downloadExcel() {
        if (!validateInfoForm()) return;
        if (tableBody.rows.length === 0) {
            alert('Tabel audit masih kosong. Harap tambahkan setidaknya satu baris audit.');
            return;
        }

        // 1. Siapkan Header untuk Excel
        const headers = [
            "No", "Kategori", "Poin yang Diaudit", "Nilai Max", "Nilai Diberikan"
        ];
        const auditData = [headers];

        // 2. Kumpulkan data dari setiap baris tabel
        tableBody.querySelectorAll('tr').forEach(row => {
            const rowData = [
                row.querySelector('.col-no').textContent,
                row.querySelector('.category-input').value,
                row.querySelector('.audit-point-input').value,
                parseInt(row.querySelector('.max-value-input').value) || 0,
                parseInt(row.querySelector('.actual-score-input').value) || 0
            ];
            auditData.push(rowData);
        });

        // 3. Buat Workbook dan Worksheet baru
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([]); // Mulai dengan sheet kosong

        // 4. Tambahkan informasi header audit
        const auditInfo = {
            "Nama Auditor": auditorNameEl.value,
            "Line Produksi": lineEl.value,
            "Model Produk": modelEl.value,
            "Style/Kode": styleEl.value,
            "Tanggal Audit": new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            "Waktu Audit": new Date().toLocaleTimeString('id-ID')
        };
        const summaryInfo = {
            "Total Nilai Tercapai": totalActualScoreEl.textContent,
            "Total Nilai Maksimal": totalMaxValueEl.textContent,
            "Skor Akhir Audit": finalScoreEl.textContent,
        };

        XLSX.utils.sheet_add_aoa(ws, [["LAPORAN AUDIT PRODUKSI"]], { origin: "A1" });
        // Menggunakan library untuk menambahkan data JSON ke sheet
        XLSX.utils.sheet_add_json(ws, [auditInfo], { origin: "A3", skipHeader: true });
        XLSX.utils.sheet_add_json(ws, [summaryInfo], { origin: "D3", skipHeader: true });
        
        // 5. Tambahkan data tabel audit
        XLSX.utils.sheet_add_aoa(ws, auditData, { origin: "A8" });

        // 6. Atur lebar kolom (opsional tapi sangat direkomendasikan)
        ws['!cols'] = [
            { wch: 5 },  // No
            { wch: 25 }, // Kategori
            { wch: 50 }, // Poin yang Diaudit
            { wch: 10 }, // Nilai Max
            { wch: 15 }  // Nilai Diberikan
        ];
        
        // 7. Tambahkan worksheet ke workbook
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Audit");

        // 8. Generate file dan trigger download
        const fileName = `Audit_${lineEl.value}_${modelEl.value}_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    /**
     * Mereset seluruh form ke keadaan awal.
     */
    function resetForm() {
        if (confirm('Apakah Anda yakin ingin mereset seluruh form? Semua data yang belum diunduh akan hilang.')) {
            document.getElementById('audit-meta-form').reset();
            tableBody.innerHTML = '';
            rowCounter = 0;
            updateSummary();
        }
    }

    // === EVENT LISTENERS ===
    addRowBtn.addEventListener('click', addAuditRow);
    downloadBtn.addEventListener('click', downloadExcel);
    resetBtn.addEventListener('click', resetForm);

    // === INISIALISASI ===
    // Tambahkan 3 baris awal untuk memudahkan pengguna
    addAuditRow();
    addAuditRow();
    addAuditRow();
});
