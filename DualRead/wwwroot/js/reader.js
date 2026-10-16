document.addEventListener('DOMContentLoaded', function () {
    function t(key, params) {
        return window.DualReadI18n ? window.DualReadI18n.t(key, params) : key;
    }

    function statusHtml(key) {
        return '<p class="tr-status" data-i18n="' + key + '">' + t(key) + '</p>';
    }

    var bootstrapEl = document.getElementById('reader-bootstrap-data');
    var bootstrap = bootstrapEl
        ? JSON.parse(bootstrapEl.textContent)
        : { bookId: null, chapters: [], landingChapterId: null, landingPage: 0, bookmarks: [], canTranslate: false, translationModeOn: false };

    var readerApp = document.getElementById('reader-app');
    var pageFrame = document.getElementById('page-frame');
    var pageTrack = document.getElementById('page-track');
    var pageIndicator = document.getElementById('page-indicator');
    var arrowLeft = document.getElementById('page-arrow-left');
    var arrowRight = document.getElementById('page-arrow-right');
    var chapterListItems = document.querySelectorAll('.chapter-list-item');
    var prevChapterBtn = document.getElementById('prev-chapter-btn');
    var nextChapterBtn = document.getElementById('next-chapter-btn');
    var bookmarkToggleBtn = document.getElementById('bookmark-toggle-btn');
    var bookmarkList = document.getElementById('panel-bookmarks');
    var translationView = document.getElementById('translation-view');
    var translationGrid = document.getElementById('translation-grid');
    var translateToggleBtn = document.getElementById('translate-toggle');
    var saveStatusEl = document.getElementById('translation-save-status');
    var trPrevChapterBtn = document.getElementById('tr-prev-chapter-btn');
    var trNextChapterBtn = document.getElementById('tr-next-chapter-btn');

    var chapters = bootstrap.chapters || [];
    var bookmarks = bootstrap.bookmarks || [];
    var currentChapterId = bootstrap.landingChapterId;
    var currentPage = 0;
    var totalPages = 1;
    var pageStep = 0;
    var pendingLandingPage = bootstrap.landingPage || 0;
    var progressSaveTimeout = null;

    var canTranslate = !!bootstrap.canTranslate && !!translationView && !!translationGrid;
    var translationModeOn = false;
    var translationBuildToken = 0;
    var pendingTranslationSaves = {};
    var translationSaveTimers = {};

    function isEditableTarget(target) {
        if (!target) return false;
        var tag = target.tagName ? target.tagName.toLowerCase() : '';
        return tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button';
    }

    function getStyledTargets() {
        return [pageTrack, translationView].filter(function (el) { return !!el; });
    }

    function recalculatePagination() {
        if (!pageFrame || !pageTrack || translationModeOn) return;

        var frameWidth = pageFrame.clientWidth;
        pageTrack.style.columnWidth = frameWidth + 'px';
        pageTrack.style.width = frameWidth + 'px';
        pageTrack.style.transform = 'translateX(0px)';

        var gap = 64;
        pageStep = frameWidth + gap;

        var scrollWidth = pageTrack.scrollWidth;
        totalPages = Math.max(1, Math.round((scrollWidth + gap) / pageStep));

        if (currentPage >= totalPages) {
            currentPage = totalPages - 1;
        }
        if (currentPage < 0) {
            currentPage = 0;
        }

        applyPageTransform();
        updatePageIndicator();
    }

    function applyPageTransform() {
        if (!pageTrack) return;
        pageTrack.style.transform = 'translateX(' + (-currentPage * pageStep) + 'px)';
    }

    function updatePageIndicator() {
        if (pageIndicator) {
            pageIndicator.textContent = (currentPage + 1) + ' / ' + totalPages;
        }
        refreshBookmarkButtonState();
    }

    function onPositionChanged() {
        updatePageIndicator();
        scheduleProgressSave();
    }

    function goToNextPage() {
        if (currentPage < totalPages - 1) {
            currentPage++;
            applyPageTransform();
            onPositionChanged();
        } else {
            goToAdjacentChapter(1);
        }
    }

    function goToPrevPage() {
        if (currentPage > 0) {
            currentPage--;
            applyPageTransform();
            onPositionChanged();
        } else {
            goToAdjacentChapter(-1);
        }
    }

    function findChapterIndex(chapterId) {
        for (var i = 0; i < chapters.length; i++) {
            if (chapters[i].id === chapterId) return i;
        }
        return -1;
    }

    function goToAdjacentChapter(direction) {
        var index = findChapterIndex(currentChapterId);
        if (index === -1) return;

        var targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= chapters.length) return;

        loadChapter(chapters[targetIndex].id, direction > 0 ? 'first' : 'last');
    }

    function setActiveChapterListItem(chapterId) {
        chapterListItems.forEach(function (item) {
            if (item.getAttribute('data-chapter-id') === chapterId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function loadChapter(chapterId, landing) {
        if (!bootstrap.bookId) return Promise.resolve();

        if (translationModeOn) {
            flushTranslationSaves(false);
        }

        return fetch('/Reader/' + bootstrap.bookId + '/Chapter/' + chapterId)
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to load chapter');
                return res.json();
            })
            .then(function (data) {
                currentChapterId = chapterId;
                pageTrack.innerHTML = data.html;
                setActiveChapterListItem(chapterId);
                document.dispatchEvent(new CustomEvent('dualread:chapterchange'));

                currentPage = 0;

                if (translationModeOn) {
                    renderTranslationView();
                    scheduleProgressSave();
                    return;
                }

                recalculatePagination();

                if (landing === 'last') {
                    currentPage = totalPages - 1;
                } else if (typeof landing === 'number') {
                    currentPage = Math.min(Math.max(landing, 0), totalPages - 1);
                }

                applyPageTransform();
                onPositionChanged();
            })
            .catch(function (err) {
                console.error('Chapter load error:', err);
                alert(t('err.chapter'));
            });
    }

    function scheduleProgressSave() {
        if (!bootstrap.bookId || !currentChapterId) return;

        clearTimeout(progressSaveTimeout);
        progressSaveTimeout = setTimeout(saveProgressNow, 1500);
    }

    function saveProgressNow() {
        if (!bootstrap.bookId || !currentChapterId) return;

        fetch('/Reader/' + bootstrap.bookId + '/Progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chapterId: currentChapterId, page: currentPage, translationModeOn: translationModeOn }),
            keepalive: true
        }).catch(function (err) {
            console.error('Progress save error:', err);
        });
    }

    function setSaveStatus(state) {
        if (!saveStatusEl) return;

        saveStatusEl.classList.remove('error');
        if (state === 'saving') {
            saveStatusEl.textContent = t('tr.saving');
        } else if (state === 'saved') {
            saveStatusEl.textContent = t('tr.saved');
        } else if (state === 'error') {
            saveStatusEl.textContent = t('tr.saveError');
            saveStatusEl.classList.add('error');
        } else {
            saveStatusEl.textContent = '';
        }
    }

    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    function autoResizeAllTextareas() {
        if (!translationGrid) return;
        translationGrid.querySelectorAll('.tr-textarea').forEach(autoResizeTextarea);
    }

    function setActiveParagraph(paragraphIndex) {
        translationGrid.querySelectorAll('.tr-original').forEach(function (el) {
            el.classList.toggle('active', el.getAttribute('data-p-index') === String(paragraphIndex));
        });

        var active = translationGrid.querySelector('.tr-original.active');
        if (active && active.scrollIntoView) {
            active.scrollIntoView({ block: 'nearest' });
        }
    }

    function queueTranslationSave(chapterId, paragraphIndex, text) {
        var key = chapterId + ':' + paragraphIndex;
        pendingTranslationSaves[key] = {
            chapterId: chapterId,
            paragraphIndex: Number(paragraphIndex),
            translatedText: text
        };

        setSaveStatus('saving');
        clearTimeout(translationSaveTimers[key]);
        translationSaveTimers[key] = setTimeout(function () {
            sendTranslationSave(key, false);
        }, 800);
    }

    function sendTranslationSave(key, keepalive) {
        var item = pendingTranslationSaves[key];
        if (!item) return Promise.resolve();

        delete pendingTranslationSaves[key];
        clearTimeout(translationSaveTimers[key]);
        delete translationSaveTimers[key];

        return fetch('/Reader/' + bootstrap.bookId + '/Chapter/' + item.chapterId + '/Translations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paragraphIndex: item.paragraphIndex, translatedText: item.translatedText }),
            keepalive: !!keepalive
        })
            .then(function (res) {
                if (!res.ok) throw new Error('Save failed');
                if (Object.keys(pendingTranslationSaves).length === 0) {
                    setSaveStatus('saved');
                }
            })
            .catch(function (err) {
                console.error('Translation save error:', err);
                setSaveStatus('error');
            });
    }

    function flushTranslationSaves(keepalive) {
        Object.keys(pendingTranslationSaves).forEach(function (key) {
            sendTranslationSave(key, keepalive);
        });
    }

    function buildTranslationGrid(chapterId, savedTranslations) {
        var savedByIndex = {};
        (savedTranslations || []).forEach(function (t) {
            savedByIndex[t.paragraphIndex] = t.translatedText;
        });

        translationGrid.innerHTML = '';

        var nodes = pageTrack.querySelectorAll('p[data-p-index], h1, h2, h3, h4, h5, h6');
        var rowCount = 0;

        nodes.forEach(function (node) {
            var text = (node.textContent || '').trim();
            if (!text) return;

            if (node.tagName === 'P') {
                var index = node.getAttribute('data-p-index');

                var original = document.createElement('div');
                original.className = 'tr-original';
                original.setAttribute('data-p-index', index);
                original.innerHTML = node.innerHTML;

                var textarea = document.createElement('textarea');
                textarea.className = 'tr-textarea';
                textarea.setAttribute('data-p-index', index);
                textarea.rows = 1;
                textarea.placeholder = t('tr.placeholder');
                textarea.value = savedByIndex[index] || '';

                textarea.addEventListener('input', function () {
                    autoResizeTextarea(textarea);
                    queueTranslationSave(chapterId, index, textarea.value);
                });
                textarea.addEventListener('focus', function () {
                    setActiveParagraph(index);
                });
                original.addEventListener('click', function () {
                    var selection = window.getSelection();
                    if (selection && selection.toString().trim()) return;
                    textarea.focus();
                });

                translationGrid.appendChild(original);
                translationGrid.appendChild(textarea);
                rowCount++;
            } else {
                var heading = document.createElement(node.tagName.toLowerCase());
                heading.className = 'tr-heading';
                heading.innerHTML = node.innerHTML;
                translationGrid.appendChild(heading);
            }
        });

        if (rowCount === 0) {
            translationGrid.innerHTML = statusHtml('tr.noParagraphs');
            return;
        }

        autoResizeAllTextareas();
        translationView.scrollTop = 0;
        document.dispatchEvent(new CustomEvent('dualread:modechange'));
    }

    function renderTranslationView() {
        if (!translationGrid || !pageTrack || !currentChapterId) return;

        var chapterId = currentChapterId;
        var token = ++translationBuildToken;

        translationGrid.innerHTML = statusHtml('tr.loading');

        fetch('/Reader/' + bootstrap.bookId + '/Chapter/' + chapterId + '/Translations')
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to load translations');
                return res.json();
            })
            .then(function (list) {
                if (token !== translationBuildToken) return;
                buildTranslationGrid(chapterId, list);
            })
            .catch(function (err) {
                console.error('Translation load error:', err);
                if (token !== translationBuildToken) return;
                translationGrid.innerHTML = statusHtml('tr.loadError');
            });
    }

    function setTranslationMode(on, silent) {
        if (!canTranslate || !pageFrame) return;
        if (on === translationModeOn) return;

        translationModeOn = on;

        if (translateToggleBtn) {
            translateToggleBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        }

        if (on) {
            pageFrame.hidden = true;
            if (pageIndicator) pageIndicator.hidden = true;
            translationView.hidden = false;
            if (bookmarkToggleBtn) bookmarkToggleBtn.style.display = 'none';
            if (saveStatusEl) saveStatusEl.hidden = false;
            setSaveStatus('');
            renderTranslationView();
        } else {
            flushTranslationSaves(false);
            translationBuildToken++;
            translationView.hidden = true;
            pageFrame.hidden = false;
            if (pageIndicator) pageIndicator.hidden = false;
            if (bookmarkToggleBtn) bookmarkToggleBtn.style.display = '';
            if (saveStatusEl) saveStatusEl.hidden = true;
            recalculatePagination();
        }

        document.dispatchEvent(new CustomEvent('dualread:modechange'));

        if (!silent) {
            scheduleProgressSave();
        }
    }

    function findBookmarkAtCurrentPosition() {
        for (var i = 0; i < bookmarks.length; i++) {
            if (bookmarks[i].chapterId === currentChapterId && bookmarks[i].page === currentPage) {
                return bookmarks[i];
            }
        }
        return null;
    }

    function refreshBookmarkButtonState() {
        if (!bookmarkToggleBtn) return;
        if (findBookmarkAtCurrentPosition()) {
            bookmarkToggleBtn.classList.add('bookmarked');
        } else {
            bookmarkToggleBtn.classList.remove('bookmarked');
        }
    }

    function getCurrentPagePreviewText() {
        if (!pageTrack) return '';
        var text = (pageTrack.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) return '';

        var approxCharsPerPage = Math.max(1, Math.floor(text.length / totalPages));
        var start = Math.min(text.length - 1, currentPage * approxCharsPerPage);
        return text.substr(start, 80).trim();
    }

    function appendBookmarkToSidebar(bookmark) {
        if (!bookmarkList) return;

        var hint = document.getElementById('bookmark-empty-hint');
        if (hint) hint.remove();

        var li = document.createElement('li');
        li.className = 'sidebar-list-item bookmark-list-item';
        li.setAttribute('data-bookmark-id', bookmark.id);
        li.setAttribute('data-chapter-id', bookmark.chapterId || '');
        li.setAttribute('data-page', bookmark.page);

        var label = document.createElement('span');
        label.className = 'bookmark-preview-text';
        label.textContent = bookmark.previewText && bookmark.previewText.length > 0
            ? bookmark.previewText
            : t('reader.pageLabel', { n: bookmark.page + 1 });

        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'bookmark-delete';
        del.setAttribute('data-bookmark-delete-id', bookmark.id);
        del.setAttribute('aria-label', 'Delete bookmark');
        del.innerHTML = '&times;';

        li.appendChild(label);
        li.appendChild(del);
        bookmarkList.insertBefore(li, bookmarkList.firstChild);
    }

    function addBookmarkAtCurrentPosition() {
        if (translationModeOn) return;
        if (!bootstrap.bookId || !currentChapterId) return;
        if (findBookmarkAtCurrentPosition()) return;

        fetch('/Reader/' + bootstrap.bookId + '/Bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chapterId: currentChapterId,
                page: currentPage,
                previewText: getCurrentPagePreviewText()
            })
        })
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to add bookmark');
                return res.json();
            })
            .then(function (created) {
                bookmarks.unshift(created);
                appendBookmarkToSidebar(created);
                refreshBookmarkButtonState();
            })
            .catch(function (err) {
                console.error('Bookmark add error:', err);
                alert(t('err.bookmarkAdd'));
            });
    }

    function removeBookmark(bookmarkId, listItem) {
        fetch('/Reader/' + bootstrap.bookId + '/Bookmarks/' + bookmarkId, { method: 'DELETE' })
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to delete bookmark');

                bookmarks = bookmarks.filter(function (b) { return b.id !== bookmarkId; });
                if (listItem) listItem.remove();
                refreshBookmarkButtonState();

                if (bookmarks.length === 0 && bookmarkList && !document.getElementById('bookmark-empty-hint')) {
                    var hint = document.createElement('li');
                    hint.id = 'bookmark-empty-hint';
                    hint.className = 'sidebar-list-empty';
                    hint.setAttribute('data-i18n', 'reader.bookmarkEmpty');
                    hint.textContent = t('reader.bookmarkEmpty');
                    bookmarkList.appendChild(hint);
                }
            })
            .catch(function (err) {
                console.error('Bookmark delete error:', err);
                alert(t('err.bookmarkDelete'));
            });
    }

    function jumpToBookmark(chapterId, page) {
        if (!chapterId) return;

        if (chapterId === currentChapterId) {
            if (translationModeOn) return;
            currentPage = Math.min(Math.max(page, 0), totalPages - 1);
            applyPageTransform();
            onPositionChanged();
        } else {
            loadChapter(chapterId, page);
        }
    }

    if (bookmarkList) {
        bookmarkList.addEventListener('click', function (e) {
            var deleteBtn = e.target.closest('.bookmark-delete');
            if (deleteBtn) {
                e.stopPropagation();
                var item = deleteBtn.closest('.bookmark-list-item');
                removeBookmark(deleteBtn.getAttribute('data-bookmark-delete-id'), item);
                return;
            }

            var row = e.target.closest('.bookmark-list-item');
            if (row) {
                jumpToBookmark(row.getAttribute('data-chapter-id'), parseInt(row.getAttribute('data-page'), 10) || 0);
            }
        });
    }

    if (bookmarkToggleBtn) {
        bookmarkToggleBtn.addEventListener('click', function () {
            addBookmarkAtCurrentPosition();
            bookmarkToggleBtn.blur();
        });
    }

    if (translateToggleBtn) {
        translateToggleBtn.addEventListener('click', function () {
            setTranslationMode(!translationModeOn, false);
            translateToggleBtn.blur();
        });
    }

    if (arrowRight) arrowRight.addEventListener('click', function () { goToNextPage(); arrowRight.blur(); });
    if (arrowLeft) arrowLeft.addEventListener('click', function () { goToPrevPage(); arrowLeft.blur(); });
    if (nextChapterBtn) nextChapterBtn.addEventListener('click', function () { goToAdjacentChapter(1); nextChapterBtn.blur(); });
    if (prevChapterBtn) prevChapterBtn.addEventListener('click', function () { goToAdjacentChapter(-1); prevChapterBtn.blur(); });
    if (trNextChapterBtn) trNextChapterBtn.addEventListener('click', function () { goToAdjacentChapter(1); trNextChapterBtn.blur(); });
    if (trPrevChapterBtn) trPrevChapterBtn.addEventListener('click', function () { goToAdjacentChapter(-1); trPrevChapterBtn.blur(); });

    chapterListItems.forEach(function (item) {
        item.addEventListener('click', function () {
            var chapterId = item.getAttribute('data-chapter-id');
            if (chapterId && chapterId !== currentChapterId) {
                loadChapter(chapterId, 'first');
            }
        });
    });

    document.addEventListener('keydown', function (e) {
        if (isEditableTarget(e.target)) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        if (translationModeOn) {
            if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                setTranslationMode(false, false);
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 'Escape') {
                closeSidebars();
            }
            return;
        }

        switch (e.key) {
            case ' ':
            case 'Spacebar':
            case 'ArrowRight':
                e.preventDefault();
                goToNextPage();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                goToPrevPage();
                break;
            case 'ArrowUp':
                e.preventDefault();
                adjustFontSize(1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                adjustFontSize(-1);
                break;
            case 'b':
            case 'B':
                addBookmarkAtCurrentPosition();
                break;
            case 't':
            case 'T':
                if (canTranslate) {
                    e.preventDefault();
                    setTranslationMode(true, false);
                }
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'Escape':
                closeSidebars();
                break;
        }
    });

    var sidebarLeft = document.getElementById('sidebar-left');
    var sidebarRight = document.getElementById('sidebar-right');
    var sidebarBackdrop = document.getElementById('sidebar-backdrop');
    var sidebarLeftToggle = document.getElementById('sidebar-left-toggle');
    var sidebarRightToggle = document.getElementById('sidebar-right-toggle');

    function openSidebar(sidebar) {
        sidebar.classList.add('open');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('show');
    }

    function closeSidebars() {
        if (sidebarLeft) sidebarLeft.classList.remove('open');
        if (sidebarRight) sidebarRight.classList.remove('open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
    }

    if (sidebarLeftToggle && sidebarLeft) {
        sidebarLeftToggle.addEventListener('click', function () { openSidebar(sidebarLeft); });
    }
    if (sidebarRightToggle && sidebarRight) {
        sidebarRightToggle.addEventListener('click', function () { openSidebar(sidebarRight); });
    }
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeSidebars);
    }
    document.querySelectorAll('[data-close-sidebar]').forEach(function (btn) {
        btn.addEventListener('click', closeSidebars);
    });

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            readerApp.requestFullscreen && readerApp.requestFullscreen();
        } else {
            document.exitFullscreen && document.exitFullscreen();
        }
    }

    function afterLayoutSettingChange() {
        recalculatePagination();
        if (translationModeOn) autoResizeAllTextareas();
    }

    function adjustFontSize(delta) {
        var fontSizeInput = document.getElementById('setting-font-size');
        if (!fontSizeInput) return;
        var newValue = Math.min(32, Math.max(12, parseInt(fontSizeInput.value, 10) + delta * 2));
        fontSizeInput.value = newValue;
        applyFontSize(newValue);
        afterLayoutSettingChange();
        scheduleSettingsSave();
    }

    function applyFontSize(px) {
        getStyledTargets().forEach(function (el) { el.style.fontSize = px + 'px'; });
        var label = document.getElementById('setting-font-size-val');
        if (label) label.textContent = px + 'px';
    }

    var darkModeToggle = document.getElementById('setting-dark-mode');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function () {
            document.documentElement.setAttribute('data-bs-theme', darkModeToggle.checked ? 'dark' : 'light');
            document.body.classList.toggle('theme-light', !darkModeToggle.checked);
            darkModeToggle.blur();
        });
    }

    var fontSelect = document.getElementById('setting-font');
    if (fontSelect) {
        fontSelect.addEventListener('change', function () {
            getStyledTargets().forEach(function (el) { el.style.fontFamily = fontSelect.value; });
            fontSelect.blur();
            afterLayoutSettingChange();
        });
    }

    var fontSizeInput = document.getElementById('setting-font-size');
    if (fontSizeInput) {
        fontSizeInput.addEventListener('input', function () {
            applyFontSize(parseInt(fontSizeInput.value, 10));
        });
        fontSizeInput.addEventListener('change', afterLayoutSettingChange);
    }

    var lineHeightInput = document.getElementById('setting-line-height');
    if (lineHeightInput) {
        lineHeightInput.addEventListener('input', function () {
            var value = parseFloat(lineHeightInput.value);
            getStyledTargets().forEach(function (el) { el.style.lineHeight = value; });
            var label = document.getElementById('setting-line-height-val');
            if (label) label.textContent = value.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
        });
        lineHeightInput.addEventListener('change', afterLayoutSettingChange);
    }

    var letterSpacingInput = document.getElementById('setting-letter-spacing');
    if (letterSpacingInput) {
        letterSpacingInput.addEventListener('input', function () {
            var value = parseFloat(letterSpacingInput.value);
            getStyledTargets().forEach(function (el) { el.style.letterSpacing = value + 'em'; });
            var label = document.getElementById('setting-letter-spacing-val');
            if (label) label.textContent = value.toFixed(2) + 'em';
        });
        letterSpacingInput.addEventListener('change', afterLayoutSettingChange);
    }

    var languageSelect = document.getElementById('setting-language');
    var settingsSaveTimeout = null;
    var canSaveSettings = !!bootstrap.canSaveSettings;

    function currentSettingsSnapshot() {
        return {
            darkMode: darkModeToggle ? darkModeToggle.checked : true,
            language: languageSelect ? languageSelect.value : 'en',
            font: fontSelect ? fontSelect.value : null,
            fontSize: fontSizeInput ? parseInt(fontSizeInput.value, 10) : null,
            lineHeight: lineHeightInput ? parseFloat(lineHeightInput.value) : null,
            letterSpacing: letterSpacingInput ? parseFloat(letterSpacingInput.value) : null
        };
    }

    function scheduleSettingsSave() {
        if (!canSaveSettings) return;

        clearTimeout(settingsSaveTimeout);
        settingsSaveTimeout = setTimeout(function () {
            fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSettingsSnapshot()),
                keepalive: true
            }).catch(function (err) {
                console.error('Settings save error:', err);
            });
        }, 600);
    }

    function applyTheme(isDark) {
        document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
        document.body.classList.toggle('theme-light', !isDark);
    }

    function applyInitialSettings() {
        var saved = bootstrap.settings;
        if (!saved) return;

        if (darkModeToggle) {
            darkModeToggle.checked = saved.darkMode !== false;
            applyTheme(darkModeToggle.checked);
        }

        if (languageSelect) {
            languageSelect.value = saved.language || 'en';
        }

        if (fontSelect && saved.font) {
            var hasFont = Array.prototype.some.call(fontSelect.options, function (option) {
                return option.value === saved.font;
            });
            if (hasFont) {
                fontSelect.value = saved.font;
                getStyledTargets().forEach(function (el) { el.style.fontFamily = saved.font; });
            }
        }

        if (fontSizeInput && saved.fontSize) {
            fontSizeInput.value = saved.fontSize;
            applyFontSize(parseInt(fontSizeInput.value, 10));
        }

        if (lineHeightInput && saved.lineHeight) {
            lineHeightInput.value = saved.lineHeight;
            var lineHeightValue = parseFloat(lineHeightInput.value);
            getStyledTargets().forEach(function (el) { el.style.lineHeight = lineHeightValue; });
            var lineHeightLabel = document.getElementById('setting-line-height-val');
            if (lineHeightLabel) lineHeightLabel.textContent = lineHeightValue.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
        }

        if (letterSpacingInput && saved.letterSpacing !== undefined && saved.letterSpacing !== null) {
            letterSpacingInput.value = saved.letterSpacing;
            var letterSpacingValue = parseFloat(letterSpacingInput.value);
            getStyledTargets().forEach(function (el) { el.style.letterSpacing = letterSpacingValue + 'em'; });
            var letterSpacingLabel = document.getElementById('setting-letter-spacing-val');
            if (letterSpacingLabel) letterSpacingLabel.textContent = letterSpacingValue.toFixed(2) + 'em';
        }
    }

    if (languageSelect) {
        languageSelect.addEventListener('change', function () {
            if (window.DualReadI18n) window.DualReadI18n.setLanguage(languageSelect.value);
            languageSelect.blur();
        });
    }

    ['setting-dark-mode', 'setting-font', 'setting-font-size', 'setting-line-height', 'setting-letter-spacing', 'setting-language'].forEach(function (id) {
        var control = document.getElementById(id);
        if (control) control.addEventListener('change', scheduleSettingsSave);
    });

    document.addEventListener('dualread:languagechange', function () {
        if (translationGrid) {
            translationGrid.querySelectorAll('.tr-textarea').forEach(function (textarea) {
                textarea.placeholder = t('tr.placeholder');
            });
        }
        if (languageSelect && window.DualReadI18n) {
            languageSelect.value = window.DualReadI18n.getLanguage();
        }
    });

    function clearTtsHighlight() {
        document.querySelectorAll('.tts-highlight-active').forEach(function (el) {
            el.classList.remove('tts-highlight-active');
        });
    }

    function getParagraphNodes() {
        return Array.prototype.filter.call(pageTrack.querySelectorAll('p[data-p-index]'), function (p) {
            return (p.textContent || '').trim().length > 0;
        });
    }

    function revealParagraphPage(paragraph) {
        if (!pageFrame || pageStep <= 0) return;

        var frameRect = pageFrame.getBoundingClientRect();
        var rect = paragraph.getBoundingClientRect();
        var deltaPages = Math.floor((rect.left - frameRect.left + 1) / pageStep);
        if (deltaPages === 0) return;

        currentPage = Math.min(Math.max(currentPage + deltaPages, 0), totalPages - 1);
        applyPageTransform();
        onPositionChanged();
    }

    function firstVisibleParagraphIndex() {
        var nodes = getParagraphNodes();
        if (nodes.length === 0) return 0;

        var i;
        var rect;

        if (translationModeOn) {
            var viewRect = translationView.getBoundingClientRect();
            var originals = translationGrid.querySelectorAll('.tr-original');
            for (i = 0; i < originals.length; i++) {
                rect = originals[i].getBoundingClientRect();
                if (rect.bottom > viewRect.top + 4) {
                    return Number(originals[i].getAttribute('data-p-index'));
                }
            }
            return Number(nodes[0].getAttribute('data-p-index'));
        }

        var frameRect = pageFrame.getBoundingClientRect();
        for (i = 0; i < nodes.length; i++) {
            rect = nodes[i].getBoundingClientRect();
            if (rect.left >= frameRect.left - 2 && rect.left < frameRect.right - 2) {
                return Number(nodes[i].getAttribute('data-p-index'));
            }
        }
        for (i = 0; i < nodes.length; i++) {
            rect = nodes[i].getBoundingClientRect();
            if (rect.right > frameRect.left) {
                return Number(nodes[i].getAttribute('data-p-index'));
            }
        }
        return Number(nodes[0].getAttribute('data-p-index'));
    }

    window.DualReadReader = {
        isTranslationMode: function () { return translationModeOn; },
        getCurrentChapterId: function () { return currentChapterId; },
        getParagraphs: function () {
            return getParagraphNodes().map(function (p) {
                return {
                    index: Number(p.getAttribute('data-p-index')),
                    text: (p.textContent || '').replace(/\s+/g, ' ').trim()
                };
            });
        },
        getFirstVisibleParagraphIndex: firstVisibleParagraphIndex,
        highlightParagraph: function (index) {
            clearTtsHighlight();
            if (translationModeOn) {
                var original = translationGrid.querySelector('.tr-original[data-p-index="' + index + '"]');
                if (original) {
                    original.classList.add('tts-highlight-active');
                    if (original.scrollIntoView) original.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            } else {
                var paragraph = pageTrack.querySelector('p[data-p-index="' + index + '"]');
                if (paragraph) {
                    paragraph.classList.add('tts-highlight-active');
                    revealParagraphPage(paragraph);
                }
            }
        },
        clearHighlight: clearTtsHighlight,
        hasNextChapter: function () {
            var index = findChapterIndex(currentChapterId);
            return index !== -1 && index < chapters.length - 1;
        },
        goToNextChapter: function () {
            var index = findChapterIndex(currentChapterId);
            if (index === -1 || index >= chapters.length - 1) return Promise.resolve();
            return loadChapter(chapters[index + 1].id, 'first');
        }
    };

    var resizeTimeout = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(afterLayoutSettingChange, 150);
    });

    window.addEventListener('beforeunload', function () {
        clearTimeout(progressSaveTimeout);
        saveProgressNow();
        flushTranslationSaves(true);
    });

    applyInitialSettings();

    if (pageFrame && pageTrack) {
        recalculatePagination();

        if (pendingLandingPage > 0) {
            currentPage = Math.min(pendingLandingPage, totalPages - 1);
            applyPageTransform();
            updatePageIndicator();
        }

        if (canTranslate && bootstrap.translationModeOn) {
            setTranslationMode(true, true);
        }
    }
});
