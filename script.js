const mapData = {
  emergencies: [
    { id: 1, lat: 40.7128, lng: -74.006, type: 'O-', hospital: 'City General Hospital', status: 'Critical' },
    { id: 2, lat: 40.73061, lng: -73.935242, type: 'AB+', hospital: 'Metro Medical Center', status: 'Urgent' },
    { id: 3, lat: 40.758, lng: -73.9855, type: 'A+', hospital: 'Regional Hospital', status: 'Emergency' }
  ],
  donors: [
    { id: 1, lat: 40.715, lng: -74.015, type: 'O-', name: 'John D.', available: true },
    { id: 2, lat: 40.729, lng: -73.99, type: 'A+', name: 'Sarah M.', available: true },
    { id: 3, lat: 40.75, lng: -73.98, type: 'B+', name: 'Mike R.', available: false },
    { id: 4, lat: 40.735, lng: -74.002, type: 'AB-', name: 'Lisa K.', available: true },
    { id: 5, lat: 40.745, lng: -73.97, type: 'O+', name: 'David L.', available: true },
    { id: 6, lat: 40.72, lng: -73.95, type: 'A-', name: 'Emma W.', available: true }
  ],
  hospitals: [
    { id: 1, lat: 40.713, lng: -74.01, name: 'City General Hospital', beds: 245 },
    { id: 2, lat: 40.732, lng: -73.94, name: 'Metro Medical Center', beds: 180 },
    { id: 3, lat: 40.75, lng: -73.99, name: 'Regional Hospital', beds: 320 },
    { id: 4, lat: 40.74, lng: -73.98, name: 'Community Health Center', beds: 150 }
  ],
  events: [
    { id: 1, lat: 40.72, lng: -74.005, name: 'Blood Drive - Mall', date: 'Today 10AM-6PM' },
    { id: 2, lat: 40.73, lng: -73.96, name: 'University Donation Event', date: 'Tomorrow 9AM-4PM' },
    { id: 3, lat: 40.75, lng: -73.97, name: 'Corporate Blood Drive', date: 'Dec 15, 8AM-2PM' }
  ]
};

let map;
let markersGroup;
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

function initMap() {
  map = L.map('map').setView([40.73, -73.99], 12);
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
    marker.on('click', () => showPopup(
      `<strong>Emergency</strong><br>Blood Type: ${emergency.type}<br>Hospital: ${emergency.hospital}<br>Status: ${emergency.status}`
    ));
  });

  mapData.donors.forEach(donor => {
    const availability = donor.available ? '(Available)' : '(Not Available)';
    const marker = L.marker([donor.lat, donor.lng], {
      icon: createCustomIcon('marker-donor', '🩸')
    }).addTo(markersGroup);
    marker.on('click', () => showPopup(
      `<strong>Donor</strong><br>Name: ${donor.name}<br>Blood Type: ${donor.type}<br>Status: ${availability}`
    ));
  });

  mapData.hospitals.forEach(hospital => {
    const marker = L.marker([hospital.lat, hospital.lng], {
      icon: createCustomIcon('marker-hospital', '🏥')
    }).addTo(markersGroup);
    marker.on('click', () => showPopup(
      `<strong>Hospital</strong><br>Name: ${hospital.name}<br>Beds: ${hospital.beds}`
    ));
  });

  mapData.events.forEach(event => {
    const marker = L.marker([event.lat, event.lng], {
      icon: createCustomIcon('marker-event', '📅')
    }).addTo(markersGroup);
    marker.on('click', () => showPopup(
      `<strong>Event</strong><br>Name: ${event.name}<br>Date: ${event.date}`
    ));
  });
}

function showPopup(html) {
  popupDetails.innerHTML = html;
  popupDialog.classList.add('show');
}

popupCloseBtn.addEventListener('click', () => {
  popupDialog.classList.remove('show');
});

function animateCounters() {
  const counters = [
    { id: 'totalDonors', target: 15420 },
    { id: 'lifesSaved', target: 8930 },
    { id: 'bloodUnits', target: 25670 },
    { id: 'hospitals', target: 156 }
  ];

  counters.forEach(counter => {
    let current = 0;
    const increment = Math.ceil(counter.target / 100);
    const el = document.getElementById(counter.id);
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

function showLoading() {
  loadingSpinner.style.display = 'flex';
}

function hideLoading() {
  loadingSpinner.style.display = 'none';
}

function showModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function notifyCompatibleDonors(bloodType) {
  return mapData.donors.filter(donor =>
    donor.available && (donor.type === bloodType || donor.type === 'O-')
  ).length;
}

function addNewEmergency(bloodType, hospital) {
  const lat = 40.7 + Math.random() * 0.1;
  const lng = -74 + Math.random() * 0.1;
  const newEmergency = {
    id: mapData.emergencies.length + 1,
    lat,
    lng,
    type: bloodType,
    hospital,
    status: 'Emergency'
  };
  mapData.emergencies.push(newEmergency);
  addMarkers();
}

function simulateNotification(count, bloodType) {
  const messages = [
    `Emergency alert sent to ${count} compatible donors`,
    `${count} donors with ${bloodType} blood have been notified`,
    `SMS alerts dispatched to ${count} nearby donors`,
    `Emergency notification system activated - ${count} donors contacted`
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function showNotification(message) {
  notificationText.textContent = message;
  notificationPopup.classList.add('show');
  setTimeout(() => {
    notificationPopup.classList.remove('show');
  }, 5000);
}

notificationCloseBtn.addEventListener('click', () => {
  notificationPopup.classList.remove('show');
});

document.getElementById('donorForm').addEventListener('submit', e => {
  e.preventDefault();
  showLoading();
  const formData = new FormData(e.target);
  const donorData = Object.fromEntries(formData);
  setTimeout(() => {
    hideLoading();
    closeModal('donorModal');
    alert(`Welcome to BloodConnect, ${donorData.name}!\n\nYour donor profile has been created successfully.\n\nBlood Type: ${donorData.bloodType}\nLocation: ${donorData.location}\n\nYou'll receive notifications when your blood type is needed in your area.`);
    const lat = 40.7 + Math.random() * 0.1;
    const lng = -74 + Math.random() * 0.1;
    const newDonor = {
      id: mapData.donors.length + 1,
      lat,
      lng,
      type: donorData.bloodType,
      name: donorData.name.split(' ')[0] + ' ' + (donorData.name.split(' ')[1]?.[0] || '') + '.',
      available: true
    };
    mapData.donors.push(newDonor);
    addMarkers();
    showNotification(`New donor ${newDonor.name} (${newDonor.type}) has joined nearby.`);
    e.target.reset();
  }, 2000);
});

document.getElementById('requestForm').addEventListener('submit', e => {
  e.preventDefault();
  showLoading();
  const formData = new FormData(e.target);
  const requestData = Object.fromEntries(formData);
  setTimeout(() => {
    hideLoading();
    closeModal('requestModal');
    const compatibleDonors = notifyCompatibleDonors(requestData.bloodType);
    const urgencyText = requestData.urgency === 'emergency' ? 'EMERGENCY' : requestData.urgency.toUpperCase();
    alert(`Blood request submitted successfully!\n\nPatient: ${requestData.patientName}\nBlood Type: ${requestData.bloodType}\nUnits: ${requestData.units}\nUrgency: ${urgencyText}\nHospital: ${requestData.hospital}\n\n${compatibleDonors} compatible donors have been notified.\n\nRequest ID: BR${Math.floor(Math.random() * 10000)}`);
    if (requestData.urgency === 'emergency') {
      addNewEmergency(requestData.bloodType, requestData.hospital);
    }
    showNotification(`New blood request for ${requestData.bloodType} at ${requestData.hospital}`);
    e.target.reset();
  }, 2500);
});

document.getElementById('emergencyForm').addEventListener('submit', e => {
  e.preventDefault();
  showLoading();
  const formData = new FormData(e.target);
  const emergencyData = Object.fromEntries(formData);
  setTimeout(() => {
    hideLoading();
    closeModal('emergencyModal');
    const compatibleDonors = notifyCompatibleDonors(emergencyData.bloodType);
    const notificationMsg = simulateNotification(compatibleDonors, emergencyData.bloodType);
    alert(`🚨 EMERGENCY ALERT ACTIVATED 🚨\n\nPatient: ${emergencyData.patientName}\nBlood Type: ${emergencyData.bloodType}\nHospital: ${emergencyData.hospital}\n\n${notificationMsg}\n\nEmergency ID: EM${Math.floor(Math.random() * 10000)}\n\nHospital blood bank has been alerted.\nNearest donors are being contacted via SMS and phone calls.`);
    addNewEmergency(emergencyData.bloodType, emergencyData.hospital);
    showNotification(`Emergency alert for ${emergencyData.bloodType} blood sent.`);
    e.target.reset();
  }, 3000);
});

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

document.getElementById('btnBecomeDonor').addEventListener('click', e => {
  e.preventDefault();
  showModal('donorModal');
  addTemporaryMarker('donor');
});
document.getElementById('heroBecomeDonor').addEventListener('click', e => {
  e.preventDefault();
  showModal('donorModal');
  addTemporaryMarker('donor');
});

document.getElementById('btnRequestBlood').addEventListener('click', e => {
  e.preventDefault();
  showModal('requestModal');
  addTemporaryMarker('request');
});
document.getElementById('heroRequestBlood').addEventListener('click', e => {
  e.preventDefault();
  showModal('requestModal');
  addTemporaryMarker('request');
});

document.getElementById('heroEmergency').addEventListener('click', e => {
  e.preventDefault();
  showModal('emergencyModal');
});

document.getElementById('btnEmergencyAlert').addEventListener('click', e => {
  e.preventDefault();
  showModal('emergencyModal');
});

document.getElementById('btnEmergencyHelp').addEventListener('click', e => {
  e.preventDefault();
  alert('Emergency Help:\n\n1. Call 911 for immediate medical emergency\n2. Contact hospital blood bank directly\n3. Use our emergency alert system\n4. Provide patient details and blood type\n5. Our system will notify compatible donors within 5km\n\nFor questions: +1-800-BLOOD');
});

function addTemporaryMarker(type) {
  const lat = 40.72 + Math.random() * 0.05;
  const lng = -74 + Math.random() * 0.05;
  const iconClass = type === 'donor' ? 'marker-donor' : 'marker-event';
  const emoji = type === 'donor' ? '🩸' : '📅';
  const marker = L.marker([lat, lng], {
    icon: createCustomIcon(iconClass, emoji)
  }).addTo(markersGroup);

  const popupContent = type === 'donor'
    ? `<strong>New Donor</strong><br>Location: Approximate<br>Thank you for joining!`
    : `<strong>New Request</strong><br>Location: Approximate<br>Please respond if you can help.`;

  marker.bindPopup(popupContent).openPopup();

  marker._icon.classList.add('slide-in');

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '2px';
  closeBtn.style.right = '6px';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#dc2626';
  closeBtn.style.fontSize = '18px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.zIndex = '10000';
  closeBtn.title = 'Remove';

  closeBtn.addEventListener('click', () => {
    markersGroup.removeLayer(marker);
  });

  marker._icon.appendChild(closeBtn);

  setTimeout(() => {
    if (markersGroup.hasLayer(marker)) {
      marker._icon.style.transition = 'opacity 1s ease';
      marker._icon.style.opacity = '0';
      setTimeout(() => {
        markersGroup.removeLayer(marker);
      }, 1000);
    }
  }, 15000);
}

window.addEventListener('load', () => {
  animateCounters();
  initMap();
});

document.getElementById('donorCancelBtn').addEventListener('click', () => closeModal('donorModal'));
document.getElementById('requestCancelBtn').addEventListener('click', () => closeModal('requestModal'));
document.getElementById('emergencyCancelBtn').addEventListener('click', () => closeModal('emergencyModal'));

document.getElementById('mobileMenuToggle').addEventListener('click', () => {
  const navMenu = document.getElementById('navMenu');
  navMenu.classList.toggle('active');
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
