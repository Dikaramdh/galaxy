/* ============================================================
   js/music.js — Background Music (MP3)
   ============================================================ */

window.GalaxyMusic = (function () {

    // Ambil tombol music
    const musicBtn = document.getElementById("music-btn");

    // Load musik
    const audio = new Audio("assets/iris.mp3");

    // Pengaturan audio
    audio.loop = true;      // Mengulang terus
    audio.volume = 0.5;     // Volume awal (0 - 1)

    let isPlaying = false;

    function fadeIn() {
        audio.volume = 0;
        audio.play();

        let volume = 0;
        const interval = setInterval(() => {
            volume += 0.02;

            if (volume >= 0.5) {
                volume = 0.5;
                clearInterval(interval);
            }

            audio.volume = volume;
        }, 100);
    }

    function fadeOut() {
        let volume = audio.volume;

        const interval = setInterval(() => {
            volume -= 0.02;

            if (volume <= 0) {
                volume = 0;
                audio.pause();
                audio.currentTime = 0;
                clearInterval(interval);
            }

            audio.volume = volume;
        }, 100);
    }

    function toggle() {

        if (!isPlaying) {
            fadeIn();

            musicBtn.textContent = "♬";
            musicBtn.classList.add("active");
        } else {
            fadeOut();

            musicBtn.textContent = "♪";
            musicBtn.classList.remove("active");
        }

        isPlaying = !isPlaying;
    }

    musicBtn.addEventListener("click", toggle);

    return {
        toggle,
        isPlaying: () => isPlaying
    };

})();
