// FDU 7480 Vehicle Expense Tracker Logic

// Global functions for HTML access
window.printIndividualReceipt = function() {
    window.print();
};

window.closeModal = function() {
    document.getElementById('receiptModal').style.display = 'none';
    document.body.classList.remove('modal-open');
};

window.printReport = function() {
    window.print();
};

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('receiptModal');
    if (event.target == modal) {
        window.closeModal();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Select elements
    const tripForm = document.getElementById('tripForm');
    const recordsTableBody = document.querySelector('#recordsTable tbody');
    const resultBadge = document.getElementById('resultBadge');
    const resultText = document.getElementById('resultText');
    const resultAmount = document.getElementById('resultAmount');

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

    // Helper function for date formatting (DD-MM-YYYY)
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

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

        records.forEach(record => {
            grandTotal += record.balance;
            const row = document.createElement('tr');
            const statusClass = record.balance >= 0 ? 'status-bachat' : 'status-nuqsan';
            const statusText = record.balance >= 0 ? 'Bachat' : 'Nuqsan';
            const balanceDisplay = `<span class="${statusClass}">${Math.abs(record.balance).toLocaleString()} ${statusText}</span>`;

            const tripDisplay = `Going: ${record.rawangiGoing} → ${record.stopGoing}${record.stopReturn ? ' | Return: ' + record.rawangiReturn + ' → ' + record.stopReturn : ''}`;
            const formattedDateGoing = formatDate(record.dateGoing);
            const formattedDateReturn = formatDate(record.dateReturn);
            const dateDisplay = `${formattedDateGoing}${record.dateReturn && record.dateReturn !== record.dateGoing ? ' / ' + formattedDateReturn : ''}`;

            row.innerHTML = `
                <td>${dateDisplay}</td>
                <td>${tripDisplay}</td>
                <td>${record.totalKiraya.toLocaleString()}</td>
                <td>${record.totalExpenses.toLocaleString()}</td>
                <td>${balanceDisplay}</td>
                <td class="action-btns-cell">
                    <button class="btn-action btn-share" data-id="${record.id}">PDF / Share</button>
                    <button class="btn-action btn-delete" data-id="${record.id}">Delete</button>
                </td>
            `;
            recordsTableBody.appendChild(row);
        });

        // Update Grand Total in Header
        const grandTotalElement = document.getElementById('grandTotalAmount');
        grandTotalElement.textContent = `Rs. ${grandTotal.toLocaleString()}`;
        grandTotalElement.style.color = grandTotal >= 0 ? '#10b981' : '#ef4444';

        // Add action event listeners
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteRecord(Number(btn.getAttribute('data-id')));
            });
        });

        document.querySelectorAll('.btn-share').forEach(btn => {
            btn.addEventListener('click', () => {
                shareRecord(Number(btn.getAttribute('data-id')));
            });
        });
    }

    // Share/Print Individual Record
    function shareRecord(id) {
        const records = JSON.parse(localStorage.getItem('fdu7480_records') || '[]');
        const record = records.find(r => r.id === id);
        if (!record) return;

        const balanceLabel = record.balance >= 0 ? "Bachat (بچت)" : "Nuqsan (نقصان)";
        const balanceColor = record.balance >= 0 ? "#059669" : "#dc2626";

        const receiptHtml = `
            <div style="font-family: 'Segoe UI', sans-serif; color: #334155; line-height: 1.4;">
                <div style="text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px;">
                    <h1 style="margin: 0; color: #1e40af; font-size: 24px;">FDU 7480</h1>
                    <p style="margin: 5px 0; opacity: 0.8; font-size: 14px;">Trip Receipt | سفر کی رسید</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc;">
                        <h3 style="margin-top: 0; color: #1e40af; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Trip Details</h3>
                        <div style="display:flex; justify-content:space-between; font-size: 13px; margin: 4px 0;"><span>Going:</span><span>${formatDate(record.dateGoing)}</span></div>
                        <div style="display:flex; justify-content:space-between; font-size: 13px; margin: 4px 0;"><span>Route:</span><span>${record.rawangiGoing} → ${record.stopGoing}</span></div>
                        ${record.stopReturn ? `
                            <div style="display:flex; justify-content:space-between; font-size: 13px; margin: 4px 0; border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 4px;"><span>Return:</span><span>${formatDate(record.dateReturn)}</span></div>
                            <div style="display:flex; justify-content:space-between; font-size: 13px; margin: 4px 0;"><span>Route:</span><span>${record.rawangiReturn} → ${record.stopReturn}</span></div>
                        ` : ''}
                    </div>
                </div>

                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                    <h3 style="margin-top: 0; color: #1e40af; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Summary | خلاصہ</h3>
                    <div style="display:flex; justify-content:space-between; font-size: 13px; margin: 4px 0;"><span>Total Fare:</span><span style="font-weight:700;">Rs. ${record.totalKiraya.toLocaleString()}</span></div>
                    <div style="display:flex; justify-content:space-between; font-size: 13px; margin: 4px 0; color: #dc2626;"><span>Total Expenses:</span><span>Rs. ${record.totalExpenses.toLocaleString()}</span></div>
                </div>

                <div style="background: ${balanceColor}10; border: 2px solid ${balanceColor}; color: ${balanceColor}; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: 800;">
                    ${balanceLabel}: Rs. ${Math.abs(record.balance).toLocaleString()}
                </div>
                
                <div style="margin-top: 20px; font-size: 10px; text-align: center; color: #94a3b8;">
                    Generated on ${new Date().toLocaleString()}
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
