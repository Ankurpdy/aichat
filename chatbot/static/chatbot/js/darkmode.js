(function() {
    var toggles = document.querySelectorAll("#darkModeToggle, #darkModeToggleSidebar");
    var body = document.body;
    function setTheme(dark) {
        if (dark) {
            body.classList.add("dark-mode");
            toggles.forEach(function(t) {
                t.innerHTML = '<i class="fas fa-sun"></i>';
            });
            localStorage.setItem("theme", "dark");
        } else {
            body.classList.remove("dark-mode");
            toggles.forEach(function(t) {
                t.innerHTML = '<i class="fas fa-moon"></i>';
            });
            localStorage.setItem("theme", "light");
        }
    }
    if (localStorage.getItem("theme") === "dark") {
        setTheme(true);
    }
    toggles.forEach(function(toggle) {
        toggle.addEventListener("click", function() {
            setTheme(!body.classList.contains("dark-mode"));
        });
    });
})();