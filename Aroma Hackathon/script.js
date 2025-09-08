const mapData = {
  emergencies: [
    { id: 1, lat: 27.7172, lng: 85.3240, type: 'O-', hospital: 'Tribhuvan University Teaching Hospital', status: 'Critical', patient: 'Urgent Case #001' },
    { id: 2, lat: 27.7021, lng: 85.3077, type: 'AB+', hospital: 'Bir Hospital', status: 'Urgent', patient: 'Emergency Patient' },
    { id: 3, lat: 27.7089, lng: 85.3150, type: 'B+', hospital: 'Grande Hospital', status: 'Emergency', patient: 'Critical Surgery' },
    { id: 4, lat: 27.7200, lng: 85.3300, type: 'A-', hospital: 'Nepal Medical College', status: 'Urgent', patient: 'Accident Victim' }
  ],
  donors: [
    { id: 1, lat: 27.7100, lng: 85.3200, type: 'O+', name: 'Raj K.', available: true, phone: '+977-98XXXXXXX1' },
    { id: 2, lat: 27.7050, lng: 85.3100, type: 'A+', name: 'Maya S.', available: true, phone: '+977-98XXXXXXX2' },
    { id: 3, lat: 27.7150, lng: 85.3250, type: 'B-', name: 'Hari T.', available: false, phone: '+977-98XXXXXXX3' },
    { id: 4, lat: 27.7080, lng: 85.3180, type: 'O-', name: 'Sita L.', available: true, phone: '+977-98XXXXXXX4' },
    { id: 5, lat: 27.7120, lng: 85.3220, type: 'AB+', name: 'Ram B.', available: true, phone: '+977-98XXXXXXX5' },
    { id: 6, lat: 27.7000, lng: 85.3050, type: 'A-', name: 'Gita P.', available: false, phone: '+977-98XXXXXXX6' },
    { id: 7, lat: 27.7180, lng: 85.3280, type: 'B+', name: 'Krishna M.', available: true, phone: '+977-98XXXXXXX7' },
    { id: 8, lat: 27.7060, lng: 85.3160, type: 'O+', name: 'Laxmi D.', available: true, phone: '+977-98XXXXXXX8' },
    { id: 9, lat: 27.7110, lng: 85.3210, type: 'AB-', name: 'Suresh G.', available: false, phone: '+977-98XXXXXXX9' },
    { id: 10, lat: 27.7140, lng: 85.3240, type: 'A+', name: 'Kamala R.', available: true, phone: '+977-98XXXXXX10' }
  ],
  hospitals: [
    { id: 1, lat: 27.7172, lng: 85.3240, name: 'Tribhuvan University Teaching Hospital', beds: 700 },
    { id: 2, lat: 27.7021, lng: 85.3077, name: 'Bir Hospital', beds: 450 },
    { id: 3, lat: 27.7089, lng: 85.3150, name: 'Grande Hospital', beds: 200 },
    { id: 4, lat: 27.7200, lng: 85.3300, name: 'Nepal Medical College', beds: 350 },
    { id: 5, lat: 27.7050, lng: 85.3120, name: 'Civil Service Hospital', beds: 180 },
    { id: 6, lat: 27.7130, lng: 85.3270, name: 'Norvik Hospital', beds: 150 }
  ],
  events: [
    { id: 1, lat: 27.7089, lng: 85.3206, name: 'Community Blood Drive', date: 'Dec 20, 9AM-4PM' },
    { id: 2, lat: 27.7150, lng: 85.3250, name: 'University Health Fair', date: 'Dec 25, 8AM-2PM' },
    { id: 3, lat: 27.7100, lng: 85.3180, name: 'Corporate Donation Day', date: 'Jan 5, 10AM-3PM' },
    { id: 4, lat: 27.7030, lng: 85.3090, name: 'Red Cross Mobile Unit', date: 'Jan 10, 9AM-5PM' }
  ]
};

let map;
let markersGroup;
let selectedPlan = '';
let selectedAmount = 0;
let ambulanceTimer = null;
let ambulanceCountdown = 30;
let currentUser = null;

const popupDialog = document.getElementById('popupDialog');
const popupDetails = document.getElementById('popupDetails');
const popupCloseBtn = document.getElementById('popupCloseBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

const notificationPopup = document.createElement('div');
notificationPopup.className = 'notification-popup';
notificationPopup.innerHTML = `<div class="notification-text"></div><button class="notification-close" aria-label="Close notification">&times;</button>`;
document.body.appendChild(notificationPopup);
const notificationText = notificationPopup.querySelector('.notification-text');
const notificationCloseBtn = notificationPopup.querySelector('.notification-close');

async function initApp() {
  try {
    if (typeof bloodConnectDB !== 'undefined') {
      await bloodConnectDB.init();
      const userId = localStorage.getItem('bloodconnect_current_user');
      if (userId) {
        currentUser = await bloodConnectDB.getUserById(parseInt(userId));
        if (currentUser) updateUserUI();
        else localStorage.removeItem('bloodconnect_current_user');
      }
      await animateCountersFromDB();
      await loadReviewsFromDB();
    } else {
      initAppFallback();
    }
    initMap();
    setupEventListeners();
    setupFormEventListeners();
  } catch (error) {
    initAppFallback();
  }
}

function initAppFallback() {
  const savedUser = localStorage.getItem('bloodConnectUser');
  if (savedUser) {
    try { 
      currentUser = JSON.parse(savedUser); 
      updateUserUI(); 
    } catch { 
      localStorage.removeItem('bloodConnectUser'); 
    }
  }
  animateCounters(); 
  initMap(); 
  setupEventListeners(); 
  setupFormEventListeners(); 
  loadReviewsFromLocalStorage();
}

function updateUserUI() {
  const navButtons = document.getElementById('navButtons');
  const userMenu = document.getElementById('userMenu');
  const userInitials = document.getElementById('userInitials');
  if (currentUser) {
    if (navButtons) navButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userInitials && currentUser.name) {
      const names = currentUser.name.split(' ');
      userInitials.textContent = (names[0].charAt(0) + (names[names.length - 1]?.charAt(0) || '')).toUpperCase();
    }
  } else {
    if (navButtons) navButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

async function animateCountersFromDB() {
  try {
    const stats = await bloodConnectDB.getStatistics();
    animateCountersWithData([
      { id: 'totalDonors', target: stats.totalDonors || 15420 },
      { id: 'lifesSaved', target: stats.livesSaved || 8930 },
      { id: 'bloodUnits', target: stats.totalUnits || 25670 },
      { id: 'hospitals', target: 156 }
    ]);
  } catch { 
    animateCounters(); 
  }
}

function animateCounters() {
  animateCountersWithData([
    { id: 'totalDonors', target: 15420 },
    { id: 'lifesSaved', target: 8930 },
    { id: 'bloodUnits', target: 25670 },
    { id: 'hospitals', target: 156 }
  ]);
}

function animateCountersWithData(counters) {
  counters.forEach(counter => {
    const el = document.getElementById(counter.id);
    if (!el) return;
    let current = 0;
    const increment = Math.ceil(counter.target / 100);
    const timer = setInterval(() => {
      current += increment;
      if (current >= counter.target) { 
        current = counter.target; 
        clearInterval(timer); 
      }
      el.textContent = current.toLocaleString();
    }, 20);
  });
}

async function loadReviewsFromDB() {
  try {
    const reviews = await bloodConnectDB.getReviews(10);
    const grid = document.getElementById('reviewsGrid');
    if (reviews?.length && grid) reviews.forEach(r => addReviewToGrid(r, grid));
  } catch {}
}

function loadReviewsFromLocalStorage() {
  const reviews = JSON.parse(localStorage.getItem('bloodConnectReviews') || '[]');
  const grid = document.getElementById('reviewsGrid');
  if (reviews.length && grid) {
    reviews.forEach(r => addReviewToGrid({ 
      ...r, 
      reviewer_name: r.name || r.reviewerName, 
      review_text: r.text || r.reviewText, 
      created_at: r.date || new Date().toISOString() 
    }, grid));
  }
}

function addReviewToGrid(review, reviewsGrid) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const card = document.createElement('div');
  card.className = 'review-card';
  card.innerHTML = `
    <div class="review-header">
      <div class="review-avatar">${review.reviewer_name.charAt(0).toUpperCase()}</div>
      <div class="review-info">
        <h4>${review.reviewer_name}</h4>
        <div class="review-stars">${stars}</div>
        <div style="font-size:0.8rem;color:#64748b">${new Date(review.created_at).toLocaleDateString()}</div>
      </div>
    </div>
    <p class="review-text">"${review.review_text}"</p>`;
  reviewsGrid.appendChild(card);
}

function setupEventListeners() {
  const userAvatar = document.getElementById('userAvatar');
  if (userAvatar) {
    userAvatar.addEventListener('click', e => { 
      e.stopPropagation(); 
      const userMenu = document.getElementById('userMenu');
      if (userMenu) userMenu.classList.toggle('active'); 
    });
  }
  
  document.addEventListener('click', () => {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) userMenu.classList.remove('active');
  });

  const dashboardLink = document.getElementById('dashboardLink');
  if (dashboardLink) {
    dashboardLink.addEventListener('click', e => { 
      e.preventDefault(); 
      window.location.href = 'dashboard.html'; 
    });
  }

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', e => {
      e.preventDefault(); 
      localStorage.removeItem('bloodconnect_current_user'); 
      localStorage.removeItem('bloodConnectUser');
      currentUser = null; 
      updateUserUI(); 
      showNotification('Logged out successfully.');
    });
  }

  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', function () {
      const img = this.getAttribute('data-image');
      const modal = document.getElementById('eventModal');
      const imgEl = document.getElementById('eventModalImage');
      if (img && modal && imgEl) { 
        imgEl.src = img; 
        modal.style.display = 'flex'; 
      }
    });
  });

  const eventModalClose = document.getElementById('eventModalClose');
  if (eventModalClose) {
    eventModalClose.addEventListener('click', () => {
      const eventModal = document.getElementById('eventModal');
      if (eventModal) eventModal.style.display = 'none';
    });
  }

  const eventModal = document.getElementById('eventModal');
  if (eventModal) {
    eventModal.addEventListener('click', function (e) { 
      if (e.target === this) this.style.display = 'none'; 
    });
  }

  const paymentSuccessBtn = document.getElementById('paymentSuccessBtn');
  if (paymentSuccessBtn) {
    paymentSuccessBtn.addEventListener('click', () => { 
      closeModal('paymentSuccessModal'); 
      showModal('hospitalModal'); 
    });
  }

  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      const navMenu = document.getElementById('navMenu');
      if (navMenu) navMenu.classList.toggle('active');
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault(); 
      const targetId = a.getAttribute('href');
      if (targetId && targetId !== '#') {
        const tgt = document.querySelector(targetId); 
        if (tgt) tgt.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  if (popupCloseBtn) {
    popupCloseBtn.addEventListener('click', () => {
      if (popupDialog) popupDialog.classList.remove('show');
    });
  }

  if (notificationCloseBtn) {
    notificationCloseBtn.addEventListener('click', () => {
      notificationPopup.classList.remove('show');
    });
  }

  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => { 
      if (e.target === m) m.style.display = 'none'; 
    });
  });

  setupMainActionButtons();
  setupCancelButtons();
}

function setupMainActionButtons() {
  [
    { id: 'btnBecomeDonor', modal: 'donorModal' },
    { id: 'heroBecomeDonor', modal: 'donorModal' },
    { id: 'btnRequestBlood', modal: 'requestModal' },
    { id: 'heroRequestBlood', modal: 'requestModal' },
    { id: 'heroEmergency', modal: 'emergencyModal' },
    { id: 'btnEmergencyAlert', modal: 'emergencyModal' }
  ].forEach(({ id, modal }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', e => { 
        e.preventDefault(); 
        showModal(modal); 
      });
    }
  });

  const btnEmergencyHelp = document.getElementById('btnEmergencyHelp');
  if (btnEmergencyHelp) {
    btnEmergencyHelp.addEventListener('click', e => {
      e.preventDefault(); 
      showModal('ambulanceModal'); 
      startAmbulanceTimer();
    });
  }

  const ambulanceCancelBtn = document.getElementById('ambulanceCancelBtn');
  if (ambulanceCancelBtn) {
    ambulanceCancelBtn.addEventListener('click', cancelAmbulance);
  }
}

function setupCancelButtons() {
  [
    { btn: 'donorCancelBtn', modal: 'donorModal' },
    { btn: 'requestCancelBtn', modal: 'requestModal' },
    { btn: 'emergencyCancelBtn', modal: 'emergencyModal' },
    { btn: 'paymentCancelBtn', modal: 'paymentModal' },
    { btn: 'hospitalCancelBtn', modal: 'hospitalModal' },
    { btn: 'userDetailCloseBtn', modal: 'userDetailModal' },
    { btn: 'eventRegisterCancelBtn', modal: 'eventRegisterModal' }
  ].forEach(({ btn, modal }) => {
    const element = document.getElementById(btn);
    if (element) {
      element.addEventListener('click', () => closeModal(modal));
    }
  });
}

function setupFormEventListeners() {
  const donorForm = document.getElementById('donorForm');
  if (donorForm) donorForm.addEventListener('submit', handleDonorRegistration);

  const requestForm = document.getElementById('requestForm');
  if (requestForm) requestForm.addEventListener('submit', handleBloodRequest);

  const emergencyForm = document.getElementById('emergencyForm');
  if (emergencyForm) emergencyForm.addEventListener('submit', handleEmergencyRequest);

  const eventRegisterForm = document.getElementById('eventRegisterForm');
  if (eventRegisterForm) eventRegisterForm.addEventListener('submit', handleEventRegistration);

  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) reviewForm.addEventListener('submit', handleReviewSubmission);

  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) paymentForm.addEventListener('submit', handlePayment);

  const hospitalForm = document.getElementById('hospitalForm');
  if (hospitalForm) hospitalForm.addEventListener('submit', handleHospitalRegistration);
}

async function handleDonorRegistration(e) {
  e.preventDefault(); 
  showLoading();
  const fd = new FormData(e.target);
  const donorData = {
    name: fd.get('name'), 
    email: fd.get('email'), 
    phone: fd.get('phone'),
    bloodType: fd.get('bloodType'), 
    age: parseInt(fd.get('age')),
    location: fd.get('location'), 
    type: 'donor', 
    password: 'default123'
  };

  if (typeof bloodConnectDB !== 'undefined' && bloodConnectDB.registerUser) {
    try {
      const res = await bloodConnectDB.registerUser(donorData);
      if (res.success) {
        currentUser = res.user;
        localStorage.setItem('bloodconnect_current_user', res.user.id.toString());
        addNewDonorToMap(donorData);
        hideLoading(); 
        closeModal('donorModal'); 
        updateUserUI();
        showNotification(`Welcome, ${donorData.name}! You are now a donor.`);
        e.target.reset(); 
        return;
      }
    } catch (error) {
      console.log('Database registration failed, using fallback');
    }
  }

  currentUser = { ...donorData, donations: 0 }; 
  localStorage.setItem('bloodConnectUser', JSON.stringify(currentUser));
  addNewDonorToMap(donorData); 
  hideLoading(); 
  closeModal('donorModal'); 
  updateUserUI();
  showNotification(`Welcome, ${donorData.name}! You are now a donor.`); 
  e.target.reset();
}

async function handleBloodRequest(e) {
  e.preventDefault(); 
  showLoading();
  const fd = new FormData(e.target);
  const req = {
    patientName: fd.get('patientName'), 
    email: fd.get('email'), 
    phone: fd.get('phone'),
    bloodType: fd.get('bloodType'), 
    units: parseInt(fd.get('units')),
    hospital: fd.get('hospital'), 
    urgency: fd.get('urgency'), 
    details: fd.get('details')
  };

  if (typeof bloodConnectDB !== 'undefined' && bloodConnectDB.addRequest) {
    try {
      const res = await bloodConnectDB.addRequest(req);
      if (res.success) { 
        if (!currentUser) await createUserFromRequest(req); 
        handleRequestSuccess(req); 
        return; 
      }
    } catch (error) {
      console.log('Database request failed, using fallback');
    }
  }

  if (!currentUser) { 
    currentUser = { 
      name: req.patientName, 
      email: req.email, 
      phone: req.phone, 
      type: 'recipient' 
    }; 
    localStorage.setItem('bloodConnectUser', JSON.stringify(currentUser)); 
    updateUserUI(); 
  }
  handleRequestSuccess(req);
}

async function handleEmergencyRequest(e) {
  e.preventDefault(); 
  showLoading();
  const fd = new FormData(e.target);
  const em = {
    patientName: fd.get('patientName'), 
    phone: fd.get('emergencyPhone'), 
    bloodType: fd.get('bloodType'),
    hospital: fd.get('hospital'), 
    urgency: 'emergency', 
    details: fd.get('details'), 
    units: 1
  };

  if (typeof bloodConnectDB !== 'undefined' && bloodConnectDB.addRequest) {
    try {
      const res = await bloodConnectDB.addRequest(em);
      if (res.success) { 
        if (!currentUser) await createUserFromEmergency(em); 
        handleEmergencySuccess(em); 
        return; 
      }
    } catch (error) {
      console.log('Database emergency request failed, using fallback');
    }
  }

  if (!currentUser) { 
    currentUser = { 
      name: em.patientName, 
      phone: em.phone, 
      type: 'recipient' 
    }; 
    localStorage.setItem('bloodConnectUser', JSON.stringify(currentUser)); 
    updateUserUI(); 
  }
  handleEmergencySuccess(em);
}

async function handleEventRegistration(e) {
  e.preventDefault(); 
  showLoading();
  const fd = new FormData(e.target);
  const ev = { 
    name: fd.get('name'), 
    email: fd.get('email'), 
    phone: fd.get('phone'), 
    bloodType: fd.get('bloodType'), 
    age: parseInt(fd.get('age')), 
    type: 'donor', 
    password: 'default123' 
  };

  let uid = currentUser?.id;
  if (!currentUser && typeof bloodConnectDB !== 'undefined' && bloodConnectDB.registerUser) {
    try {
      const ur = await bloodConnectDB.registerUser(ev);
      if (ur.success) { 
        uid = ur.userId; 
        currentUser = { id: uid, ...ev, donations: 0 }; 
        delete currentUser.password; 
        localStorage.setItem('bloodconnect_current_user', uid.toString()); 
        updateUserUI(); 
      }
    } catch (error) {
      console.log('Database event registration failed');
    }
  }

  if (uid && typeof bloodConnectDB !== 'undefined' && bloodConnectDB.registerForEvent) {
    try {
      await bloodConnectDB.registerForEvent(1, uid);
    } catch (error) {
      console.log('Event registration failed');
    }
  }

  hideLoading(); 
  closeModal('eventRegisterModal'); 
  showNotification('Registered for event!'); 
  e.target.reset();
}

async function handleReviewSubmission(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const rev = { 
    reviewerName: fd.get('reviewerName'), 
    reviewerEmail: fd.get('reviewerEmail'), 
    rating: parseInt(fd.get('rating')), 
    reviewText: fd.get('reviewText'), 
    photoUrl: null 
  };

  if (!rev.rating) { 
    showNotification('Please select a rating'); 
    return; 
  }

  showLoading();

  if (typeof bloodConnectDB !== 'undefined' && bloodConnectDB.addReview) {
    try {
      const res = await bloodConnectDB.addReview(rev);
      if (res.success) { 
        const grid = document.getElementById('reviewsGrid'); 
        if (grid) addReviewToGrid({ 
          ...rev, 
          reviewer_name: rev.reviewerName, 
          review_text: rev.reviewText, 
          created_at: new Date().toISOString() 
        }, grid); 
        hideLoading(); 
        e.target.reset(); 
        showNotification('Thanks for your review!'); 
        return; 
      }
    } catch (error) {
      console.log('Database review submission failed, using fallback');
    }
  }

  const reviews = JSON.parse(localStorage.getItem('bloodConnectReviews') || '[]'); 
  reviews.push({ 
    name: rev.reviewerName, 
    rating: rev.rating, 
    text: rev.reviewText, 
    date: new Date().toISOString() 
  }); 
  localStorage.setItem('bloodConnectReviews', JSON.stringify(reviews));
  
  const grid = document.getElementById('reviewsGrid'); 
  if (grid) addReviewToGrid({ 
    reviewer_name: rev.reviewerName, 
    review_text: rev.reviewText, 
    rating: rev.rating, 
    created_at: new Date().toISOString() 
  }, grid);
  
  hideLoading(); 
  e.target.reset(); 
  showNotification('Thanks for your review!');
}

function handlePayment(e) { 
  e.preventDefault(); 
  showLoading(); 
  setTimeout(() => { 
    hideLoading(); 
    closeModal('paymentModal'); 
    const successPlan = document.getElementById('successPlan');
    const successAmount = document.getElementById('successAmount');
    if (successPlan) successPlan.textContent = selectedPlan; 
    if (successAmount) successAmount.textContent = selectedAmount; 
    showModal('paymentSuccessModal'); 
  }, 2000); 
}

function handleHospitalRegistration(e) {
  e.preventDefault(); 
  const fd = new FormData(e.target); 
  const hd = Object.fromEntries(fd);
  if (hd.hospitalPassword !== hd.confirmPassword) { 
    showNotification('Passwords do not match'); 
    return; 
  }
  showLoading(); 
  setTimeout(() => { 
    hideLoading(); 
    closeModal('hospitalModal'); 
    showNotification(`Hospital registered for ${selectedPlan} plan!`); 
    e.target.reset(); 
  }, 2000);
}

async function createUserFromRequest(r) {
  if (typeof bloodConnectDB === 'undefined' || !bloodConnectDB.registerUser) return;
  try {
    const ur = await bloodConnectDB.registerUser({ 
      name: r.patientName, 
      email: r.email, 
      phone: r.phone, 
      type: 'recipient', 
      password: 'default123' 
    });
    if (ur.success) { 
      currentUser = { 
        id: ur.userId, 
        name: r.patientName, 
        email: r.email, 
        phone: r.phone, 
        type: 'recipient' 
      }; 
      localStorage.setItem('bloodconnect_current_user', ur.userId.toString()); 
      updateUserUI(); 
    }
  } catch (error) {
    console.log('Failed to create user from request');
  }
}

async function createUserFromEmergency(em) {
  if (typeof bloodConnectDB === 'undefined' || !bloodConnectDB.registerUser) return;
  try {
    const ur = await bloodConnectDB.registerUser({ 
      name: em.patientName, 
      phone: em.phone, 
      type: 'recipient', 
      password: 'default123' 
    });
    if (ur.success) { 
      currentUser = { 
        id: ur.userId, 
        name: em.patientName, 
        phone: em.phone, 
        type: 'recipient' 
      }; 
      localStorage.setItem('bloodconnect_current_user', ur.userId.toString()); 
      updateUserUI(); 
    }
  } catch (error) {
    console.log('Failed to create user from emergency');
  }
}

function handleRequestSuccess(r) {
  const compat = mapData.donors.filter(d => d.available && (d.type === r.bloodType || d.type === 'O-')).length;
  if (r.urgency === 'emergency') addEmergencyToMap(r);
  hideLoading(); 
  closeModal('requestModal'); 
  showNotification(`Request submitted! ${compat} donors notified.`); 
  const requestForm = document.getElementById('requestForm');
  if (requestForm) requestForm.reset();
}

function handleEmergencySuccess(em) {
  const compat = mapData.donors.filter(d => d.available && (d.type === em.bloodType || d.type === 'O-')).length;
  addEmergencyToMap(em); 
  hideLoading(); 
  closeModal('emergencyModal'); 
  showNotification(`Emergency alert sent to ${compat} donors!`); 
  const emergencyForm = document.getElementById('emergencyForm');
  if (emergencyForm) emergencyForm.reset();
}

function addNewDonorToMap(d) {
  const lat = 27.7089 + (Math.random() - 0.5) * 0.02;
  const lng = 85.3206 + (Math.random() - 0.5) * 0.02;
  mapData.donors.push({ 
    id: mapData.donors.length + 1, 
    lat, 
    lng, 
    type: d.bloodType, 
    name: d.name.split(' ')[0] + ' ' + (d.name.split(' ')[1]?.[0] || '') + '.', 
    available: true, 
    phone: d.phone 
  });
  if (markersGroup) addMarkers();
}

function addEmergencyToMap(r) {
  const lat = 27.7089 + (Math.random() - 0.5) * 0.02;
  const lng = 85.3206 + (Math.random() - 0.5) * 0.02;
  mapData.emergencies.push({ 
    id: mapData.emergencies.length + 1, 
    lat, 
    lng, 
    type: r.bloodType, 
    hospital: r.hospital, 
    status: 'Emergency', 
    patient: r.patientName 
  });
  if (markersGroup) addMarkers();
}

function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;
  
  map = L.map('map').setView([27.7089, 85.3206], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
    maxZoom: 19, 
    attribution: '&copy; OpenStreetMap contributors' 
  }).addTo(map);
  markersGroup = L.layerGroup().addTo(map); 
  addMarkers();
}

function createCustomIcon(cls, emoji) {
  return L.divIcon({ 
    className: `custom-marker ${cls}`, 
    html: emoji, 
    iconSize: [30, 30], 
    iconAnchor: [15, 30], 
    popupAnchor: [0, -30] 
  });
}

function addMarkers() {
  if (!markersGroup) return;
  
  markersGroup.clearLayers();
  
  mapData.emergencies.forEach(em => {
    const mk = L.marker([em.lat, em.lng], { 
      icon: createCustomIcon('marker-emergency', '🚨') 
    }).addTo(markersGroup);
    mk.on('click', () => showUserDetail('emergency', em));
  });
  
  mapData.donors.forEach(d => {
    const mk = L.marker([d.lat, d.lng], { 
      icon: createCustomIcon('marker-donor', '🩸') 
    }).addTo(markersGroup);
    mk.on('click', () => showUserDetail('donor', d));
  });
  
  mapData.hospitals.forEach(h => {
    const mk = L.marker([h.lat, h.lng], { 
      icon: createCustomIcon('marker-hospital', '🏥') 
    }).addTo(markersGroup);
    mk.on('click', () => showUserDetail('hospital', h));
  });
  
  mapData.events.forEach(ev => {
    const mk = L.marker([ev.lat, ev.lng], { 
      icon: createCustomIcon('marker-event', '📅') 
    }).addTo(markersGroup);
    mk.on('click', () => showUserDetail('event', ev));
  });
}

function showUserDetail(type, data) {
  const modal = document.getElementById('userDetailModal');
  const title = document.getElementById('userDetailTitle');
  const content = document.getElementById('userDetailContent');
  const rq = document.getElementById('requestBloodBtn');
  const dn = document.getElementById('donateBloodBtn');
  
  if (!modal || !title || !content || !rq || !dn) return;
  
  rq.style.display = dn.style.display = 'none';
  
  switch (type) {
    case 'emergency':
      title.textContent = 'Emergency Request';
      content.innerHTML = `
        <p><strong>Patient:</strong> ${data.patient}</p>
        <p><strong>Blood Type:</strong> ${data.type}</p>
        <p><strong>Hospital:</strong> ${data.hospital}</p>
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Urgency:</strong> Critical - Immediate response needed</p>
      `;
      dn.style.display = 'inline-block'; 
      dn.onclick = () => { 
        closeModal('userDetailModal'); 
        showNotification(`Emergency donation response sent for ${data.type} blood type!`); 
      };
      break;
    case 'donor':
      title.textContent = 'Donor Information';
      content.innerHTML = `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Blood Type:</strong> ${data.type}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Status:</strong> ${data.available ? 'Available' : 'Not Available'}</p>
        <p><strong>Last Donation:</strong> 3 months ago</p>
      `;
      if (data.available) { 
        rq.style.display = 'inline-block'; 
        rq.onclick = () => { 
          closeModal('userDetailModal'); 
          showNotification(`Blood request sent to ${data.name}!`); 
        }; 
      }
      break;
    case 'hospital':
      title.textContent = 'Hospital Information';
      content.innerHTML = `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Total Beds:</strong> ${data.beds}</p>
        <p><strong>Blood Bank:</strong> Available 24/7</p>
        <p><strong>Emergency Services:</strong> Yes</p>
        <p><strong>Contact:</strong> +977-1-${Math.floor(Math.random() * 9000000) + 1000000}</p>
      `;
      rq.style.display = 'inline-block'; 
      rq.textContent = 'Request Blood'; 
      rq.onclick = () => { 
        closeModal('userDetailModal'); 
        showModal('requestModal'); 
      };
      break;
    case 'event':
      title.textContent = 'Blood Donation Event';
      content.innerHTML = `
        <p><strong>Event:</strong> ${data.name}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Location:</strong> Community Center</p>
        <p><strong>Organizer:</strong> Red Cross Society</p>
        <p><strong>Expected Donors:</strong> 50-100</p>
      `;
      dn.style.display = 'inline-block'; 
      dn.textContent = 'Register for Event'; 
      dn.onclick = () => { 
        closeModal('userDetailModal'); 
        showModal('eventRegisterModal'); 
      };
      break;
  }
  showModal('userDetailModal');
}

function openPaymentModal(plan, amount) {
  selectedPlan = plan; 
  selectedAmount = amount;
  const planName = document.getElementById('planName');
  const planAmount = document.getElementById('planAmount');
  if (planName) planName.textContent = plan;
  if (planAmount) planAmount.textContent = amount;
  showModal('paymentModal');
}

function showLoading() { 
  if (loadingSpinner) loadingSpinner.style.display = 'flex'; 
}

function hideLoading() { 
  if (loadingSpinner) loadingSpinner.style.display = 'none'; 
}

function showModal(id) { 
  const m = document.getElementById(id); 
  if (m) m.style.display = 'flex'; 
}

function closeModal(id) { 
  const m = document.getElementById(id); 
  if (m) m.style.display = 'none'; 
}

function showNotification(msg) {
  notificationText.textContent = msg; 
  notificationPopup.classList.add('show');
  setTimeout(() => notificationPopup.classList.remove('show'), 5000);
}

function startAmbulanceTimer() {
  const el = document.getElementById('ambulanceTimer');
  const st = document.getElementById('ambulanceStatus');
  if (!el || !st) return;
  
  let c = 30;
  el.textContent = c; 
  st.textContent = `Calling ambulance in ${c} seconds`;
  
  ambulanceTimer = setInterval(() => {
    c--; 
    el.textContent = c; 
    st.textContent = `Calling ambulance in ${c} seconds`;
    if (c <= 0) {
      clearInterval(ambulanceTimer);
      st.textContent = 'Ambulance has been called!'; 
      st.style.color = '#10b981';
      const i = document.querySelector('.ambulance-icon i');
      const d = document.querySelector('.ambulance-icon');
      const b = document.getElementById('ambulanceCancelBtn');
      if (i) i.className = 'fas fa-check-circle'; 
      if (d) d.style.color = '#10b981'; 
      if (b) b.style.display = 'none';
      setTimeout(() => { 
        closeModal('ambulanceModal'); 
        ambulanceCountdown = 30; 
      }, 3000);
    }
  }, 1000);
}

function cancelAmbulance() { 
  clearInterval(ambulanceTimer); 
  closeModal('ambulanceModal'); 
  ambulanceCountdown = 30; 
  showNotification('Ambulance request cancelled.'); 
}

async function loginUser(email, password) {
  if (typeof bloodConnectDB === 'undefined' || !bloodConnectDB.loginUser) { 
    showNotification('Database not available for login.'); 
    return false; 
  }
  try {
    const r = await bloodConnectDB.loginUser(email, password);
    if (r.success) { 
      currentUser = r.user; 
      localStorage.setItem('bloodconnect_current_user', r.user.id.toString()); 
      updateUserUI(); 
      showNotification(`Welcome back, ${r.user.name}!`); 
      return true; 
    }
    showNotification(`Login failed: ${r.error}`); 
    return false;
  } catch (error) {
    showNotification('Login failed: Database error');
    return false;
  }
}

async function exportDatabase() {
  try {
    if (typeof bloodConnectDB === 'undefined' || !bloodConnectDB.db || !bloodConnectDB.initialized) { 
      showNotification('Database not available for export.'); 
      return; 
    }
    const data = bloodConnectDB.db.export(); 
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `bloodconnect_backup_${new Date().toISOString().split('T')[0]}.db`;
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
    showNotification('Database exported successfully!');
  } catch { 
    showNotification('Export failed.'); 
  }
}

async function importDatabase(file) {
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    if (!window.SQL) {
      window.SQL = await initSqlJs({ 
        locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}` 
      });
    }
    if (typeof bloodConnectDB !== 'undefined') { 
      bloodConnectDB.db = new SQL.Database(buf); 
      bloodConnectDB.saveDatabase(); 
      await animateCountersFromDB(); 
      await loadReviewsFromDB(); 
      showNotification('Database imported!'); 
    }
  } catch { 
    showNotification('Import failed.'); 
  }
}

async function searchDonors(bt, loc, max = 10) { 
  return mapData.donors.filter(d => 
    d.available && 
    (d.type === bt || d.type === 'O-') && 
    d.name.toLowerCase().includes(loc.toLowerCase())
  ).slice(0, max); 
}

async function getUserDonationHistory(uid) {
  if (typeof bloodConnectDB === 'undefined' || !bloodConnectDB.initialized) return [];
  try {
    const stmt = bloodConnectDB.db.prepare(`
      SELECT d.*, br.patient_name, br.hospital 
      FROM donations d 
      LEFT JOIN blood_requests br ON d.recipient_id = br.id 
      WHERE d.donor_id = ? 
      ORDER BY d.donation_date DESC
    `);
    stmt.bind([uid]); 
    const h = []; 
    while (stmt.step()) h.push(stmt.getAsObject()); 
    stmt.free(); 
    return h;
  } catch {
    return [];
  }
}

function checkDonationEligibility(last) {
  if (!last) return { eligible: true, msg: 'You are eligible to donate.' }; 
  const days = Math.floor((new Date() - new Date(last)) / 864e5); 
  return days < 56 ? 
    { eligible: false, msg: `Wait ${56 - days} more days.` } : 
    { eligible: true, msg: 'You are eligible to donate.' };
}

function getCompatibleBloodTypes(t) {
  const compatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'], 
    'A-': ['A-', 'O-'], 
    'B+': ['B+', 'B-', 'O+', 'O-'], 
    'B-': ['B-', 'O-'], 
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 
    'AB-': ['A-', 'B-', 'AB-', 'O-'], 
    'O+': ['O+', 'O-'], 
    'O-': ['O-']
  };
  return compatibility[t] || [];
}

window.bloodConnectAdmin = { 
  exportDB: exportDatabase, 
  importDB: importDatabase, 
  searchDonors, 
  getStats: async () => (typeof bloodConnectDB !== 'undefined' ? bloodConnectDB.getStatistics() : null), 
  getUserHistory: getUserDonationHistory, 
  loginUser 
};

window.addEventListener('load', initApp);



(function(){
  const popup = document.getElementById('invitePopup');
  const closeBtn = document.getElementById('inviteClose');
  if(!popup) return;

  popup.style.display='flex';
  const timer = setTimeout(()=>popup.remove(),10000);   

  closeBtn.addEventListener('click',()=>{ clearTimeout(timer); popup.remove(); });
})();