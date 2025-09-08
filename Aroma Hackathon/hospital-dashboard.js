(async () => {
  console.log('Hospital Dashboard initializing...');
  
  let dbReady = false;
  let retryCount = 0;
  const maxRetries = 15;
  
  while (!dbReady && retryCount < maxRetries) {
    try {
      if (typeof bloodConnectDB !== 'undefined') {
        if (!bloodConnectDB.initialized) {
          console.log(`Attempting database initialization (attempt ${retryCount + 1})...`);
          const initResult = await bloodConnectDB.init();
          if (initResult) {
            dbReady = true;
            console.log('Database initialized successfully');
          } else {
            throw new Error('Database initialization returned false');
          }
        } else {
          dbReady = true;
          console.log('Database already initialized');
        }
      } else {
        throw new Error('bloodConnectDB not available');
      }
    } catch (error) {
      console.log(`Database connection attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  if (!dbReady) {
    console.error('Failed to initialize database after maximum retries');
    showError('Database connection failed. Please refresh the page.');
    return;
  }

  const HOSPITAL_CREDENTIALS = {
    email: 'cmc@gmail.com',
    password: 'cmc123#'
  };

  const loginBox = document.getElementById('loginBox');
  const dashboardBox = document.getElementById('dashboardBox');
  const loginForm = document.getElementById('hospitalLogin');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notificationText');

  function showLogin() {
    if (loginBox) loginBox.style.display = 'flex';
    if (dashboardBox) dashboardBox.style.display = 'none';
  }

  function showDashboard() {
    if (loginBox) loginBox.style.display = 'none';
    if (dashboardBox) dashboardBox.style.display = 'flex';
    loadDashboardData();
  }

  function showError(message) {
    console.error('Error:', message);
    if (notification && notificationText) {
      notificationText.textContent = message;
      notification.classList.add('show', 'error');
      setTimeout(() => {
        notification.classList.remove('show', 'error');
      }, 5000);
    }
  }

  if (localStorage.getItem('hospital_logged_in') === 'true') {
    showDashboard();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const email = formData.get('email');
      const password = formData.get('password');

      if (email === HOSPITAL_CREDENTIALS.email && password === HOSPITAL_CREDENTIALS.password) {
        localStorage.setItem('hospital_logged_in', 'true');
        showDashboard();
        if (loginError) loginError.style.display = 'none';
      } else {
        if (loginError) {
          loginError.textContent = 'Invalid email or password';
          loginError.style.display = 'block';
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('hospital_logged_in');
      showLogin();
    });
  }

  async function loadDashboardData() {
    try {
      console.log('Loading dashboard data...');
      await addSampleDataDirectly();
      await updateStats();
      await loadRequestsTable();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Failed to load dashboard data');
    }
  }

  async function addSampleDataDirectly() {
    try {
      if (typeof bloodConnectDB !== 'undefined' && bloodConnectDB.db) {
        const result = bloodConnectDB.db.exec(`
          SELECT COUNT(*) as count FROM blood_requests 
          WHERE hospital LIKE '%CMC%' OR hospital LIKE '%cmc%'
        `);
        
        const count = result[0] ? result[0].values[0][0] : 0;
        
        if (count === 0) {
          console.log('Adding sample blood requests...');
          
          const stmt = bloodConnectDB.db.prepare(`
            INSERT INTO blood_requests (
              patient_name, contact_phone, blood_type, units_needed, 
              hospital, urgency_level, additional_details, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          const sampleRequests = [
            ['Harihar Bhusal', '9841234567', 'O+', 2, 'cmc/bharatpur', 'emergency', 'Urgent surgery required', 'pending'],
            ['Sita Sharma', '9812345678', 'A-', 1, 'CMC', 'urgent', 'Blood transfusion needed', 'pending'],
            ['Ram Kumar', '9823456789', 'B+', 3, 'CMC', 'routine', 'Scheduled operation', 'accepted'],
            ['Maya Gurung', '9834567890', 'AB+', 1, 'cmc/bharatpur', 'routine', 'Regular checkup', 'pending'],
            ['Krishna Tamang', '9845678901', 'O-', 2, 'CMC', 'emergency', 'Critical condition', 'rejected']
          ];
          
          sampleRequests.forEach(request => {
            stmt.bind(request);
            stmt.step();
            stmt.reset();
          });
          
          stmt.free();
          bloodConnectDB.saveDatabase();
          console.log('Sample data added successfully');
        }
      }
    } catch (error) {
      console.error('Error adding sample data:', error);
    }
  }

  async function updateStats() {
    try {
      const tbody = document.getElementById('requestsTableBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading statistics...</td></tr>';
      }

      let requests = [];
      
      if (typeof bloodConnectDB !== 'undefined' && bloodConnectDB.db) {
        const stmt = bloodConnectDB.db.prepare(`
          SELECT * FROM blood_requests 
          WHERE hospital LIKE '%' || ? || '%'
          ORDER BY created_at DESC
        `);
        stmt.bind(['CMC']);
        
        while (stmt.step()) {
          const row = stmt.getAsObject();
          requests.push(row);
        }
        stmt.free();
      }

      const pending = requests.filter(r => r.status === 'pending').length;
      const accepted = requests.filter(r => r.status === 'accepted').length;
      const emergency = requests.filter(r => r.urgency_level === 'emergency').length;
      const total = requests.length;

      animateCounter('statPending', pending);
      animateCounter('statAccepted', accepted);
      animateCounter('statEmergency', emergency);
      animateCounter('statTotal', total);

      console.log(`Stats updated: ${pending} pending, ${accepted} accepted, ${emergency} emergency, ${total} total`);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    
    if (currentValue === targetValue) return;
    
    let current = currentValue;
    const timer = setInterval(() => {
      current += increment;
      element.textContent = current;
      
      if (current === targetValue) {
        clearInterval(timer);
      }
    }, 50);
  }

  async function loadRequestsTable() {
    console.log('Loading requests table...');
    
    try {
      const tbody = document.getElementById('requestsTableBody');
      if (!tbody) return;

      let requests = [];
      
      if (typeof bloodConnectDB !== 'undefined' && bloodConnectDB.db) {
        const stmt = bloodConnectDB.db.prepare(`
          SELECT * FROM blood_requests 
          WHERE hospital LIKE '%' || ? || '%'
          ORDER BY created_at DESC
        `);
        stmt.bind(['CMC']);
        
        while (stmt.step()) {
          const row = stmt.getAsObject();
          requests.push(row);
        }
        stmt.free();
      }

      tbody.innerHTML = '';

      if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No requests found for this hospital</td></tr>';
        return;
      }

      requests.forEach(request => {
        const row = document.createElement('tr');
        
        const urgencyClass = `urgency-${request.urgency_level}`;
        const statusClass = `status-${request.status}`;
        
        let actionButtons = '';
        if (request.status === 'pending') {
          actionButtons = `
            <div class="action-buttons">
              <button class="btn-accept" onclick="handleRequest(${request.id}, 'accepted')">
                <i class="fas fa-check"></i> Accept
              </button>
              <button class="btn-reject" onclick="handleRequest(${request.id}, 'rejected')">
                <i class="fas fa-times"></i> Reject
              </button>
            </div>
          `;
        } else {
          actionButtons = `<span class="status-badge ${statusClass}">${request.status.toUpperCase()}</span>`;
        }

        row.innerHTML = `
          <td>${request.id}</td>
          <td>${request.patient_name}</td>
          <td><strong>${request.blood_type}</strong></td>
          <td>${request.units_needed}</td>
          <td>${request.contact_phone || 'N/A'}</td>
          <td><span class="status-badge ${urgencyClass}">${request.urgency_level.toUpperCase()}</span></td>
          <td><span class="status-badge ${statusClass}">${request.status.toUpperCase()}</span></td>
          <td>${actionButtons}</td>
        `;
        
        tbody.appendChild(row);
      });

      console.log(`Loaded ${requests.length} requests`);
    } catch (error) {
      console.error('Error loading requests table:', error);
      const tbody = document.getElementById('requestsTableBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">Error loading requests</td></tr>';
      }
    }
  }

  async function handleRequest(requestId, action) {
    console.log(`Handling request ${requestId}: ${action}`);
    
    try {
      if (typeof bloodConnectDB !== 'undefined' && bloodConnectDB.db) {
        const stmt = bloodConnectDB.db.prepare(`
          UPDATE blood_requests 
          SET status = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `);
        stmt.bind([action, requestId]);
        stmt.step();
        stmt.free();
        
        bloodConnectDB.saveDatabase();
        console.log(`Request ${requestId} ${action} successfully`);
      }
      
      showNotification(`Request ${action.toUpperCase()}: User has been notified through their account`);
      
      await loadDashboardData();
    } catch (error) {
      console.error('Error handling request:', error);
      showNotification('Error processing request');
    }
  }

  window.handleRequest = handleRequest;
  window.refreshData = async () => {
    console.log('Refreshing data...');
    await loadDashboardData();
    showNotification('Data refreshed successfully');
  };

  function showNotification(message) {
    console.log('Showing notification:', message);
    if (notification && notificationText) {
      notificationText.textContent = message;
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, 4000);
    }
  }

  try {
    await addSampleDataDirectly();
    
    if (localStorage.getItem('hospital_logged_in') === 'true') {
      await loadDashboardData();
    }
    
    console.log('Hospital Dashboard initialized successfully');
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    showError('Failed to initialize dashboard. Please refresh the page.');
  }
})();