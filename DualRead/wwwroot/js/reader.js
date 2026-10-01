document.addEventListener('DOMContentLoaded', function () {
    var bootstrapEl = document.getElementById('reader-bootstrap-data');
    var bootstrap = bootstrapEl
        ? JSON.parse(bootstrapEl.textContent)
        : { bookId: null, chapters: [], landingChapterId: null, landingPage: 0, bookmarks: [] };

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

    var chapters = bootstrap.chapters || [];
    var bookmarks = bootstrap.bookmarks || [];
    var currentChapterId = bootstrap.landingChapterId;
    var currentPage = 0;
    var totalPages = 1;
    var pageStep = 0;
    var pendingLandingPage = bootstrap.landingPage || 0;
    var progressSaveTimeout = null;

    function isEditableTarget(target) {
        if (!target) return false;
        var tag = target.tagName ? target.tagName.toLowerCase() : '';
        return tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'button';
    }

    function recalculatePagination() {
        if (!pageFrame || !pageTrack) return;

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

        return fetch('/Reader/' + bootstrap.bookId + '/Chapter/' + chapterId)
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to load chapter');
                return res.json();
            })
            .then(function (data) {
                currentChapterId = chapterId;
                pageTrack.innerHTML = data.html;
                setActiveChapterListItem(chapterId);

                currentPage = 0;
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
                alert('Could not load this chapter. Please try again.');
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
            body: JSON.stringify({ chapterId: currentChapterId, page: currentPage }),
            keepalive: true
        }).catch(function (err) {
            console.error('Progress save error:', err);
        });
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
            : 'Trang ' + (bookmark.page + 1);

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
                alert('Could not add bookmark. Please try again.');
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
                    hint.textContent = 'Chưa có bookmark nào. Nhấn phím B hoặc bấm nút đánh dấu để lưu trang này.';
                    bookmarkList.appendChild(hint);
                }
            })
            .catch(function (err) {
                console.error('Bookmark delete error:', err);
                alert('Could not delete bookmark. Please try again.');
            });
    }

    function jumpToBookmark(chapterId, page) {
        if (!chapterId) return;

        if (chapterId === currentChapterId) {
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
        bookmarkToggleBtn.addEventListener('click', addBookmarkAtCurrentPosition);
    }

    if (arrowRight) arrowRight.addEventListener('click', goToNextPage);
    if (arrowLeft) arrowLeft.addEventListener('click', goToPrevPage);
    if (nextChapterBtn) nextChapterBtn.addEventListener('click', function () { goToAdjacentChapter(1); });
    if (prevChapterBtn) prevChapterBtn.addEventListener('click', function () { goToAdjacentChapter(-1); });

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

    function adjustFontSize(delta) {
        var fontSizeInput = document.getElementById('setting-font-size');
        if (!fontSizeInput) return;
        var newValue = Math.min(32, Math.max(12, parseInt(fontSizeInput.value, 10) + delta * 2));
        fontSizeInput.value = newValue;
        applyFontSize(newValue);
        recalculatePagination();
    }

    function applyFontSize(px) {
        if (!pageTrack) return;
        pageTrack.style.fontSize = px + 'px';
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
            if (pageTrack) pageTrack.style.fontFamily = fontSelect.value;
            fontSelect.blur();
            recalculatePagination();
        });
    }

    var fontSizeInput = document.getElementById('setting-font-size');
    if (fontSizeInput) {
        fontSizeInput.addEventListener('input', function () {
            applyFontSize(parseInt(fontSizeInput.value, 10));
        });
        fontSizeInput.addEventListener('change', function () {
            recalculatePagination();
        });
    }

    var lineHeightInput = document.getElementById('setting-line-height');
    if (lineHeightInput) {
        lineHeightInput.addEventListener('input', function () {
            var value = parseFloat(lineHeightInput.value);
            if (pageTrack) pageTrack.style.lineHeight = value;
            var label = document.getElementById('setting-line-height-val');
            if (label) label.textContent = value.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
        });
        lineHeightInput.addEventListener('change', function () {
            recalculatePagination();
        });
    }

    var letterSpacingInput = document.getElementById('setting-letter-spacing');
    if (letterSpacingInput) {
        letterSpacingInput.addEventListener('input', function () {
            var value = parseFloat(letterSpacingInput.value);
            if (pageTrack) pageTrack.style.letterSpacing = value + 'em';
            var label = document.getElementById('setting-letter-spacing-val');
            if (label) label.textContent = value.toFixed(2) + 'em';
        });
        letterSpacingInput.addEventListener('change', function () {
            recalculatePagination();
        });
    }

    var resizeTimeout = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(recalculatePagination, 150);
    });

    window.addEventListener('beforeunload', function () {
        clearTimeout(progressSaveTimeout);
        saveProgressNow();
    });

    if (pageFrame && pageTrack) {
        recalculatePagination();

        if (pendingLandingPage > 0) {
            currentPage = Math.min(pendingLandingPage, totalPages - 1);
            applyPageTransform();
            updatePageIndicator();
        }
    }
});
