// FDU 7480 Vehicle Expense Tracker Logic

const APP_VERSION = "1.5.0";

// Global functions for HTML access
window.printIndividualReceipt = function() {
    window.print();
};

window.downloadReceiptPDF = function() {
    const element = document.getElementById('receiptContent');
    if (!element) return;

    const btn = document.querySelector('[onclick="downloadReceiptPDF()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Processing... (تیار ہو رہا ہے)";
    btn.disabled = true;

    if (!window.html2pdf) {
        alert("Library loading... Try in 5s.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    setTimeout(() => {
        const opt = {
            margin: [10, 10],
            filename: `FDU7480_Trip_${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        window.html2pdf().from(element).set(opt).toPdf().get('pdf').then(function (pdf) {
            // For mobile, we try to use the share API if available
            if (navigator.share && navigator.canShare) {
                const pdfBlob = pdf.output('blob');
                const file = new File([pdfBlob], `Trip_Receipt_${Date.now()}.pdf`, { type: 'application/pdf' });
                
                if (navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'Trip Receipt',
                        text: 'FDU 7480 Receipt'
                    }).catch(err => {
                        console.log('Share failed, saving normally');
                        pdf.save();
                    });
                } else {
                    pdf.save();
                }
            } else {
                pdf.save();
            }
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            console.error('PDF Error:', err);
            btn.innerHTML = originalText;
            btn.disabled = false;
            window.print();
        });
    }, 500); 
};

window.closeModal = function() {
    document.getElementById('receiptModal').style.display = 'none';
    document.body.classList.remove('modal-open');
};

window.printReport = function() {
    // For full report, we can use window.print() as it handles the whole page better
    // or generate a massive PDF.
    window.print();
};

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('receiptModal');
    if (event.target == modal) {
        window.closeModal();
    }
};

// Helper function for date formatting (DD-MM-YYYY)
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

document.addEventListener('DOMContentLoaded', () => {
    async function checkForUpdates() {
        try {
            const response = await fetch('/version.json?v=' + Date.now(), { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                if (data.version !== APP_VERSION) {
                    const updateToast = document.getElementById('updateToast');
                    const updateMessage = document.getElementById('updateMessage');
                    if (updateToast && updateMessage) {
                        updateMessage.textContent = data.message;
                        updateToast.style.display = 'block';
                    }
                }
            }
        } catch (error) {
            console.warn('Update check failed:', error);
        }
    }

    // Call update check
    checkForUpdates();

    // Select elements
    const tripForm = document.getElementById('tripForm');
    const recordsTableBody = document.querySelector('#recordsTable tbody');
    const resultBadge = document.getElementById('resultBadge');
    const resultText = document.getElementById('resultText');
    const resultAmount = document.getElementById('resultAmount');

    // Menu Elements
    const menuBtn = document.getElementById('menuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sideMenu = document.getElementById('sideMenu');
    const menuBackdrop = document.getElementById('menuBackdrop');

    // Menu Toggle Logic
    function toggleMenu() {
        sideMenu.classList.toggle('active');
        menuBackdrop.style.display = sideMenu.classList.contains('active') ? 'block' : 'none';
        
        if (sideMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            renderSummaryInMenu(); // Refresh summary when opening
        } else {
            document.body.style.overflow = '';
        }
    }

    if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMenu);
    if (menuBackdrop) menuBackdrop.addEventListener('click', toggleMenu);

    function renderSummaryInMenu() {
        const records = JSON.parse(localStorage.getItem('fdu7480_records') || '[]');
        
        const totals = {
            diesel: 0, toll: 0, jurmana: 0, khana: 0, driver: 0, digar: 0,
            kiraya: 0, expenses: 0, bachat: 0
        };

        records.forEach(r => {
            totals.diesel += r.diesel || 0;
            totals.toll += r.toll || 0;
            totals.jurmana += r.jurmana || 0;
            totals.khana += r.khana || 0;
            totals.driver += r.driver || 0;
            totals.digar += r.digar || 0;
            totals.kiraya += r.totalKiraya || 0;
            totals.expenses += r.totalExpenses || 0;
            totals.bachat += r.balance || 0;
        });

        // Inject into Menu
        const updateVal = (id, val) => {
            const el = document.querySelector(`#${id} .summary-value`);
            if (el) el.textContent = `Rs. ${val.toLocaleString()}`;
        };

        updateVal('summaryDiesel', totals.diesel);
        updateVal('summaryToll', totals.toll);
        updateVal('summaryKhana', totals.khana);
        updateVal('summaryDriver', totals.driver);
        updateVal('summaryJurmana', totals.jurmana);
        updateVal('summaryDigar', totals.digar);
        updateVal('summaryKiraya', totals.kiraya);
        updateVal('summaryExpenses', totals.expenses);
        updateVal('summaryBachat', totals.bachat);

        // Color coding bachat
        const bachatEl = document.querySelector('#summaryBachat .summary-value');
        if (bachatEl) {
            bachatEl.style.color = totals.bachat >= 0 ? '#059669' : '#dc2626';
        }
    }

    // Fare inputs
    const kiraya1Input = document.getElementById('kiraya1');
    const kiraya2Input = document.getElementById('kiraya2');
    const totalKirayaDisplay = document.getElementById('totalKirayaDisplay');

    // Expense inputs
    const expenseInputs = [
        'diesel', 'toll', 'jurmana', 'khana', 'driver', 'digar'
    ].map(id => document.getElementById(id));
    const totalExpensesDisplay = document.getElementById('totalExpensesDisplay');

    // Initialize dates with today
    const today = new Date();
    document.getElementById('dateGoing').valueAsDate = today;
    document.getElementById('dateReturn').valueAsDate = today;

    // Auto-calculate Fare
    function calculateFare() {
        const k1 = parseFloat(kiraya1Input.value) || 0;
        const k2 = parseFloat(kiraya2Input.value) || 0;
        const total = k1 + k2;
        totalKirayaDisplay.textContent = total.toLocaleString();
        return total;
    }

    // Auto-calculate Expenses
    function calculateExpenses() {
        let total = 0;
        expenseInputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        totalExpensesDisplay.textContent = total.toLocaleString();
        return total;
    }

    // Update Profit/Loss Display
    function updateProfitLoss() {
        const fare = calculateFare();
        const expenses = calculateExpenses();
        const balance = fare - expenses;

        resultAmount.textContent = Math.abs(balance).toLocaleString();
        
        if (balance >= 0) {
            resultBadge.className = 'result-badge bachat';
            resultText.textContent = 'Bachat (بچت)';
        } else {
            resultBadge.className = 'result-badge nuqsan';
            resultText.textContent = 'Nuqsan (نقصان)';
        }
    }

    // Add listeners for auto-calculation
    [kiraya1Input, kiraya2Input, ...expenseInputs].forEach(input => {
        input.addEventListener('input', updateProfitLoss);
    });

    // Save Record
    tripForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const record = {
            id: Date.now(),
            dateGoing: document.getElementById('dateGoing').value,
            rawangiGoing: document.getElementById('rawangiGoing').value,
            stopGoing: document.getElementById('stopGoing').value,
            dateReturn: document.getElementById('dateReturn').value,
            rawangiReturn: document.getElementById('rawangiReturn').value,
            stopReturn: document.getElementById('stopReturn').value,
            kiraya1: parseFloat(kiraya1Input.value) || 0,
            kiraya2: parseFloat(kiraya2Input.value) || 0,
            totalKiraya: calculateFare(),
            diesel: parseFloat(document.getElementById('diesel').value) || 0,
            toll: parseFloat(document.getElementById('toll').value) || 0,
            jurmana: parseFloat(document.getElementById('jurmana').value) || 0,
            khana: parseFloat(document.getElementById('khana').value) || 0,
            driver: parseFloat(document.getElementById('driver').value) || 0,
            digar: parseFloat(document.getElementById('digar').value) || 0,
            totalExpenses: calculateExpenses()
        };

        record.balance = record.totalKiraya - record.totalExpenses;

        saveRecordToLocal(record);
        tripForm.reset();
        document.getElementById('dateGoing').valueAsDate = new Date();
        document.getElementById('dateReturn').valueAsDate = new Date();
        updateProfitLoss();
        renderRecords();
    });

    function saveRecordToLocal(record) {
        let records = JSON.parse(localStorage.getItem('fdu7480_records') || '[]');
        records.unshift(record);
        localStorage.setItem('fdu7480_records', JSON.stringify(records));
    }

    function deleteRecord(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            let records = JSON.parse(localStorage.getItem('fdu7480_records') || '[]');
            records = records.filter(r => r.id !== id);
            localStorage.setItem('fdu7480_records', JSON.stringify(records));
            renderRecords();
        }
    }

    function renderRecords() {
        const records = JSON.parse(localStorage.getItem('fdu7480_records') || '[]');
        recordsTableBody.innerHTML = '';
        
        let grandTotal = 0;

        // Sort records by date descending
        records.sort((a, b) => new Date(b.dateGoing) - new Date(a.dateGoing));

        records.forEach(record => {
            grandTotal += record.balance;
            const row = document.createElement('tr');
            const statusClass = record.balance >= 0 ? 'status-bachat' : 'status-nuqsan';
            const bachatAmount = Math.abs(record.balance).toLocaleString();

            const tripDisplay = `${record.stopGoing}${record.stopReturn ? ' / ' + record.stopReturn : ''}`;
            const formattedDate = formatDate(record.dateGoing);

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${tripDisplay}</td>
                <td>${record.totalKiraya.toLocaleString()}</td>
                <td><span class="${statusClass}" style="font-weight:700;">${bachatAmount}</span></td>
                <td class="action-btns-cell">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <button class="btn-action btn-share" data-id="${record.id}" style="padding:4px 8px; font-size:10px;">PDF</button>
                        <button class="btn-action btn-delete" data-id="${record.id}" style="padding:4px 8px; font-size:10px; background:#fee2e2; color:#ef4444;">Del</button>
                    </div>
                </td>
            `;
            recordsTableBody.appendChild(row);
        });

        // Update Grand Total in Header
        const grandTotalElement = document.getElementById('grandTotalAmount');
        if (grandTotalElement) {
            grandTotalElement.textContent = `Rs. ${grandTotal.toLocaleString()}`;
            grandTotalElement.style.color = grandTotal >= 0 ? '#10b981' : '#ef4444';
        }

        // Also update menu summary
        renderSummaryInMenu();
    }

    // Event Delegation for Table Actions
    recordsTableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-delete')) {
            const id = Number(target.getAttribute('data-id'));
            deleteRecord(id);
        } else if (target.classList.contains('btn-share')) {
            const id = Number(target.getAttribute('data-id'));
            shareRecord(id);
        }
    });

    // Share/Print Individual Record
    function shareRecord(id) {
        const records = JSON.parse(localStorage.getItem('fdu7480_records') || '[]');
        const record = records.find(r => r.id === id);
        if (!record) return;

        const balanceLabel = record.balance >= 0 ? "Bachat (بچت)" : "Nuqsan (نقصان)";
        const balanceColor = record.balance >= 0 ? "#059669" : "#dc2626";

        const receiptHtml = `
            <div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.5; background: #ffffff; padding: 20px; width: 100%;">
                <div style="text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px;">
                    <h1 style="margin: 0; color: #1e40af; font-size: 28px;">FDU 7480</h1>
                    <p style="margin: 5px 0; color: #64748b; font-size: 16px; font-weight: 600;">Trip Receipt | سفر کی رسید</p>
                </div>

                <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; background: #f8fafc;">
                    <h3 style="margin-top: 0; color: #1e40af; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">Trip Details</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 5px 0; font-weight: 600;">Date (Going):</td>
                            <td style="padding: 5px 0; text-align: right; font-family: monospace;">${formatDate(record.dateGoing)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: 600;">Route:</td>
                            <td style="padding: 5px 0; text-align: right;">${record.rawangiGoing} → ${record.stopGoing}</td>
                        </tr>
                        ${record.stopReturn ? `
                        <tr>
                             <td colspan="2" style="padding: 10px 0; border-top: 1px dashed #cbd5e1;"></td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: 600;">Date (Return):</td>
                            <td style="padding: 5px 0; text-align: right; font-family: monospace;">${formatDate(record.dateReturn)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: 600;">Route:</td>
                            <td style="padding: 5px 0; text-align: right;">${record.rawangiReturn} → ${record.stopReturn}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>

                <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #1e40af; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">Financial Summary</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                        <tr>
                            <td style="padding: 8px 0;">Total Fare (کرایہ):</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: 800; color: #1e40af;">Rs. ${record.totalKiraya.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">Total Expenses (اخراجات):</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #dc2626;">- Rs. ${record.totalExpenses.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding: 15px 0; border-top: 3px double #e2e8f0;">
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="font-size: 18px; font-weight: 800; color: ${balanceColor};">${balanceLabel}:</td>
                                        <td style="font-size: 24px; font-weight: 900; color: ${balanceColor}; text-align: right;">Rs. ${Math.abs(record.balance).toLocaleString()}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    <table style="width: 100%; font-size: 11px; color: #94a3b8;">
                        <tr>
                            <td>
                                Trip ID: #${record.id}<br>
                                Generated: ${new Date().toLocaleString()}
                            </td>
                            <td style="text-align: right; font-family: 'Courier New', Courier, monospace; color: #1e40af; font-weight: bold;">
                                FDU 7480
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('receiptContent').innerHTML = receiptHtml;
        document.getElementById('receiptModal').style.display = 'block';
        document.body.classList.add('modal-open');
    }

    // Initial render
    renderRecords();
});
