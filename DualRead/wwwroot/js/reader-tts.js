document.addEventListener('DOMContentLoaded', function () {
    var toggleBtn = document.getElementById('tts-toggle');
    var player = document.getElementById('reader-tts-player');
    var voiceSection = document.getElementById('tts-voice-section');        
    if (!toggleBtn || !player) return;

    var supported = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';
    var reader = window.DualReadReader;
    if (!supported || !reader) {
        toggleBtn.hidden = true;
        if (voiceSection) voiceSection.hidden = true;
        return;
    }

    var synth = window.speechSynthesis;
    var playBtn = document.getElementById('tts-play');
    var prevBtn = document.getElementById('tts-prev');
    var nextBtn = document.getElementById('tts-next');
    var stopBtn = document.getElementById('tts-stop');
    var speedBtn = document.getElementById('tts-speed-btn');
    var speedMenu = document.getElementById('tts-speed-menu');
    var voiceSelect = document.getElementById('setting-tts-voice');

    var RATE_KEY = 'dualread.tts.rate';
    var VOICE_KEY = 'dualread.tts.voice';
    var MAX_CHUNK = 220;

    function t(key) {
        return window.DualReadI18n ? window.DualReadI18n.t(key) : key;
    }

    function loadPreference(key, fallback) {
        try {
            var value = window.localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function savePreference(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (e) {
        }
    }

    function escapeHtml(value) {
        var div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML.replace(/"/g, '&quot;');
    }

    var rate = parseFloat(loadPreference(RATE_KEY, '1')) || 1;
    var voiceUri = loadPreference(VOICE_KEY, 'auto');

    var active = false;
    var playing = false;
    var token = 0;
    var paragraphs = [];
    var paragraphPos = 0;
    var chunks = [];
    var chunkIndex = 0;
    var awaitingChapterChange = false;

    function updatePlayIcon() {
        playBtn.innerHTML = playing ? '&#10074;&#10074;' : '&#9654;';
    }

    function updateSpeedUi() {
        speedBtn.textContent = rate + 'x';
        speedMenu.querySelectorAll('.tts-speed-option').forEach(function (option) {
            option.classList.toggle('active', parseFloat(option.getAttribute('data-speed')) === rate);
        });
    }

    function pickVoice() {
        if (voiceUri === 'auto') return null;

        var voices = synth.getVoices();
        for (var i = 0; i < voices.length; i++) {
            if (voices[i].voiceURI === voiceUri) return voices[i];
        }
        return null;
    }

    function populateVoices() {
        if (!voiceSelect) return;

        var voices = synth.getVoices();
        var options = ['<option value="auto" data-i18n="tts.voiceAuto">' + escapeHtml(t('tts.voiceAuto')) + '</option>'];
        voices.forEach(function (voice) {
            options.push('<option value="' + escapeHtml(voice.voiceURI) + '">' + escapeHtml(voice.name + ' (' + voice.lang + ')') + '</option>');
        });

        voiceSelect.innerHTML = options.join('');
        voiceSelect.value = voiceUri;
        if (voiceSelect.value !== voiceUri) {
            voiceSelect.value = 'auto';
        }
    }

    function splitIntoChunks(text) {
        var sentences = text.match(/[^.!?\u2026\u3002\uff01\uff1f]+[.!?\u2026\u3002\uff01\uff1f]*\s*/g) || [text];
        var result = [];
        var buffer = '';

        sentences.forEach(function (sentence) {
            if (buffer && (buffer + sentence).length > MAX_CHUNK) {
                result.push(buffer.trim());
                buffer = '';
            }
            buffer += sentence;

            while (buffer.length > MAX_CHUNK + 80) {
                var cut = buffer.lastIndexOf(' ', MAX_CHUNK);
                if (cut < 80) cut = MAX_CHUNK;
                result.push(buffer.slice(0, cut).trim());
                buffer = buffer.slice(cut);
            }
        });

        if (buffer.trim()) result.push(buffer.trim());
        return result.length > 0 ? result : [text];
    }

    function cancelSpeech() {
        token++;
        synth.cancel();
    }

    function speakCurrentChunk() {
        if (!active || !playing) return;

        if (chunkIndex >= chunks.length) {
            playParagraph(paragraphPos + 1);
            return;
        }

        var myToken = ++token;
        var utterance = new window.SpeechSynthesisUtterance(chunks[chunkIndex]);
        utterance.rate = rate;

        var voice = pickVoice();
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        }

        utterance.onend = function () {
            if (myToken !== token) return;
            chunkIndex++;
            speakCurrentChunk();
        };

        utterance.onerror = function (event) {
            if (myToken !== token) return;
            if (event && (event.error === 'interrupted' || event.error === 'canceled')) return;
            chunkIndex++;
            speakCurrentChunk();
        };

        synth.speak(utterance);
    }

    function playParagraph(position) {
        paragraphs = reader.getParagraphs();

        if (position >= paragraphs.length) {
            handleChapterEnd();
            return;
        }

        paragraphPos = Math.max(position, 0);
        chunks = splitIntoChunks(paragraphs[paragraphPos].text);
        chunkIndex = 0;

        reader.highlightParagraph(paragraphs[paragraphPos].index);
        speakCurrentChunk();
    }

    function handleChapterEnd() {
        if (!reader.hasNextChapter()) {
            stop();
            return;
        }

        var before = reader.getCurrentChapterId();
        awaitingChapterChange = true;

        reader.goToNextChapter().then(function () {
            awaitingChapterChange = false;

            if (reader.getCurrentChapterId() === before) {
                stop();
                return;
            }

            if (active && playing) {
                playParagraph(0);
            }
        });
    }

    function startSoon(action) {
        cancelSpeech();
        var snapshot = token;
        setTimeout(function () {
            if (snapshot !== token || !active) return;
            action();
        }, 60);
    }

    function jumpTo(position) {
        playing = true;
        updatePlayIcon();
        startSoon(function () { playParagraph(position); });
    }

    function restartChunk() {
        startSoon(function () {
            if (playing) speakCurrentChunk();
        });
    }

    function start() {
        active = true;
        playing = true;

        player.hidden = false;
        window.requestAnimationFrame(function () { player.classList.add('show'); });
        toggleBtn.setAttribute('aria-pressed', 'true');
        updatePlayIcon();
        updateSpeedUi();

        paragraphs = reader.getParagraphs();
        var firstVisible = reader.getFirstVisibleParagraphIndex();
        var position = 0;
        for (var i = 0; i < paragraphs.length; i++) {
            if (paragraphs[i].index >= firstVisible) {
                position = i;
                break;
            }
        }

        playParagraph(position);
    }

    function stop() {
        active = false;
        playing = false;
        cancelSpeech();
        reader.clearHighlight();

        speedMenu.hidden = true;
        player.classList.remove('show');
        toggleBtn.setAttribute('aria-pressed', 'false');
        updatePlayIcon();

        setTimeout(function () {
            if (!active) player.hidden = true;
        }, 300);
    }

    function togglePlayPause() {
        if (!active) return;

        if (playing) {
            playing = false;
            cancelSpeech();
            updatePlayIcon();
        } else {
            playing = true;
            updatePlayIcon();
            restartChunk();
        }
    }

    toggleBtn.addEventListener('click', function () {
        if (active) {
            stop();
        } else {
            start();
        }
        toggleBtn.blur();
    });

    playBtn.addEventListener('click', function () { togglePlayPause(); playBtn.blur(); });
    prevBtn.addEventListener('click', function () { jumpTo(paragraphPos - 1); prevBtn.blur(); });
    nextBtn.addEventListener('click', function () { jumpTo(paragraphPos + 1); nextBtn.blur(); });
    stopBtn.addEventListener('click', function () { stop(); });

    speedBtn.addEventListener('click', function () {
        speedMenu.hidden = !speedMenu.hidden;
        speedBtn.blur();
    });

    speedMenu.querySelectorAll('.tts-speed-option').forEach(function (option) {
        option.addEventListener('click', function () {
            rate = parseFloat(option.getAttribute('data-speed')) || 1;
            savePreference(RATE_KEY, String(rate));
            updateSpeedUi();
            speedMenu.hidden = true;
            if (active && playing) restartChunk();
        });
    });

    document.addEventListener('click', function (e) {
        if (speedMenu.hidden) return;
        if (speedMenu.contains(e.target) || speedBtn.contains(e.target)) return;
        speedMenu.hidden = true;
    });

    if (voiceSelect) {
        voiceSelect.addEventListener('change', function () {
            voiceUri = voiceSelect.value;
            savePreference(VOICE_KEY, voiceUri);
            voiceSelect.blur();
            if (active && playing) restartChunk();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button') return;

        if (e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            toggleBtn.click();
        } else if (e.key === 'Escape' && !speedMenu.hidden) {
            speedMenu.hidden = true;
        }
    });

    document.addEventListener('dualread:chapterchange', function () {
        if (awaitingChapterChange) return;
        if (active) stop();
    });

    document.addEventListener('dualread:modechange', function () {
        if (active && paragraphs[paragraphPos]) {
            reader.highlightParagraph(paragraphs[paragraphPos].index);
        }
    });

    document.addEventListener('dualread:languagechange', function () {
        populateVoices();
    });

    window.addEventListener('pagehide', function () {
        synth.cancel();
    });

    if (typeof synth.addEventListener === 'function') {
        synth.addEventListener('voiceschanged', populateVoices);
    } else {
        synth.onvoiceschanged = populateVoices;
    }

    populateVoices();
    updateSpeedUi();
    updatePlayIcon();
});
