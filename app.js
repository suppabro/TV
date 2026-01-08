const PLAYLIST =
  "https://api.allorigins.win/raw?url=https://iptv-org.github.io/iptv/index.m3u";

const player = document.getElementById("player");
const channelsDiv = document.getElementById("channels");
const searchInput = document.getElementById("search");
const epgBox = document.getElementById("epg-content");

let channels = [];
let filtered = [];

function play(url, name) {
  epgBox.textContent = "Now Playing: " + name;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(player);
  } else if (player.canPlayType("application/vnd.apple.mpegurl")) {
    player.src = url;
  }
}

// Load & parse M3U
fetch(PLAYLIST)
  .then(res => res.text())
  .then(data => {
    const lines = data.split("\n");
    let ch = {};

    lines.forEach(line => {
      if (line.startsWith("#EXTINF")) {
        ch = {
          name: line.split(",")[1] || "Unknown",
          logo: (line.match(/tvg-logo="([^"]+)"/) || [])[1],
          group: (line.match(/group-title="([^"]+)"/) || [])[1]
        };
      } else if (line.startsWith("http")) {
        ch.url = line.trim();
        channels.push(ch);
        ch = {};
      }
    });

    filtered = channels;
    render();
    if (filtered[0]) play(filtered[0].url, filtered[0].name);
  });

// Render channels
function render() {
  channelsDiv.innerHTML = "";
  filtered.forEach(c => {
    const div = document.createElement("div");
    div.className = "channel";
    div.tabIndex = 0;

    div.innerHTML = `
      <img src="${c.logo || 'https://dummyimage.com/300x150/222/fff&text=TV'}">
      <div>${c.name}</div>
    `;

    div.onclick = () => play(c.url, c.name);
    channelsDiv.appendChild(div);
  });
}

// Search
searchInput.oninput = () => {
  const q = searchInput.value.toLowerCase();
  filtered = channels.filter(c => c.name.toLowerCase().includes(q));
  render();
};

// Category filter
document.querySelectorAll("#filters button").forEach(btn => {
  btn.onclick = () => {
    const cat = btn.dataset.cat;
    filtered =
      cat === "ALL"
        ? channels
        : channels.filter(c => c.group?.toUpperCase().includes(cat));
    render();
  };
});

// Smart TV / Keyboard navigation
document.addEventListener("keydown", e => {
  const focused = document.activeElement;
  if (!focused.classList.contains("channel")) return;

  let next;
  if (e.key === "ArrowRight") next = focused.nextElementSibling;
  if (e.key === "ArrowLeft") next = focused.previousElementSibling;
  if (e.key === "Enter") focused.click();

  if (next) next.focus();
});
