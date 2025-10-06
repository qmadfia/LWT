/**
 * @file script.js
 * @description Main logic for the Line Walk Through application.
 * @version 1.0.0
 */

// Menunggu hingga seluruh konten halaman (DOM) selesai dimuat
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // KONSTANTA DAN VARIABEL GLOBAL
    // =========================================================================

    /**
     * Kunci untuk menyimpan data di Local Storage.
     * @type {string}
     */
    const STORAGE_KEY = 'lineWalkThroughData';

    /**
     * Total baris/pair yang akan di-generate.
     * @type {number}
     */
    const TOTAL_PAIRS = 20;

    /**
     * Database sementara untuk relasi Style Number dan Model.
     * Di aplikasi nyata, ini bisa diambil dari server/API.
     * @type {Object.<string, string>}
     */
    const styleModelMap = {
        'STY001': 'Air Max 270',
        'STY002': 'Classic Cortez',
        'STY003': 'React Element 55',
        'STY004': 'VaporMax Flyknit',
        'STY005': 'Zoom Pegasus 38',
    };

    /**
     * Daftar tipe defect yang tersedia.
     * @type {string[]}
     */
    const defectTypes = [
        'Hairy', 'Damage', 'Stain', 'Cracked', 'Wrinkle',
        'Over Cement', 'Bonding Gap', 'Uneven Color', 'Stitching Issue', 'Component Missing'
    ];

    /**
     * Referensi ke elemen-elemen DOM utama.
     */
    const DOMElements = {
        validationCategory: document.getElementById('validation-category'),
        styleNumber: document.getElementById('style-number'),
        model: document.getElementById('model'),
        line: document.getElementById('line'),
        dataEntryBody: document.getElementById('data-entry-body'),
        saveButton: document.getElementById('save-button'),
        resetButton: document.getElementById('reset-button'),
        savedFilesList: document.getElementById('saved-files-list'),
        deleteModal: document.getElementById('delete-modal'),
        confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    };

    /**
     * Variabel untuk menyimpan ID file yang akan dihapus.
     * @type {string|null}
     */
    let fileIdToDelete = null;

    // =========================================================================
    // FUNGSI INISIALISASI
    // =========================================================================

    /**
     * Fungsi utama untuk menginisialisasi aplikasi.
     * @returns {void}
     */
    function initializeApp() {
        console.log("Initializing Line Walk Through App...");
        populateLineDropdown();
        generateDataEntryRows();
        setupEventListeners();
        renderSavedFiles();
        console.log("App initialized successfully.");
    }

    /**
     * Mengisi dropdown 'Line' dengan opsi yang ditentukan.
     * @returns {void}
     */
    function populateLineDropdown() {
        const lineSelect = DOMElements.line;
        // Generate line 101-116
        for (let i = 101; i <= 116; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            lineSelect.appendChild(option);
        }
        // Generate line 201-216
        for (let i = 201; i <= 216; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            lineSelect.appendChild(option);
        }
    }

    /**
     * Membuat baris-baris input data di dalam tabel secara dinamis.
     * @returns {void}
     */
    function generateDataEntryRows() {
        const tbody = DOMElements.dataEntryBody;
        tbody.innerHTML = ''; // Kosongkan tabel sebelum generate
        for (let i = 1; i <= TOTAL_PAIRS; i++) {
            const tr = document.createElement('tr');
            tr.dataset.pairNumber = i;

            // Kolom Pair Number
            const tdPair = document.createElement('td');
            tdPair.textContent = i;
            
            // Kolom Status OK/NG
            const tdStatus = document.createElement('td');
            const statusSelect = document.createElement('select');
            statusSelect.className = 'status-select';
            statusSelect.innerHTML = `
                <option value="OK">OK</option>
                <option value="NG">NG</option>
            `;
            tdStatus.appendChild(statusSelect);

            // Kolom Tipe Defect (Multi-select)
            const tdDefect = document.createElement('td');
            const defectInput = createMultiSelectDefectInput(i);
            tdDefect.appendChild(defectInput);
            
            // Default state: OK, defect input disabled
            toggleDefectInputState(defectInput, false);

            tr.append(tdPair, tdStatus, tdDefect);
            tbody.appendChild(tr);
        }
    }

    /**
     * Membuat komponen input multi-select untuk tipe defect.
     * @param {number} pairIndex - Nomor pair untuk ID unik.
     * @returns {HTMLDivElement} - Elemen container untuk multi-select.
     */
    function createMultiSelectDefectInput(pairIndex) {
        const container = document.createElement('div');
        container.className = 'defect-input-container';
        container.dataset.pair = pairIndex;

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'defect-tags-container';
        tagsContainer.textContent = 'Pilih defect...';

        const dropdown = document.createElement('div');
        dropdown.className = 'multi-select-dropdown';
        
        defectTypes.forEach(defect => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = defect;
            checkbox.dataset.defect = defect;
            label.appendChild(checkbox);
            label.append(` ${defect}`);
            dropdown.appendChild(label);
        });

        container.append(tagsContainer, dropdown);
        return container;
    }

    // =========================================================================
    // EVENT LISTENERS SETUP
    // =========================================================================

    /**
     * Menyiapkan semua event listener yang dibutuhkan aplikasi.
     * @returns {void}
     */
    function setupEventListeners() {
        // Listener untuk input Style Number (auto-fill Model)
        DOMElements.styleNumber.addEventListener('input', handleStyleNumberInput);

        // Listener untuk perubahan pada tabel data entry (delegation)
        DOMElements.dataEntryBody.addEventListener('change', handleTableChange);
        
        // Listener untuk klik pada tabel (untuk multi-select)
        DOMElements.dataEntryBody.addEventListener('click', handleTableClick);

        // Listener untuk klik di luar dropdown multi-select
        document.addEventListener('click', handleDocumentClick);

        // Listener untuk tombol Simpan dan Reset
        DOMElements.saveButton.addEventListener('click', handleSaveData);
        DOMElements.resetButton.addEventListener('click', resetForm);

        // Listener untuk daftar file tersimpan (delegation)
        DOMElements.savedFilesList.addEventListener('click', handleSavedFilesActions);

        // Listener untuk tombol modal
        DOMElements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
        DOMElements.cancelDeleteBtn.addEventListener('click', () => showDeleteModal(false));
    }

    // =========================================================================
    // EVENT HANDLER FUNCTIONS
    // =========================================================================

    /**
     * Menangani input pada field Style Number untuk mengisi field Model secara otomatis.
     * @param {Event} e - Event object.
     */
    function handleStyleNumberInput(e) {
        const styleNumber = e.target.value.trim().toUpperCase();
        DOMElements.model.value = styleModelMap[styleNumber] || '';
    }

    /**
     * Menangani event 'change' pada tabel data, terutama untuk dropdown OK/NG.
     * @param {Event} e - Event object.
     */
    function handleTableChange(e) {
        if (e.target.classList.contains('status-select')) {
            const selectedValue = e.target.value;
            const tr = e.target.closest('tr');
            const defectInputContainer = tr.querySelector('.defect-input-container');
            
            if (selectedValue === 'OK') {
                toggleDefectInputState(defectInputContainer, false);
                clearDefectSelection(defectInputContainer);
            } else { // NG
                toggleDefectInputState(defectInputContainer, true);
            }
        }
    }
    
    /**
     * Menangani event 'click' pada tabel data, untuk membuka dropdown dan menghapus tag.
     * @param {Event} e - Event object.
     */
    function handleTableClick(e) {
        const tagsContainer = e.target.closest('.defect-tags-container');
        if (tagsContainer) {
            const parentContainer = tagsContainer.closest('.defect-input-container');
            if (!parentContainer.classList.contains('disabled')) {
                const dropdown = parentContainer.querySelector('.multi-select-dropdown');
                dropdown.classList.toggle('active');
            }
        }

        if (e.target.classList.contains('remove-tag')) {
            const tagToRemove = e.target.parentElement;
            const defectValue = e.target.dataset.value;
            const container = e.target.closest('.defect-input-container');
            const checkbox = container.querySelector(`input[value="${defectValue}"]`);
            if (checkbox) checkbox.checked = false;
            tagToRemove.remove();
            updateTagsContainerPlaceholder(container);
        }

        if(e.target.type === 'checkbox' && e.target.closest('.multi-select-dropdown')) {
            const container = e.target.closest('.defect-input-container');
            updateDefectTags(container);
        }
    }

    /**
     * Menutup dropdown multi-select jika user klik di luar area tersebut.
     * @param {Event} e - Event object.
     */
    function handleDocumentClick(e) {
        if (!e.target.closest('.defect-input-container')) {
            document.querySelectorAll('.multi-select-dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    }

    /**
     * Menangani klik pada tombol Simpan. Mengumpulkan data dan menyimpannya.
     */
    function handleSaveData() {
        if (!validateHeaderForm()) {
            alert('Harap lengkapi semua informasi umum (Validation Category, Style Number, dan Line).');
            return;
        }

        // Kumpulkan data header
        const headerData = {
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            validationCategory: DOMElements.validationCategory.value,
            styleNumber: DOMElements.styleNumber.value,
            model: DOMElements.model.value,
            line: DOMElements.line.value
        };

        // Kumpulkan data dari setiap baris
        const pairsData = [];
        const rows = DOMElements.dataEntryBody.querySelectorAll('tr');
        rows.forEach(row => {
            const pairNumber = row.dataset.pairNumber;
            const status = row.querySelector('.status-select').value;
            let defects = [];

            if (status === 'NG') {
                const checkedDefects = row.querySelectorAll('.defect-input-container input[type="checkbox"]:checked');
                checkedDefects.forEach(checkbox => defects.push(checkbox.value));
            }

            pairsData.push({
                pairNumber: parseInt(pairNumber),
                status,
                defects
            });
        });

        // Buat objek file data
        const fileId = `lwt_${Date.now()}`;
        const fileName = `LWT-${headerData.validationCategory}-${headerData.date}`;
        const fileData = {
            id: fileId,
            name: fileName,
            header: headerData,
            pairs: pairsData
        };

        // Simpan data ke Local Storage
        saveDataToStorage(fileData);
        alert(`Data berhasil disimpan dengan nama: ${fileName}`);
        
        // Render ulang daftar file dan reset form
        renderSavedFiles();
        resetForm();
    }
    
    /**
     * Menangani aksi (download/delete) pada daftar file yang tersimpan.
     * @param {Event} e - Event object.
     */
    function handleSavedFilesActions(e) {
        const target = e.target;
        const fileId = target.dataset.id;
        if (!fileId) return;

        if (target.classList.contains('download-btn')) {
            handleDownload(fileId);
        } else if (target.classList.contains('delete-btn')) {
            fileIdToDelete = fileId;
            showDeleteModal(true);
        }
    }

    /**
     * Menangani konfirmasi penghapusan file.
     */
    function handleConfirmDelete() {
        if (fileIdToDelete) {
            deleteDataFromStorage(fileIdToDelete);
            renderSavedFiles();
            showDeleteModal(false);
            fileIdToDelete = null;
        }
    }
    
    /**
     * Menangani permintaan download file ke format Excel.
     * @param {string} fileId - ID file yang akan di-download.
     */
    function handleDownload(fileId) {
        const savedData = getSavedData();
        const fileData = savedData.find(item => item.id === fileId);
        if (!fileData) {
            alert('Data tidak ditemukan!');
            return;
        }
        generateExcel(fileData);
    }
    
    // =========================================================================
    // FUNGSI UTILITY & DOM MANIPULATION
    // =========================================================================

    /**
     * Mengaktifkan atau menonaktifkan input defect.
     * @param {HTMLDivElement} container - Elemen container input defect.
     * @param {boolean} enable - true untuk enable, false untuk disable.
     */
    function toggleDefectInputState(container, enable) {
        if (enable) {
            container.classList.remove('disabled');
        } else {
            container.classList.add('disabled');
            container.querySelector('.multi-select-dropdown').classList.remove('active');
        }
    }

    /**
     * Membersihkan pilihan defect pada satu baris.
     * @param {HTMLDivElement} container - Elemen container input defect.
     */
    function clearDefectSelection(container) {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        updateDefectTags(container);
    }
    
    /**
     * Memperbarui tampilan tag defect berdasarkan checkbox yang dipilih.
     * @param {HTMLDivElement} container - Elemen container input defect.
     */
    function updateDefectTags(container) {
        const tagsContainer = container.querySelector('.defect-tags-container');
        const checkedBoxes = container.querySelectorAll('input:checked');
        
        tagsContainer.innerHTML = ''; // Clear existing tags

        checkedBoxes.forEach(checkbox => {
            const tag = document.createElement('span');
            tag.className = 'defect-tag';
            tag.textContent = checkbox.value;
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-tag';
            removeBtn.textContent = 'x';
            removeBtn.dataset.value = checkbox.value;

            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
        });

        updateTagsContainerPlaceholder(container);
    }

    /**
     * Menampilkan atau menyembunyikan placeholder 'Pilih defect...'
     * @param {HTMLDivElement} container - Elemen container input defect.
     */
    function updateTagsContainerPlaceholder(container) {
        const tagsContainer = container.querySelector('.defect-tags-container');
        if (tagsContainer.childElementCount === 0) {
            tagsContainer.textContent = 'Pilih defect...';
        } else if (tagsContainer.textContent === 'Pilih defect...'){
             tagsContainer.textContent = ''; // Hapus placeholder jika ada tag baru
        }
    }

    /**
     * Merender daftar file yang tersimpan dari Local Storage.
     */
    function renderSavedFiles() {
        const data = getSavedData();
        const listElement = DOMElements.savedFilesList;
        listElement.innerHTML = '';

        if (data.length === 0) {
            listElement.innerHTML = '<li>Belum ada data yang tersimpan.</li>';
            return;
        }

        data.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="file-name">${file.name} (ID: ${file.id})</span>
                <div class="file-actions">
                    <button class="btn btn-primary download-btn" data-id="${file.id}">Download</button>
                    <button class="btn btn-danger delete-btn" data-id="${file.id}">Hapus</button>
                </div>
            `;
            listElement.appendChild(li);
        });
    }

    /**
     * Menampilkan atau menyembunyikan modal konfirmasi hapus.
     * @param {boolean} show - true untuk tampil, false untuk sembunyi.
     */
    function showDeleteModal(show) {
        DOMElements.deleteModal.style.display = show ? 'flex' : 'none';
    }
    
    /**
     * Memvalidasi form header sebelum menyimpan.
     * @returns {boolean} - true jika valid, false jika tidak.
     */
    function validateHeaderForm() {
        return DOMElements.validationCategory.value.trim() !== '' &&
               DOMElements.styleNumber.value.trim() !== '' &&
               DOMElements.line.value.trim() !== '';
    }

    /**
     * Mereset seluruh form ke keadaan awal.
     */
    function resetForm() {
        document.querySelector('.form-section form, .form-section').reset(); // Jika ada form tag
        DOMElements.validationCategory.value = '';
        DOMElements.styleNumber.value = '';
        DOMElements.model.value = '';
        DOMElements.line.value = '';
        generateDataEntryRows(); // Generate ulang baris untuk reset state
    }

    // =========================================================================
    // FUNGSI LOCAL STORAGE
    // =========================================================================

    /**
     * Mengambil semua data tersimpan dari Local Storage.
     * @returns {Array} - Array of saved file objects.
     */
    function getSavedData() {
        const dataJSON = localStorage.getItem(STORAGE_KEY);
        return dataJSON ? JSON.parse(dataJSON) : [];
    }

    /**
     * Menyimpan data baru ke Local Storage.
     * @param {Object} fileData - Objek file yang akan disimpan.
     */
    function saveDataToStorage(fileData) {
        const existingData = getSavedData();
        existingData.push(fileData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
    }

    /**
     * Menghapus data dari Local Storage berdasarkan ID.
     * @param {string} fileId - ID file yang akan dihapus.
     */
    function deleteDataFromStorage(fileId) {
        let existingData = getSavedData();
        const updatedData = existingData.filter(item => item.id !== fileId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    }
    
    // =========================================================================
    // FUNGSI GENERATE EXCEL (menggunakan SheetJS/xlsx)
    // =========================================================================
    
    /**
     * Membuat dan men-download file Excel dari data yang diberikan.
     * @param {Object} fileData - Data lengkap file.
     */
    function generateExcel(fileData) {
        const header = fileData.header;
        const pairs = fileData.pairs;

        // Mendefinisikan header kolom Excel
        const excelHeaders = [
            'Date', 'Validation Category', 'Style Number', 'Model', 'Line',
            'Pair Number', 'OK/NG',
            'Defect type 1', 'Defect type 2', 'Defect type 3', 'Defect type 4', 'Defect type 5',
            'Defect type 6', 'Defect type 7', 'Defect type 8', 'Defect type 9', 'Defect type 10'
        ]; // Total 17 kolom (A-Q)
        
        const dataForSheet = [excelHeaders];

        // Memformat data baris
        pairs.forEach(pair => {
            const row = [
                header.date,
                header.validationCategory,
                header.styleNumber,
                header.model,
                header.line,
                pair.pairNumber,
                pair.status
            ];
            
            // Tambahkan defect ke kolom-kolom berikutnya
            for (let i = 0; i < 10; i++) {
                row.push(pair.defects[i] || ''); // Isi dengan defect atau string kosong
            }

            dataForSheet.push(row);
        });

        // Membuat worksheet dari array data
        const ws = XLSX.utils.aoa_to_sheet(dataForSheet);

        // Menambahkan styling ke header
        const headerStyle = {
            font: { bold: true },
            fill: { fgColor: { rgb: "FF007BFF" } }, // Warna biru
            alignment: { horizontal: "center", vertical: "center" }
        };

        // Aplikasikan style ke setiap cell di baris header (A1 sampai Q1)
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!ws[address]) continue;
            ws[address].s = headerStyle;
        }

        // Membuat workbook baru
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'LWT Data');

        // Men-trigger download file Excel
        XLSX.writeFile(wb, `${fileData.name}.xlsx`);
    }

    // =========================================================================
    // INISIALISASI APLIKASI
    // =========================================================================
    initializeApp();

});
