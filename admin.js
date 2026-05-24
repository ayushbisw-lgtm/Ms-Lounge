/* ==========================================
   MS BAR AND LOUNGE - ADMIN DASHBOARD LOGIC
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const bookingsList = document.getElementById('bookings-list');
    const emptyState = document.getElementById('empty-state');
    const totalBookingsEl = document.getElementById('total-bookings');
    const todayBookingsEl = document.getElementById('today-bookings');
    const pendingBookingsEl = document.getElementById('pending-bookings');

    // Tab Switching Logic
    window.switchTab = (tab) => {
        const billingTab = document.getElementById('billing-tab');
        const settingsTab = document.getElementById('settings-tab');
        const tablesTab = document.getElementById('tables-tab');
        const requestsTab = document.getElementById('requests-tab');
        const title = document.getElementById('current-tab-title');
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => item.classList.remove('active'));

        if (tab === 'billing') {
            billingTab.style.display = 'block';
            settingsTab.style.display = 'none';
            tablesTab.style.display = 'none';
            requestsTab.style.display = 'none';
            title.innerText = 'Billing & Bookings';
            navItems[0].classList.add('active');
            loadBookings();
        } else if (tab === 'tables') {
            billingTab.style.display = 'none';
            settingsTab.style.display = 'none';
            tablesTab.style.display = 'block';
            requestsTab.style.display = 'none';
            title.innerText = 'Table Status';
            navItems[1].classList.add('active');
            loadTableStatus();
        } else if (tab === 'requests') {
            billingTab.style.display = 'none';
            settingsTab.style.display = 'none';
            tablesTab.style.display = 'none';
            requestsTab.style.display = 'block';
            title.innerText = 'Customer Orders';
            navItems[2].classList.add('active');
            loadCustomerRequests();
        } else {
            billingTab.style.display = 'none';
            settingsTab.style.display = 'block';
            tablesTab.style.display = 'none';
            requestsTab.style.display = 'none';
            title.innerText = 'Menu Settings';
            navItems[3].classList.add('active');
            loadMenuManagement();
        }
    };

    // Customer Requests Logic
    function loadCustomerRequests() {
        const list = document.getElementById('customer-requests-list');
        const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
        const badge = document.getElementById('request-count-badge');
        
        badge.innerText = `${requests.filter(r => r.status === 'New').length} New`;
        list.innerHTML = '';

        if (requests.length === 0) {
            list.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No active customer requests.</td></tr>';
            return;
        }

        requests.forEach((req, index) => {
            const isBill = req.type === 'Bill';
            const itemsText = isBill ? '<span style="color: #ffc107; font-weight: bold;">BILL REQUESTED</span>' : req.items.map(i => `${i.name} (x${i.qty})`).join(', ');
            const total = isBill ? '-' : `₹${req.items.reduce((sum, i) => sum + (i.price * i.qty), 0).toFixed(2)}`;
            const time = new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const row = document.createElement('tr');
            if (isBill) {
                row.style.background = 'rgba(255, 193, 7, 0.05)';
            }

            row.innerHTML = `
                <td><b style="color: var(--text-gold);">Table ${req.tableId}</b></td>
                <td style="max-width: 300px; font-size: 0.85rem;">${itemsText}</td>
                <td>${total}</td>
                <td style="color: #d0d0d0;">${time}</td>
                <td>
                    ${isBill ? `
                        <button class="action-btn" style="border-color: #ffc107; color: #ffc107;" onclick="acceptBillRequest(${index})">Open Bill</button>
                        <button class="action-btn delete-btn" onclick="rejectCustomerOrder(${index})">Dismiss</button>
                    ` : `
                        <button class="action-btn" style="border-color: #28a745; color: #28a745;" onclick="acceptCustomerOrder(${index})">Accept & Add to Bill</button>
                        <button class="action-btn delete-btn" onclick="rejectCustomerOrder(${index})">Reject</button>
                    `}
                </td>
            `;
            list.appendChild(row);
        });
    }

    window.acceptBillRequest = (index) => {
        const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
        const req = requests[index];
        
        // Remove from requests
        requests.splice(index, 1);
        localStorage.setItem('ms_customer_requests', JSON.stringify(requests));
        
        // Open the bill for that table
        openTableBill(req.tableId);
        loadCustomerRequests();
    };

    window.acceptCustomerOrder = (index) => {
        const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
        const order = requests[index];
        const tableKey = `Table ${order.tableId}`;

        // 1. Save to Active Orders (Billing System)
        const activeOrders = JSON.parse(localStorage.getItem('ms_active_orders') || '{}');
        
        if (!activeOrders[tableKey]) {
            activeOrders[tableKey] = { items: [], customerName: 'Customer', customerPhone: '' };
        }
        
        // Merge items (if table already has an order)
        order.items.forEach(newItem => {
            const existing = activeOrders[tableKey].items.find(i => i.name === newItem.name);
            if (existing) {
                existing.qty += newItem.qty;
            } else {
                activeOrders[tableKey].items.push(newItem);
            }
        });

        localStorage.setItem('ms_active_orders', JSON.stringify(activeOrders));

        // 2. Update Table Status to Full
        updateTableStatus(parseInt(order.tableId), 'Full');

        // 3. Remove from requests
        requests.splice(index, 1);
        localStorage.setItem('ms_customer_requests', JSON.stringify(requests));
        
        alert('Order accepted and added to table bill!');
        loadCustomerRequests();
    };

    window.rejectCustomerOrder = (index) => {
        if (confirm('Are you sure you want to reject this order?')) {
            const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
            requests.splice(index, 1);
            localStorage.setItem('ms_customer_requests', JSON.stringify(requests));
            loadCustomerRequests();
        }
    };

    // Table Status Logic
    function loadTableStatus() {
        const grid = document.getElementById('table-status-grid');
        const tables = JSON.parse(localStorage.getItem('ms_tables') || '[]');
        
        // Initialize if empty
        if (tables.length === 0) {
            for (let i = 1; i <= 10; i++) {
                tables.push({ id: i, status: 'Empty' });
            }
            localStorage.setItem('ms_tables', JSON.stringify(tables));
        }

        grid.innerHTML = '';
        tables.forEach(table => {
            const card = document.createElement('div');
            card.className = 'table-card';
            card.innerHTML = `
                <span class="table-number">Table ${table.id}</span>
                <span class="table-status status-${table.status.toLowerCase()}">${table.status}</span>
                <div class="table-actions">
                    <button class="action-btn" style="font-size: 0.7rem; border-color: #28a745; color: #28a745;" onclick="openTableBill(${table.id})">Generate Bill</button>
                    <div style="display: flex; gap: 4px; margin-top: 5px;">
                        <button class="action-btn" style="font-size: 0.6rem; flex: 1;" onclick="updateTableStatus(${table.id}, 'Empty')">Empty</button>
                        <button class="action-btn" style="font-size: 0.6rem; flex: 1;" onclick="updateTableStatus(${table.id}, 'Full')">Full</button>
                        <button class="action-btn" style="font-size: 0.6rem; flex: 1;" onclick="updateTableStatus(${table.id}, 'Maintenance')">Maint.</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    window.updateTableStatus = (id, newStatus) => {
        const tables = JSON.parse(localStorage.getItem('ms_tables') || '[]');
        const index = tables.findIndex(t => t.id === id);
        if (index !== -1) {
            tables[index].status = newStatus;
            localStorage.setItem('ms_tables', JSON.stringify(tables));
            loadTableStatus();
        }
    };

    window.addNewTable = () => {
        const tables = JSON.parse(localStorage.getItem('ms_tables') || '[]');
        const nextId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
        tables.push({ id: nextId, status: 'Empty' });
        localStorage.setItem('ms_tables', JSON.stringify(tables));
        loadTableStatus();
    };

    // Menu Management Logic
    function loadMenuManagement() {
        const menuList = document.getElementById('menu-items-list');
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        
        menuList.innerHTML = '';
        
        Object.keys(menuData).forEach(category => {
            menuData[category].forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><span style="text-transform: capitalize; color: #d0d0d0;">${category}</span></td>
                    <td style="color: white; font-weight: 500;">${item.name}</td>
                    <td style="color: var(--text-gold); font-weight: 600;">₹${item.price}</td>
                    <td>
                        <button class="action-btn" onclick="openEditFoodModal('${category}', ${index})">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteFoodItem('${category}', ${index})">Delete</button>
                    </td>
                `;
                menuList.appendChild(row);
            });
        });
    }

    window.openAddFoodModal = () => {
        document.getElementById('food-modal-title').innerText = 'Add New Food';
        document.getElementById('food-name').value = '';
        document.getElementById('food-price').value = '';
        document.getElementById('edit-food-index').value = '';
        document.getElementById('food-modal').style.display = 'flex';
    };

    window.openEditFoodModal = (category, index) => {
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        const item = menuData[category][index];
        
        document.getElementById('food-modal-title').innerText = 'Edit Food Item';
        document.getElementById('food-category').value = category;
        document.getElementById('food-name').value = item.name;
        document.getElementById('food-price').value = item.price;
        document.getElementById('edit-food-index').value = index;
        document.getElementById('edit-food-category').value = category;
        document.getElementById('food-modal').style.display = 'flex';
    };

    window.closeFoodModal = () => {
        document.getElementById('food-modal').style.display = 'none';
    };

    window.saveFoodItem = () => {
        const category = document.getElementById('food-category').value;
        const name = document.getElementById('food-name').value;
        const price = document.getElementById('food-price').value;
        const editIndex = document.getElementById('edit-food-index').value;
        const oldCategory = document.getElementById('edit-food-category').value;

        if (!name || !price) {
            alert('Please fill all fields');
            return;
        }

        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));

        if (editIndex !== '') {
            // Edit existing
            if (oldCategory !== category) {
                // Category changed, remove from old, add to new
                menuData[oldCategory].splice(parseInt(editIndex), 1);
                menuData[category].push({ name, price });
            } else {
                menuData[category][parseInt(editIndex)] = { name, price };
            }
        } else {
            // Add new
            menuData[category].push({ name, price });
        }

        localStorage.setItem('ms_menu_data', JSON.stringify(menuData));
        closeFoodModal();
        loadMenuManagement();
        
        // Update index.html dynamically if it's open (via storage event)
        window.dispatchEvent(new Event('storage'));
    };

    window.deleteFoodItem = (category, index) => {
        if (confirm('Are you sure you want to delete this item?')) {
            const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
            menuData[category].splice(index, 1);
            localStorage.setItem('ms_menu_data', JSON.stringify(menuData));
            loadMenuManagement();
        }
    };

    function loadBookings() {
        const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
        
        if (bookings.length === 0) {
            bookingsList.innerHTML = '';
            emptyState.style.display = 'block';
            updateStats([]);
            return;
        }

        emptyState.style.display = 'none';
        bookingsList.innerHTML = '';

        bookings.forEach(booking => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: white;">${booking.formattedDate}</div>
                    <div style="font-size: 0.8rem; color: #d0d0d0;">${booking.time}</div>
                </td>
                <td>
                    <div style="font-weight: 600; color: white;">${booking.name}</div>
                    <div style="font-size: 0.8rem; color: #d0d0d0;">${booking.phone}</div>
                </td>
                <td>${booking.guests} Diners</td>
                <td>
                    <div style="font-size: 0.85rem;">${booking.seating}</div>
                    ${booking.notes ? `<div style="font-size: 0.75rem; color: #D4AF37; margin-top: 4px;">Note: ${booking.notes}</div>` : ''}
                </td>
                <td>
                    <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span>
                </td>
                <td>
                    <button class="action-btn" style="border-color: #28a745; color: #28a745;" onclick="openBillModal('${booking.name}', '${booking.phone}')">Bill</button>
                    <button class="action-btn" onclick="updateStatus(${booking.id}, 'Confirmed')">Confirm</button>
                    <button class="action-btn delete-btn" onclick="deleteBooking(${booking.id})">Delete</button>
                </td>
            `;
            
            bookingsList.appendChild(row);
        });

        updateStats(bookings);
    }

    function updateStats(bookings) {
        const today = new Date().toISOString().split('T')[0];
        
        const total = bookings.length;
        const todayCount = bookings.filter(b => b.date === today).length;
        const pending = bookings.filter(b => b.status === 'Pending').length;

        totalBookingsEl.innerText = total;
        todayBookingsEl.innerText = todayCount;
        pendingBookingsEl.innerText = pending;
    }

    // Global functions for actions
    window.updateStatus = (id, newStatus) => {
        const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
        const index = bookings.findIndex(b => b.id === id);
        
        if (index !== -1) {
            bookings[index].status = newStatus;
            localStorage.setItem('ms_bookings', JSON.stringify(bookings));
            loadBookings();
        }
    };

    window.deleteBooking = (id) => {
        if (confirm('Are you sure you want to delete this booking?')) {
            const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
            const filteredBookings = bookings.filter(b => b.id !== id);
            localStorage.setItem('ms_bookings', JSON.stringify(filteredBookings));
            loadBookings();
        }
    };

    // Initial Load
    loadBookings();

    // Listen for changes in other tabs (Real-time connection)
    window.addEventListener('storage', (e) => {
        if (e.key === 'ms_bookings') {
            loadBookings();
        }
    });

    // Refresh every 30 seconds as fallback
    setInterval(loadBookings, 30000);

    // Populate Datalist for Billing
    function populateMenuDatalist() {
        const datalist = document.getElementById('menu-items-datalist');
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        
        datalist.innerHTML = '';
        Object.keys(menuData).forEach(category => {
            menuData[category].forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                datalist.appendChild(option);
            });
        });
    }
    populateMenuDatalist();

    // Bill Management Logic
    const billModal = document.getElementById('bill-modal');
    const itemsList = document.getElementById('bill-items-list');

    window.openBillModal = (name = '', phone = '') => {
        populateMenuDatalist(); // Ensure fresh data
        document.getElementById('bill-cust-name').value = name;
        document.getElementById('bill-cust-phone').value = phone;
        
        // Auto-fill table number if it's a reservation
        const tableInput = document.getElementById('bill-table-no');
        tableInput.value = name === '' ? 'Counter/Takeaway' : '';
        
        itemsList.innerHTML = '';
        addBillItem(); // Add one initial row
        billModal.style.display = 'flex';
    };

    window.openTableBill = (tableId) => {
        populateMenuDatalist(); // Ensure fresh data
        document.getElementById('bill-cust-name').value = '';
        document.getElementById('bill-cust-phone').value = '';
        document.getElementById('bill-table-no').value = `Table ${tableId}`;
        
        itemsList.innerHTML = '';
        
        // Check for an active (saved) order for this table
        const activeOrders = JSON.parse(localStorage.getItem('ms_active_orders') || '{}');
        const existingOrder = activeOrders[`Table ${tableId}`];
        
        if (existingOrder) {
            document.getElementById('bill-cust-name').value = existingOrder.customerName || '';
            document.getElementById('bill-cust-phone').value = existingOrder.customerPhone || '';
            
            existingOrder.items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'item-row';
                row.innerHTML = `
                    <input type="text" class="bill-input item-name" list="menu-items-datalist" value="${item.name}">
                    <input type="number" class="bill-input item-qty" value="${item.qty}">
                    <input type="number" class="bill-input item-price" value="${item.price}">
                `;
                itemsList.appendChild(row);
                attachAutoPriceLogic(row);
            });
        } else {
            addBillItem(); // Add one initial row if no saved order
        }
        
        billModal.style.display = 'flex';
    };

    function attachAutoPriceLogic(row) {
        const nameInput = row.querySelector('.item-name');
        const priceInput = row.querySelector('.item-price');
        
        nameInput.addEventListener('input', (e) => {
            const selectedName = e.target.value;
            const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
            
            let foundPrice = '';
            Object.keys(menuData).some(category => {
                const item = menuData[category].find(i => i.name === selectedName);
                if (item) {
                    foundPrice = item.price;
                    return true;
                }
                return false;
            });
            
            if (foundPrice) {
                priceInput.value = foundPrice;
            }
        });
    }

    window.closeBillModal = () => {
        billModal.style.display = 'none';
    };

    window.addBillItem = () => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <input type="text" class="bill-input item-name" list="menu-items-datalist" placeholder="Food Item">
            <input type="number" class="bill-input item-qty" placeholder="Qty" value="1">
            <input type="number" class="bill-input item-price" placeholder="Price">
        `;
        
        attachAutoPriceLogic(row);
        itemsList.appendChild(row);
    };

    window.saveCurrentOrder = () => {
        const name = document.getElementById('bill-cust-name').value;
        const phone = document.getElementById('bill-cust-phone').value;
        const table = document.getElementById('bill-table-no').value;
        
        const rows = document.querySelectorAll('.item-row');
        const orderItems = [];

        rows.forEach(row => {
            const itemName = row.querySelector('.item-name').value;
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            
            if (itemName && qty > 0) {
                orderItems.push({ name: itemName, qty, price });
            }
        });

        if (orderItems.length === 0) {
            alert('Please add at least one item to save.');
            return;
        }

        // Save to active orders
        const activeOrders = JSON.parse(localStorage.getItem('ms_active_orders') || '{}');
        activeOrders[table] = {
            customerName: name,
            customerPhone: phone,
            items: orderItems,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('ms_active_orders', JSON.stringify(activeOrders));

        // Auto-update table status if it's a real table
        if (table && table.startsWith('Table ')) {
            const tableId = parseInt(table.replace('Table ', '').trim());
            if (!isNaN(tableId)) {
                updateTableStatus(tableId, 'Full');
            }
        }

        alert(`Order for ${table} saved successfully!`);
        closeBillModal();
    };

    window.generateAndPrintBill = () => {
        const name = document.getElementById('bill-cust-name').value;
        const phone = document.getElementById('bill-cust-phone').value;
        const table = document.getElementById('bill-table-no').value;
        
        const rows = document.querySelectorAll('.item-row');
        let itemsHtml = '';
        let subtotal = 0;
        const billItems = [];

        rows.forEach(row => {
            const itemName = row.querySelector('.item-name').value;
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            
            if (itemName && qty > 0 && price > 0) {
                const total = qty * price;
                subtotal += total;
                billItems.push({ name: itemName, qty, price, total });
                itemsHtml += `
                    <div class="receipt-line">
                        <span>${itemName} (x${qty})</span>
                        <span>₹${total.toFixed(2)}</span>
                    </div>
                `;
            }
        });

        if (billItems.length === 0) {
            alert('Please add at least one item to the bill.');
            return;
        }

        const gst = subtotal * 0.05; // 5% GST
        const grandTotal = subtotal + gst;

        // Save bill to history
        const savedBills = JSON.parse(localStorage.getItem('ms_saved_bills') || '[]');
        const newBill = {
            id: Date.now(),
            customerName: name,
            customerPhone: phone,
            tableNumber: table,
            items: billItems,
            subtotal,
            gst,
            grandTotal,
            date: new Date().toISOString()
        };
        savedBills.unshift(newBill);
        localStorage.setItem('ms_saved_bills', JSON.stringify(savedBills));

        // Clear active order for this table as it is now paid/completed
        const activeOrders = JSON.parse(localStorage.getItem('ms_active_orders') || '{}');
        delete activeOrders[table];
        localStorage.setItem('ms_active_orders', JSON.stringify(activeOrders));

        // Auto-update table status to 'Full' if a table number is provided
        if (table && table !== 'Counter/Takeaway') {
            const tableId = parseInt(table.replace('Table ', '').trim());
            if (!isNaN(tableId)) {
                updateTableStatus(tableId, 'Full');
            }
        }

        const receiptPreview = document.getElementById('receipt-preview');
        receiptPreview.innerHTML = `
            <div class="receipt-header">
                <h2>MS BAR & LOUNGE</h2>
                <p>3 Nawab Siraj-Ud-Daulah Sarani, Kolkata</p>
                <p>Phone: +91 92309 96055</p>
                <div style="margin-top: 10px; text-align: left;">
                    <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
                    <p><b>Customer:</b> ${name || 'N/A'}</p>
                    <p><b>Phone:</b> ${phone || 'N/A'}</p>
                    <p><b>Table:</b> ${table || 'N/A'}</p>
                </div>
            </div>
            <div class="receipt-body">
                <div class="receipt-line" style="font-weight: bold; border-bottom: 1px solid black; margin-bottom: 5px;">
                    <span>Item</span>
                    <span>Price</span>
                </div>
                ${itemsHtml}
                <div style="border-top: 1px solid black; margin-top: 10px; padding-top: 5px;">
                    <div class="receipt-line">
                        <span>Subtotal</span>
                        <span>₹${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="receipt-line">
                        <span>GST (5%)</span>
                        <span>₹${gst.toFixed(2)}</span>
                    </div>
                    <div class="receipt-line" style="font-weight: bold; font-size: 1.1rem; margin-top: 5px;">
                        <span>TOTAL</span>
                        <span>₹${grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <div class="receipt-footer">
                <p><b>THANK YOU</b></p>
                <p>VISIT AGAIN</p>
            </div>
        `;

        // Trigger Print
        window.print();
    };

    // Logout Function
    window.adminLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.removeItem('ms_admin_logged_in');
            sessionStorage.removeItem('ms_admin_user');
            window.location.href = 'login.html';
        }
    };

    // Auto Refresh (Every 5 seconds)
    setInterval(() => {
        const activeNav = document.querySelector('.nav-item.active');
        if (!activeNav) return;

        const tabTitle = activeNav.innerText.trim();
        
        // Always refresh customer request badge
        const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
        const badge = document.getElementById('request-count-badge');
        if (badge) {
            badge.innerText = `${requests.filter(r => r.status === 'New').length} New`;
        }

        // Refresh active tab data
        if (tabTitle === 'Billing & Bookings') {
            loadBookings();
        } else if (tabTitle === 'Table Status') {
            loadTableStatus();
        } else if (tabTitle === 'Customer Orders') {
            loadCustomerRequests();
        } else if (tabTitle === 'Menu Settings') {
            // Only load menu management if modal is not open to avoid disrupting edits
            const modal = document.getElementById('food-modal');
            if (modal && modal.style.display !== 'flex') {
                loadMenuManagement();
            }
        }
    }, 5000);
});
