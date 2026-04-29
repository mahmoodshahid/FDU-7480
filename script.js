// FDU 7480 Vehicle Expense Tracker Logic

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

    // Initialize date with today
    document.getElementById('tripDate').valueAsDate = new Date();

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
            date: document.getElementById('tripDate').value,
            trip12: document.getElementById('trip1to2').value,
            trip21: document.getElementById('trip2to1').value,
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
        document.getElementById('tripDate').valueAsDate = new Date();
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

        records.forEach(record => {
            const row = document.createElement('tr');
            const statusClass = record.balance >= 0 ? 'status-bachat' : 'status-nuqsan';
            const statusText = record.balance >= 0 ? 'Bachat' : 'Nuqsan';
            const balanceDisplay = `<span class="${statusClass}">${Math.abs(record.balance).toLocaleString()} ${statusText}</span>`;

            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.trip12} / ${record.trip21}</td>
                <td>${record.totalKiraya.toLocaleString()}</td>
                <td>${record.totalExpenses.toLocaleString()}</td>
                <td>${balanceDisplay}</td>
                <td>
                    <button class="btn btn-delete" data-id="${record.id}">Delete</button>
                </td>
            `;
            recordsTableBody.appendChild(row);
        });

        // Add delete event listeners
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteRecord(Number(btn.getAttribute('data-id')));
            });
        });
    }

    // Print functionality
    window.printReport = function() {
        window.print();
    };

    // Initial render
    renderRecords();
});
