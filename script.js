/**
 * @file script.js
 * @description Main logic for the Line Walk Through application (V2).
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // VARIABEL GLOBAL DAN REFERENSI DOM
    // =========================================================================
    const STORAGE_KEY = 'lineWalkThroughData';
    const TOTAL_PAIRS = 20;
    let currentRowForDefectModal = null; // Menyimpan baris yg sedang aktif untuk modal defect
    let currentModalAction = { onConfirm: null, onCancel: null }; // Menyimpan aksi modal

    const DOMElements = {
        validationCategory: document.getElementById('validation-category'),
        styleNumberInput: document.getElementById('style-number'),
        autocompleteResults: document.getElementById('autocomplete-results'),
        model: document.getElementById('model'),
        line: document.getElementById('line'),
        dataEntryBody: document.getElementById('data-entry-body'),
        saveButton: document.getElementById('save-button'),
        savedFilesList: document.getElementById('saved-files-list'),
        modal: document.getElementById('app-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'),
        modalActions: document.getElementById('modal-actions'),
        modalConfirmBtn: document.getElementById('modal-confirm-btn'),
        modalCancelBtn: document.getElementById('modal-cancel-btn'),
    };

    // =========================================================================
    // FUNGSI INISIALISASI
    // =========================================================================
    function initializeApp() {
        populateLineDropdown();
        generateDataEntryRows();
        setupEventListeners();
        renderSavedFiles();
    }

    function populateLineDropdown() {
        // (Sama seperti sebelumnya)
        for (let i = 101; i <= 116; i++) DOMElements.line.add(new Option(i, i));
        for (let i = 201; i <= 216; i++) DOMElements.line.add(new Option(i, i));
    }

    function generateDataEntryRows() {
        const tbody = DOMElements.dataEntryBody;
        tbody.innerHTML = '';
        for (let i = 1; i <= TOTAL_PAIRS; i++) {
            const tr = document.createElement('tr');
            tr.dataset.pairNumber = i;
            tr.innerHTML = `
                <td class="col-pair">${i}</td>
                <td class="col-status">
                    <select class="status-select">
                        <option value="">Pilih...</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                    </select>
                </td>
                <td class="col-defect">
                    <div class="defect-input-container disabled" data-pair="${i}">
                        <div class="defect-tags-wrapper">
                            <span class="placeholder-text">Pilih status 'NG' untuk mengisi</span>
                        </div>
                    </div>
                </td>
                <td class="col-photo">
                    <button class="table-action-btn camera-btn" title="Tambah Foto Defect">📷</button>
                    <input type="file" accept="image/*" class="hidden-file-input" capture>
                </td>
                <td class="col-action">
                    <button class="table-action-btn delete-row-btn" title="Hapus Data Baris Ini">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================
    function setupEventListeners() {
        // Event untuk autocomplete
        DOMElements.styleNumberInput.addEventListener('input', handleAutocompleteInput);
        DOMElements.autocompleteResults.addEventListener('click', handleAutocompleteSelect);
        document.addEventListener('click', (e) => { // Sembunyikan jika klik di luar
            if (!e.target.closest('.autocomplete-container')) {
                DOMElements.autocompleteResults.style.display = 'none';
            }
        });

        // Event delegation untuk tabel
        DOMElements.dataEntryBody.addEventListener('change', handleTableChange);
        DOMElements.dataEntryBody.addEventListener('click', handleTableClick);

        // Event untuk tombol utama dan modal
        DOMElements.saveButton.addEventListener('click', handleSaveValidation);
        DOMElements.modalConfirmBtn.addEventListener('click', () => currentModalAction.onConfirm?.());
        DOMElements.modalCancelBtn.addEventListener('click', () => currentModalAction.onCancel?.());
    }

    // =========================================================================
    // HANDLER UNTUK FITUR BARU
    // =========================================================================

    // --- Autocomplete Style Number ---
    function handleAutocompleteInput(e) {
        const value = e.target.value.toLowerCase();
        const resultsContainer = DOMElements.autocompleteResults;
        resultsContainer.innerHTML = '';
        if (value.length < 1) {
            resultsContainer.style.display = 'none';
            return;
        }

        const filteredKeys = Object.keys(styleModelMap).filter(key => key.toLowerCase().includes(value));

        if (filteredKeys.length > 0) {
            filteredKeys.forEach(key => {
                const item = document.createElement('div');
                item.innerHTML = key.replace(new RegExp(value, 'gi'), `<span class="highlight">${value}</span>`);
                item.dataset.value = key;
                resultsContainer.appendChild(item);
            });
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.style.display = 'none';
        }
    }

    function handleAutocompleteSelect(e) {
        if (e.target.dataset.value) {
            const selectedStyle = e.target.dataset.value;
            DOMElements.styleNumberInput.value = selectedStyle;
            DOMElements.model.value = styleModelMap[selectedStyle] || '';
            DOMElements.autocompleteResults.style.display = 'none';
        }
    }

    // --- Handler Aksi di Tabel ---
    function handleTableChange(e) {
        // Perubahan pada dropdown OK/NG
        if (e.target.classList.contains('status-select')) {
            const select = e.target;
            const tr = select.closest('tr');
            const defectContainer = tr.querySelector('.defect-input-container');
            const placeholder = defectContainer.querySelector('.placeholder-text');

            select.classList.add('status-selected');
            select.classList.toggle('status-ok', select.value === 'OK');
            select.classList.toggle('status-ng', select.value === 'NG');
            
            if (select.value === 'NG') {
                defectContainer.classList.remove('disabled');
                defectContainer.classList.add('enabled');
                placeholder.textContent = 'Klik untuk pilih defect...';
            } else {
                defectContainer.classList.remove('enabled');
                defectContainer.classList.add('disabled');
                placeholder.textContent = "Pilih status 'NG' untuk mengisi";
                resetDefectsForRow(tr); // Hapus defect jika status kembali ke OK
            }
        }
        // Perubahan pada input file (foto)
        if (e.target.classList.contains('hidden-file-input')) {
            handleImageUpload(e);
        }
    }

    function handleTableClick(e) {
        const target = e.target;
        // Klik tombol kamera
        if (target.classList.contains('camera-btn')) {
            target.nextElementSibling.click(); // Klik input file yang tersembunyi
        }
        // Klik tombol hapus baris
        if (target.classList.contains('delete-row-btn')) {
            const tr = target.closest('tr');
            const pairNum = tr.dataset.pairNumber;
            showModal({
                title: 'Konfirmasi Hapus',
                body: `<p>Apakah Anda yakin hendak menghapus data inspeksi untuk <strong>Pair #${pairNum}</strong>?</p>`,
                confirmText: 'Ya, Hapus',
                cancelText: 'Batal',
                onConfirm: () => {
                    resetRow(tr);
                    hideModal();
                }
            });
        }
        // Klik container defect
        if (target.closest('.defect-input-container.enabled')) {
            currentRowForDefectModal = target.closest('tr');
            showDefectSelectionModal(currentRowForDefectModal);
        }
    }
    
    // --- Manajemen Foto ---
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64String = event.target.result;
            const tr = e.target.closest('tr');
            tr.dataset.photo = base64String; // Simpan data foto di dataset
            tr.querySelector('.camera-btn').classList.add('has-photo');
        };
        reader.readAsDataURL(file);
    }
    
    // --- Reset Baris ---
    function resetRow(tr) {
        tr.querySelector('.status-select').value = "";
        tr.querySelector('.status-select').className = 'status-select';
        resetDefectsForRow(tr);
        const defectContainer = tr.querySelector('.defect-input-container');
        defectContainer.className = 'defect-input-container disabled';
        defectContainer.querySelector('.placeholder-text').textContent = "Pilih status 'NG' untuk mengisi";
        delete tr.dataset.photo;
        tr.querySelector('.camera-btn').classList.remove('has-photo');
        tr.querySelector('.hidden-file-input').value = "";
    }
    
    function resetDefectsForRow(tr) {
        tr.dataset.defects = JSON.stringify([]);
        updateDefectTags(tr);
    }

    // --- Modal Defect Interaktif ---
    function showDefectSelectionModal(tr) {
        const currentDefects = JSON.parse(tr.dataset.defects || '[]');
        let optionsHTML = defectTypes.map(defect => `
            <label>
                <input type="checkbox" value="${defect}" ${currentDefects.includes(defect) ? 'checked' : ''}>
                ${defect}
            </label>
        `).join('');

        const modalBodyHTML = `
            <div id="defect-selection-modal">
                <input type="text" class="search-bar" placeholder="Cari tipe defect...">
                <div class="options-container">${optionsHTML}</div>
            </div>`;
        
        showModal({
            title: `Pilih Defect untuk Pair #${tr.dataset.pairNumber}`,
            body: modalBodyHTML,
            confirmText: 'Simpan Pilihan',
            cancelText: 'Batal',
            onConfirm: () => {
                const selected = [];
                document.querySelectorAll('#defect-selection-modal input:checked').forEach(cb => selected.push(cb.value));
                tr.dataset.defects = JSON.stringify(selected);
                updateDefectTags(tr);
                hideModal();
            },
        });
        
        // Tambahkan fungsi search ke modal
        document.querySelector('#defect-selection-modal .search-bar').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('#defect-selection-modal label').forEach(label => {
                const matches = label.textContent.trim().toLowerCase().includes(searchTerm);
                label.style.display = matches ? 'block' : 'none';
            });
        });
    }

    function updateDefectTags(tr) {
        const wrapper = tr.querySelector('.defect-tags-wrapper');
        const defects = JSON.parse(tr.dataset.defects || '[]');
        wrapper.innerHTML = '';
        if (defects.length > 0) {
            defects.forEach(defect => {
                const tag = document.createElement('span');
                tag.className = 'defect-tag';
                tag.textContent = defect;
                wrapper.appendChild(tag);
            });
        } else {
            const placeholder = document.createElement('span');
            placeholder.className = 'placeholder-text';
            placeholder.textContent = tr.querySelector('.status-select').value === 'NG' ? 'Klik untuk pilih defect...' : "Pilih status 'NG' untuk mengisi";
            wrapper.appendChild(placeholder);
        }
    }
    
    // --- Validasi Simpan ---
    function handleSaveValidation() {
        if (!DOMElements.validationCategory.value || !DOMElements.styleNumberInput.value || !DOMElements.line.value) {
            alert('Harap lengkapi semua informasi di bagian atas (Kategori, Style, Line).');
            return;
        }

        const inspectedCount = Array.from(document.querySelectorAll('.status-select')).filter(s => s.value !== "").length;
        if (inspectedCount < TOTAL_PAIRS) {
            showModal({
                title: 'Konfirmasi Penyimpanan',
                body: `<p>Inspeksi baru dilakukan pada <strong>${inspectedCount} dari ${TOTAL_PAIRS} pairs</strong>.<br>Apakah Anda tetap ingin menyimpan data ini?</p>`,
                confirmText: 'Lanjutkan',
                cancelText: 'Batal',
                onConfirm: () => {
                    saveData();
                    hideModal();
                }
            });
        } else {
            saveData();
        }
    }

    // =========================================================================
    // FUNGSI INTI (Simpan, Download, Hapus, dll)
    // =========================================================================

    function saveData() {
        // (Logika pengumpulan data diperbarui untuk menyertakan foto)
        const headerData = { /* ... sama seperti sebelumnya ... */ };
        const pairsData = [];
        DOMElements.dataEntryBody.querySelectorAll('tr').forEach(tr => {
            pairsData.push({
                pairNumber: parseInt(tr.dataset.pairNumber),
                status: tr.querySelector('.status-select').value,
                defects: JSON.parse(tr.dataset.defects || '[]'),
                photo: tr.dataset.photo || null // Ambil data foto dari dataset
            });
        });
        
        const fileId = `lwt_${Date.now()}`;
        const fileName = `LWT-${headerData.validationCategory || 'DATA'}-${headerData.date}`;
        const fileData = { id: fileId, name: fileName, header: headerData, pairs: pairsData };

        const existingData = getSavedData();
        existingData.push(fileData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
        
        alert(`Data berhasil disimpan: ${fileName}`);
        location.reload(); // Reload halaman untuk reset form
    }
    
    function generateExcel(fileData) {
        // (Logika Excel diperbarui untuk menyertakan kolom foto)
        const excelHeaders = [ /* ..., */ 'OK/NG', 'Photo Attached', 'Defect type 1', /* ... */ ];
        const dataForSheet = [excelHeaders];
        
        fileData.pairs.forEach(pair => {
            const row = [ /* ..., */ pair.status, pair.photo ? 'Yes' : 'No'];
            for (let i = 0; i < 10; i++) row.push(pair.defects[i] || '');
            dataForSheet.push(row);
        });

        // (Logika pembuatan SheetJS tetap sama)
    }
    
    function getSavedData() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    // (Fungsi renderSavedFiles, deleteDataFromStorage, dll tetap sama)

    // =========================================================================
    // UTILITY MODAL DINAMIS
    // =========================================================================
    function showModal({ title, body, confirmText = 'OK', cancelText = 'Cancel', onConfirm, onCancel }) {
        DOMElements.modalTitle.textContent = title;
        DOMElements.modalBody.innerHTML = body;
        DOMElements.modalConfirmBtn.textContent = confirmText;
        DOMElements.modalCancelBtn.textContent = cancelText;

        currentModalAction.onConfirm = onConfirm;
        currentModalAction.onCancel = onCancel || hideModal;

        DOMElements.modal.style.display = 'flex';
    }

    function hideModal() {
        DOMElements.modal.style.display = 'none';
        currentModalAction.onConfirm = null;
        currentModalAction.onCancel = null;
    }

    // =========================================================================
    // JALANKAN APLIKASI
    // =========================================================================
    initializeApp();
});
