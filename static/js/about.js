// Notification dropdown toggle
document.querySelector('.notifications').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('notificationsDropdown').style.display = 
        document.getElementById('notificationsDropdown').style.display === 'none' ? 'block' : 'none';
});

// Profile dropdown toggle
document.querySelector('.user-profile').addEventListener('click', function() {
    document.getElementById('profileDropdown').style.display = 
        document.getElementById('profileDropdown').style.display === 'none' ? 'block' : 'none';
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.notifications') && !e.target.closest('#notificationsDropdown')) {
        document.getElementById('notificationsDropdown').style.display = 'none';
    }
    if (!e.target.closest('.user-profile') && !e.target.closest('#profileDropdown')) {
        document.getElementById('profileDropdown').style.display = 'none';
    }
});
