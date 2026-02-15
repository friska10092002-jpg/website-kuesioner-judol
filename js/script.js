/**
 * UNIKIAB Research - Kuesioner Penelitian
 * FINAL REALTIME VERSION
 */

// ========================================
// CONFIGURATION
// ========================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcZqb6s1mv5gv1YNbjSsSaDiqYvbxai-a3FqjsKVQSHxS1TElswa9RrElERlQ00e4W8g/exec';


// ========================================
// UTILITY FUNCTIONS
// ========================================

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function showLoading(message = 'Memuat...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

function showToast(message, type = 'success') {
    alert(message); // Versi aman tanpa animasi error
}


// ========================================
// FORM VALIDATION
// ========================================

function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            valid = false;
        } else {
            field.classList.remove('error');
        }
    });

    return valid;
}


// ========================================
// FORM SUBMISSION
// ========================================

async function submitForm(formData) {
    try {
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        data.timestamp = new Date().toISOString();

        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        return { success: true };

    } catch (error) {
        console.error('Submit error:', error);
        return { success: false };
    }
}

function initQuestionnaireForm() {
    const form = document.getElementById('kuesionerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm(form)) {
            showToast('Mohon lengkapi semua field', 'error');
            return;
        }

        showLoading('Mengirim jawaban...');

        const result = await submitForm(new FormData(form));

        hideLoading();

        if (result.success) {
            showToast('Jawaban berhasil dikirim');
            form.reset();
        } else {
            showToast('Gagal mengirim jawaban', 'error');
        }
    });
}


// ========================================
// CHART DATA (REALTIME FROM GOOGLE SHEET)
// ========================================

async function fetchChartData() {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        const sheetData = await response.json();

        if (!sheetData || sheetData.length <= 1) {
            return emptyChartData();
        }

        const headers = sheetData[0];
        const rows = sheetData.slice(1);

        const data = rows.map(row => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        return processChartData(data);

    } catch (error) {
        console.error('Error ambil data:', error);
        return emptyChartData();
    }
}

function emptyChartData() {
    return {
        totalResponden: 0,
        dimensions: {
            adaptation: { ya: 0, tidak: 0 },
            goal: { ya: 0, tidak: 0 },
            integration: { ya: 0, tidak: 0 },
            latency: { ya: 0, tidak: 0 }
        }
    };
}

function processChartData(data) {

    const totalResponden = data.length;

    const dimensions = {
        adaptation: { ya: 0, tidak: 0 },
        goal: { ya: 0, tidak: 0 },
        integration: { ya: 0, tidak: 0 },
        latency: { ya: 0, tidak: 0 }
    };

    data.forEach(response => {

        for (let i = 1; i <= 5; i++) {
            if (response[`A${i}`] === 'Ya') dimensions.adaptation.ya++;
            if (response[`A${i}`] === 'Tidak') dimensions.adaptation.tidak++;
        }

        for (let i = 1; i <= 5; i++) {
            if (response[`G${i}`] === 'Ya') dimensions.goal.ya++;
            if (response[`G${i}`] === 'Tidak') dimensions.goal.tidak++;
        }

        for (let i = 1; i <= 5; i++) {
            if (response[`I${i}`] === 'Ya') dimensions.integration.ya++;
            if (response[`I${i}`] === 'Tidak') dimensions.integration.tidak++;
        }

        for (let i = 1; i <= 5; i++) {
            if (response[`L${i}`] === 'Ya') dimensions.latency.ya++;
            if (response[`L${i}`] === 'Tidak') dimensions.latency.tidak++;
        }

    });

    return {
        totalResponden,
        dimensions
    };
}


// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initQuestionnaireForm();
});


// ========================================
// EXPORT FOR CHART.JS
// ========================================

window.KuesionerApp = {
    fetchChartData
};
