let rowCounter = 0;
let auditData = [];

// Categories for audit
const categories = [
    'Kebersihan',
    'Keselamatan Kerja',
    'Kualitas Produk',
    'Peralatan',
    'Dokumentasi',
    'Lingkungan Kerja',
    'Proses Produksi',
    'Material Storage',
    'Maintenance',
    'Training & Competency'
];

// Initialize with sample data
function initializeApp() {
    // Add some sample rows
    for (let i = 1; i <= 3; i++) {
        addRow();
    }
    updateSummary();
    showToast('Aplikasi berhasil dimuat!', 'success');
}

// Add new row to audit table
function addRow() {
    rowCounter++;
    const tbody = document.getElementById('auditTableBody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${rowCounter}</td>
        <td>
            <select class="table-select" onchange="updateSummary()">
                <option value="">Pilih Kategori</option>
                ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
        </td>
        <td>
            <input type="text" class="table-input" placeholder="Masukkan item audit" onchange="updateSummary()">
        </td>
        <td>
            <input type="number" class="table-input" min="0" max="100" placeholder="100" value="100" onchange="updateSummary()">
        </td>
        <td>
            <input type="number" class="table-input" min="0" max="100" placeholder="0" onchange="updateSummary()">
        </td>
        <td>
            <input type="text" class="table-input" placeholder="Keterangan tambahan">
        </td>
        <td>
            <button class="delete-btn" onclick="deleteRow(this)" title="Hapus baris">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    updateRowNumbers();
    updateSummary();
}

// Delete row from table
function deleteRow(button) {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        button.closest('tr').remove();
        updateRowNumbers();
        updateSummary();
        showToast('Item berhasil dihapus!', 'success');
    }
}

// Update row numbers after deletion
function updateRowNumbers() {
    const rows = document.querySelectorAll('#auditTableBody tr');
    rows.forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
    rowCounter = rows.length;
}

// Update summary statistics
function updateSummary() {
    const rows = document.querySelectorAll('#auditTableBody tr');
    let totalItems = rows.length;
    let totalScore = 0;
    let maxScore = 0;

    rows.forEach(row => {
        const maxVal = parseFloat(row.cells[3].querySelector('input').value) || 0;
        const actualVal = parseFloat(row.cells[4].querySelector('input').value) || 0;
        
        maxScore += maxVal;
        totalScore += actualVal;
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalScore').textContent = totalScore;
    document.getElementById('maxScore').textContent = maxScore;
    document.getElementById('percentage').textContent = percentage + '%';
}

// Collect all data from form
function collectData() {
    const data = {
        auditorInfo: {
            nama: document.getElementById('auditorName').value,
            line: document.getElementById('line').value,
            model: document.getElementById('model').value,
            style: document.getElementById('style').value,
            tanggal: new Date().toLocaleDateString('id-ID'),
            waktu: new Date().toLocaleTimeString('id-ID')
        },
        auditItems: []
    };

    const rows = document.querySelectorAll('#auditTableBody tr');
    rows.forEach((row, index) => {
        const kategori = row.cells[1].querySelector('select').value;
        const audit = row.cells[2].querySelector('input').value;
        const nilaiMaksimal = row.cells[3].querySelector('input').value;
        const nilaiAktual = row.cells[4].querySelector('input').value;
        const keterangan = row.cells[5].querySelector('input').value;

        if (kategori || audit) {  // Only add rows with data
            data.auditItems.push({
                no: index + 1,
                kategori,
                audit,
                nilaiMaksimal: parseFloat(nilaiMaksimal) || 0,
                nilaiAktual: parseFloat(nilaiAktual) || 0,
                keterangan
            });
        }
    });

    return data;
}

// Save data to localStorage
function saveData() {
    try {
        const data = collectData();
        
        // Validation
        if (!data.auditorInfo.nama) {
            throw new Error('Nama auditor harus diisi!');
        }
        if (!data.auditorInfo.line) {
            throw new Error('Line production harus dipilih!');
        }
        if (data.auditItems.length === 0) {
            throw new Error('Minimal harus ada satu item audit!');
        }

        localStorage.setItem('auditData', JSON.stringify(data));
        showToast('Data berhasil disimpan!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Export data to Excel with proper formatting (Alternative method)
function exportToExcel() {
    try {
        showLoading(true);
        
        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            throw new Error('Library Excel belum dimuat! Refresh halaman dan coba lagi.');
        }
        
        const data = collectData();
        
        // Validation
        if (!data.auditorInfo.nama) {
            throw new Error('Nama auditor harus diisi!');
        }
        if (data.auditItems.length === 0) {
            throw new Error('Tidak ada data audit untuk diekspor!');
        }

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Method 1: Create formatted Excel data
        const excelData = [];
        
        // Header information with proper formatting
        excelData.push([`Nama Auditor : ${data.auditorInfo.nama}`, '', '', '', '', '']);
        excelData.push([`Line : ${data.auditorInfo.line}`, '', '', '', '', '']);
        excelData.push([`Model : ${data.auditorInfo.model}`, '', '', '', '', '']);
        excelData.push([`Style : ${data.auditorInfo.style}`, '', '', '', '', '']);
        excelData.push(['']); // Empty row for spacing
        
        // Table headers
        excelData.push(['No', 'Kategori', 'Audit', 'Value', 'Nilai', 'Keterangan']);
        
        // Data rows
        data.auditItems.forEach((item, index) => {
            excelData.push([
                index + 1,
                item.kategori || '',
                item.audit || '',
                item.nilaiMaksimal || 0,
                item.nilaiAktual || 0,
                item.keterangan || ''
            ]);
        });

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 8 },   // No
            { wch: 20 },  // Kategori
            { wch: 35 },  // Audit
            { wch: 15 },  // Value
            { wch: 15 },  // Nilai
            { wch: 30 }   // Keterangan
        ];

        // Merge cells for header information
        worksheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Nama Auditor
            { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Line
            { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Model
            { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }  // Style
        ];

        // Add borders and basic formatting
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                
                if (!worksheet[cellAddress]) {
                    worksheet[cellAddress] = { t: 's', v: '' };
                }
                
                // Basic cell formatting
                if (!worksheet[cellAddress].s) {
                    worksheet[cellAddress].s = {};
                }
                
                // Add borders to all cells
                worksheet[cellAddress].s.border = {
                    top: { style: 'thin', color: { rgb: '000000' } },
                    bottom: { style: 'thin', color: { rgb: '000000' } },
                    left: { style: 'thin', color: { rgb: '000000' } },
                    right: { style: 'thin', color: { rgb: '000000' } }
                };
                
                // Header rows (0-3) styling
                if (R <= 3) {
                    worksheet[cellAddress].s.font = { bold: true, size: 12 };
                    worksheet[cellAddress].s.fill = { fgColor: { rgb: 'E3F2FD' } };
                    worksheet[cellAddress].s.alignment = { horizontal: 'left', vertical: 'center' };
                }
                
                // Table header row (5) styling
                if (R === 5) {
                    worksheet[cellAddress].s.font = { bold: true, color: { rgb: 'FFFFFF' }, size: 11 };
                    worksheet[cellAddress].s.fill = { fgColor: { rgb: '2196F3' } };
                    worksheet[cellAddress].s.alignment = { horizontal: 'center', vertical: 'center' };
                }
                
                // Data rows styling with alternating colors
                if (R > 5) {
                    const isEvenRow = (R - 6) % 2 === 0;
                    worksheet[cellAddress].s.fill = { 
                        fgColor: { rgb: isEvenRow ? 'F8F9FA' : 'FFFFFF' } 
                    };
                    worksheet[cellAddress].s.alignment = { vertical: 'center' };
                }
            }
        }

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Form Audit');

        // Alternative: Create a second sheet with simple table format
        const simpleData = [
            ['MANUFACTURING AUDIT REPORT'],
            [''],
            [`Tanggal: ${data.auditorInfo.tanggal} ${data.auditorInfo.waktu}`],
            [`Auditor: ${data.auditorInfo.nama}`],
            [`Line: ${data.auditorInfo.line}`],
            [`Model: ${data.auditorInfo.model}`],
            [`Style: ${data.auditorInfo.style}`],
            [''],
            ['=== HASIL AUDIT ==='],
            ['No', 'Kategori', 'Item Audit', 'Nilai Maksimal', 'Nilai Aktual', 'Keterangan', 'Status'],
        ];

        data.auditItems.forEach((item, index) => {
            const status = item.nilaiAktual >= item.nilaiMaksimal * 0.8 ? 'BAIK' : 'PERLU PERBAIKAN';
            simpleData.push([
                index + 1,
                item.kategori,
                item.audit,
                item.nilaiMaksimal,
                item.nilaiAktual,
                item.keterangan,
                status
            ]);
        });

        // Add summary
        const totalScore = data.auditItems.reduce((sum, item) => sum + item.nilaiAktual, 0);
        const maxScore = data.auditItems.reduce((sum, item) => sum + item.nilaiMaksimal, 0);
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        
        simpleData.push(['']);
        simpleData.push(['SUMMARY']);
        simpleData.push(['Total Items:', data.auditItems.length]);
        simpleData.push(['Total Score:', totalScore]);
        simpleData.push(['Max Score:', maxScore]);
        simpleData.push(['Percentage:', percentage + '%']);

        const simpleSheet = XLSX.utils.aoa_to_sheet(simpleData);
        simpleSheet['!cols'] = [
            { wch: 8 }, { wch: 20 }, { wch: 35 }, { wch: 15 }, 
            { wch: 15 }, { wch: 30 }, { wch: 20 }
        ];
        
        XLSX.utils.book_append_sheet(workbook, simpleSheet, 'Ringkasan Audit');

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
        const lineName = data.auditorInfo.line.replace(/\s+/g, '_') || 'Unknown';
        const filename = `Audit_${lineName}_${timestamp}.xlsx`;

        console.log('Attempting to download file:', filename);
        
        // Try download
        try {
            XLSX.writeFile(workbook, filename);
            console.log('Excel file created successfully with table formatting');
        } catch (downloadError) {
            console.error('Standard download failed, trying alternative method:', downloadError);
            
            // Alternative blob method
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('Alternative download method used');
        }
        
        showLoading(false);
        showToast('File Excel berhasil diunduh dengan format tabel! Cek folder Downloads Anda.', 'success');
        
    } catch (error) {
        showLoading(false);
        console.error('Export error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}
        }
        
        showLoading(false);
        showToast('File Excel berhasil diunduh! Cek folder Downloads Anda.', 'success');
        
    } catch (error) {
        showLoading(false);
        console.error('Export error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// Show loading animation
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Load saved data on page load
function loadSavedData() {
    const savedData = localStorage.getItem('auditData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            // Load auditor info
            document.getElementById('auditorName').value = data.auditorInfo.nama || '';
            document.getElementById('line').value = data.auditorInfo.line || '';
            document.getElementById('model').value = data.auditorInfo.model || '';
            document.getElementById('style').value = data.auditorInfo.style || '';
            
            showToast('Data tersimpan berhasil dimuat!', 'success');
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadSavedData();
});

// Auto-save functionality
setInterval(saveData, 30000); // Auto-save every 30 seconds
