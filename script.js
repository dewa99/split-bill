document.addEventListener('DOMContentLoaded', function() {
    // Format currency to Rupiah
    function formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // DOM elements
    const addPersonBtn = document.getElementById('add-person');
    const peopleList = document.getElementById('people-list');
    const calculateBtn = document.getElementById('calculate');
    const resultsDiv = document.getElementById('results');
    
    // Add person
    addPersonBtn.addEventListener('click', addPerson);
    
    // Calculate split
    calculateBtn.addEventListener('click', calculateSplit);
    
    // Add initial person
    addPerson();
    
    function addPerson() {
        const personId = Date.now();
        const personDiv = document.createElement('div');
        personDiv.className = 'bg-gray-50 p-3 rounded-md';
        personDiv.dataset.id = personId;
        
        personDiv.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-medium text-gray-700">Person ${document.querySelectorAll('[data-id]').length + 1}</h3>
                <button class="remove-person px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                    Remove
                </button>
            </div>
            <div class="mb-2">
                <label class="block text-sm text-gray-600 mb-1">Name:</label>
                <input type="text" class="person-name w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Person name">
            </div>
            <div>
                <label class="block text-sm text-gray-600 mb-1">Order Amount (Rp):</label>
                <input type="number" min="0" step="1000" placeholder="0" 
                       class="person-order w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
            </div>
        `;
        
        peopleList.appendChild(personDiv);
        
        // Add remove event
        personDiv.querySelector('.remove-person').addEventListener('click', function() {
            personDiv.remove();
            updatePersonNumbers();
        });
    }
    
    function updatePersonNumbers() {
        const people = document.querySelectorAll('[data-id]');
        people.forEach((person, index) => {
            person.querySelector('h3').textContent = `Person ${index + 1}`;
        });
    }
    
    function calculateSplit() {
        // Get bill information
        const subtotal = parseFloat(document.getElementById('subtotal').value) || 0;
        const finalTotal = parseFloat(document.getElementById('final-total').value) || 0;
        
        // Calculate discount amount
        const discountAmount = subtotal - finalTotal;
        
        // Get all people
        const people = document.querySelectorAll('[data-id]');
        if (people.length === 0) {
            showError('Please add at least one person.');
            return;
        }
        
        // Collect person data
        const personData = [];
        let totalOrders = 0;
        
        people.forEach(person => {
            const name = person.querySelector('.person-name').value || `Person ${person.dataset.id}`;
            const orderAmount = parseFloat(person.querySelector('.person-order').value) || 0;
            
            personData.push({
                id: person.dataset.id,
                name,
                orderAmount
            });
            
            totalOrders += orderAmount;
        });
        
        // Validate orders match subtotal
        if (Math.abs(totalOrders - subtotal) > 100) {
            showError(`Total orders (${formatRupiah(totalOrders)}) doesn't match subtotal (${formatRupiah(subtotal)})`);
            return;
        }
        
        // Validate final total is reasonable
        if (finalTotal > subtotal) {
            showError(`Final total (${formatRupiah(finalTotal)}) can't be greater than subtotal (${formatRupiah(subtotal)})`);
            return;
        }
        
        if (finalTotal <= 0) {
            showError('Final total must be greater than 0');
            return;
        }
        
        // Calculate each person's share
        personData.forEach(person => {
            // Calculate ratio of this person's order to total orders
            const ratio = totalOrders > 0 ? person.orderAmount / totalOrders : 1 / personData.length;
            
            // Calculate their share of the discount
            const personDiscount = discountAmount * ratio;
            
            // Calculate their total payment
            const personTotal = person.orderAmount - personDiscount;
            
            // Add to person object
            person.ratio = ratio;
            person.discount = personDiscount;
            person.total = personTotal;
        });
        
        // Display results
        displayResults(personData, {
            subtotal,
            discountAmount,
            finalTotal
        });
    }
    
    function showError(message) {
        resultsDiv.innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                ${message}
            </div>
        `;
    }
    
    function displayResults(personData, billData) {
        // Summary section
        const summaryHTML = `
            <div class="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
                <h3 class="font-semibold text-blue-800 mb-3">Bill Summary</h3>
                <table class="w-full">
                    <tbody>
                        <tr>
                            <td class="py-1 text-gray-600">Subtotal:</td>
                            <td class="py-1 text-right font-medium">${formatRupiah(billData.subtotal)}</td>
                        </tr>
                        <tr>
                            <td class="py-1 text-gray-600">Discount:</td>
                            <td class="py-1 text-right font-medium text-red-500">-${formatRupiah(billData.discountAmount)}</td>
                        </tr>
                        <tr class="border-t border-gray-200">
                            <td class="py-2 font-semibold text-gray-800">Final Total:</td>
                            <td class="py-2 text-right font-semibold">${formatRupiah(billData.finalTotal)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        // Table header
        let tableHTML = `
            ${summaryHTML}
            <h3 class="font-semibold text-gray-700 mb-3">Individual Payments</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr class="bg-gray-100 text-gray-700 text-left">
                            <th class="py-2 px-4 border-b">Name</th>
                            <th class="py-2 px-4 border-b text-right">Order</th>
                            <th class="py-2 px-4 border-b text-right">Ratio</th>
                            <th class="py-2 px-4 border-b text-right">Discount</th>
                            <th class="py-2 px-4 border-b text-right">To Pay</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Table rows
        personData.forEach(person => {
            tableHTML += `
                <tr class="hover:bg-gray-50 border-b">
                    <td class="py-2 px-4">${person.name}</td>
                    <td class="py-2 px-4 text-right">${formatRupiah(person.orderAmount)}</td>
                    <td class="py-2 px-4 text-right">${(person.ratio * 100).toFixed(1)}%</td>
                    <td class="py-2 px-4 text-right text-red-500">-${formatRupiah(person.discount)}</td>
                    <td class="py-2 px-4 text-right font-medium">${formatRupiah(person.total)}</td>
                </tr>
            `;
        });
        
        // Close table
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        resultsDiv.innerHTML = tableHTML;
    }
});