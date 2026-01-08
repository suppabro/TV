const PLAYLIST =
  "https://api.allorigins.win/raw?url=https://iptv-org.github.io/iptv/index.m3u";

const video = document.getElementById("player");
const channelsDiv = document.getElementById("channels");
const searchInput = document.getElementById("search");
const epgBox = document.getElementById("epg-content");

let channels = [];
let filtered = [];
let hls = null;

// ---------- PLAY FUNCTION ----------
function playChannel(url, name) {
  epgBox.textContent = "Loading: " + name;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {
        epgBox.textContent = "Tap ▶ to play";
      });
    });

    hls.on(Hls.Events.ERROR, () => {
      epgBox.textContent = "Stream not supported";
    });

  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.play().catch(() => {
      epgBox.textContent = "Tap ▶ to play";
    });
  } else {
    epgBox.textContent = "HLS not supported";
  }
}

// ---------- LOAD PLAYLIST ----------
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
    epgBox.textContent = "Select a channel";
  })
  .catch(() => {
    epgBox.textContent = "Playlist failed to load";
  });

// ---------- RENDER ----------
function render() {
  channelsDiv.innerHTML = "";
  filtered.slice(0, 200).forEach(c => {
    const div = document.createElement("div");
    div.className = "channel";
    div.tabIndex = 0;

    div.innerHTML = `
      <img src="${c.logo || 'https://dummyimage.com/300x150/222/fff&text=TV'}">
      <div>${c.name}</div>
    `;

    div.onclick = () => playChannel(c.url, c.name);
    channelsDiv.appendChild(div);
  });
}

// ---------- SEARCH ----------
searchInput.oninput = () => {
  const q = searchInput.value.toLowerCase();
  filtered = channels.filter(c => c.name.toLowerCase().includes(q));
  render();
};

// ---------- CATEGORY FILTER ----------
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

// ---------- TV REMOTE ----------
document.addEventListener("keydown", e => {
  const focused = document.activeElement;
  if (!focused.classList.contains("channel")) return;

  let next;
  if (e.key === "ArrowRight") next = focused.nextElementSibling;
  if (e.key === "ArrowLeft") next = focused.previousElementSibling;
  if (e.key === "Enter") focused.click();

  if (next) next.focus();
});
