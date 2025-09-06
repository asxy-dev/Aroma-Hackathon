function animateCounters() {
    const counters = [
        { id: 'totalDonors', target: 15420 },
        { id: 'lifesSaved', target: 8930 },
        { id: 'bloodUnits', target: 25670 },
        { id: 'hospitals', target: 156 }
    ];
    counters.forEach(counter => {
        let current = 0;
        const increment = counter.target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= counter.target) {
                current = counter.target;
                clearInterval(timer);
            }
            document.getElementById(counter.id).textContent = Math.floor(current).toLocaleString();
        }, 20);
    });
}
window.addEventListener('load', () => {
    setTimeout(animateCounters, 500);
});
function showLogin() {
    alert('Login functionality - Connect to authentication API');
}
function showRegister() {
    alert('Registration functionality - Connect to user registration API');
}
function becomeDonor() {
    alert('Donor registration - Connect to donor signup API');
}
function requestBlood() {
    alert('Blood request - Connect to blood request API');
}
function emergencyRequest() {
    if (confirm('This will send emergency alerts to all compatible donors nearby. Continue?')) {
        showLoading();
        setTimeout(() => {
            hideLoading();
            alert('Emergency alert sent to nearby donors!');
        }, 2000);
    }
}
function showEmergencyHelp() {
    alert('Emergency help information - Connect to help system API');
}
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}
function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}
document.querySelector('.mobile-menu-toggle').addEventListener('click', function() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
});
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
