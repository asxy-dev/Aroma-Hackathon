document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadDashboardData();
    setupNavigation();
    setupEventListeners();
    checkUserLocation();
});

function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('bloodConnectUser')) || {
        name: 'John Doe',
        donations: 3,
        bloodType: 'A+',
        location: 'New York, USA'
    };
    
    if (userData.name) {
        document.getElementById('userName').textContent = userData.name;
        
        const names = userData.name.split(' ');
        let initials = names[0].charAt(0);
        if (names.length > 1) {
            initials += names[names.length - 1].charAt(0);
        }
        document.getElementById('userInitials').textContent = initials;
        
        if (userData.donations) {
            document.getElementById('totalDonations').textContent = userData.donations;
            updateBadges(userData.donations);
        }
        
        if (userData.bloodType) {
            document.getElementById('bloodType').value = userData.bloodType;
        }
    }
}

function updateBadges(donationCount) {
    const badgesGrid = document.getElementById('badgesGrid');
    badgesGrid.innerHTML = '';
    
    const badges = [
        { id: 1, name: 'First Donation', desc: 'Donated blood for the first time', minDonations: 1, image: 'badges/1.png' },
        { id: 2, name: 'Regular Donor', desc: '3+ donations completed', minDonations: 3, image: 'badges/2.png' },
        { id: 3, name: 'Hero Donor', desc: '5+ donations completed', minDonations: 5, image: 'badges/3.png' },
        { id: 4, name: 'Life Saver', desc: '7+ donations completed', minDonations: 7, image: 'badges/4.png' },
        { id: 5, name: 'Godly Saver', desc: '10+ donations completed', minDonations: 10, image: 'badges/5.png' },
        { id: 6, name: 'Heavenly Saver', desc: '15+ donations completed', minDonations: 15, image: 'badges/6.png' }
    ];
    
    badges.forEach(badge => {
        const isUnlocked = donationCount >= badge.minDonations;
        
        const badgeItem = document.createElement('div');
        badgeItem.className = 'badge-item';
        badgeItem.innerHTML = `
            <div class="badge-icon ${isUnlocked ? '' : 'locked'}">
                <img src="${badge.image}" alt="${badge.name}">
            </div>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-desc">${badge.desc}</div>
        `;
        
        badgesGrid.appendChild(badgeItem);
    });
    
    const badgesEarned = badges.filter(badge => donationCount >= badge.minDonations).length;
    document.getElementById('badgesEarned').textContent = badgesEarned;
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === 'index.html') return;
            
            e.preventDefault();
            const section = this.dataset.section;
            switchSection(section);
            
            navLinks.forEach(nl => nl.classList.remove('active'));
            this.classList.add('active');
            
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });
}

function switchSection(section) {
    document.querySelectorAll('.content-section').forEach(s => {
        s.style.display = 'none';
    });
    
    document.getElementById('dashboardContent').style.display = 'none';
    
    const sectionElement = document.getElementById(`${section}Content`);
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }
    
    switch(section) {
        case 'profile':
            loadProfileData();
            break;
        case 'donations':
            loadDonationHistory();
            break;
        case 'requests':
            loadBloodRequests();
            break;
        case 'events':
            loadUpcomingEvents();
            break;
        case 'badges':
            loadUserBadges();
            break;
        case 'nearby':
            loadNearbyDonors();
            break;
        case 'settings':
            loadUserSettings();
            break;
        default:
            document.getElementById('dashboardContent').style.display = 'block';
    }
}

function setupEventListeners() {
    document.getElementById('mobileMenuToggle').addEventListener('click', toggleSidebar);
    document.getElementById('overlay').addEventListener('click', toggleSidebar);
    
    document.getElementById('scheduleDonationBtn').addEventListener('click', scheduleDonation);
    document.getElementById('findBloodBanksBtn').addEventListener('click', findBloodBanks);
    document.getElementById('updateAvailabilityBtn').addEventListener('click', updateAvailability);
    document.getElementById('inviteFriendsBtn').addEventListener('click', inviteFriends);
    document.getElementById('emergencyBtn').addEventListener('click', createEmergencyRequest);
    document.getElementById('completeProfileBtn').addEventListener('click', completeProfile);
    
    document.getElementById('notificationBell').addEventListener('click', showNotifications);
    
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    document.getElementById('alertButton').addEventListener('click', hideAlert);
    document.getElementById('closeBadgeModal').addEventListener('click', hideBadgeModal);
    
    document.querySelectorAll('#requestsContent .btn-primary').forEach(btn => {
        btn.addEventListener('click', function() {
            respondToRequest(this.closest('.request-item'));
        });
    });
    
    document.querySelectorAll('#eventsContent .btn-primary').forEach(btn => {
        btn.addEventListener('click', function() {
            registerForEvent(this.closest('.event-item'));
        });
    });
    
    document.querySelectorAll('#nearbyContent .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            contactDonor(this.closest('.donor-item'));
        });
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
}

async function loadDashboardData() {
    try {
        const stats = {
            totalDonations: parseInt(document.getElementById('totalDonations').textContent) || 0,
            nearbyRequests: 12,
            badgesEarned: parseInt(document.getElementById('badgesEarned').textContent) || 0,
            upcomingEvents: 3
        };
        
        updateStatsCards(stats);
        
    } catch (error) {
        showAlert('Error', 'Failed to load dashboard data', 'error');
    }
}

function updateStatsCards(stats) {
    document.getElementById('totalDonations').textContent = stats.totalDonations;
    document.getElementById('nearbyRequests').textContent = stats.nearbyRequests;
    document.getElementById('badgesEarned').textContent = stats.badgesEarned;
    document.getElementById('upcomingEvents').textContent = stats.upcomingEvents;
}

function scheduleDonation() {
    showAlert('Schedule Donation', 'This would open a donation scheduling dialog', 'info');
}

function findBloodBanks() {
    showAlert('Find Blood Banks', 'This would show nearby blood banks on a map', 'info');
}

function updateAvailability() {
    const isAvailable = confirm('Are you currently available for blood donation?');
    showAlert('Availability Updated', `Your availability has been ${isAvailable ? 'enabled' : 'disabled'}`, 'success');
}

function inviteFriends() {
    showAlert('Invite Friends', 'This would open a sharing dialog', 'info');
}

function createEmergencyRequest() {
    if (confirm('This will send emergency alerts to all compatible donors nearby. Continue?')) {
        const userData = JSON.parse(localStorage.getItem('bloodConnectUser')) || {};
        const requests = parseInt(document.getElementById('nearbyRequests').textContent) + 1;
        document.getElementById('nearbyRequests').textContent = requests;
        
        showAlert('Emergency Request', 'Emergency alert has been sent to nearby donors', 'emergency');
    }
}

function completeProfile() {
    showAlert('Complete Profile', 'This would open the profile completion form', 'info');
}

function showNotifications() {
    showAlert('Notifications', 'This would show a notifications panel', 'info');
}

function checkUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
            },
            error => {
            }
        );
    }
}

function loadProfileData() {
}

function loadDonationHistory() {
}

function loadBloodRequests() {
}

function loadUpcomingEvents() {
}

function loadUserBadges() {
}

function loadNearbyDonors() {
}

function loadUserSettings() {
}

function saveProfile() {
    const userData = JSON.parse(localStorage.getItem('bloodConnectUser')) || {};
    
    userData.name = document.getElementById('fullName').value;
    userData.email = document.getElementById('email').value;
    userData.phone = document.getElementById('phone').value;
    userData.bloodType = document.getElementById('bloodType').value;
    userData.location = document.getElementById('location').value;
    
    localStorage.setItem('bloodConnectUser', JSON.stringify(userData));
    
    document.getElementById('userName').textContent = userData.name;
    const names = userData.name.split(' ');
    let initials = names[0].charAt(0);
    if (names.length > 1) {
        initials += names[names.length - 1].charAt(0);
    }
    document.getElementById('userInitials').textContent = initials;
    
    showAlert('Profile Saved', 'Your profile has been updated successfully', 'success');
}

function saveSettings() {
    showAlert('Settings Saved', 'Your settings have been updated successfully', 'success');
}

function respondToRequest(requestItem) {
    const bloodType = requestItem.querySelector('.blood-type').textContent;
    showAlert('Request Response', `You've responded to the ${bloodType} blood request`, 'success');
}

function registerForEvent(eventItem) {
    const eventName = eventItem.querySelector('h4').textContent;
    showAlert('Event Registration', `You've registered for ${eventName}`, 'success');
}

function contactDonor(donorItem) {
    const donorName = donorItem.querySelector('h4').textContent;
    showAlert('Contact Donor', `You've requested to contact ${donorName}`, 'info');
}

function showAlert(title, message, type) {
    const alert = document.getElementById('customAlert');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertIcon = document.getElementById('alertIcon');
    
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    
    alertIcon.className = 'alert-icon';
    switch(type) {
        case 'success':
            alertIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            alertIcon.style.color = '#10b981';
            break;
        case 'error':
            alertIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            alertIcon.style.color = '#ef4444';
            break;
        case 'warning':
            alertIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            alertIcon.style.color = '#f59e0b';
            break;
        case 'emergency':
            alertIcon.innerHTML = '<i class="fas fa-ambulance"></i>';
            alertIcon.style.color = '#dc2626';
            break;
        default:
            alertIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
            alertIcon.style.color = '#3b82f6';
    }
    
    alert.classList.add('active');
}

function hideAlert() {
    document.getElementById('customAlert').classList.remove('active');
}

function showBadgeUnlockModal(badge) {
    const modal = document.getElementById('badgeUnlockModal');
    const badgeImage = document.getElementById('unlockedBadgeImage');
    const badgeName = document.getElementById('unlockedBadgeName');
    
    badgeImage.src = badge.image;
    badgeName.textContent = badge.name;
    
    modal.classList.add('active');
}

function hideBadgeModal() {
    document.getElementById('badgeUnlockModal').classList.remove('active');
}

function unlockNewBadge(donationCount) {
    const badges = [
        { id: 1, name: 'First Donation', desc: 'Donated blood for the first time', minDonations: 1, image: 'badges/1.png' },
        { id: 2, name: 'Regular Donor', desc: '3+ donations completed', minDonations: 3, image: 'badges/2.png' },
        { id: 3, name: 'Hero Donor', desc: '5+ donations completed', minDonations: 5, image: 'badges/3.png' },
        { id: 4, name: 'Life Saver', desc: '7+ donations completed', minDonations: 7, image: 'badges/4.png' },
        { id: 5, name: 'Godly Saver', desc: '10+ donations completed', minDonations: 10, image: 'badges/5.png' },
        { id: 6, name: 'Heavenly Saver', desc: '15+ donations completed', minDonations: 15, image: 'badges/6.png' }
    ];
    
    const newlyUnlocked = badges.find(badge => badge.minDonations === donationCount);
    
    if (newlyUnlocked) {
        showBadgeUnlockModal(newlyUnlocked);
    }
}

function startRealTimeUpdates() {
    setInterval(() => {
        const currentRequests = parseInt(document.getElementById('nearbyRequests').textContent);
        const newRequests = Math.max(0, currentRequests + Math.floor(Math.random() * 3) - 1);
        document.getElementById('nearbyRequests').textContent = newRequests;
    }, 30000);
}

startRealTimeUpdates();

document.getElementById('viewAllRequestsBtn').addEventListener('click', function(e) {
    e.preventDefault();
    switchSection('requests');
    document.querySelector('[data-section="requests"]').click();
});

document.getElementById('viewAllActivityBtn').addEventListener('click', function(e) {
    e.preventDefault();
    switchSection('donations');
    document.querySelector('[data-section="donations"]').click();
});

document.getElementById('viewAllBadgesBtn').addEventListener('click', function(e) {
    e.preventDefault();
    switchSection('badges');
    document.querySelector('[data-section="badges"]').click();
});

document.querySelectorAll('.badge-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        if (!this.querySelector('.badge-icon').classList.contains('locked')) {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s';
        }
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

document.getElementById('emergencyBtn').addEventListener('click', function() {
    const userData = JSON.parse(localStorage.getItem('bloodConnectUser')) || {};
    if (userData.donations === undefined) userData.donations = 0;
    userData.donations += 1;
    localStorage.setItem('bloodConnectUser', JSON.stringify(userData));
    
    document.getElementById('totalDonations').textContent = userData.donations;
    updateBadges(userData.donations);
    unlockNewBadge(userData.donations);
    
    const requests = parseInt(document.getElementById('nearbyRequests').textContent) + 1;
    document.getElementById('nearbyRequests').textContent = requests;
    
    showAlert('Donation Recorded', 'Thank you for your donation! Your contribution has been recorded.', 'success');
});