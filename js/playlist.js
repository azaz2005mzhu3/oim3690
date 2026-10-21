// Playlist app: an array of songs rendered with a for...of loop.
(function () {
    // 1. An array of five songs (by hand)
    let songs = [
        "Shape of You",
        "Blinding Lights",
        "Industry Baby (Remix)",
        "Sunflower",
        "Levitating (VIP Remix)"
    ];

    const form = document.getElementById("playlist-form");
    const input = document.getElementById("song-input");
    const list = document.getElementById("playlist");
    const emptyMessage = document.getElementById("playlist-empty");
    const countLabel = document.getElementById("playlist-count");

    function render() {
        list.innerHTML = "";

        // 2. for...of loop that creates an <li> for each song and appends it
        for (const song of songs) {
            const item = document.createElement("li");
            item.className = "playlist-item";
            item.textContent = song;

            // 3. if inside the loop that marks any song whose title contains "Remix"
            if (song.includes("Remix")) {
                item.classList.add("remix");
                item.textContent = `${song} 🎶`;
            }

            list.appendChild(item);
        }

        emptyMessage.style.display = songs.length === 0 ? "block" : "none";
        countLabel.textContent = `${songs.length} song${songs.length === 1 ? "" : "s"}`;
    }

    function addSong(title) {
        songs.push(title);
        render();
    }

    // what runs when the Add Song button is clicked
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = input.value.trim();
        if (!title) return;
        addSong(title);
        input.value = "";
        input.focus();
    });

    render();
})();
