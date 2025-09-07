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
        if (currentUser) {
          updateUserUI();
        } else {
          localStorage.removeItem('bloodconnect_current_user');
        }
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
    } catch (error) {
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
      let initials = names[0].charAt(0);
      if (names.length > 1) {
        initials += names[names.length - 1].charAt(0);
      }
      userInitials.textContent = initials.toUpperCase();
    }
  } else {
    if (navButtons) navButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

async function animateCountersFromDB() {
  try {
    const stats = await bloodConnectDB.getStatistics();
    
    const counters = [
      { id: 'totalDonors', target: stats.totalDonors || 15420 },
      { id: 'lifesSaved', target: stats.livesSaved || 8930 },
      { id: 'bloodUnits', target: stats.totalUnits || 25670 },
      { id: 'hospitals', target: 156 }
    ];

    animateCountersWithData(counters);
  } catch (error) {
    animateCounters();
  }
}

function animateCounters() {
  const counters = [
    { id: 'totalDonors', target: 15420 },
    { id: 'lifesSaved', target: 8930 },
    { id: 'bloodUnits', target: 25670 },
    { id: 'hospitals', target: 156 }
  ];

  animateCountersWithData(counters);
}

function animateCountersWithData(counters) {
  counters.forEach(counter => {
    const el = document.getElementById(counter.id);
    if (el) {
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
    }
  });
}

async function loadReviewsFromDB() {
  try {
    const reviews = await bloodConnectDB.getReviews(10);
    const reviewsGrid = document.getElementById('reviewsGrid');
    
    if (reviews && reviews.length > 0 && reviewsGrid) {
      reviews.forEach(review => {
        addReviewToGrid(review, reviewsGrid);
      });
    }
  } catch (error) {
  }
}

function loadReviewsFromLocalStorage() {
  const reviews = JSON.parse(localStorage.getItem('bloodConnectReviews') || '[]');
  const reviewsGrid = document.getElementById('reviewsGrid');
  
  if (reviews.length > 0 && reviewsGrid) {
    reviews.forEach(review => {
      const reviewWithDate = {
        ...review,
        reviewer_name: review.name || review.reviewerName,
        review_text: review.text || review.reviewText,
        created_at: review.date || new Date().toISOString()
      };
      addReviewToGrid(reviewWithDate, reviewsGrid);
    });
  }
}

function addReviewToGrid(review, reviewsGrid) {
  const reviewCard = document.createElement('div');
  reviewCard.className = 'review-card';
  
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const reviewDate = new Date(review.created_at).toLocaleDateString();
  
  reviewCard.innerHTML = `
    <div class="review-header">
      <div class="review-avatar">${review.reviewer_name.charAt(0).toUpperCase()}</div>
      <div class="review-info">
        <h4>${review.reviewer_name}</h4>
        <div class="review-stars">${stars}</div>
        <div style="font-size: 0.8rem; color: #64748b;">${reviewDate}</div>
      </div>
    </div>
    <p class="review-text">"${review.review_text}"</p>
  `;
  
  reviewsGrid.appendChild(reviewCard);
}

function setupEventListeners() {
  const userAvatar = document.getElementById('userAvatar');
  if (userAvatar) {
    userAvatar.addEventListener('click', function(e) {
      e.stopPropagation();
      const userMenu = document.getElementById('userMenu');
      if (userMenu) userMenu.classList.toggle('active');
    });
  }
  
  document.addEventListener('click', function() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) userMenu.classList.remove('active');
  });
  
  const dashboardLink = document.getElementById('dashboardLink');
  if (dashboardLink) {
    dashboardLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }
  
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('bloodconnect_current_user');
      localStorage.removeItem('bloodConnectUser');
      currentUser = null;
      updateUserUI();
      showNotification('You have been logged out successfully.');
    });
  }
  
  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', function() {
      const imageUrl = this.getAttribute('data-image');
      const eventModalImage = document.getElementById('eventModalImage');
      const eventModal = document.getElementById('eventModal');
      if (eventModalImage && eventModal) {
        eventModalImage.src = imageUrl;
        eventModal.style.display = 'flex';
      }
    });
  });
  
  const eventModalClose = document.getElementById('eventModalClose');
  if (eventModalClose) {
    eventModalClose.addEventListener('click', function() {
      const eventModal = document.getElementById('eventModal');
      if (eventModal) eventModal.style.display = 'none';
    });
  }
  
  const eventModal = document.getElementById('eventModal');
  if (eventModal) {
    eventModal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });
  }
  
  const paymentSuccessBtn = document.getElementById('paymentSuccessBtn');
  if (paymentSuccessBtn) {
    paymentSuccessBtn.addEventListener('click', function() {
      closeModal('paymentSuccessModal');
      showModal('hospitalModal');
    });
  }
  
  setupMainActionButtons();
  
  setupCancelButtons();
  
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      const navMenu = document.getElementById('navMenu');
      if (navMenu) navMenu.classList.toggle('active');
    });
  }
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  
  if (popupCloseBtn) {
    popupCloseBtn.addEventListener('click', () => {
      popupDialog.classList.remove('show');
    });
  }
  
  if (notificationCloseBtn) {
    notificationCloseBtn.addEventListener('click', () => {
      notificationPopup.classList.remove('show');
    });
  }
  
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

function setupMainActionButtons() {
  const buttonMappings = [
    { id: 'btnBecomeDonor', modal: 'donorModal' },
    { id: 'heroBecomeDonor', modal: 'donorModal' },
    { id: 'btnRequestBlood', modal: 'requestModal' },
    { id: 'heroRequestBlood', modal: 'requestModal' },
    { id: 'heroEmergency', modal: 'emergencyModal' },
    { id: 'btnEmergencyAlert', modal: 'emergencyModal' }
  ];
  
  buttonMappings.forEach(mapping => {
    const button = document.getElementById(mapping.id);
    if (button) {
      button.addEventListener('click', e => {
        e.preventDefault();
        showModal(mapping.modal);
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
  const cancelMappings = [
    { btnId: 'donorCancelBtn', modalId: 'donorModal' },
    { btnId: 'requestCancelBtn', modalId: 'requestModal' },
    { btnId: 'emergencyCancelBtn', modalId: 'emergencyModal' },
    { btnId: 'paymentCancelBtn', modalId: 'paymentModal' },
    { btnId: 'hospitalCancelBtn', modalId: 'hospitalModal' },
    { btnId: 'userDetailCloseBtn', modalId: 'userDetailModal' },
    { btnId: 'eventRegisterCancelBtn', modalId: 'eventRegisterModal' }
  ];
  
  cancelMappings.forEach(mapping => {
    const button = document.getElementById(mapping.btnId);
    if (button) {
      button.addEventListener('click', () => closeModal(mapping.modalId));
    }
  });
}

function setupFormEventListeners() {
  const donorForm = document.getElementById('donorForm');
  if (donorForm) {
    donorForm.addEventListener('submit', handleDonorRegistration);
  }
  
  const requestForm = document.getElementById('requestForm');
  if (requestForm) {
    requestForm.addEventListener('submit', handleBloodRequest);
  }
  
  const emergencyForm = document.getElementById('emergencyForm');
  if (emergencyForm) {
    emergencyForm.addEventListener('submit', handleEmergencyRequest);
  }
  
  const eventRegisterForm = document.getElementById('eventRegisterForm');
  if (eventRegisterForm) {
    eventRegisterForm.addEventListener('submit', handleEventRegistration);
  }
  
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmission);
  }
  
  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) {
    paymentForm.addEventListener('submit', handlePayment);
  }
  
  const hospitalForm = document.getElementById('hospitalForm');
  if (hospitalForm) {
    hospitalForm.addEventListener('submit', handleHospitalRegistration);
  }
}

async function handleDonorRegistration(e) {
  e.preventDefault();
  showLoading();
  
  try {
    const formData = new FormData(e.target);
    const donorData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      bloodType: formData.get('bloodType'),
      age: parseInt(formData.get('age')),
      location: formData.get('location'),
      type: 'donor',
      password: 'default123'
    };
    
    if (typeof bloodConnectDB !== 'undefined') {
      const result = await bloodConnectDB.registerUser(donorData);
      
      if (result.success) {
        currentUser = result.user;
        
        localStorage.setItem('bloodconnect_current_user', result.user.id.toString());
        addNewDonorToMap(donorData);
        
        hideLoading();
        closeModal('donorModal');
        updateUserUI();
        showNotification(`Welcome to BloodConnect, ${donorData.name}! You are now a registered donor.`);
        e.target.reset();
      } else {
        hideLoading();
        showNotification(`Registration failed: ${result.error}`);
      }
    } else {
      currentUser = {
        name: donorData.name,
        email: donorData.email,
        phone: donorData.phone,
        bloodType: donorData.bloodType,
        age: donorData.age,
        location: donorData.location,
        type: 'donor',
        donations: 0
      };
      
      localStorage.setItem('bloodConnectUser', JSON.stringify(currentUser));
      addNewDonorToMap(donorData);
      
      hideLoading();
      closeModal('donorModal');
      updateUserUI();
      showNotification(`Welcome to BloodConnect, ${donorData.name}! You are now a registered donor.`);
      e.target.reset();
    }
  } catch (error) {
    hideLoading();
    showNotification('Registration failed. Please try again.');
  }
}

async function handleBloodRequest(e) {
  e.preventDefault();
  showLoading();
  
  try {
    const formData = new FormData(e.target);
    const requestData = {
      patientName: formData.get('patientName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      bloodType: formData.get('bloodType'),
      units: parseInt(formData.get('units')),
      hospital: formData.get('hospital'),
      urgency: formData.get('urgency'),
      details: formData.get('details')
    };
    
    if (typeof bloodConnectDB !== 'undefined') {
      const result = await bloodConnectDB.addBloodRequest(requestData);
      
      if (result.success) {
        if (!currentUser) {
          await createUserFromRequest(requestData);
        }
        handleRequestSuccess(requestData);
      } else {
        hideLoading();
        showNotification(`Request failed: ${result.error}`);
      }
    } else {
      if (!currentUser) {
        currentUser = {
          name: requestData.patientName,
          email: requestData.email,
          phone: requestData.phone,
          type: 'recipient'
        };
        localStorage.setItem('bloodConnectUser', JSON.stringify(currentUser));
        updateUserUI();
      }
      handleRequestSuccess(requestData);
    }
  } catch (error) {
    hideLoading();
    showNotification('Request failed. Please try again.');
  }
}

async function handleEmergencyRequest(e) {
  e.preventDefault();
  showLoading();
  
  try {
    const formData = new FormData(e.target);
    const emergencyData = {
      patientName: formData.get('patientName'),
      phone: formData.get('emergencyPhone'),
      bloodType: formData.get('bloodType'),
      hospital: formData.get('hospital'),
      urgency: 'emergency',
      details: formData.get('details'),
      units: 1
    };
    
    if (typeof bloodConnectDB !== 'undefined') {
      const result = await bloodConnectDB.addBloodRequest(emergencyData);
      
      if (result.success) {
        if (!currentUser) {
          await createUserFromEmergency(emergencyData);
        }
        handleEmergencySuccess(emergencyData);
      } else {
        hideLoading();
        showNotification(`Emergency request failed: ${result.error}`);
      }
    } else {
      if (!currentUser) {
        currentUser = {
          name: emergencyData.patientName,
          phone: emergencyData.phone,
          type: 'recipient'
        };
        localStorage.setItem('bloodConnectUser', JSON.stringify(currentUser));
        updateUserUI();
      }
      handleEmergencySuccess(emergencyData);
    }
  } catch (error) {
    hideLoading();
    showNotification('Emergency request failed. Please try again.');
  }
}

async function handleEventRegistration(e) {
  e.preventDefault();
  showLoading();
  
  try {
    const formData = new FormData(e.target);
    const eventData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      bloodType: formData.get('bloodType'),
      age: parseInt(formData.get('age')),
      type: 'donor',
      password: 'default123'
    };
    
    let userId = currentUser?.id;
    
    if (!currentUser && typeof bloodConnectDB !== 'undefined') {
      const userResult = await bloodConnectDB.registerUser(eventData);
      if (userResult.success) {
        userId = userResult.userId;
        currentUser = {
          id: userId,
          ...eventData,
          donations: 0
        };
        delete currentUser.password;
        localStorage.setItem('bloodconnect_current_user', userId.toString());
        updateUserUI();
      }
    }
    
    if (userId && typeof bloodConnectDB !== 'undefined') {
      await bloodConnectDB.registerForEvent(1, userId);
    }
    
    hideLoading();
    closeModal('eventRegisterModal');
    showNotification('Successfully registered for the event!');
    e.target.reset();
  } catch (error) {
    hideLoading();
    showNotification('Event registration failed. Please try again.');
  }
}

async function handleReviewSubmission(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const reviewData = {
    reviewerName: formData.get('reviewerName'),
    reviewerEmail: formData.get('reviewerEmail'),
    rating: parseInt(formData.get('rating')),
    reviewText: formData.get('reviewText'),
    photoUrl: null
  };
  
  if (!reviewData.rating) {
    showNotification('Please select a rating');
    return;
  }
  
  showLoading();
  
  try {
    if (typeof bloodConnectDB !== 'undefined') {
      const result = await bloodConnectDB.addReview(reviewData);
      
      if (result.success) {
        const reviewsGrid = document.getElementById('reviewsGrid');
        if (reviewsGrid) {
          const reviewWithDate = {
            ...reviewData,
            reviewer_name: reviewData.reviewerName,
            review_text: reviewData.reviewText,
            created_at: new Date().toISOString()
          };
          addReviewToGrid(reviewWithDate, reviewsGrid);
        }
        
        hideLoading();
        e.target.reset();
        showNotification('Thank you for your review!');
      } else {
        hideLoading();
        showNotification(`Review submission failed: ${result.error}`);
      }
    } else {
      const reviews = JSON.parse(localStorage.getItem('bloodConnectReviews') || '[]');
      const newReview = {
        name: reviewData.reviewerName,
        reviewerName: reviewData.reviewerName,
        rating: reviewData.rating,
        text: reviewData.reviewText,
        reviewText: reviewData.reviewText,
        date: new Date().toISOString()
      };
      reviews.push(newReview);
      localStorage.setItem('bloodConnectReviews', JSON.stringify(reviews));
      
      const reviewsGrid = document.getElementById('reviewsGrid');
      if (reviewsGrid) {
        const reviewWithDate = {
          reviewer_name: reviewData.reviewerName,
          review_text: reviewData.reviewText,
          rating: reviewData.rating,
          created_at: new Date().toISOString()
        };
        addReviewToGrid(reviewWithDate, reviewsGrid);
      }
      
      hideLoading();
      e.target.reset();
      showNotification('Thank you for your review!');
    }
  } catch (error) {
    hideLoading();
    showNotification('Review submission failed. Please try again.');
  }
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
  const formData = new FormData(e.target);
  const hospitalData = Object.fromEntries(formData);
  
  if(hospitalData.hospitalPassword !== hospitalData.confirmPassword) {
    showNotification('Passwords do not match!');
    return;
  }
  
  showLoading();
  setTimeout(() => {
    hideLoading();
    closeModal('hospitalModal');
    showNotification(`Hospital registration successful for ${selectedPlan} plan!`);
    e.target.reset();
  }, 2000);
}

async function createUserFromRequest(requestData) {
  if (typeof bloodConnectDB !== 'undefined') {
    const userResult = await bloodConnectDB.registerUser({
      name: requestData.patientName,
      email: requestData.email,
      phone: requestData.phone,
      type: 'recipient',
      password: 'default123'
    });
    
    if (userResult.success) {
      currentUser = {
        id: userResult.userId,
        name: requestData.patientName,
        email: requestData.email,
        phone: requestData.phone,
        type: 'recipient'
      };
      localStorage.setItem('bloodconnect_current_user', userResult.userId.toString());
      updateUserUI();
    }
  }
}

async function createUserFromEmergency(emergencyData) {
  if (typeof bloodConnectDB !== 'undefined') {
    const userResult = await bloodConnectDB.registerUser({
      name: emergencyData.patientName,
      phone: emergencyData.phone,
      type: 'recipient',
      password: 'default123'
    });
    
    if (userResult.success) {
      currentUser = {
        id: userResult.userId,
        name: emergencyData.patientName,
        phone: emergencyData.phone,
        type: 'recipient'
      };
      localStorage.setItem('bloodconnect_current_user', userResult.userId.toString());
      updateUserUI();
    }
  }
}

function handleRequestSuccess(requestData) {
  const compatibleDonors = mapData.donors.filter(donor => 
    donor.available && (donor.type === requestData.bloodType || donor.type === 'O-')
  ).length;
  
  if (requestData.urgency === 'emergency') {
    addEmergencyToMap(requestData);
  }
  
  hideLoading();
  closeModal('requestModal');
  showNotification(`Blood request submitted! ${compatibleDonors} donors notified.`);
  document.getElementById('requestForm').reset();
}

function handleEmergencySuccess(emergencyData) {
  const compatibleDonors = mapData.donors.filter(donor => 
    donor.available && (donor.type === emergencyData.bloodType || donor.type === 'O-')
  ).length;
  
  addEmergencyToMap(emergencyData);
  
  hideLoading();
  closeModal('emergencyModal');
  showNotification(`Emergency alert sent to ${compatibleDonors} donors!`);
  document.getElementById('emergencyForm').reset();
}

function addNewDonorToMap(donorData) {
  const lat = 27.7089 + (Math.random() - 0.5) * 0.02;
  const lng = 85.3206 + (Math.random() - 0.5) * 0.02;
  const newDonor = {
    id: mapData.donors.length + 1,
    lat,
    lng,
    type: donorData.bloodType,
    name: donorData.name.split(' ')[0] + ' ' + (donorData.name.split(' ')[1]?.[0] || '') + '.',
    available: true,
    phone: donorData.phone
  };
  mapData.donors.push(newDonor);
  addMarkers();
}

function addEmergencyToMap(requestData) {
  const lat = 27.7089 + (Math.random() - 0.5) * 0.02;
  const lng = 85.3206 + (Math.random() - 0.5) * 0.02;
  const newEmergency = {
    id: mapData.emergencies.length + 1,
    lat,
    lng,
    type: requestData.bloodType,
    hospital: requestData.hospital,
    status: 'Emergency',
    patient: requestData.patientName
  };
  mapData.emergencies.push(newEmergency);
  addMarkers();
}

function initMap() {
  map = L.map('map').setView([27.7089, 85.3206], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);
  addMarkers();
}

function createCustomIcon(className, emoji) {
  return L.divIcon({
    className: `custom-marker ${className}`,
    html: emoji,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
}

function addMarkers() {
  markersGroup.clearLayers();

  mapData.emergencies.forEach(emergency => {
    const marker = L.marker([emergency.lat, emergency.lng], {
      icon: createCustomIcon('marker-emergency', '🚨')
    }).addTo(markersGroup);
    marker.on('click', () => showUserDetail('emergency', emergency));
  });

  mapData.donors.forEach(donor => {
    const marker = L.marker([donor.lat, donor.lng], {
      icon: createCustomIcon('marker-donor', '🩸')
    }).addTo(markersGroup);
    marker.on('click', () => showUserDetail('donor', donor));
  });

  mapData.hospitals.forEach(hospital => {
    const marker = L.marker([hospital.lat, hospital.lng], {
      icon: createCustomIcon('marker-hospital', '🏥')
    }).addTo(markersGroup);
    marker.on('click', () => showUserDetail('hospital', hospital));
  });

  mapData.events.forEach(event => {
    const marker = L.marker([event.lat, event.lng], {
      icon: createCustomIcon('marker-event', '📅')
    }).addTo(markersGroup);
    marker.on('click', () => showUserDetail('event', event));
  });
}

function showUserDetail(type, data) {
  const modal = document.getElementById('userDetailModal');
  const title = document.getElementById('userDetailTitle');
  const content = document.getElementById('userDetailContent');
  const requestBtn = document.getElementById('requestBloodBtn');
  const donateBtn = document.getElementById('donateBloodBtn');

  if (!modal || !title || !content || !requestBtn || !donateBtn) return;

  requestBtn.style.display = 'none';
  donateBtn.style.display = 'none';

  switch(type) {
    case 'emergency':
      title.textContent = 'Emergency Request';
      content.innerHTML = `
        <p><strong>Patient:</strong> ${data.patient}</p>
        <p><strong>Blood Type:</strong> ${data.type}</p>
        <p><strong>Hospital:</strong> ${data.hospital}</p>
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Urgency:</strong> Critical - Immediate response needed</p>
      `;
      donateBtn.style.display = 'inline-block';
      donateBtn.onclick = () => {
        closeModal('userDetailModal');
        showNotification(`Emergency donation response sent for ${data.type} blood type!`);
      };
      break;
    case 'donor':
      title.textContent = 'Donor Information';
      const availability = data.available ? 'Available' : 'Not Available';
      content.innerHTML = `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Blood Type:</strong> ${data.type}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Status:</strong> ${availability}</p>
        <p><strong>Last Donation:</strong> 3 months ago</p>
      `;
      if(data.available) {
        requestBtn.style.display = 'inline-block';
        requestBtn.onclick = () => {
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
      requestBtn.style.display = 'inline-block';
      requestBtn.textContent = 'Request Blood';
      requestBtn.onclick = () => {
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
      donateBtn.style.display = 'inline-block';
      donateBtn.textContent = 'Register for Event';
      donateBtn.onclick = () => {
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

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

function showNotification(message) {
  notificationText.textContent = message;
  notificationPopup.classList.add('show');
  setTimeout(() => {
    notificationPopup.classList.remove('show');
  }, 5000);
}

function startAmbulanceTimer() {
  const ambulanceTimer = document.getElementById('ambulanceTimer');
  const ambulanceStatus = document.getElementById('ambulanceStatus');
  
  if (!ambulanceTimer || !ambulanceStatus) return;
  
  ambulanceTimer.textContent = ambulanceCountdown;
  ambulanceStatus.textContent = `Calling ambulance in ${ambulanceCountdown} seconds`;
  
  ambulanceTimer = setInterval(() => {
    ambulanceCountdown--;
    ambulanceTimer.textContent = ambulanceCountdown;
    ambulanceStatus.textContent = `Calling ambulance in ${ambulanceCountdown} seconds`;
    
    if (ambulanceCountdown <= 0) {
      clearInterval(ambulanceTimer);
      ambulanceStatus.textContent = 'Ambulance has been called!';
      ambulanceStatus.style.color = '#10b981';
      
      const ambulanceIcon = document.querySelector('.ambulance-icon i');
      const ambulanceIconDiv = document.querySelector('.ambulance-icon');
      const cancelBtn = document.getElementById('ambulanceCancelBtn');
      
      if (ambulanceIcon) ambulanceIcon.className = 'fas fa-check-circle';
      if (ambulanceIconDiv) ambulanceIconDiv.style.color = '#10b981';
      if (cancelBtn) cancelBtn.style.display = 'none';
      
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
  try {
    if (typeof bloodConnectDB === 'undefined') {
      showNotification('Database not available for login.');
      return false;
    }
    
    const result = await bloodConnectDB.loginUser(email, password);
    if (result.success) {
      currentUser = result.user;
      localStorage.setItem('bloodconnect_current_user', result.user.id.toString());
      updateUserUI();
      showNotification(`Welcome back, ${result.user.name}!`);
      return true;
    } else {
      showNotification(`Login failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    showNotification('Login failed. Please try again.');
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
  } catch (error) {
    showNotification('Export failed. Please try again.');
  }
}

async function importDatabase(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uInt8Array = new Uint8Array(arrayBuffer);
    
    if (!window.SQL) {
      const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });
      window.SQL = SQL;
    }
    
    if (typeof bloodConnectDB !== 'undefined') {
      bloodConnectDB.db = new SQL.Database(uInt8Array);
      bloodConnectDB.saveDatabase();
      
      await animateCountersFromDB();
      await loadReviewsFromDB();
      
      showNotification('Database imported successfully!');
    }
  } catch (error) {
    showNotification('Import failed. Please check the file format.');
  }
}

async function searchDonors(bloodType, location, maxDistance = 10) {
  try {
    const availableDonors = mapData.donors.filter(donor => 
      donor.available && 
      (donor.type === bloodType || donor.type === 'O-') &&
      donor.name.toLowerCase().includes(location.toLowerCase())
    );
    
    return availableDonors;
  } catch (error) {
    return [];
  }
}

async function getUserDonationHistory(userId) {
  try {
    if (typeof bloodConnectDB === 'undefined' || !bloodConnectDB.initialized) return [];
    
    const stmt = bloodConnectDB.db.prepare(`
      SELECT d.*, br.patient_name, br.hospital 
      FROM donations d
      LEFT JOIN blood_requests br ON d.recipient_id = br.id
      WHERE d.donor_id = ?
      ORDER BY d.donation_date DESC
    `);
    
    const history = [];
    stmt.bind([userId]);
    while (stmt.step()) {
      history.push(stmt.getAsObject());
    }
    
    return history;
  } catch (error) {
    return [];
  }
}

function checkDonationEligibility(lastDonationDate) {
  if (!lastDonationDate) return { eligible: true, message: 'You are eligible to donate.' };
  
  const lastDonation = new Date(lastDonationDate);
  const now = new Date();
  const daysSince = Math.floor((now - lastDonation) / (1000 * 60 * 60 * 24));
  
  if (daysSince < 56) {
    const daysRemaining = 56 - daysSince;
    return { 
      eligible: false, 
      message: `You need to wait ${daysRemaining} more days before your next donation.` 
    };
  }
  
  return { eligible: true, message: 'You are eligible to donate.' };
}

async function notifyCompatibleDonors(bloodType, urgencyLevel, location) {
  try {
    const compatibleTypes = getCompatibleBloodTypes(bloodType);
    const compatibleDonors = mapData.donors.filter(donor => 
      donor.available && compatibleTypes.includes(donor.type)
    );
    
    return compatibleDonors.length;
  } catch (error) {
    return 0;
  }
}

function getCompatibleBloodTypes(requiredType) {
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
  
  return compatibility[requiredType] || [];
}

window.addEventListener('load', initApp);

window.bloodConnectAdmin = {
  exportDB: exportDatabase,
  importDB: importDatabase,
  searchDonors: searchDonors,
  getStats: async () => {
    if (typeof bloodConnectDB !== 'undefined') {
      return await bloodConnectDB.getStatistics();
    }
    return null;
  },
  getUserHistory: getUserDonationHistory,
  loginUser: loginUser
};
