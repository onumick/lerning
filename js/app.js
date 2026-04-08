document.addEventListener('DOMContentLoaded', () => {
    // ---- Elements ----
    const viewDashboard = document.getElementById('view-dashboard');
    const viewPhases = document.getElementById('view-phases');
    const viewSublevels = document.getElementById('view-sublevels');
    const viewLearning = document.getElementById('view-learning');
    
    const levelsContainer = document.getElementById('levels-container');
    const phasesContainer = document.getElementById('phases-container');
    const sublevelsContainer = document.getElementById('sublevels-container');
    
    const appTitle = document.getElementById('app-title');
    const btnBack = document.getElementById('btn-back');
    const phaseTitle = document.getElementById('phase-title');
    const sublevelTitle = document.getElementById('sublevel-title');
    
    // Flashcard Elements
    const cardScene = document.getElementById('card-scene');
    const flashcard = document.getElementById('flashcard');
    const cardTextFront = document.getElementById('card-text-front');
    const cardTextVerify = document.getElementById('card-text-verify');
    
    const btnFlip = document.getElementById('btn-flip');
    const btnPlayAudio = document.getElementById('btn-play-audio');
    
    // Recording UI Elements
    const toggleCustomVoice = document.getElementById('toggle-custom-voice');
    const recordingUi = document.getElementById('recording-ui');
    const btnRecord = document.getElementById('btn-record');
    const recordingStatus = document.getElementById('recording-status');
    
    // Verification / States Elements
    const verifyActionContainer = document.getElementById('verify-action-container');
    const btnReveal = document.getElementById('btn-reveal');
    const verificationBackdrop = document.getElementById('verification-backdrop');
    const verificationPanel = document.getElementById('verification-panel');
    const completionPanel = document.getElementById('completion-panel');
    const btnNotYet = document.getElementById('btn-not-yet');
    const btnGotIt = document.getElementById('btn-got-it');
    const btnFinishTopic = document.getElementById('btn-finish-topic');
    
    // Progress
    const progressBarFill = document.getElementById('progress-bar-fill');
    const cardCounter = document.getElementById('card-counter');
    
    // ---- State Variables ----
    let currentView = 'dashboard'; // 'dashboard', 'phases', 'sublevels', 'learning'
    let currentLevelId = null;
    let currentPhaseId = null;
    let currentDeck = [];
    let currentCardIndex = 0;
    const LONG_TEXT_CHAR_THRESHOLD = 140;
    const LONG_TEXT_LINEBREAK_THRESHOLD = 2;
    
    // Tracking Variables
    let currentSubLevelId = null;
    let completedDecks = JSON.parse(localStorage.getItem('completedDecks')) || [];
    
    // Recording State Variables
    let mediaRecorder = null;
    let audioChunks = [];
    let currentCustomAudioBlob = null;
    let isRecording = false;

    let synth = window.speechSynthesis;
    let synthVoice = null;

    // ---- Initialization ----
    initApp();
    
    async function initApp() {
        await window.initAppData();
        populateDashboard();
        setupEventListeners();
        setupVoices();
    }
    
    // Set up voice (ensure we use a decent English one if available)
    function setupVoices() {
        if (!synth) return;
        
        let voices = synth.getVoices();
        // Fallback wait if voices aren't loaded immediately
        if (voices.length === 0) {
            synth.onvoiceschanged = () => {
                voices = synth.getVoices();
                selectVoice(voices);
            };
        } else {
            selectVoice(voices);
        }
    }
    
    function selectVoice(voices) {
        // Prefer a clean US English voice like Google US English or en-US
        const preferredVoice = voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
        if (preferredVoice) {
            synthVoice = preferredVoice;
        }
    }

    // ---- View Management ----
    function switchView(viewName) {
        // Hide all
        viewDashboard.classList.add('hidden');
        viewDashboard.classList.remove('active');
        viewPhases.classList.add('hidden');
        viewPhases.classList.remove('active');
        viewSublevels.classList.add('hidden');
        viewSublevels.classList.remove('active');
        viewLearning.classList.add('hidden');
        viewLearning.classList.remove('active');
        
        // Show specific
        if (viewName === 'dashboard') {
            viewDashboard.classList.remove('hidden');
            viewDashboard.classList.add('active');
            btnBack.classList.add('hidden');
            appTitle.textContent = "Listen & Write";
        } else if (viewName === 'phases') {
            viewPhases.classList.remove('hidden');
            viewPhases.classList.add('active');
            btnBack.classList.remove('hidden');
            const levelObj = appData.levels.find(l => l.id === currentLevelId);
            appTitle.textContent = levelObj ? levelObj.title : "Phases";
        } else if (viewName === 'sublevels') {
            viewSublevels.classList.remove('hidden');
            viewSublevels.classList.add('active');
            btnBack.classList.remove('hidden');
            const levelObj = appData.levels.find(l => l.id === currentLevelId);
            const phaseObj = levelObj ? levelObj.phases.find(p => p.id === currentPhaseId) : null;
            appTitle.textContent = phaseObj ? phaseObj.title : "Parts";
        } else if (viewName === 'learning') {
            viewLearning.classList.remove('hidden');
            viewLearning.classList.add('active');
            btnBack.classList.remove('hidden');
        }
        
        currentView = viewName;
    }
    
    function goBack() {
        if (currentView === 'phases') {
            switchView('dashboard');
        } else if (currentView === 'sublevels') {
            switchView('phases');
        } else if (currentView === 'learning') {
            // Cancel audio and leave deck session
            if(synth) synth.cancel();
            switchView('sublevels');
        }
    }

    // ---- Step 1: Dashboard Population ----
    function populateDashboard() {
        levelsContainer.innerHTML = '';
        
        appData.levels.forEach(level => {
            const el = document.createElement('div');
            el.className = 'dashboard-card';
            el.tabIndex = 0; // Accessibility
            el.innerHTML = `
                <h3>${level.title}</h3>
                <p>${level.description}</p>
            `;
            
            // Handle Clicks
            el.addEventListener('click', () => {
                currentLevelId = level.id;
                populatePhases(level);
                switchView('phases');
            });
            // Handle Keyboard enter
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') el.click();
            });
            
            levelsContainer.appendChild(el);
        });
    }

    // ---- Step 2: Phase Population ----
    function populatePhases(levelData) {
        phaseTitle.textContent = "Select a Phase";
        phasesContainer.innerHTML = '';
        
        levelData.phases.forEach(phase => {
            const el = document.createElement('div');
            el.className = 'dashboard-card';
            el.tabIndex = 0;
            
            // Just a check to see if all parts in this phase are complete
            const allComplete = phase.subLevels.length > 0 && phase.subLevels.every(sub => completedDecks.includes(sub.id));
            const checkmark = allComplete ? ' <span class="status-icon">✅</span>' : '';
            
            el.innerHTML = `
                <h3>${phase.title}${checkmark}</h3>
                <p>${phase.subLevels.length} parts</p>
            `;
            
            el.addEventListener('click', () => {
                currentPhaseId = phase.id;
                populateSubLevels(phase);
                switchView('sublevels');
            });
            el.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') el.click();
            });
            
            phasesContainer.appendChild(el);
        });
    }

    // ---- Step 3: Sub-Level Population ----
    function populateSubLevels(phaseData) {
        sublevelTitle.textContent = "Select a Part";
        sublevelsContainer.innerHTML = '';
        
        phaseData.subLevels.forEach(sub => {
            const el = document.createElement('div');
            el.className = 'dashboard-card';
            if (completedDecks.includes(sub.id)) el.classList.add('completed');
            el.tabIndex = 0;
            
            const checkmark = completedDecks.includes(sub.id) ? ' <span class="status-icon">✅</span>' : '';
            
            el.innerHTML = `
                <h3>${sub.title}${checkmark}</h3>
                <p>${sub.cards.length} items to practice</p>
            `;
            
            el.addEventListener('click', () => {
                currentSubLevelId = sub.id;
                startLearningLoop(sub);
            });
            el.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') el.click();
            });
            
            sublevelsContainer.appendChild(el);
        });
    }

    // ---- Step 4: Learning Loop ----
    function startLearningLoop(subLevelData) {
        currentSubLevelId = subLevelData.id;
        currentDeck = [...subLevelData.cards]; // clone array
        currentCardIndex = 0;
        appTitle.textContent = subLevelData.title; // update nav title
        
        // Hide panel completion in case it was showing previously
        completionPanel.classList.add('hidden');
        cardScene.classList.remove('hidden');
        
        switchView('learning');
        loadCard();
    }
    
    function loadCard() {
        if (currentCardIndex >= currentDeck.length) {
            handleCompletion();
            return;
        }
        
        const currentItem = currentDeck[currentCardIndex];
        
        // Setup text
        cardTextFront.textContent = currentItem.text;
        cardTextVerify.textContent = currentItem.text;
        updateLongTextState(currentItem.text);
        cardTextFront.scrollTop = 0;
        cardTextVerify.scrollTop = 0;
        
        // Update UI Progress
        cardCounter.textContent = `${currentCardIndex + 1} / ${currentDeck.length}`;
        const pct = ((currentCardIndex) / currentDeck.length) * 100;
        progressBarFill.style.width = pct + "%";
        
        // Reset States
        resetCardState();
    }

    function updateLongTextState(text) {
        const lineBreakCount = (text.match(/\n/g) || []).length;
        const isLongText = text.length > LONG_TEXT_CHAR_THRESHOLD || lineBreakCount >= LONG_TEXT_LINEBREAK_THRESHOLD;
        cardTextFront.classList.toggle('target-text--long', isLongText);
        cardTextVerify.classList.toggle('target-text--long', isLongText);
    }
    
    function resetCardState() {
        flashcard.classList.remove('is-flipped');
        verificationPanel.classList.add('hidden');
        verificationBackdrop.classList.add('hidden');
        verifyActionContainer.classList.remove('hidden');
        
        if(synth) synth.cancel(); // Stop playing anything active
        
        // Reset Recording State
        toggleCustomVoice.checked = false;
        recordingUi.classList.add('hidden');
        currentCustomAudioBlob = null;
        btnRecord.classList.remove('has-recording', 'is-recording');
        recordingStatus.textContent = 'Tap to record';
    }
    
    function handleCompletion() {
        cardScene.classList.add('hidden');
        verificationPanel.classList.add('hidden');
        verificationBackdrop.classList.add('hidden');
        completionPanel.classList.remove('hidden');
        progressBarFill.style.width = "100%";
        if (synth) synth.cancel();
        
        if (currentSubLevelId && !completedDecks.includes(currentSubLevelId)) {
            completedDecks.push(currentSubLevelId);
            localStorage.setItem('completedDecks', JSON.stringify(completedDecks));
        }
    }

    // ---- Interactions ----
    function flipToBack() {
        flashcard.classList.add('is-flipped');
        
        // Optional: Auto-play audio when flipped? Let's wait for user to hit play to dictate pace.
    }
    
    function playAudio() {
        const currentItem = currentDeck[currentCardIndex];
        
        // Stop any currently playing audio/speech
        if(synth) synth.cancel();
        
        // Check if user recorded custom audio for this card
        if (toggleCustomVoice.checked && currentCustomAudioBlob) {
            const audioUrl = URL.createObjectURL(currentCustomAudioBlob);
            const customAudio = new Audio(audioUrl);
            customAudio.play().catch(e => {
                console.error("Custom audio block:", e);
                fallbackSpeech(currentItem.text);
            });
            return;
        }
        
        if (currentItem.audioUrl && currentItem.audioUrl.trim() !== '') {
            // Future HTMLAudioElement usage when files exist
            const audio = new Audio(currentItem.audioUrl);
            audio.play().catch(e => {
                console.error("Audio block or missing data:", e);
                fallbackSpeech(currentItem.text);
            });
        } else {
            // Use browser speech synthesis fallback
            fallbackSpeech(currentItem.text);
        }
    }
    
    function fallbackSpeech(text) {
        if (!synth) {
            alert("Speech synthesis not supported in this browser.");
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (synthVoice) utterance.voice = synthVoice;
        utterance.rate = 0.85; // slightly slower for dictation clarity for adults
        synth.speak(utterance);
    }
    
    function revealVerification() {
        // The user says "I wrote it down, let me see"
        // Hide the Check Answer button on the back of the card so it doesn't get clicked twice
        verifyActionContainer.classList.add('hidden');
        // Show panel and backdrop beneath the card
        verificationPanel.classList.remove('hidden');
        verificationBackdrop.classList.remove('hidden');
    }

    // ---- Outcome Logic ----
    function handleGotIt() {
        // Advance queue
        currentCardIndex++;
        loadCard();
    }
    
    function handleNotYet() {
        // They didn't get it right. Reset back to study phase.
        resetCardState();
    }

    // ---- Recording Logic ----
    async function toggleRecording() {
        if (isRecording) {
            // Stop recording
            mediaRecorder.stop();
            btnRecord.classList.remove('is-recording');
            btnRecord.classList.add('has-recording');
            recordingStatus.textContent = 'Recorded! Tap to re-record.';
            isRecording = false;
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                currentCustomAudioBlob = null;
                
                mediaRecorder.ondataavailable = e => {
                    if (e.data.size > 0) {
                        audioChunks.push(e.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    currentCustomAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    // Stop streaming to release mic indicator
                    stream.getTracks().forEach(track => track.stop());
                };
                
                mediaRecorder.start();
                isRecording = true;
                btnRecord.classList.add('is-recording');
                btnRecord.classList.remove('has-recording');
                recordingStatus.textContent = 'Recording... Tap to stop.';
                
            } catch (err) {
                console.error("Microphone access denied or error:", err);
                alert("Could not access your microphone. Please check permissions.");
            }
        }
    }

    // ---- Event Listeners Initialization ----
    function setupEventListeners() {
        btnBack.addEventListener('click', goBack);
        
        // Recording Options Toggle
        toggleCustomVoice.addEventListener('change', (e) => {
            if (e.target.checked) {
                recordingUi.classList.remove('hidden');
            } else {
                recordingUi.classList.add('hidden');
            }
        });
        
        // Recording Button Actions
        btnRecord.addEventListener('click', toggleRecording);
        
        // Card Flip
        btnFlip.addEventListener('click', flipToBack);
        
        // Audio
        btnPlayAudio.addEventListener('click', playAudio);
        
        // Reveal for user to check text
        btnReveal.addEventListener('click', revealVerification);
        
        // End of card outcomes
        btnGotIt.addEventListener('click', handleGotIt);
        btnNotYet.addEventListener('click', handleNotYet);
        
        // Finish course
        btnFinishTopic.addEventListener('click', () => {
            switchView('sublevels');
        });
    }
});