/**
 * ===================================================================
 * Nexora - Music Player & Media Studio Engine
 * ===================================================================
 * A clean, beginner-friendly JavaScript application built using standard
 * Web APIs (HTML5 Audio, Canvas 2D, Web Audio API, and MediaRecorder).
 * 
 * Main Modules:
 *   1. Application State & Song Database (Hindi, English, Gujarati, Punjabi)
 *   2. Core Audio Player Engine (Play, Pause, Seek, Volume, Fallback)
 *   3. Dynamic UI Rendering & Real-Time Search Filter
 *   4. Custom Audio & Video File Import (Drag & Drop)
 *   5. Audio Cutter Studio (PCM Waveform Canvas & 16-bit WAV Export)
 *   6. Video Studio (Video Trimmer & Soundtrack Audio Mixer)
 *   7. Client-Side 16-bit PCM WAV Binary Encoder
 *   8. User Authentication & Profile Management
 *   9. Application Startup & Initialization
 * ===================================================================
 */

// ===================================================================
// SECTION 1: APPLICATION STATE & SONG DATABASE
// ===================================================================

// Central reactive state object tracking current playback and studio data
const state = {
  tracks: [],                  // Array of active songs loaded in the app
  currentTrackIndex: 0,        // Index of the currently loaded song
  isPlaying: false,            // True if audio is actively playing
  isShuffled: false,           // True if shuffle mode is on
  isRepeated: false,           // True if repeat mode is on
  currentPlaylistFilter: 'all',// Active language filter ('all', 'hindi', 'english', etc.)
  currentUser: null,           // Logged in user name
  audioContext: null,          // Shared Web Audio API context for editing and mixing

  // Audio Cutter state
  cutter: {
    audioBuffer: null,         // Decoded audio PCM samples for waveform
    sourceNode: null,          // Audio source node used for previewing cuts
    startTime: 0,              // Start trim point in seconds
    endTime: 10,               // End trim point in seconds
    duration: 0,               // Total track duration in seconds
    currentTrack: null,        // Song object being edited
    isPlayingPreview: false    // True if cut preview is playing
  },

  // Video Studio state
  video: {
    file: null,                // Video file reference
    videoUrl: null,            // Browser URL for the video
    duration: 0,               // Total video length in seconds
    startTime: 0,              // Video trim start point in seconds
    endTime: 0,                // Video trim end point in seconds
    selectedAudioTrack: null   // Audio track selected to overlay on video
  },

  // Audio Equalizer & Speed state (DSP)
  eq: {
    preset: "flat",
    bass: 0,
    mid: 0,
    treble: 0,
    speed: 1.0
  },

  // User collection state (Favorites & Playback History)
  likedSongIds: [],            // Array of liked song IDs persisted in localStorage
  history: [],                 // Array of recently played song objects
  mediaStorage: [],            // Saved audio cuts and rendered video recordings
  activeStorageFilter: "all"   // Storage active tab filter ("all", "audio", "video")
};

// Curated 16 hit songs catalog across 4 Indian & Global languages
const REAL_SONGS = [
  // --- HINDI SONGS (4 TRACKS) ---
  {
    id: "kesariya",
    title: "Kesariya",
    artist: "Arijit Singh, Pritam",
    language: "Hindi",
    category: "hindi",
    genre: "Hindi Romantic",
    audio: "audio/kesariya.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/38/4c/5c/384c5c8f-3ff8-e457-b2f7-3158ce108649/mzaf_12389299033886433185.plus.aac.p.m4a",
    cover: "covers/kesariya.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/300x300bb.jpg",
    duration: 30,
    color: "#e65100",
    icon: "HINDI"
  },
  {
    id: "tum_hi_ho",
    title: "Tum Hi Ho",
    artist: "Arijit Singh, Mithoon",
    language: "Hindi",
    category: "hindi",
    genre: "Hindi Soulful Ballad",
    audio: "audio/tum_hi_ho.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3a/8c/9b/3a8c9b0b-2def-750a-f615-1555bf941edf/mzaf_17229496441442805917.plus.aac.p.m4a",
    cover: "covers/tum_hi_ho.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/300x300bb.jpg",
    duration: 30,
    color: "#880e4f",
    icon: "HINDI"
  },
  {
    id: "apna_bana_le",
    title: "Apna Bana Le",
    artist: "Arijit Singh, Sachin-Jigar",
    language: "Hindi",
    category: "hindi",
    genre: "Hindi Soft Melody",
    audio: "audio/apna_bana_le.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ff/b2/c2/ffb2c28b-2139-4ec4-f61e-271bc06bddad/mzaf_12403837045914372948.plus.aac.p.m4a",
    cover: "covers/apna_bana_le.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/65/6f/5f/656f5fc0-4ce3-e03e-b7da-667a289f9e28/8909024114538.png/300x300bb.jpg",
    duration: 30,
    color: "#bf360c",
    icon: "HINDI"
  },
  {
    id: "raataan_lambiyan",
    title: "Raataan Lambiyan",
    artist: "Jubin Nautiyal, Tanishk Bagchi",
    language: "Hindi",
    category: "hindi",
    genre: "Hindi Acoustic Chill",
    audio: "audio/raataan_lambiyan.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ff/7a/7a/ff7a7a63-9947-cefa-e269-ad9602fb1ca3/mzaf_14039909875904828823.plus.aac.p.m4a",
    cover: "covers/raataan_lambiyan.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c3/df/e7/c3dfe71e-d532-458e-9c1c-32d40f8d9123/886449472222.jpg/300x300bb.jpg",
    duration: 30,
    color: "#4a148c",
    icon: "HINDI"
  },

  // --- ENGLISH SONGS (4 TRACKS) ---
  {
    id: "blinding_lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    language: "English",
    category: "english",
    genre: "English Synthpop",
    audio: "audio/blinding_lights.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a",
    cover: "covers/blinding_lights.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/300x300bb.jpg",
    duration: 30,
    color: "#d50000",
    icon: "ENG"
  },
  {
    id: "shape_of_you",
    title: "Shape of You",
    artist: "Ed Sheeran",
    language: "English",
    category: "english",
    genre: "English Pop Groove",
    audio: "audio/shape_of_you.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/c7/4f/44c74f0d-72dc-6143-d4d0-ba14d661ca0d/mzaf_9566898362556366703.plus.aac.p.m4a",
    cover: "covers/shape_of_you.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/300x300bb.jpg",
    duration: 30,
    color: "#00b0ff",
    icon: "ENG"
  },
  {
    id: "starboy",
    title: "Starboy",
    artist: "The Weeknd, Daft Punk",
    language: "English",
    category: "english",
    genre: "English Electro R&B",
    audio: "audio/starboy.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/71/d6/1171d6ad-3c96-e027-2af6-58028426588c/mzaf_15137631797407745471.plus.aac.p.m4a",
    cover: "covers/starboy.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/300x300bb.jpg",
    duration: 30,
    color: "#1a237e",
    icon: "ENG"
  },
  {
    id: "levitating",
    title: "Levitating",
    artist: "Dua Lipa",
    language: "English",
    category: "english",
    genre: "English Disco Funk",
    audio: "audio/levitating.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a",
    cover: "covers/levitating.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/300x300bb.jpg",
    duration: 30,
    color: "#c2185b",
    icon: "ENG"
  },

  // --- GUJARATI SONGS (4 TRACKS) ---
  {
    id: "khalasi",
    title: "Khalasi (Gotilo)",
    artist: "Aditya Gadhvi, Achint",
    language: "Gujarati",
    category: "gujarati",
    genre: "Gujarati Folk Fusion",
    audio: "audio/khalasi.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0d/68/bd/0d68bdec-6fee-740f-ca95-02b701c18d48/mzaf_15555358427089070690.plus.aac.p.m4a",
    cover: "covers/khalasi.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/32/df/c7/32dfc7ae-c9ce-842d-478b-23d0a4b97614/24UMGIM59593.rgb.jpg/300x300bb.jpg",
    duration: 30,
    color: "#ff6f00",
    icon: "GUJ"
  },
  {
    id: "dholida",
    title: "Dholida",
    artist: "Jahnvi Shrimankar, Sanjay Leela Bhansali",
    language: "Gujarati",
    category: "gujarati",
    genre: "Gujarati Garba Anthem",
    audio: "audio/dholida.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e3/58/0a/e3580aa3-2a94-f8e3-33af-4ce8d27fd00e/mzaf_17990530228880718560.plus.aac.p.m4a",
    cover: "covers/dholida.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/43/73/e3/4373e314-fc31-7549-25ff-44d34790b7fe/196626455369.jpg/300x300bb.jpg",
    duration: 30,
    color: "#c51162",
    icon: "GUJ"
  },
  {
    id: "vhalam_aavo_ne",
    title: "Vhalam Aavo Ne",
    artist: "Jigardan Gadhavi, Sachin-Jigar",
    language: "Gujarati",
    category: "gujarati",
    genre: "Gujarati Romantic Folk",
    audio: "audio/vhalam_aavo_ne.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e1/38/2c/e1382c28-0867-ca22-1e06-7002182f43e2/mzaf_17531767971940135343.plus.aac.p.m4a",
    cover: "covers/vhalam_aavo_ne.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/24/dc/09/24dc09f9-dc3c-2016-8bbb-e422d96b83e0/cover.jpg/300x300bb.jpg",
    duration: 30,
    color: "#00796b",
    icon: "GUJ"
  },
  {
    id: "chogada",
    title: "Chogada Tara",
    artist: "Darshan Raval, Asees Kaur",
    language: "Gujarati",
    category: "gujarati",
    genre: "Gujarati Dandiya Beats",
    audio: "audio/chogada.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/1f/bb/a1/1fbba135-c2a0-363b-0e44-267b9f1914e2/mzaf_12556899107469621015.plus.aac.p.m4a",
    cover: "covers/chogada.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/af/69/79/af697907-7447-e35b-5446-40d3cb3e1f64/8903431684981_cover.jpg/300x300bb.jpg",
    duration: 30,
    color: "#f57f17",
    icon: "GUJ"
  },

  // --- PUNJABI SONGS (4 TRACKS) ---
  {
    id: "brown_munde",
    title: "Brown Munde",
    artist: "AP Dhillon, Gurinder Gill",
    language: "Punjabi",
    category: "punjabi",
    genre: "Punjabi Trap & Hip-Hop",
    audio: "audio/brown_munde.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/97/74/69/977469be-a9d5-35a7-80ad-ebe12a799ccc/mzaf_804867738726203367.plus.aac.p.m4a",
    cover: "covers/brown_munde.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/26/a3/ac/26a3ac64-69e4-95ec-80ab-1f5a477537d2/859742042973_cover.jpg/300x300bb.jpg",
    duration: 30,
    color: "#212121",
    icon: "PUNJ"
  },
  {
    id: "excuses",
    title: "Excuses",
    artist: "AP Dhillon, Gurinder Gill",
    language: "Punjabi",
    category: "punjabi",
    genre: "Punjabi Melodic Pop",
    audio: "audio/excuses.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e8/84/c8/e884c82f-7136-54d8-6754-6b45c6968f29/mzaf_11726474689882106813.plus.aac.p.m4a",
    cover: "covers/excuses.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/47/47/ac/4747ac85-1658-64ae-bc82-220a4d6213d5/859747478890_cover.jpg/300x300bb.jpg",
    duration: 30,
    color: "#311b92",
    icon: "PUNJ"
  },
  {
    id: "amplifier",
    title: "Amplifier",
    artist: "Imran Khan",
    language: "Punjabi",
    category: "punjabi",
    genre: "Punjabi Urban Desi",
    audio: "audio/amplifier.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c9/07/49/c907498f-72ee-a92d-d35e-b84a294791d4/mzaf_1725919051371720512.plus.aac.p.m4a",
    cover: "covers/amplifier.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a2/e5/d3/a2e5d31f-23bf-d5de-59c6-b1f3744668cf/dj.usvbhaev.jpg/300x300bb.jpg",
    duration: 30,
    color: "#0091ea",
    icon: "PUNJ"
  },
  {
    id: "pasoori",
    title: "Pasoori",
    artist: "Ali Sethi, Shae Gill",
    language: "Punjabi",
    category: "punjabi",
    genre: "Punjabi Folk Fusion",
    audio: "audio/pasoori.m4a",
    fallbackAudio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/62/33/1e/62331ea8-d1df-027d-fe75-ac16a519323d/mzaf_14381883946572745360.plus.aac.p.m4a",
    cover: "covers/pasoori.jpg",
    fallbackCover: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/f3/f9/06/f3f906c3-79d5-ac9a-5fdd-262048f955f9/cover.jpg/300x300bb.jpg",
    duration: 30,
    color: "#004d40",
    icon: "PUNJ"
  }
];

// Load catalog songs into application state
function loadLibraryTracks() {
  loadSavedLikedSongs();
  loadSavedHistory();
  loadSavedMediaStorage();

  state.tracks = REAL_SONGS.map(song => {
    const trackId = "track-" + song.id;
    return {
      id: trackId,
      title: song.title,
      artist: song.artist,
      language: song.language,
      category: song.category,
      genre: song.genre,
      duration: song.duration,
      durationFormatted: formatTime(song.duration),
      url: song.audio,
      fallbackUrl: song.fallbackAudio,
      cover: song.cover,
      fallbackCover: song.fallbackCover,
      icon: song.icon,
      color: song.color,
      isLiked: state.likedSongIds.includes(trackId)
    };
  });

  updateCollectionBadges();
  updateStorageBadges();
  renderTracksUI();
  renderLikedView();
  renderHistoryView();
  renderStorageView();
  updateCutterTrackSelect();
  updateVideoAudioSelect();
}

// ===================================================================
// SECTION 2: CORE AUDIO PLAYER ENGINE
// ===================================================================

// Cache player HTML DOM elements
const mainAudio = document.getElementById("main-audio");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const playerTitle = document.getElementById("player-title");
const playerArtist = document.getElementById("player-artist");
const playerArt = document.getElementById("player-art");
const playerCurrentTime = document.getElementById("player-current-time");
const playerDuration = document.getElementById("player-duration");
const playerProgressFill = document.getElementById("player-progress-fill");
const playerProgressHandle = document.getElementById("player-progress-handle");
const seekContainer = document.getElementById("seek-container");
const miniVisualizer = document.getElementById("mini-visualizer");
const volumeSlider = document.getElementById("volume-slider");
const btnVolumeIcon = document.getElementById("btn-volume-icon");
const volHighIcon = document.getElementById("vol-high-icon");
const volMuteIcon = document.getElementById("vol-mute-icon");

// Load a specific song into the player bar
function loadTrack(index) {
  if (index < 0 || index >= state.tracks.length) return;
  state.currentTrackIndex = index;
  const track = state.tracks[index];

  // Set audio source and text info
  mainAudio.src = track.url;
  playerTitle.textContent = track.title;
  playerArtist.textContent = track.language ? `${track.artist} - ${track.language}` : track.artist;

  // Set cover artwork with image error fallback
  if (track.cover) {
    playerArt.innerHTML = `<img src="${track.cover}" alt="${track.title}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" onerror="if(this.src!=='${track.fallbackCover || ''}')this.src='${track.fallbackCover || ''}'">`;
  } else {
    playerArt.innerHTML = track.icon ? `<span style="font-size:0.85rem; font-weight:800; color:#fff;">${track.icon}</span>` : '<svg viewBox="0 0 24 24" width="24" height="24" fill="#1DB954"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
  }
  playerArt.style.backgroundColor = track.color || "#282828";

  // Update like heart icon
  const likeBtn = document.getElementById("btn-like");
  likeBtn.classList.toggle("liked", !!track.isLiked);

  highlightActiveTrackRow(index);
  logTrackHistory(track);
}

// Fallback to online stream if local audio file fails to load
mainAudio.addEventListener("error", () => {
  const current = state.tracks[state.currentTrackIndex];
  if (current && current.fallbackUrl && mainAudio.src !== current.fallbackUrl) {
    console.log("Playing online fallback stream for:", current.title);
    mainAudio.src = current.fallbackUrl;
    if (state.isPlaying) {
      mainAudio.play().catch(() => {});
    }
  }
});

// Start playing current song
function playTrack() {
  if (!mainAudio.src && state.tracks.length > 0) {
    loadTrack(state.currentTrackIndex);
  }

  // Connect Web Audio Equalizer (DSP) if not yet connected
  if (!isEqInitialized) {
    initAudioEqualizer();
  }

  mainAudio.play().then(() => {
    state.isPlaying = true;
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
    miniVisualizer.classList.add("playing");
  }).catch(err => {
    console.warn("Autoplay note:", err);
  });
}

// Pause active song
function pauseTrack() {
  mainAudio.pause();
  state.isPlaying = false;
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
  miniVisualizer.classList.remove("playing");
}

// Toggle between play and pause
function togglePlayPause() {
  if (state.isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

// Play next song (handles shuffle mode)
function nextTrack() {
  if (state.isShuffled) {
    state.currentTrackIndex = Math.floor(Math.random() * state.tracks.length);
  } else {
    state.currentTrackIndex = (state.currentTrackIndex + 1) % state.tracks.length;
  }
  loadTrack(state.currentTrackIndex);
  playTrack();
}

// Play previous song (restarts if past 3 seconds)
function prevTrack() {
  if (mainAudio.currentTime > 3) {
    mainAudio.currentTime = 0;
  } else {
    state.currentTrackIndex = (state.currentTrackIndex - 1 + state.tracks.length) % state.tracks.length;
    loadTrack(state.currentTrackIndex);
    playTrack();
  }
}

// Update scrubber bar and time display during playback
mainAudio.addEventListener("timeupdate", () => {
  const current = mainAudio.currentTime;
  const total = mainAudio.duration || 0;
  playerCurrentTime.textContent = formatTime(current);

  if (total > 0) {
    playerDuration.textContent = formatTime(total);
    const progress = (current / total) * 100;
    playerProgressFill.style.width = progress + "%";
    playerProgressHandle.style.left = progress + "%";
  }
});

// Handle song completion (loop if repeat on, else play next)
mainAudio.addEventListener("ended", () => {
  if (state.isRepeated) {
    mainAudio.currentTime = 0;
    playTrack();
  } else {
    nextTrack();
  }
});

// Click seek bar to jump to new time
seekContainer.addEventListener("click", (e) => {
  if (!mainAudio.duration) return;
  const rect = seekContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, clickX / rect.width));
  mainAudio.currentTime = percent * mainAudio.duration;
});

// Volume slider adjustment
volumeSlider.addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  mainAudio.volume = val;
  updateVolumeIcons(val);
});

// Mute / Unmute toggle
btnVolumeIcon.addEventListener("click", () => {
  if (mainAudio.volume > 0) {
    mainAudio.dataset.prevVol = mainAudio.volume;
    mainAudio.volume = 0;
    volumeSlider.value = 0;
    updateVolumeIcons(0);
  } else {
    const prev = parseFloat(mainAudio.dataset.prevVol || 0.8);
    mainAudio.volume = prev;
    volumeSlider.value = prev;
    updateVolumeIcons(prev);
  }
});

function updateVolumeIcons(vol) {
  volHighIcon.style.display = vol === 0 ? "none" : "block";
  volMuteIcon.style.display = vol === 0 ? "block" : "none";
}

// ===================================================================
// SECTION 3: DYNAMIC UI RENDERING & SEARCH ENGINE
// ===================================================================

// Render Quick Picks cards and Songs Table matching language filter & search query
function renderTracksUI(searchQuery = "") {
  const tbody = document.getElementById("tracks-table-body");
  const quickGrid = document.getElementById("quick-picks-container");
  const badge = document.getElementById("track-count-badge");

  tbody.innerHTML = "";
  quickGrid.innerHTML = "";

  // Filter songs by active playlist and search keyword
  const filtered = state.tracks.filter(track => {
    // 1. Language filter
    if (state.currentPlaylistFilter && state.currentPlaylistFilter !== 'all') {
      const filter = state.currentPlaylistFilter.toLowerCase();
      if (filter === 'trimmed') {
        const isTrimmed = track.category === 'trimmed' || (track.title || '').toLowerCase().includes('cut');
        if (!isTrimmed) return false;
      } else {
        const lang = (track.language || '').toLowerCase();
        const cat = (track.category || '').toLowerCase();
        if (lang !== filter && cat !== filter) return false;
      }
    }

    // 2. Search keyword filter
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      (track.language && track.language.toLowerCase().includes(q)) ||
      (track.genre && track.genre.toLowerCase().includes(q))
    );
  });

  badge.textContent = `${filtered.length} track${filtered.length === 1 ? '' : 's'}`;

  // If viewing trimmed clips and none exist, show helpful message
  if (state.currentPlaylistFilter === 'trimmed' && filtered.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="5" style="text-align: center; padding: 3rem 1rem;">
        <h3 style="color: #fff; margin-bottom: 0.4rem;">No trimmed clips yet!</h3>
        <p style="color: #888; font-size: 0.88rem; margin-bottom: 1.2rem;">
          Open the Audio Cutter studio to trim any song and add it here.
        </p>
        <button class="btn btn-primary" onclick="switchView('view-cutter')">Open Audio Cutter</button>
      </td>
    `;
    tbody.appendChild(emptyRow);
  }

  // Populate Quick Picks top 6 cards
  filtered.slice(0, 6).forEach(track => {
    const card = document.createElement("div");
    card.className = "quick-card";
    const art = track.cover
      ? `<img src="${track.cover}" alt="${track.title}" style="width:100%; height:100%; object-fit:cover;" onerror="if(this.src!=='${track.fallbackCover || ''}')this.src='${track.fallbackCover || ''}'">`
      : `<span style="font-size:0.75rem; font-weight:800; color:#fff;">${track.icon || 'MUSIC'}</span>`;

    card.innerHTML = `
      <div class="quick-card-art" style="background:${track.color || '#333'}; overflow:hidden;">${art}</div>
      <div class="quick-card-title">${track.title}</div>
      <button class="quick-play-btn" title="Play">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>
    `;

    card.addEventListener("click", () => {
      const idx = state.tracks.findIndex(t => t.id === track.id);
      loadTrack(idx);
      playTrack();
    });

    quickGrid.appendChild(card);
  });

  // Populate Songs Table rows
  filtered.forEach((track, index) => {
    const actualIdx = state.tracks.findIndex(t => t.id === track.id);
    const tr = document.createElement("tr");
    tr.id = `track-row-${actualIdx}`;
    if (actualIdx === state.currentTrackIndex && state.isPlaying) {
      tr.classList.add("active-playing");
    }

    const langTagClass = (track.category || 'hindi').toLowerCase();
    const langLabel = track.language || 'Music';
    const thumb = track.cover
      ? `<img src="${track.cover}" alt="${track.title}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" onerror="if(this.src!=='${track.fallbackCover || ''}')this.src='${track.fallbackCover || ''}'">`
      : `<span style="font-size:0.75rem; font-weight:800; color:#fff;">${track.icon || 'NX'}</span>`;

    tr.innerHTML = `
      <td class="track-num-cell">
        <button class="btn-row-like ${track.isLiked ? 'liked' : ''}" title="${track.isLiked ? 'Unlike' : 'Like'}" onclick="toggleLikeTrack('${track.id}')">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </td>
      <td>
        <div class="track-main-cell">
          <div class="track-thumb" style="background:${track.color || '#242424'}; overflow:hidden;">${thumb}</div>
          <div>
            <div class="track-title-cell">${track.title}</div>
            <div style="font-size:0.75rem; color:#888;">
              ${track.artist}
              <span class="lang-tag tag-${langTagClass}">${langLabel}</span>
            </div>
          </div>
        </div>
      </td>
      <td>${track.genre || "Music"}</td>
      <td>${track.durationFormatted || formatTime(track.duration)}</td>
      <td>
        <div class="track-actions-cell">
          <button class="icon-action-btn" title="Cut Track in Studio" onclick="openTrackInCutter('${track.id}')">Cut</button>
          <button class="icon-action-btn" title="Play Track" onclick="playSpecificTrack(${actualIdx})">Play</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Highlight the row of the playing song in green
function highlightActiveTrackRow(index) {
  document.querySelectorAll(".tracks-table tbody tr").forEach(r => r.classList.remove("active-playing"));
  const row = document.getElementById(`track-row-${index}`);
  if (row) row.classList.add("active-playing");
}

// Play specific track by index
function playSpecificTrack(idx) {
  loadTrack(idx);
  playTrack();
}

// Real-time search input listener
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", (e) => {
  renderTracksUI(e.target.value.trim());
});

// Update dynamic greeting based on system clock
function updateGreeting() {
  const greetingEl = document.getElementById("greeting-text");
  const hour = new Date().getHours();
  if (hour < 12) greetingEl.textContent = "Good morning";
  else if (hour < 18) greetingEl.textContent = "Good afternoon";
  else greetingEl.textContent = "Good evening";
}

// ===================================================================
// SECTION 4: CUSTOM MEDIA FILE UPLOADS (Drag & Drop)
// ===================================================================

const globalFileInput = document.getElementById("global-file-input");
const btnUploadMedia = document.getElementById("btn-upload-media");
const audioDropZone = document.getElementById("audio-drop-zone");

btnUploadMedia.addEventListener("click", () => globalFileInput.click());

globalFileInput.addEventListener("change", (e) => {
  handleFilesUpload(e.target.files);
});

// Drag and drop events
audioDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  audioDropZone.classList.add("drag-over");
});

audioDropZone.addEventListener("dragleave", () => {
  audioDropZone.classList.remove("drag-over");
});

audioDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  audioDropZone.classList.remove("drag-over");
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFilesUpload(e.dataTransfer.files);
  }
});

// Process uploaded audio or video files
function handleFilesUpload(files) {
  Array.from(files).forEach(file => {
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");

    if (!isAudio && !isVideo) {
      alert(`File "${file.name}" is not supported. Please choose an audio or video file.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");

    if (isAudio) {
      // Read audio duration and insert at top of playlist
      const temp = new Audio(objectUrl);
      temp.addEventListener("loadedmetadata", () => {
        const dur = temp.duration || 0;
        const newTrack = {
          id: "track-user-" + Date.now(),
          title: cleanName,
          artist: "User Upload",
          genre: "Custom Audio",
          duration: dur,
          durationFormatted: formatTime(dur),
          url: objectUrl,
          file: file,
          icon: "USER",
          color: "#4a148c",
          isLiked: false
        };

        state.tracks.unshift(newTrack);
        renderTracksUI();
        updateCutterTrackSelect();
        updateVideoAudioSelect();
        loadTrack(0);
        playTrack();
      });
    } else if (isVideo) {
      // Load video directly into Video Studio
      loadVideoFile(file);
      switchView("view-video");
    }
  });
}

// ===================================================================
// SECTION 5: AUDIO CUTTER STUDIO (Waveform Canvas & Trimming)
// ===================================================================

const cutterTrackSelect = document.getElementById("cutter-track-select");
const cutterFileInput = document.getElementById("cutter-file-input");
const waveformCanvas = document.getElementById("waveform-canvas");
const waveformPlayhead = document.getElementById("waveform-playhead");
const waveformSelection = document.getElementById("waveform-selection");
const cutterStartTimeInput = document.getElementById("cutter-start-time");
const cutterEndTimeInput = document.getElementById("cutter-end-time");
const cutterSelectedDuration = document.getElementById("cutter-selected-duration");
const cutterRangeLabel = document.getElementById("cutter-range-label");
const cutterTrackName = document.getElementById("cutter-current-track-name");
const cutterTotalTime = document.getElementById("cutter-track-total-time");
const btnPreviewCut = document.getElementById("btn-preview-cut");
const btnStopCutPreview = document.getElementById("btn-stop-cut-preview");
const btnDownloadCut = document.getElementById("btn-download-cut");
const btnAddCutToLibrary = document.getElementById("btn-add-cut-to-library");
const cutterStatusMsg = document.getElementById("cutter-status-msg");

// Synchronize cutter song selection dropdown
function updateCutterTrackSelect() {
  cutterTrackSelect.innerHTML = `<option value="">-- Choose from Nexora Library (Hindi, English, Gujarati, Punjabi) --</option>`;
  state.tracks.forEach(track => {
    const opt = document.createElement("option");
    opt.value = track.id;
    const lang = track.language ? ` [${track.language}]` : "";
    opt.textContent = `${track.title} - ${track.artist}${lang} (${track.durationFormatted})`;
    cutterTrackSelect.appendChild(opt);
  });
}

cutterTrackSelect.addEventListener("change", (e) => {
  const trackId = e.target.value;
  if (!trackId) return;
  const track = state.tracks.find(t => t.id === trackId);
  if (track) loadTrackIntoCutter(track);
});

cutterFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadAudioFileIntoCutter(file);
});

// Shortcut from table 'Cut' button into Audio Cutter view
function openTrackInCutter(trackId) {
  const track = state.tracks.find(t => t.id === trackId);
  if (track) {
    switchView("view-cutter");
    cutterTrackSelect.value = track.id;
    loadTrackIntoCutter(track);
  }
}

// Fetch audio, decode PCM buffer via Web Audio API, and render waveform
async function loadTrackIntoCutter(track) {
  showCutterStatus(`Loading "${track.title}" waveform...`, "info");
  cutterTrackName.textContent = `${track.title} - ${track.artist}`;
  state.cutter.currentTrack = track;

  try {
    if (track.buffer) {
      setupCutterWithBuffer(track.buffer);
    } else {
      let arrayBuffer;
      try {
        const resp = await fetch(track.url);
        if (!resp.ok && track.fallbackUrl) {
          const fb = await fetch(track.fallbackUrl);
          arrayBuffer = await fb.arrayBuffer();
        } else {
          arrayBuffer = await resp.arrayBuffer();
        }
      } catch (err) {
        if (track.fallbackUrl) {
          const fb = await fetch(track.fallbackUrl);
          arrayBuffer = await fb.arrayBuffer();
        } else {
          throw err;
        }
      }

      const audioCtx = getAudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      track.buffer = decoded;
      setupCutterWithBuffer(decoded);
    }
    showCutterStatus(`"${track.title}" ready to trim!`, "success");
  } catch (err) {
    showCutterStatus("Notice: Track ready for player. You can also upload any MP3/WAV file directly.", "info");
  }
}

// Load a local audio file directly into the cutter
async function loadAudioFileIntoCutter(file) {
  showCutterStatus(`Loading "${file.name}"...`, "info");
  cutterTrackName.textContent = file.name;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = getAudioContext();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    
    state.cutter.currentTrack = {
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Local Edit"
    };

    setupCutterWithBuffer(decoded);
  } catch (err) {
    showCutterStatus("Error loading audio file: " + err.message, "error");
  }
}

// Setup initial slice boundaries and draw the waveform
function setupCutterWithBuffer(buffer) {
  state.cutter.audioBuffer = buffer;
  const dur = buffer.duration;
  state.cutter.duration = dur;

  // Default slice: first 10 seconds (or full track if shorter)
  state.cutter.startTime = 0;
  state.cutter.endTime = Math.min(10, dur);

  cutterStartTimeInput.max = dur;
  cutterEndTimeInput.max = dur;
  cutterStartTimeInput.value = state.cutter.startTime.toFixed(1);
  cutterEndTimeInput.value = state.cutter.endTime.toFixed(1);
  cutterTotalTime.textContent = formatTime(dur);

  updateCutterDurationDisplay();
  drawWaveform(buffer);
  updateWaveformOverlay();
}

function updateCutterDurationDisplay() {
  const diff = Math.max(0, state.cutter.endTime - state.cutter.startTime);
  cutterSelectedDuration.textContent = diff.toFixed(2) + "s";
  cutterRangeLabel.textContent = `${state.cutter.startTime.toFixed(1)}s - ${state.cutter.endTime.toFixed(1)}s`;
}

// Draw raw PCM audio samples on HTML5 Canvas
function drawWaveform(buffer) {
  const canvas = waveformCanvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Background subtle grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < width; x += 40) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  ctx.stroke();

  // Extract PCM channel 0 data
  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / width);
  const amp = height / 2;

  ctx.fillStyle = "#1DB954";
  ctx.beginPath();

  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = data[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }

    const y1 = (1 + min) * amp;
    const y2 = Math.max(1, (max - min) * amp);
    ctx.fillRect(i, y1, 1, y2);
  }

  // Center line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.moveTo(0, amp);
  ctx.lineTo(width, amp);
  ctx.stroke();
}

// Update the green selection highlight box over the waveform
function updateWaveformOverlay() {
  if (!state.cutter.duration) return;
  const startPct = (state.cutter.startTime / state.cutter.duration) * 100;
  const endPct = (state.cutter.endTime / state.cutter.duration) * 100;

  waveformSelection.style.left = startPct + "%";
  waveformSelection.style.width = (endPct - startPct) + "%";
}

// Click on canvas to adjust Start or End cut position
waveformCanvas.addEventListener("click", (e) => {
  if (!state.cutter.duration) return;
  const rect = waveformCanvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickedTime = (clickX / rect.width) * state.cutter.duration;

  const distToStart = Math.abs(clickedTime - state.cutter.startTime);
  const distToEnd = Math.abs(clickedTime - state.cutter.endTime);

  if (distToStart < distToEnd) {
    state.cutter.startTime = Math.min(clickedTime, state.cutter.endTime - 0.2);
    cutterStartTimeInput.value = state.cutter.startTime.toFixed(1);
  } else {
    state.cutter.endTime = Math.max(clickedTime, state.cutter.startTime + 0.2);
    cutterEndTimeInput.value = state.cutter.endTime.toFixed(1);
  }

  updateCutterDurationDisplay();
  updateWaveformOverlay();
});

// Numeric input listeners
cutterStartTimeInput.addEventListener("input", (e) => {
  let val = parseFloat(e.target.value) || 0;
  if (val < 0) val = 0;
  if (val >= state.cutter.endTime) val = Math.max(0, state.cutter.endTime - 0.1);
  state.cutter.startTime = val;
  updateCutterDurationDisplay();
  updateWaveformOverlay();
});

cutterEndTimeInput.addEventListener("input", (e) => {
  let val = parseFloat(e.target.value) || 0;
  if (val > state.cutter.duration) val = state.cutter.duration;
  if (val <= state.cutter.startTime) val = state.cutter.startTime + 0.1;
  state.cutter.endTime = val;
  updateCutterDurationDisplay();
  updateWaveformOverlay();
});

// Snap cut points to current player position
document.getElementById("btn-set-start-curr").addEventListener("click", () => {
  if (mainAudio.duration) {
    state.cutter.startTime = Math.min(mainAudio.currentTime, state.cutter.endTime - 0.1);
    cutterStartTimeInput.value = state.cutter.startTime.toFixed(1);
    updateCutterDurationDisplay();
    updateWaveformOverlay();
  }
});

document.getElementById("btn-set-end-curr").addEventListener("click", () => {
  if (mainAudio.duration) {
    state.cutter.endTime = Math.max(mainAudio.currentTime, state.cutter.startTime + 0.1);
    cutterEndTimeInput.value = state.cutter.endTime.toFixed(1);
    updateCutterDurationDisplay();
    updateWaveformOverlay();
  }
});

// Audition the cut slice using Web Audio API AudioBufferSourceNode
btnPreviewCut.addEventListener("click", () => {
  if (!state.cutter.audioBuffer) {
    showCutterStatus("Please select or upload an audio track first.", "error");
    return;
  }

  // Stop any other audio playing first
  pauseTrack();
  stopCutterPreview();

  const audioCtx = getAudioContext();
  const source = audioCtx.createBufferSource();
  source.buffer = state.cutter.audioBuffer;
  source.connect(audioCtx.destination);

  const start = state.cutter.startTime;
  const duration = state.cutter.endTime - start;

  source.start(0, start, duration);
  state.cutter.sourceNode = source;
  state.cutter.isPlayingPreview = true;

  showCutterStatus(`Playing cut preview (${start.toFixed(1)}s to ${state.cutter.endTime.toFixed(1)}s)...`, "info");
  source.onended = () => { state.cutter.isPlayingPreview = false; };
});

// Play entire song in Audio Cutter
const btnPlayFullCutter = document.getElementById("btn-play-full-cutter");
if (btnPlayFullCutter) {
  btnPlayFullCutter.addEventListener("click", () => {
    if (!state.cutter.currentTrack && !state.cutter.audioBuffer) {
      showCutterStatus("Please select or upload an audio track first.", "error");
      return;
    }
    stopCutterPreview();
    if (state.cutter.currentTrack) {
      const trackIdx = state.tracks.findIndex(t => t.id === state.cutter.currentTrack.id);
      if (trackIdx !== -1) {
        loadTrack(trackIdx);
        playTrack();
        showCutterStatus(`Playing full track: "${state.cutter.currentTrack.title}"`, "info");
        return;
      }
    }
    // Uploaded audio buffer fallback
    const audioCtx = getAudioContext();
    const source = audioCtx.createBufferSource();
    source.buffer = state.cutter.audioBuffer;
    source.connect(audioCtx.destination);
    source.start(0, 0);
    state.cutter.sourceNode = source;
    state.cutter.isPlayingPreview = true;
    showCutterStatus("Playing audio file...", "info");
    source.onended = () => { state.cutter.isPlayingPreview = false; };
  });
}

btnStopCutPreview.addEventListener("click", () => {
  stopCutterPreview();
  pauseTrack();
  showCutterStatus("Audio playback stopped.", "info");
});

function stopCutterPreview() {
  if (state.cutter.sourceNode) {
    try { state.cutter.sourceNode.stop(); } catch (e) {}
    state.cutter.sourceNode = null;
  }
  state.cutter.isPlayingPreview = false;
}

// Download cut audio slice as 16-bit WAV file
btnDownloadCut.addEventListener("click", async () => {
  if (!state.cutter.audioBuffer) {
    showCutterStatus("Please select or upload an audio file first.", "error");
    return;
  }

  showCutterStatus("Generating 16-bit WAV file...", "info");
  const slicedBlob = await createSlicedAudioBlob();

  const trackTitle = (state.cutter.currentTrack ? state.cutter.currentTrack.title : "audio") + "-trimmed";
  const link = document.createElement("a");
  link.href = URL.createObjectURL(slicedBlob);
  link.download = `${trackTitle}.wav`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showCutterStatus(`Downloaded "${trackTitle}.wav" successfully!`, "success");
});

// Add cut track directly into the Nexora library
btnAddCutToLibrary.addEventListener("click", async () => {
  if (!state.cutter.audioBuffer) {
    showCutterStatus("Please select or upload an audio track first.", "error");
    return;
  }

  showCutterStatus("Adding trimmed clip to library...", "info");
  const slicedBlob = await createSlicedAudioBlob();
  const slicedUrl = URL.createObjectURL(slicedBlob);
  const slicedDuration = state.cutter.endTime - state.cutter.startTime;
  const baseTitle = state.cutter.currentTrack ? state.cutter.currentTrack.title : "Audio Clip";

  const newTrack = {
    id: "track-cut-" + Date.now(),
    title: `${baseTitle} (Trimmed Cut)`,
    artist: "Studio Edit",
    language: "Trimmed",
    category: "trimmed",
    genre: "Custom Trim",
    duration: slicedDuration,
    durationFormatted: formatTime(slicedDuration),
    url: slicedUrl,
    icon: "CUT",
    color: "#2e7d32",
    isLiked: true
  };

  state.tracks.unshift(newTrack);
  renderTracksUI();
  updateCutterTrackSelect();
  updateVideoAudioSelect();
  showCutterStatus(`"${newTrack.title}" added to your library!`, "success");
  
  loadTrack(0);
  playTrack();
});

// Render the exact audio slice into a new WAV Blob using OfflineAudioContext
async function createSlicedAudioBlob() {
  const orig = state.cutter.audioBuffer;
  const start = state.cutter.startTime;
  const duration = Math.max(0.1, state.cutter.endTime - start);
  const sampleRate = orig.sampleRate;
  const channels = orig.numberOfChannels;

  const offline = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
    channels,
    Math.ceil(duration * sampleRate),
    sampleRate
  );

  const source = offline.createBufferSource();
  source.buffer = orig;
  source.connect(offline.destination);
  source.start(0, start, duration);

  const rendered = await offline.startRendering();
  return audioBufferToWavBlob(rendered);
}

function showCutterStatus(msg, type) {
  cutterStatusMsg.textContent = msg;
  cutterStatusMsg.className = `status-message show ${type}`;
  setTimeout(() => {
    if (type !== "error") cutterStatusMsg.classList.remove("show");
  }, 4000);
}

// ===================================================================
// SECTION 6: VIDEO STUDIO (Video Trimmer & Soundtrack Mixer)
// ===================================================================

const studioVideo = document.getElementById("studio-video");
const videoPlaceholder = document.getElementById("video-placeholder");
const videoFileInput = document.getElementById("video-file-input");
const btnLoadDemoVideo = document.getElementById("btn-load-demo-video");
const videoStartRange = document.getElementById("video-start-range");
const videoEndRange = document.getElementById("video-end-range");
const videoTrimStartLabel = document.getElementById("video-trim-start-label");
const videoTrimEndLabel = document.getElementById("video-trim-end-label");
const btnVideoSetStart = document.getElementById("btn-video-set-start");
const btnVideoSetEnd = document.getElementById("btn-video-set-end");
const btnVideoPreviewTrim = document.getElementById("btn-video-preview-trim");
const videoAudioSelect = document.getElementById("video-audio-select");
const videoCustomAudioInput = document.getElementById("video-custom-audio-input");
const videoOrigVolume = document.getElementById("video-orig-volume");
const videoAddedVolume = document.getElementById("video-added-volume");
const origVolVal = document.getElementById("orig-vol-val");
const addedVolVal = document.getElementById("added-vol-val");
const btnExportVideo = document.getElementById("btn-export-video");
const videoExportProgress = document.getElementById("video-export-progress");
const exportBarFill = document.getElementById("export-bar-fill");
const exportStatusText = document.getElementById("export-status-text");
const videoStatusMsg = document.getElementById("video-status-msg");

// Populate soundtrack dropdown in Video Studio
function updateVideoAudioSelect() {
  const current = videoAudioSelect.value;
  videoAudioSelect.innerHTML = `<option value="none">-- Keep Original Video Sound Only --</option>`;
  state.tracks.forEach(track => {
    const opt = document.createElement("option");
    opt.value = track.id;
    const lang = track.language ? ` [${track.language}]` : "";
    opt.textContent = `${track.title} - ${track.artist}${lang} (${track.durationFormatted})`;
    videoAudioSelect.appendChild(opt);
  });
  videoAudioSelect.value = current;
}

videoFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadVideoFile(file);
});

btnLoadDemoVideo.addEventListener("click", () => {
  generateDemoVideoClip();
});

// Load video file and initialize trim range sliders
function loadVideoFile(file) {
  state.video.file = file;
  state.video.videoUrl = URL.createObjectURL(file);
  studioVideo.src = state.video.videoUrl;
  videoPlaceholder.style.display = "none";

  studioVideo.addEventListener("loadedmetadata", () => {
    const dur = studioVideo.duration || 10;
    state.video.duration = dur;
    state.video.startTime = 0;
    state.video.endTime = dur;

    videoStartRange.max = dur;
    videoEndRange.max = dur;
    videoStartRange.value = 0;
    videoEndRange.value = dur;

    videoTrimStartLabel.textContent = "0.0s";
    videoTrimEndLabel.textContent = dur.toFixed(1) + "s";

    showVideoStatus(`Video "${file.name}" loaded (${dur.toFixed(1)}s)`, "success");
  }, { once: true });
}

// Generate animated HTML5 canvas clip if user has no MP4 on hand
function generateDemoVideoClip() {
  showVideoStatus("Generating interactive demo video...", "info");
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const file = new File([blob], "nexora-demo-video.webm", { type: "video/webm" });
    loadVideoFile(file);
  };

  recorder.start();

  let frame = 0;
  const totalFrames = 30 * 10; // 10 seconds

  function renderFrame() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dynamic gradient circle
    const hue = (frame * 2) % 360;
    ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
    ctx.beginPath();
    const x = canvas.width / 2 + Math.sin(frame * 0.05) * 150;
    const y = canvas.height / 2 + Math.cos(frame * 0.05) * 60;
    ctx.arc(x, y, 45, 0, Math.PI * 2);
    ctx.fill();

    // Waveform bars
    ctx.fillStyle = "#1DB954";
    for (let i = 0; i < 20; i++) {
      const barH = 20 + Math.abs(Math.sin((frame + i * 5) * 0.1)) * 100;
      ctx.fillRect(100 + i * 22, 300 - barH, 14, barH);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Nexora Video Studio", 160, 80);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#aaa";
    ctx.fillText(`Frame ${frame} / ${totalFrames} (Demo Clip)`, 240, 115);

    frame++;
    if (frame < totalFrames) {
      requestAnimationFrame(renderFrame);
    } else {
      recorder.stop();
    }
  }

  renderFrame();
}

// Video trim slider controls
videoStartRange.addEventListener("input", (e) => {
  let val = parseFloat(e.target.value);
  if (val >= state.video.endTime) val = Math.max(0, state.video.endTime - 0.2);
  state.video.startTime = val;
  videoTrimStartLabel.textContent = val.toFixed(1) + "s";
  studioVideo.currentTime = val;
});

videoEndRange.addEventListener("input", (e) => {
  let val = parseFloat(e.target.value);
  if (val <= state.video.startTime) val = state.video.startTime + 0.2;
  state.video.endTime = val;
  videoTrimEndLabel.textContent = val.toFixed(1) + "s";
  studioVideo.currentTime = val;
});

btnVideoSetStart.addEventListener("click", () => {
  const cur = studioVideo.currentTime;
  state.video.startTime = Math.min(cur, state.video.endTime - 0.2);
  videoStartRange.value = state.video.startTime;
  videoTrimStartLabel.textContent = state.video.startTime.toFixed(1) + "s";
});

btnVideoSetEnd.addEventListener("click", () => {
  const cur = studioVideo.currentTime;
  state.video.endTime = Math.max(cur, state.video.startTime + 0.2);
  videoEndRange.value = state.video.endTime;
  videoTrimEndLabel.textContent = state.video.endTime.toFixed(1) + "s";
});

// Helper to play background soundtrack if selected in video studio
function playVideoSoundtrack() {
  const audioId = videoAudioSelect.value;
  if (audioId !== "none") {
    const track = state.tracks.find(t => t.id === audioId);
    if (track) {
      mainAudio.src = track.url;
      mainAudio.currentTime = 0;
      mainAudio.volume = parseFloat(videoAddedVolume.value);
      mainAudio.play().catch(() => {});
    }
  }
}

// Play full video
const btnVideoPlay = document.getElementById("btn-video-play");
if (btnVideoPlay) {
  btnVideoPlay.addEventListener("click", () => {
    if (!studioVideo.src) {
      showVideoStatus("Please upload a video or click 'Use Demo Canvas Clip' first.", "error");
      return;
    }
    studioVideo.play();
    playVideoSoundtrack();
    showVideoStatus("Playing video...", "info");
  });
}

// Stop video and background audio
const btnVideoStop = document.getElementById("btn-video-stop");
if (btnVideoStop) {
  btnVideoStop.addEventListener("click", () => {
    studioVideo.pause();
    studioVideo.currentTime = state.video.startTime || 0;
    mainAudio.pause();
    showVideoStatus("Video stopped and reset to start point.", "info");
  });
}

// Preview trimmed video segment and overlay music concurrently
btnVideoPreviewTrim.addEventListener("click", () => {
  if (!studioVideo.src) {
    showVideoStatus("Please upload a video or click 'Use Demo Canvas Clip' first.", "error");
    return;
  }
  studioVideo.currentTime = state.video.startTime;
  studioVideo.play();
  playVideoSoundtrack();
  showVideoStatus(`Previewing trimmed segment (${state.video.startTime.toFixed(1)}s - ${state.video.endTime.toFixed(1)}s)...`, "info");

  const checkEnd = () => {
    if (studioVideo.currentTime >= state.video.endTime) {
      studioVideo.pause();
      mainAudio.pause();
      studioVideo.removeEventListener("timeupdate", checkEnd);
      showVideoStatus("Trim preview completed.", "success");
    }
  };
  studioVideo.addEventListener("timeupdate", checkEnd);
});

// Volume slider percentages
videoOrigVolume.addEventListener("input", (e) => {
  origVolVal.textContent = Math.round(e.target.value * 100) + "%";
  studioVideo.volume = parseFloat(e.target.value);
});

videoAddedVolume.addEventListener("input", (e) => {
  addedVolVal.textContent = Math.round(e.target.value * 100) + "%";
});

// Custom audio file for video
videoCustomAudioInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const trackName = file.name.replace(/\.[^/.]+$/, "");

  const newAudioTrack = {
    id: "video-custom-audio-" + Date.now(),
    title: trackName,
    artist: "Uploaded Soundtrack",
    duration: 30,
    durationFormatted: "--",
    url: url
  };

  state.tracks.push(newAudioTrack);
  updateVideoAudioSelect();
  videoAudioSelect.value = newAudioTrack.id;
  showVideoStatus(`Soundtrack "${trackName}" loaded for video!`, "success");
});

// Export combined trimmed video with mixed soundtracks
btnExportVideo.addEventListener("click", async () => {
  if (!studioVideo.src) {
    showVideoStatus("Please upload or load a video first.", "error");
    return;
  }

  showVideoStatus("Rendering trimmed video & mixing audio...", "info");
  videoExportProgress.style.display = "flex";
  exportBarFill.style.width = "10%";
  exportStatusText.textContent = "Preparing streams...";

  try {
    const trimStart = state.video.startTime;
    const trimEnd = state.video.endTime;
    const duration = Math.max(0.5, trimEnd - trimStart);

    // Canvas to capture video frames
    const canvas = document.createElement("canvas");
    canvas.width = studioVideo.videoWidth || 640;
    canvas.height = studioVideo.videoHeight || 360;
    const ctx = canvas.getContext("2d");

    // Audio mixing via Web Audio API
    const audioCtx = getAudioContext();
    const dest = audioCtx.createMediaStreamDestination();

    // 1. Original video audio (if enabled)
    const origVol = parseFloat(videoOrigVolume.value);
    if (origVol > 0) {
      try {
        const videoSource = audioCtx.createMediaElementSource(studioVideo);
        const origGain = audioCtx.createGain();
        origGain.gain.value = origVol;
        videoSource.connect(origGain);
        origGain.connect(dest);
        origGain.connect(audioCtx.destination);
      } catch (err) {
        console.warn("Audio element source note:", err);
      }
    }

    // 2. Added audio soundtrack (if selected)
    const audioTrackId = videoAudioSelect.value;
    let addedAudio = null;
    if (audioTrackId !== "none") {
      const selected = state.tracks.find(t => t.id === audioTrackId);
      if (selected) {
        addedAudio = new Audio(selected.url);
        addedAudio.crossOrigin = "anonymous";
        const addedSource = audioCtx.createMediaElementSource(addedAudio);
        const addedGain = audioCtx.createGain();
        addedGain.gain.value = parseFloat(videoAddedVolume.value);
        addedSource.connect(addedGain);
        addedGain.connect(dest);
      }
    }

    // Combine canvas video stream + mixed audio stream
    const canvasStream = canvas.captureStream(30);
    const mixedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    let options = { mimeType: "video/webm;codecs=vp8,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
    }

    const recorder = new MediaRecorder(mixedStream, options);
    const recordedChunks = [];

    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    recorder.onstop = () => {
      exportBarFill.style.width = "100%";
      exportStatusText.textContent = "Done!";

      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const dl = document.createElement("a");
      dl.href = URL.createObjectURL(blob);
      dl.download = `nexora-video-${Date.now()}.webm`;
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);

      showVideoStatus("Video rendered and downloaded successfully!", "success");
      setTimeout(() => { videoExportProgress.style.display = "none"; }, 3000);
    };

    // Seek to trim start and start recording
    studioVideo.currentTime = trimStart;
    studioVideo.pause();

    await new Promise(r => setTimeout(r, 200));

    recorder.start();
    await studioVideo.play();
    if (addedAudio) {
      addedAudio.currentTime = 0;
      await addedAudio.play();
    }

    // Capture frames loop
    let isRecording = true;
    function drawFrame() {
      if (!isRecording) return;
      ctx.drawImage(studioVideo, 0, 0, canvas.width, canvas.height);

      const elapsed = studioVideo.currentTime - trimStart;
      const progress = Math.min(95, Math.max(10, (elapsed / duration) * 100));
      exportBarFill.style.width = `${progress}%`;
      exportStatusText.textContent = `Rendering: ${Math.round(progress)}%`;

      if (studioVideo.currentTime >= trimEnd || studioVideo.ended) {
        isRecording = false;
        studioVideo.pause();
        if (addedAudio) addedAudio.pause();
        recorder.stop();
      } else {
        requestAnimationFrame(drawFrame);
      }
    }

    drawFrame();

  } catch (err) {
    showVideoStatus("Export failed: " + err.message, "error");
    videoExportProgress.style.display = "none";
  }
});

function showVideoStatus(msg, type) {
  videoStatusMsg.textContent = msg;
  videoStatusMsg.className = `status-message show ${type}`;
  setTimeout(() => {
    if (type !== "error") videoStatusMsg.classList.remove("show");
  }, 4500);
}

// ===================================================================
// SECTION 7: CLIENT-SIDE 16-BIT PCM WAV BINARY ENCODER
// ===================================================================

// Encodes an AudioBuffer into a binary WAV Blob without external libraries
function audioBufferToWavBlob(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const bufferArray = new ArrayBuffer(44 + length);
  const view = new DataView(bufferArray);

  // RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');

  // fmt Sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data Sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Interleave and write 16-bit PCM samples
  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ===================================================================
// SECTION 8: NAVIGATION & HELPER UTILITIES
// ===================================================================

// Format seconds into "m:ss"
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Initialize shared Web Audio Context
function getAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }
  return state.audioContext;
}

// Switch between visible views ('view-home', 'view-cutter', 'view-video')
function switchView(viewId) {
  document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  const target = document.getElementById(viewId);
  if (target) target.classList.add("active");

  const matchingNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (matchingNav) matchingNav.classList.add("active");
}

// Sidebar view switching buttons
document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    switchView(btn.dataset.view);
  });
});

document.getElementById("sidebar-add-media-btn").addEventListener("click", () => {
  globalFileInput.click();
});

document.getElementById("search-nav-trigger").addEventListener("click", () => {
  switchView("view-home");
  searchInput.focus();
});

document.getElementById("library-nav-trigger").addEventListener("click", () => {
  switchView("view-home");
});

// Player bar controls
document.getElementById("btn-play-pause").addEventListener("click", togglePlayPause);
document.getElementById("btn-next").addEventListener("click", nextTrack);
document.getElementById("btn-prev").addEventListener("click", prevTrack);

// Shuffle & Repeat buttons
const btnShuffle = document.getElementById("btn-shuffle");
btnShuffle.addEventListener("click", () => {
  state.isShuffled = !state.isShuffled;
  btnShuffle.classList.toggle("active-state", state.isShuffled);
});

const btnRepeat = document.getElementById("btn-repeat");
btnRepeat.addEventListener("click", () => {
  state.isRepeated = !state.isRepeated;
  btnRepeat.classList.toggle("active-state", state.isRepeated);
});

// Like heart button in bottom player bar
const btnLike = document.getElementById("btn-like");
btnLike.addEventListener("click", () => {
  const current = state.tracks[state.currentTrackIndex];
  if (current) {
    toggleLikeTrack(current.id);
  }
});

// Shortcut to open playing song in Cutter
document.getElementById("btn-cut-current").addEventListener("click", () => {
  const current = state.tracks[state.currentTrackIndex];
  if (current) openTrackInCutter(current.id);
});

// Play all songs
document.getElementById("hero-play-btn").addEventListener("click", () => {
  if (state.tracks.length > 0) {
    loadTrack(0);
    playTrack();
  }
});

// Check if Java backend is online
async function checkJavaBackend() {
  try {
    const res = await fetch("/api/status");
    if (res.ok) console.log("Java Backend Connected:", await res.json());
  } catch (e) {}
}

// Filter tracks by language playlist (Hindi, English, Gujarati, Punjabi, etc.)
function selectPlaylist(plType, clickedEl) {
  state.currentPlaylistFilter = plType;

  // Update active sidebar playlist item
  document.querySelectorAll(".playlist-item").forEach(el => el.classList.remove("active-playlist"));
  if (clickedEl && clickedEl.classList.contains("playlist-item")) {
    clickedEl.classList.add("active-playlist");
  } else {
    const match = document.querySelector(`.playlist-item[data-playlist="${plType}"]`);
    if (match) match.classList.add("active-playlist");
  }

  // Update active language filter pill
  document.querySelectorAll(".lang-pill").forEach(el => el.classList.remove("active-pill"));
  const matchPill = document.querySelector(`.lang-pill[data-lang="${plType}"]`);
  if (matchPill) matchPill.classList.add("active-pill");

  switchView("view-home");

  // Update section heading
  const title = document.querySelector(".section-header-row .section-title");
  if (title) {
    if (plType === "all") title.textContent = "All Songs (Hindi, English, Gujarati, Punjabi)";
    else if (plType === "hindi") title.textContent = "Hindi Songs Library";
    else if (plType === "english") title.textContent = "English Songs Library";
    else if (plType === "gujarati") title.textContent = "Gujarati Songs Library";
    else if (plType === "punjabi") title.textContent = "Punjabi Songs Library";
    else if (plType === "trimmed") title.textContent = "My Trimmed Clips";
  }

  renderTracksUI();

  // Auto-play first matching song
  if (plType !== "trimmed") {
    const matchIdx = state.tracks.findIndex(t => {
      if (plType === "all") return true;
      const lang = (t.language || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      return lang === plType || cat === plType;
    });

    if (matchIdx !== -1) {
      loadTrack(matchIdx);
      playTrack();
    }
  }
}

// Bind playlist list items and language pills
document.querySelectorAll(".playlist-item").forEach(item => {
  item.addEventListener("click", () => {
    selectPlaylist(item.dataset.playlist || "all", item);
  });
});

document.querySelectorAll(".lang-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    selectPlaylist(pill.dataset.lang || "all");
  });
});

// ===================================================================
// SECTION 9: USER AUTHENTICATION & INITIALIZATION
// ===================================================================

const loginOverlay = document.getElementById("login-overlay");
const loginForm = document.getElementById("login-form");
const loginUsernameInput = document.getElementById("login-username");
const loginPasswordInput = document.getElementById("login-password");
const btnGuestLogin = document.getElementById("btn-guest-login");
const btnGoogleLogin = document.getElementById("btn-google-login");
const btnPwdToggle = document.getElementById("btn-pwd-toggle");
const btnForgotPwd = document.getElementById("btn-forgot-pwd");
const btnSignupLink = document.getElementById("btn-signup-link");
const userAvatarBtn = document.getElementById("user-avatar-btn");
const userDropdownPanel = document.getElementById("user-dropdown-panel");
const userDisplayName = document.getElementById("user-display-name");
const userAvatarInitials = document.getElementById("user-avatar-initials");
const btnLogout = document.getElementById("btn-logout");

// Check saved user session in localStorage
function checkUserLogin() {
  const savedUser = localStorage.getItem("nexora_user");
  if (savedUser) {
    applyLoggedInUser(savedUser);
    if (loginOverlay) loginOverlay.classList.add("hidden");
  } else {
    if (loginOverlay) loginOverlay.classList.remove("hidden");
  }
}

// Apply username to avatar initials and greeting
function applyLoggedInUser(username) {
  state.currentUser = username;
  localStorage.setItem("nexora_user", username);
  if (userDisplayName) userDisplayName.textContent = username;

  // Calculate initials (e.g., "Producer Alex" -> "PA")
  const parts = username.trim().split(" ");
  let initials = parts[0] ? parts[0][0].toUpperCase() : "U";
  if (parts.length > 1 && parts[1]) initials += parts[1][0].toUpperCase();
  if (userAvatarInitials) userAvatarInitials.textContent = initials;

  const greetingEl = document.getElementById("greeting-text");
  if (greetingEl) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    greetingEl.textContent = `${timeOfDay}, ${username}`;
  }
}

function completeLogin(username) {
  applyLoggedInUser(username);
  if (loginOverlay) loginOverlay.classList.add("hidden");
  getAudioContext();
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    completeLogin(loginUsernameInput.value.trim() || "Producer");
  });
}

if (btnGuestLogin) {
  btnGuestLogin.addEventListener("click", () => {
    completeLogin("Producer Alex");
  });
}

if (btnGoogleLogin) {
  btnGoogleLogin.addEventListener("click", () => {
    completeLogin("Google Producer");
  });
}

if (btnPwdToggle && loginPasswordInput) {
  btnPwdToggle.addEventListener("click", () => {
    const isPwd = loginPasswordInput.type === "password";
    loginPasswordInput.type = isPwd ? "text" : "password";
    const pwdText = document.getElementById("pwd-toggle-text");
    if (pwdText) pwdText.textContent = isPwd ? "HIDE" : "SHOW";
  });
}

if (btnForgotPwd) {
  btnForgotPwd.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Demo Mode: Enter any password or click 'Quick Guest Login'!");
  });
}

if (btnSignupLink) {
  btnSignupLink.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Notice: Enter any username and password to log in right now!");
  });
}

// Toggle user profile dropdown
if (userAvatarBtn && userDropdownPanel) {
  userAvatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = userDropdownPanel.style.display === "block";
    userDropdownPanel.style.display = isOpen ? "none" : "block";
  });
}

document.addEventListener("click", (e) => {
  if (userDropdownPanel && !e.target.closest(".user-profile-menu")) {
    userDropdownPanel.style.display = "none";
  }
});

// Logout handler
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("nexora_user");
    if (userDropdownPanel) userDropdownPanel.style.display = "none";
    if (loginOverlay) loginOverlay.classList.remove("hidden");
    pauseTrack();
  });
}

// Application startup when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  checkUserLogin();
  updateGreeting();
  loadLibraryTracks();
  if (state.tracks.length > 0) {
    loadTrack(0);
  }
  checkJavaBackend();
});

// ===================================================================
// SECTION 10: AUDIO EQUALIZER (DSP STUDIO PRO) & KEYBOARD SHORTCUTS
// ===================================================================

// Web Audio API DSP Filter Nodes
let mediaSourceNode = null;
let eqBassNode = null;
let eqMidNode = null;
let eqTrebleNode = null;
let eqAnalyserNode = null;
let isEqInitialized = false;
let eqAnimFrameId = null;

// Preset definitions (in decibels dB)
const EQ_PRESETS = {
  flat: { name: "Flat / Pure", bass: 0, mid: 0, treble: 0 },
  bass: { name: "Bass Punch", bass: 8, mid: 0, treble: 1 },
  pop: { name: "Pop Radiance", bass: 3, mid: 3, treble: 5 },
  rock: { name: "Rock & Metal", bass: 6, mid: -2, treble: 6 },
  vocal: { name: "Vocal Clarity", bass: -2, mid: 6, treble: 2 },
  electronic: { name: "Club / EDM", bass: 9, mid: 1, treble: 7 },
  acoustic: { name: "Acoustic Warm", bass: 4, mid: 1, treble: 3 }
};

// Initialize the 3-band BiquadFilter Equalizer graph + Analyser
function initAudioEqualizer() {
  if (isEqInitialized) return true;
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    // Create media element source node for main audio
    if (!mediaSourceNode) {
      mediaSourceNode = ctx.createMediaElementSource(mainAudio);
    }

    // Low Shelf for Bass (250 Hz)
    eqBassNode = ctx.createBiquadFilter();
    eqBassNode.type = "lowshelf";
    eqBassNode.frequency.value = 250;
    eqBassNode.gain.value = state.eq.bypassed ? 0 : (state.eq.bass || 0);

    // Peaking filter for Midrange (1500 Hz)
    eqMidNode = ctx.createBiquadFilter();
    eqMidNode.type = "peaking";
    eqMidNode.frequency.value = 1500;
    eqMidNode.Q.value = 1.0;
    eqMidNode.gain.value = state.eq.bypassed ? 0 : (state.eq.mid || 0);

    // High Shelf for Treble (4000 Hz)
    eqTrebleNode = ctx.createBiquadFilter();
    eqTrebleNode.type = "highshelf";
    eqTrebleNode.frequency.value = 4000;
    eqTrebleNode.gain.value = state.eq.bypassed ? 0 : (state.eq.treble || 0);

    // Analyser Node for Real-time Spectrum & VU Meters
    eqAnalyserNode = ctx.createAnalyser();
    eqAnalyserNode.fftSize = 256;
    eqAnalyserNode.smoothingTimeConstant = 0.8;

    // Connect audio signal chain:
    // mainAudio -> Bass Filter -> Mid Filter -> Treble Filter -> Analyser -> Speakers
    mediaSourceNode.connect(eqBassNode);
    eqBassNode.connect(eqMidNode);
    eqMidNode.connect(eqTrebleNode);
    eqTrebleNode.connect(eqAnalyserNode);
    eqAnalyserNode.connect(ctx.destination);

    isEqInitialized = true;
    return true;
  } catch (err) {
    console.warn("Audio Equalizer notice:", err);
    return false;
  }
}

// Apply current EQ values to Web Audio API filters
function applyEqFilterValues() {
  const isBypassed = !!state.eq.bypassed;
  if (eqBassNode) eqBassNode.gain.value = isBypassed ? 0 : state.eq.bass;
  if (eqMidNode) eqMidNode.gain.value = isBypassed ? 0 : state.eq.mid;
  if (eqTrebleNode) eqTrebleNode.gain.value = isBypassed ? 0 : state.eq.treble;
  updateEqStatusBadge();
  updateScreenStatReadout();
  drawEqVisualizer();
}

// Update Screen Stats & Badge
function updateScreenStatReadout() {
  const statCurve = document.getElementById("screen-stat-curve");
  if (statCurve) {
    if (state.eq.bypassed) {
      statCurve.textContent = "DSP BYPASSED (FLAT RESPONSE)";
    } else {
      const b = (state.eq.bass > 0 ? "+" : "") + state.eq.bass.toFixed(1);
      const m = (state.eq.mid > 0 ? "+" : "") + state.eq.mid.toFixed(1);
      const t = (state.eq.treble > 0 ? "+" : "") + state.eq.treble.toFixed(1);
      statCurve.textContent = `BASS: ${b}dB | MID: ${m}dB | HIGH: ${t}dB`;
    }
  }
}

function updateEqStatusBadge() {
  const badge = document.getElementById("eq-status-badge");
  if (!badge) return;
  const pName = EQ_PRESETS[state.eq.preset] ? EQ_PRESETS[state.eq.preset].name : "Custom";
  badge.textContent = `Mode: ${pName} (${state.eq.bass > 0 ? "+" : ""}${state.eq.bass}dB) \u2022 Speed: ${state.eq.speed}x`;
}

// Select an EQ preset
function setEqPreset(presetKey) {
  const preset = EQ_PRESETS[presetKey];
  if (!preset) return;

  state.eq.preset = presetKey;
  state.eq.bass = preset.bass;
  state.eq.mid = preset.mid;
  state.eq.treble = preset.treble;

  // Update slider positions & labels
  const bassSlider = document.getElementById("eq-slider-bass");
  const midSlider = document.getElementById("eq-slider-mid");
  const trebleSlider = document.getElementById("eq-slider-treble");
  const bassVal = document.getElementById("eq-val-bass");
  const midVal = document.getElementById("eq-val-mid");
  const trebleVal = document.getElementById("eq-val-treble");

  if (bassSlider) bassSlider.value = preset.bass;
  if (midSlider) midSlider.value = preset.mid;
  if (trebleSlider) trebleSlider.value = preset.treble;

  if (bassVal) bassVal.textContent = `${preset.bass > 0 ? "+" : ""}${preset.bass.toFixed(1)} dB`;
  if (midVal) midVal.textContent = `${preset.mid > 0 ? "+" : ""}${preset.mid.toFixed(1)} dB`;
  if (trebleVal) trebleVal.textContent = `${preset.treble > 0 ? "+" : ""}${preset.treble.toFixed(1)} dB`;

  // Highlight active preset button
  document.querySelectorAll(".eq-preset-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.preset === presetKey);
  });

  initAudioEqualizer();
  applyEqFilterValues();
}

// Set playback speed (tempo)
function setPlaybackSpeed(speed) {
  state.eq.speed = speed;
  mainAudio.playbackRate = speed;

  // Update continuous slider
  const speedSlider = document.getElementById("eq-slider-speed");
  if (speedSlider) speedSlider.value = speed;

  // Update speed preset buttons
  document.querySelectorAll(".speed-btn").forEach(btn => {
    const bSpeed = parseFloat(btn.dataset.speed);
    btn.classList.toggle("active", Math.abs(bSpeed - speed) < 0.04);
  });

  // Update readout pill
  const readout = document.getElementById("tape-speed-readout");
  if (readout) {
    let desc = "NORMAL";
    if (speed < 0.95) desc = "SLOWED";
    else if (speed > 1.35) desc = "FAST TAPE";
    else if (speed > 1.05) desc = "UPTEMPO";
    readout.textContent = `${speed.toFixed(2)}x \u2022 ${Math.round(speed * 100)}% PITCH (${desc})`;
  }

  updateEqStatusBadge();
}

// Toggle Bypass DSP
function toggleEqBypass() {
  state.eq.bypassed = !state.eq.bypassed;
  const btnBypass = document.getElementById("btn-toggle-bypass");
  const textBypass = document.getElementById("bypass-status-text");

  if (btnBypass && textBypass) {
    if (state.eq.bypassed) {
      btnBypass.classList.add("bypassed");
      textBypass.textContent = "BYPASSED";
    } else {
      btnBypass.classList.remove("bypassed");
      textBypass.textContent = "DSP ACTIVE";
    }
  }

  applyEqFilterValues();
}

// Reset EQ to default flat 0dB and speed 1.0x
function resetEqualizer() {
  state.eq.bypassed = false;
  const btnBypass = document.getElementById("btn-toggle-bypass");
  const textBypass = document.getElementById("bypass-status-text");
  if (btnBypass && textBypass) {
    btnBypass.classList.remove("bypassed");
    textBypass.textContent = "DSP ACTIVE";
  }
  setEqPreset("flat");
  setPlaybackSpeed(1.0);
}

// ===================================================================
// REAL-TIME CANVAS FREQUENCY RESPONSE CURVE & SPECTRUM VISUALIZER
// ===================================================================
function drawEqVisualizer() {
  const canvas = document.getElementById("eq-curve-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  // Clear background
  ctx.fillStyle = "#07090d";
  ctx.fillRect(0, 0, width, height);

  const midY = height / 2;
  const maxDb = 15; // display range +/-15 dB
  const isBypassed = !!state.eq.bypassed;
  const bassGain = isBypassed ? 0 : (state.eq.bass || 0);
  const midGain = isBypassed ? 0 : (state.eq.mid || 0);
  const trebleGain = isBypassed ? 0 : (state.eq.treble || 0);

  // 1. Grid Lines (Horizontal dB levels)
  const dbLines = [12, 6, 0, -6, -12];
  ctx.font = "9px monospace";
  ctx.textBaseline = "middle";

  dbLines.forEach(db => {
    const y = midY - (db / maxDb) * (height * 0.42);
    ctx.beginPath();
    if (db === 0) {
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
    }
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // dB label on left
    ctx.fillStyle = db === 0 ? "#10b981" : "#556275";
    ctx.fillText(`${db > 0 ? "+" : ""}${db}dB`, 6, y);
  });

  // Vertical Frequency logarithmic grid lines
  const freqMarks = [30, 60, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  freqMarks.forEach(freq => {
    const logFrac = Math.log10(freq / 20) / Math.log10(20000 / 20);
    const x = logFrac * width;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // 2. Real-time FFT Audio Spectrum Bars (Behind EQ Curve)
  let bassVU = 0;
  let midVU = 0;
  let trebleVU = 0;

  if (eqAnalyserNode && !mainAudio.paused) {
    const bufferLength = eqAnalyserNode.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    eqAnalyserNode.getByteFrequencyData(freqData);

    const barCount = 48;
    const barWidth = width / barCount;
    ctx.fillStyle = "rgba(16, 185, 129, 0.12)";

    for (let i = 0; i < barCount; i++) {
      const dataIdx = Math.floor((i / barCount) * (bufferLength * 0.7));
      const val = freqData[dataIdx] || 0;
      const barH = (val / 255) * (height * 0.75);
      const x = i * barWidth;
      const y = height - barH;
      ctx.fillRect(x + 1, y, barWidth - 2, barH);
    }

    // Compute VU meter levels for 3 bands
    // Bass: bins 1..6 (20Hz - 250Hz)
    let bSum = 0;
    for (let i = 1; i <= 6; i++) bSum += freqData[i] || 0;
    bassVU = Math.min(1, (bSum / (6 * 255)) * (1 + bassGain * 0.04));

    // Mid: bins 7..25 (250Hz - 2kHz)
    let mSum = 0;
    for (let i = 7; i <= 25; i++) mSum += freqData[i] || 0;
    midVU = Math.min(1, (mSum / (19 * 255)) * (1 + midGain * 0.04));

    // Treble: bins 26..80 (2kHz - 10kHz)
    let tSum = 0;
    for (let i = 26; i <= 80; i++) tSum += freqData[i] || 0;
    trebleVU = Math.min(1, (tSum / (55 * 255)) * (1 + trebleGain * 0.04));
  }

  // Update LED VU ladder meters
  updateLedLadder("vu-meter-bass", bassVU);
  updateLedLadder("vu-meter-mid", midVU);
  updateLedLadder("vu-meter-treble", trebleVU);

  // 3. Mathematical Transfer Function for 3-Band Parametric Response Curve
  const points = [];
  const steps = 140;

  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const f = 20 * Math.pow(20000 / 20, frac); // logarithmic frequency
    const x = frac * width;

    // Low-shelf contribution (250 Hz)
    const gBass = bassGain / (1 + Math.pow(f / 250, 2));

    // Mid peaking contribution (1500 Hz, Q = 1.0)
    const rMid = Math.log2(f / 1500);
    const gMid = midGain / (1 + 3 * Math.pow(rMid, 2));

    // High-shelf contribution (4000 Hz)
    const gTreble = (trebleGain * Math.pow(f / 4000, 2)) / (1 + Math.pow(f / 4000, 2));

    const totalGain = gBass + gMid + gTreble;
    const y = midY - (totalGain / maxDb) * (height * 0.42);

    points.push({ x, y, f, gain: totalGain });
  }

  // Draw Area fill under curve
  if (points.length > 0) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(16, 185, 129, 0.28)");
    grad.addColorStop(0.5, "rgba(16, 185, 129, 0.08)");
    grad.addColorStop(1, "rgba(16, 185, 129, 0.0)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, midY);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, midY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Draw Smooth EQ Response Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  const lineGrad = ctx.createLinearGradient(0, 0, width, 0);
  lineGrad.addColorStop(0, "#10b981");
  lineGrad.addColorStop(0.5, "#34d399");
  lineGrad.addColorStop(1, "#06b6d4");

  ctx.strokeStyle = isBypassed ? "rgba(245, 158, 11, 0.7)" : lineGrad;
  ctx.lineWidth = 3;
  ctx.shadowColor = isBypassed ? "rgba(245, 158, 11, 0.5)" : "rgba(16, 185, 129, 0.8)";
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0; // reset shadow

  // 4. Interactive Frequency Anchor Handles on the Curve
  const anchors = [
    { freq: 250, label: "LOW", color: "#10b981", gain: bassGain },
    { freq: 1500, label: "MID", color: "#eab308", gain: midGain },
    { freq: 4000, label: "HIGH", color: "#06b6d4", gain: trebleGain }
  ];

  anchors.forEach(a => {
    const frac = Math.log10(a.freq / 20) / Math.log10(20000 / 20);
    const ax = frac * width;
    const ay = midY - (a.gain / maxDb) * (height * 0.42);

    // Glowing outer ring
    ctx.beginPath();
    ctx.arc(ax, ay, 7, 0, Math.PI * 2);
    ctx.fillStyle = a.color;
    ctx.shadowColor = a.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner white dot
    ctx.beginPath();
    ctx.arc(ax, ay, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Text Tag
    ctx.font = "bold 8px monospace";
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "center";
    ctx.fillText(a.label, ax, ay > midY ? ay + 14 : ay - 11);
  });
}

// Update 10-Segment LED Meter
function updateLedLadder(meterId, level) {
  const container = document.getElementById(meterId);
  if (!container) return;
  const leds = container.querySelectorAll(".meter-led");
  const count = leds.length;
  const activeCount = Math.round(level * count);

  leds.forEach((led, idx) => {
    // leds in markup are indexed 9 (top) down to 0 (bottom)
    const ledNum = count - 1 - idx;
    if (ledNum < activeCount) {
      led.classList.add("lit");
    } else {
      led.classList.remove("lit");
    }
  });
}

// Continuous Animation Loop for Visualizer while modal is active
function startEqVisualizerLoop() {
  if (eqAnimFrameId) cancelAnimationFrame(eqAnimFrameId);
  function render() {
    drawEqVisualizer();
    const modal = document.getElementById("eq-modal");
    if (modal && !modal.classList.contains("hidden")) {
      eqAnimFrameId = requestAnimationFrame(render);
    }
  }
  eqAnimFrameId = requestAnimationFrame(render);
}

function stopEqVisualizerLoop() {
  if (eqAnimFrameId) {
    cancelAnimationFrame(eqAnimFrameId);
    eqAnimFrameId = null;
  }
}

// Equalizer Slider Event Listeners
const sliderBass = document.getElementById("eq-slider-bass");
const sliderMid = document.getElementById("eq-slider-mid");
const sliderTreble = document.getElementById("eq-slider-treble");
const sliderSpeed = document.getElementById("eq-slider-speed");

if (sliderBass) {
  sliderBass.addEventListener("input", (e) => {
    state.eq.bass = parseFloat(e.target.value);
    state.eq.preset = "custom";
    document.querySelectorAll(".eq-preset-btn").forEach(btn => btn.classList.remove("active"));
    const valEl = document.getElementById("eq-val-bass");
    if (valEl) valEl.textContent = `${state.eq.bass > 0 ? "+" : ""}${state.eq.bass.toFixed(1)} dB`;
    initAudioEqualizer();
    applyEqFilterValues();
  });
}

if (sliderMid) {
  sliderMid.addEventListener("input", (e) => {
    state.eq.mid = parseFloat(e.target.value);
    state.eq.preset = "custom";
    document.querySelectorAll(".eq-preset-btn").forEach(btn => btn.classList.remove("active"));
    const valEl = document.getElementById("eq-val-mid");
    if (valEl) valEl.textContent = `${state.eq.mid > 0 ? "+" : ""}${state.eq.mid.toFixed(1)} dB`;
    initAudioEqualizer();
    applyEqFilterValues();
  });
}

if (sliderTreble) {
  sliderTreble.addEventListener("input", (e) => {
    state.eq.treble = parseFloat(e.target.value);
    state.eq.preset = "custom";
    document.querySelectorAll(".eq-preset-btn").forEach(btn => btn.classList.remove("active"));
    const valEl = document.getElementById("eq-val-treble");
    if (valEl) valEl.textContent = `${state.eq.treble > 0 ? "+" : ""}${state.eq.treble.toFixed(1)} dB`;
    initAudioEqualizer();
    applyEqFilterValues();
  });
}

// Continuous tape speed slider
if (sliderSpeed) {
  sliderSpeed.addEventListener("input", (e) => {
    setPlaybackSpeed(parseFloat(e.target.value));
  });
}

// Quick zero buttons for fader strips
document.querySelectorAll(".channel-zero-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const targetSlider = document.getElementById(targetId);
    if (!targetSlider) return;
    targetSlider.value = 0;
    if (targetId === "eq-slider-bass") state.eq.bass = 0;
    if (targetId === "eq-slider-mid") state.eq.mid = 0;
    if (targetId === "eq-slider-treble") state.eq.treble = 0;
    state.eq.preset = "custom";
    document.querySelectorAll(".eq-preset-btn").forEach(b => b.classList.remove("active"));

    const valBass = document.getElementById("eq-val-bass");
    const valMid = document.getElementById("eq-val-mid");
    const valTreble = document.getElementById("eq-val-treble");
    if (targetId === "eq-slider-bass" && valBass) valBass.textContent = "0.0 dB";
    if (targetId === "eq-slider-mid" && valMid) valMid.textContent = "0.0 dB";
    if (targetId === "eq-slider-treble" && valTreble) valTreble.textContent = "0.0 dB";

    initAudioEqualizer();
    applyEqFilterValues();
  });
});

// Bypass button
const btnBypassDsp = document.getElementById("btn-toggle-bypass");
if (btnBypassDsp) {
  btnBypassDsp.addEventListener("click", toggleEqBypass);
}

// Wire up preset buttons
document.querySelectorAll(".eq-preset-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    setEqPreset(btn.dataset.preset);
  });
});

// Wire up speed buttons
document.querySelectorAll(".speed-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    setPlaybackSpeed(parseFloat(btn.dataset.speed));
  });
});

// Reset button
const btnResetEq = document.getElementById("btn-reset-eq");
if (btnResetEq) {
  btnResetEq.addEventListener("click", resetEqualizer);
}

// Done button
const btnDoneEq = document.getElementById("btn-done-eq");
if (btnDoneEq) {
  btnDoneEq.addEventListener("click", closeEqModal);
}

// Modal management: Equalizer
const eqModal = document.getElementById("eq-modal");
const btnOpenEq = document.getElementById("btn-open-eq");
const btnCloseEq = document.getElementById("btn-close-eq");
const eqBackdrop = document.getElementById("eq-backdrop");

function openEqModal() {
  initAudioEqualizer();
  if (eqModal) eqModal.classList.remove("hidden");
  applyEqFilterValues();
  startEqVisualizerLoop();
}

function closeEqModal() {
  if (eqModal) eqModal.classList.add("hidden");
  stopEqVisualizerLoop();
}

function toggleEqModal() {
  if (eqModal && eqModal.classList.contains("hidden")) {
    openEqModal();
  } else {
    closeEqModal();
  }
}

if (btnOpenEq) btnOpenEq.addEventListener("click", openEqModal);
if (btnCloseEq) btnCloseEq.addEventListener("click", closeEqModal);
if (eqBackdrop) eqBackdrop.addEventListener("click", closeEqModal);

// Modal management: Keyboard Shortcuts
const shortcutsModal = document.getElementById("shortcuts-modal");
const btnOpenShortcuts = document.getElementById("btn-open-shortcuts");
const btnCloseShortcuts = document.getElementById("btn-close-shortcuts");
const shortcutsBackdrop = document.getElementById("shortcuts-backdrop");

function openShortcutsModal() {
  if (shortcutsModal) shortcutsModal.classList.remove("hidden");
}

function closeShortcutsModal() {
  if (shortcutsModal) shortcutsModal.classList.add("hidden");
}

function toggleShortcutsModal() {
  if (shortcutsModal && shortcutsModal.classList.contains("hidden")) {
    openShortcutsModal();
  } else {
    closeShortcutsModal();
  }
}

if (btnOpenShortcuts) btnOpenShortcuts.addEventListener("click", openShortcutsModal);
if (btnCloseShortcuts) btnCloseShortcuts.addEventListener("click", closeShortcutsModal);
if (shortcutsBackdrop) shortcutsBackdrop.addEventListener("click", closeShortcutsModal);

// Volume adjustment helper
function adjustVolume(delta) {
  const newVol = Math.max(0, Math.min(1, mainAudio.volume + delta));
  mainAudio.volume = newVol;
  if (volumeSlider) volumeSlider.value = newVol;
  updateVolumeIcons(newVol);
}

// Global Keyboard Shortcuts Event Handler
window.addEventListener("keydown", (e) => {
  // Ignore key events if the user is typing in an input, textarea, or select field
  const activeTag = document.activeElement ? document.activeElement.tagName : "";
  if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag) || (document.activeElement && document.activeElement.isContentEditable)) {
    return;
  }

  // Escape: Close all open modals
  if (e.key === "Escape") {
    closeShortcutsModal();
    closeEqModal();
    if (userDropdownPanel) userDropdownPanel.style.display = "none";
    return;
  }

  // ? or Shift + /: Toggle shortcuts modal
  if (e.key === "?" || (e.shiftKey && e.key === "/")) {
    e.preventDefault();
    toggleShortcutsModal();
    return;
  }

  // E / e: Toggle Equalizer modal
  if (e.key === "e" || e.key === "E") {
    e.preventDefault();
    toggleEqModal();
    return;
  }

  // Spacebar: Toggle Play / Pause
  if (e.code === "Space" || e.key === " ") {
    e.preventDefault();
    togglePlayPause();
    return;
  }

  // Left Arrow: Rewind 5 seconds
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    mainAudio.currentTime = Math.max(0, mainAudio.currentTime - 5);
    return;
  }

  // Right Arrow: Fast-forward 5 seconds
  if (e.key === "ArrowRight") {
    e.preventDefault();
    mainAudio.currentTime = Math.min(mainAudio.duration || 0, mainAudio.currentTime + 5);
    return;
  }

  // Up Arrow: Volume up 5%
  if (e.key === "ArrowUp") {
    e.preventDefault();
    adjustVolume(0.05);
    return;
  }

  // Down Arrow: Volume down 5%
  if (e.key === "ArrowDown") {
    e.preventDefault();
    adjustVolume(-0.05);
    return;
  }

  // M / m: Toggle mute
  if (e.key === "m" || e.key === "M") {
    e.preventDefault();
    if (btnVolumeIcon) btnVolumeIcon.click();
    return;
  }

  // L / l: Toggle loop / repeat
  if (e.key === "l" || e.key === "L") {
    e.preventDefault();
    if (btnRepeat) btnRepeat.click();
    return;
  }

  // S / s: Toggle shuffle
  if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    if (btnShuffle) btnShuffle.click();
    return;
  }
});

// ===================================================================
// SECTION 11: LIKED SONGS & LISTENING HISTORY (LocalStorage & Views)
// ===================================================================

// Load saved liked track IDs from browser storage
function loadSavedLikedSongs() {
  try {
    const raw = localStorage.getItem("nexora_liked_songs");
    state.likedSongIds = raw ? JSON.parse(raw) : [];
  } catch (err) {
    state.likedSongIds = [];
  }
}

// Persist liked song IDs into localStorage
function saveLikedSongs() {
  try {
    localStorage.setItem("nexora_liked_songs", JSON.stringify(state.likedSongIds));
  } catch (err) {
    console.warn("Could not save liked songs:", err);
  }
}

// Load saved play history from browser storage
function loadSavedHistory() {
  try {
    const raw = localStorage.getItem("nexora_play_history");
    state.history = raw ? JSON.parse(raw) : [];
  } catch (err) {
    state.history = [];
  }
}

// Persist play history into localStorage
function saveHistory() {
  try {
    localStorage.setItem("nexora_play_history", JSON.stringify(state.history));
  } catch (err) {
    console.warn("Could not save history:", err);
  }
}

// Toggle like / favorite for any song by ID
function toggleLikeTrack(trackId) {
  const track = state.tracks.find(t => t.id === trackId);
  if (!track) return;

  track.isLiked = !track.isLiked;

  if (track.isLiked) {
    if (!state.likedSongIds.includes(trackId)) {
      state.likedSongIds.push(trackId);
    }
  } else {
    state.likedSongIds = state.likedSongIds.filter(id => id !== trackId);
  }

  saveLikedSongs();
  updateCollectionBadges();

  // Update bottom player bar heart button if currently playing
  const current = state.tracks[state.currentTrackIndex];
  if (current && current.id === trackId) {
    const likeBtn = document.getElementById("btn-like");
    if (likeBtn) likeBtn.classList.toggle("liked", !!track.isLiked);
  }

  renderTracksUI();
  renderLikedView();
}

// Record played song into history timeline
function logTrackHistory(track) {
  if (!track) return;
  // Remove duplicate if already recorded recently
  state.history = state.history.filter(h => h.id !== track.id);
  // Prepend current track with timestamp
  state.history.unshift({
    id: track.id,
    title: track.title,
    artist: track.artist,
    language: track.language || "Music",
    genre: track.genre || "Music",
    cover: track.cover || "",
    fallbackCover: track.fallbackCover || "",
    durationFormatted: track.durationFormatted || formatTime(track.duration),
    playedAt: Date.now()
  });

  // Keep up to 40 tracks
  if (state.history.length > 40) {
    state.history = state.history.slice(0, 40);
  }

  saveHistory();
  updateCollectionBadges();
  renderHistoryView();
}

// Format relative time (e.g. "Just now", "2m ago", "1h ago")
function formatRelativeTime(timestamp) {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Update all count badges across sidebar, pills, and headers
function updateCollectionBadges() {
  const likedCount = state.likedSongIds.length;
  const historyCount = state.history.length;

  // Sidebar badges
  const sideLikedBadge = document.getElementById("sidebar-liked-badge");
  const sideHistBadge = document.getElementById("sidebar-history-badge");
  if (sideLikedBadge) sideLikedBadge.textContent = likedCount;
  if (sideHistBadge) sideHistBadge.textContent = historyCount;

  // Filter pills badges
  const pillLiked = document.getElementById("pill-liked-count");
  const pillHist = document.getElementById("pill-history-count");
  if (pillLiked) pillLiked.textContent = likedCount;
  if (pillHist) pillHist.textContent = historyCount;

  // View header labels
  const likedLabel = document.getElementById("liked-count-label");
  const histLabel = document.getElementById("history-count-label");
  if (likedLabel) likedLabel.textContent = `${likedCount} song${likedCount === 1 ? '' : 's'}`;
  if (histLabel) histLabel.textContent = `${historyCount} track${historyCount === 1 ? '' : 's'} played`;
}

// Render the dedicated Liked Songs view table
function renderLikedView() {
  const tbody = document.getElementById("liked-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const likedTracks = state.tracks.filter(t => state.likedSongIds.includes(t.id));

  if (likedTracks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-collection-box">
            <div class="empty-collection-icon">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="#ff4081">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h3 class="empty-collection-title">Songs you love will show up here</h3>
            <p class="empty-collection-desc">Save songs to your favorites by tapping the heart icon on any song card or in the player bar below.</p>
            <button class="btn btn-primary" onclick="switchView('view-home')">Discover Music</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  likedTracks.forEach((track, index) => {
    const actualIdx = state.tracks.findIndex(t => t.id === track.id);
    const tr = document.createElement("tr");
    tr.id = `liked-row-${actualIdx}`;
    if (actualIdx === state.currentTrackIndex && state.isPlaying) {
      tr.classList.add("active-playing");
    }

    const langTagClass = (track.category || 'hindi').toLowerCase();
    const langLabel = track.language || 'Music';
    const thumb = track.cover
      ? `<img src="${track.cover}" alt="${track.title}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" onerror="if(this.src!=='${track.fallbackCover || ''}')this.src='${track.fallbackCover || ''}'">`
      : `<span style="font-size:0.75rem; font-weight:800; color:#fff;">${track.icon || 'NX'}</span>`;

    tr.innerHTML = `
      <td class="track-num-cell">
        <button class="btn-row-like liked" title="Remove from Liked" onclick="toggleLikeTrack('${track.id}')">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </td>
      <td>
        <div class="track-main-cell">
          <div class="track-thumb" style="background:${track.color || '#242424'}; overflow:hidden;">${thumb}</div>
          <div>
            <div class="track-title-cell">${track.title}</div>
            <div style="font-size:0.75rem; color:#888;">
              ${track.artist}
              <span class="lang-tag tag-${langTagClass}">${langLabel}</span>
            </div>
          </div>
        </div>
      </td>
      <td>${track.genre || "Music"}</td>
      <td>${track.durationFormatted || formatTime(track.duration)}</td>
      <td>
        <div class="track-actions-cell">
          <button class="icon-action-btn" title="Cut Track in Studio" onclick="openTrackInCutter('${track.id}')">Cut</button>
          <button class="icon-action-btn" title="Play Track" onclick="playSpecificTrack(${actualIdx})">Play</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Render the dedicated Listening History view table
function renderHistoryView() {
  const tbody = document.getElementById("history-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (state.history.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-collection-box">
            <div class="empty-collection-icon">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="#00d2ff">
                <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
              </svg>
            </div>
            <h3 class="empty-collection-title">No listening history yet</h3>
            <p class="empty-collection-desc">Tracks you stream or listen to will appear right here in your personal listening timeline.</p>
            <button class="btn btn-primary" onclick="switchView('view-home')">Play Music Now</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  state.history.forEach((item, index) => {
    const actualIdx = state.tracks.findIndex(t => t.id === item.id);
    const isCurrentlyLiked = state.likedSongIds.includes(item.id);
    const tr = document.createElement("tr");

    if (actualIdx !== -1 && actualIdx === state.currentTrackIndex && state.isPlaying) {
      tr.classList.add("active-playing");
    }

    const thumb = item.cover
      ? `<img src="${item.cover}" alt="${item.title}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" onerror="if(this.src!=='${item.fallbackCover || ''}')this.src='${item.fallbackCover || ''}'">`
      : `<span style="font-size:0.75rem; font-weight:800; color:#fff;">NX</span>`;

    const relTime = formatRelativeTime(item.playedAt);

    tr.innerHTML = `
      <td class="track-num-cell">
        <button class="btn-row-like ${isCurrentlyLiked ? 'liked' : ''}" title="${isCurrentlyLiked ? 'Unlike' : 'Like'}" onclick="toggleLikeTrack('${item.id}')">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </td>
      <td>
        <div class="track-main-cell">
          <div class="track-thumb" style="background:#242424; overflow:hidden;">${thumb}</div>
          <div>
            <div class="track-title-cell">${item.title}</div>
            <div style="font-size:0.75rem; color:#888;">
              ${item.artist}
              <span class="lang-tag tag-hindi">${item.language}</span>
            </div>
          </div>
        </div>
      </td>
      <td><span style="color:#1DB954; font-weight:600; font-size:0.8rem;">${relTime}</span></td>
      <td>${item.durationFormatted || "0:30"}</td>
      <td>
        <div class="track-actions-cell">
          <button class="icon-action-btn" title="Cut Track in Studio" onclick="openTrackInCutter('${item.id}')">Cut</button>
          <button class="icon-action-btn" title="Play Track" onclick="${actualIdx !== -1 ? `playSpecificTrack(${actualIdx})` : `alert('Track not in current library')`}">Play</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Play all liked songs starting with the first one
const btnPlayAllLiked = document.getElementById("btn-play-all-liked");
if (btnPlayAllLiked) {
  btnPlayAllLiked.addEventListener("click", () => {
    const firstLikedId = state.likedSongIds[0];
    if (firstLikedId) {
      const idx = state.tracks.findIndex(t => t.id === firstLikedId);
      if (idx !== -1) {
        loadTrack(idx);
        playTrack();
      }
    } else {
      alert("No liked songs yet! Click the heart icon on any song to add it to your favorites.");
    }
  });
}

// Replay the latest track from history
const btnReplayHistory = document.getElementById("btn-replay-history");
if (btnReplayHistory) {
  btnReplayHistory.addEventListener("click", () => {
    if (state.history.length > 0) {
      const last = state.history[0];
      const idx = state.tracks.findIndex(t => t.id === last.id);
      if (idx !== -1) {
        loadTrack(idx);
        playTrack();
      }
    } else {
      alert("No listening history yet! Play some songs first.");
    }
  });
}

// Clear history
const btnClearHistory = document.getElementById("btn-clear-history");
if (btnClearHistory) {
  btnClearHistory.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your listening history?")) {
      state.history = [];
      saveHistory();
      updateCollectionBadges();
      renderHistoryView();
    }
  });
}

// Filter pill click handlers for Liked and History
const pillLikedBtn = document.getElementById("pill-liked-btn");
if (pillLikedBtn) {
  pillLikedBtn.addEventListener("click", () => {
    switchView("view-liked");
  });
}

const pillHistoryBtn = document.getElementById("pill-history-btn");
if (pillHistoryBtn) {
  pillHistoryBtn.addEventListener("click", () => {
    switchView("view-history");
  });
}

// ===================================================================
// SECTION 12: MEDIA STORAGE VAULT & FUTURE SYSTEMS
// ===================================================================

// Load saved media vault items from browser storage
function loadSavedMediaStorage() {
  try {
    const raw = localStorage.getItem("nexora_media_storage");
    state.mediaStorage = raw ? JSON.parse(raw) : [];
  } catch (err) {
    state.mediaStorage = [];
  }
}

// Persist media vault items into browser storage
function saveMediaStorage() {
  try {
    localStorage.setItem("nexora_media_storage", JSON.stringify(state.mediaStorage));
  } catch (err) {
    console.warn("Could not save media storage:", err);
  }
}

// Save a new media item (audio cut or video recording) to storage
function addMediaToStorage(item) {
  const newItem = {
    id: "media-" + Date.now(),
    type: item.type || "audio",
    name: item.name || "Untitled Media",
    duration: item.duration || "0:15",
    url: item.url || "",
    category: item.category || (item.type === "video" ? "Video Studio" : "Audio Cutter"),
    savedAt: Date.now()
  };

  // Prepend to storage
  state.mediaStorage.unshift(newItem);
  saveMediaStorage();
  updateStorageBadges();
  renderStorageView();
  return newItem;
}

// Delete a media item from storage by ID
function deleteStorageItem(mediaId) {
  const item = state.mediaStorage.find(m => m.id === mediaId);
  const itemName = item ? item.name : "this item";

  if (confirm(`Are you sure you want to delete "${itemName}" from your storage vault?`)) {
    state.mediaStorage = state.mediaStorage.filter(m => m.id !== mediaId);
    saveMediaStorage();
    updateStorageBadges();
    renderStorageView();
  }
}

// Play a stored media item
function playStorageMedia(mediaId) {
  const item = state.mediaStorage.find(m => m.id === mediaId);
  if (!item) return;

  if (item.type === "video") {
    switchView("view-video");
    if (studioVideo) {
      if (item.url) studioVideo.src = item.url;
      studioVideo.play();
      showVideoStatus(`Playing stored video: "${item.name}"`, "info");
    }
  } else {
    // Audio cut
    if (item.url) {
      mainAudio.src = item.url;
      playerTitle.textContent = item.name;
      playerArtist.textContent = "Saved Studio Audio Cut";
      playTrack();
    } else {
      showCutterStatus(`Playing stored audio: "${item.name}"`, "info");
    }
  }
}

// Download a stored media item
function downloadStorageMedia(mediaId) {
  const item = state.mediaStorage.find(m => m.id === mediaId);
  if (!item || !item.url) return;

  const a = document.createElement("a");
  a.href = item.url;
  a.download = item.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Update badges for media storage count
function updateStorageBadges() {
  const total = state.mediaStorage.length;
  const audioCount = state.mediaStorage.filter(m => m.type === "audio").length;
  const videoCount = state.mediaStorage.filter(m => m.type === "video").length;

  const sideBadge = document.getElementById("sidebar-storage-badge");
  const pillBadge = document.getElementById("pill-storage-count");
  const labelBadge = document.getElementById("storage-count-label");
  const countAll = document.getElementById("storage-count-all");
  const countAudio = document.getElementById("storage-count-audio");
  const countVideo = document.getElementById("storage-count-video");

  if (sideBadge) sideBadge.textContent = total;
  if (pillBadge) pillBadge.textContent = total;
  if (labelBadge) labelBadge.textContent = `${total} item${total === 1 ? '' : 's'}`;
  if (countAll) countAll.textContent = total;
  if (countAudio) countAudio.textContent = audioCount;
  if (countVideo) countVideo.textContent = videoCount;
}

// Render the Media Storage Vault Table
function renderStorageView() {
  const tbody = document.getElementById("storage-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filter = state.activeStorageFilter || "all";
  const items = state.mediaStorage.filter(item => {
    if (filter === "audio") return item.type === "audio";
    if (filter === "video") return item.type === "video";
    return true;
  });

  if (items.length === 0) {
    const filterLabel = filter === "audio" ? "audio cuts" : filter === "video" ? "video recordings" : "media files";
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-collection-box">
            <div class="empty-collection-icon" style="background: rgba(0, 229, 255, 0.1);">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="#00e5ff">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
            </div>
            <h3 class="empty-collection-title">No saved ${filterLabel} in your vault</h3>
            <p class="empty-collection-desc">Trim songs in the Audio Cutter or record clips in the Video Studio, then click "Save to Vault" to manage and store them here.</p>
            <div style="display:flex; gap:0.6rem; justify-content:center;">
              <button class="btn btn-secondary" onclick="switchView('view-cutter')">Open Audio Cutter</button>
              <button class="btn btn-secondary" onclick="switchView('view-video')">Open Video Studio</button>
            </div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  items.forEach((item, index) => {
    const tr = document.createElement("tr");
    const isVideo = item.type === "video";
    const typeBadge = isVideo
      ? `<span class="lang-tag" style="background:rgba(0, 210, 255, 0.2); color:#00d2ff; border:1px solid rgba(0, 210, 255, 0.35);">VIDEO</span>`
      : `<span class="lang-tag" style="background:rgba(29, 185, 84, 0.2); color:#1DB954; border:1px solid rgba(29, 185, 84, 0.35);">AUDIO WAV</span>`;

    const iconSvg = isVideo
      ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="#00d2ff"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`
      : `<svg viewBox="0 0 24 24" width="20" height="20" fill="#1DB954"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

    const relTime = formatRelativeTime(item.savedAt);

    tr.innerHTML = `
      <td class="track-num-cell">${index + 1}</td>
      <td>
        <div class="track-main-cell">
          <div class="track-thumb" style="background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center;">${iconSvg}</div>
          <div>
            <div class="track-title-cell">${item.name}</div>
            <div style="font-size:0.75rem; color:#888;">
              ${item.category || "Studio Export"}
              ${typeBadge}
            </div>
          </div>
        </div>
      </td>
      <td>${item.duration || "0:15"}</td>
      <td><span style="color:#aaa; font-size:0.8rem;">${relTime}</span></td>
      <td>
        <div class="track-actions-cell">
          <button class="icon-action-btn" title="Play Media" onclick="playStorageMedia('${item.id}')">Play</button>
          ${item.url ? `<button class="icon-action-btn" title="Download Media" onclick="downloadStorageMedia('${item.id}')">Get</button>` : ''}
          <button class="btn-delete-action" title="Delete from Storage" onclick="deleteStorageItem('${item.id}')">Delete</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Storage filter tab button listeners
document.querySelectorAll(".storage-tab-btn").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".storage-tab-btn").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    state.activeStorageFilter = tab.dataset.filter;
    renderStorageView();
  });
});

// Clear all storage button
const btnClearStorage = document.getElementById("btn-clear-storage");
if (btnClearStorage) {
  btnClearStorage.addEventListener("click", () => {
    if (state.mediaStorage.length === 0) {
      alert("Storage is already empty!");
      return;
    }
    if (confirm("Are you sure you want to delete all saved audio and video files from your storage vault?")) {
      state.mediaStorage = [];
      saveMediaStorage();
      updateStorageBadges();
      renderStorageView();
    }
  });
}

// "Save to Vault" button in Audio Cutter
const btnSaveCutToStorage = document.getElementById("btn-save-cut-to-storage");
if (btnSaveCutToStorage) {
  btnSaveCutToStorage.addEventListener("click", async () => {
    if (!state.cutter.audioBuffer) {
      showCutterStatus("Please select or upload an audio file first.", "error");
      return;
    }

    showCutterStatus("Saving cut clip to storage vault...", "info");
    const slicedBlob = await createSlicedAudioBlob();
    const cutDuration = (state.cutter.endTime - state.cutter.startTime).toFixed(1) + "s";
    const trackTitle = (state.cutter.currentTrack ? state.cutter.currentTrack.title : "Audio") + " - Cut";
    const blobUrl = URL.createObjectURL(slicedBlob);

    addMediaToStorage({
      type: "audio",
      name: `${trackTitle}.wav`,
      duration: cutDuration,
      url: blobUrl,
      category: "Audio Cutter"
    });

    showCutterStatus(`"${trackTitle}.wav" saved to Media Storage!`, "success");
    alert(`Success: "${trackTitle}.wav" has been saved into your Media Storage Vault! You can view, play, or delete it anytime from the sidebar.`);
  });
}

// "Save Video to Storage Vault" button in Video Studio
const btnSaveVideoToStorage = document.getElementById("btn-save-video-to-storage");
if (btnSaveVideoToStorage) {
  btnSaveVideoToStorage.addEventListener("click", () => {
    if (!studioVideo.src) {
      showVideoStatus("Please load a video or generate a demo clip first.", "error");
      return;
    }

    const videoDur = (state.video.endTime - state.video.startTime).toFixed(1) + "s";
    const videoName = "Studio-Video-Clip-" + new Date().toLocaleTimeString().replace(/:/g, "-") + ".webm";

    addMediaToStorage({
      type: "video",
      name: videoName,
      duration: videoDur,
      url: studioVideo.src,
      category: "Video Studio"
    });

    showVideoStatus(`Saved "${videoName}" to Media Storage!`, "success");
    alert(`Success: Video clip saved into your Media Storage Vault! View or delete it anytime under "Media Storage".`);
  });
}

// Pill click for Storage Vault
const pillStorageBtn = document.getElementById("pill-storage-btn");
if (pillStorageBtn) {
  pillStorageBtn.addEventListener("click", () => {
    switchView("view-storage");
  });
}
