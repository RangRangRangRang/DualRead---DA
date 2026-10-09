document.addEventListener('DOMContentLoaded', function () {
    var pageTrack = document.getElementById('page-track');
    if (!pageTrack) return;

    var bootstrapEl = document.getElementById('reader-bootstrap-data');
    var bootstrap = bootstrapEl ? JSON.parse(bootstrapEl.textContent) : { bookId: null };

    var bubble = document.createElement('button');
    bubble.type = 'button';
    bubble.className = 'quick-trans-bubble';
    bubble.setAttribute('aria-label', 'Dịch nhanh');
    bubble.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
    document.body.appendChild(bubble);

    var popover = document.createElement('div');
    popover.className = 'quick-trans-popover';
    popover.setAttribute('role', 'dialog');
    document.body.appendChild(popover);

    var currentSelectionText = '';
    var currentChapterId = null;
    var lastSavedId = null;

    function getCurrentChapterId() {
        var active = document.querySelector('.chapter-list-item.active');
        return active ? active.getAttribute('data-chapter-id') : null;
    }

    function hideAll() {
        bubble.classList.remove('show');
        popover.classList.remove('show');
    }

    function positionNear(el, rect) {
        var top = window.scrollY + rect.top - el.offsetHeight - 10;
        var left = window.scrollX + rect.left + (rect.width / 2) - (el.offsetWidth / 2);

        if (top < window.scrollY + 8) {
            top = window.scrollY + rect.bottom + 10;
        }

        var maxTop = window.scrollY + window.innerHeight - el.offsetHeight - 8;
        top = Math.max(window.scrollY + 8, Math.min(top, maxTop));

        left = Math.max(8, Math.min(left, window.scrollX + window.innerWidth - el.offsetWidth - 8));

        el.style.top = top + 'px';
        el.style.left = left + 'px';
    }

    document.addEventListener('mouseup', function (e) {
        if (popover.contains(e.target) || bubble.contains(e.target)) return;
        var insideSource = pageTrack.contains(e.target) || (e.target.closest && e.target.closest('.tr-original, .tr-heading'));
        if (!insideSource) { hideAll(); return; }

        setTimeout(function () {
            var sel = window.getSelection();
            var text = sel ? sel.toString().trim() : '';

            if (!text || sel.isCollapsed || text.length > 300) {
                hideAll();
                return;
            }

            currentSelectionText = text;
            currentChapterId = getCurrentChapterId();

            var range = sel.getRangeAt(0);
            var rect = range.getBoundingClientRect();

            popover.classList.remove('show');
            bubble.style.display = 'flex';
            bubble.classList.add('show');
            positionNear(bubble, rect);
        }, 10);
    });

    bubble.addEventListener('click', function () {
        var rect = bubble.getBoundingClientRect();
        bubble.classList.remove('show');

        popover.innerHTML =
            '<div class="quick-trans-header">' +
            '<span class="quick-trans-title">Dịch nhanh</span>' +
            '<div class="quick-trans-header-actions">' +
            '<button type="button" class="quick-trans-close-btn" aria-label="Close">&times;</button>' +
            '</div>' +
            '</div>' +
            '<div class="quick-trans-body">' +
            '<div class="quick-trans-skeleton">' +
            '<div class="skeleton-line skeleton-line-title"></div>' +
            '<div class="skeleton-line skeleton-line-sub"></div>' +
            '</div>' +
            '</div>';

        popover.style.display = 'block';
        popover.classList.add('show');
        positionNear(popover, rect);

        popover.querySelector('.quick-trans-close-btn').addEventListener('click', hideAll);

        fetch('/api/translate?text=' + encodeURIComponent(currentSelectionText) + '&sl=auto&tl=vi')
            .then(function (res) {
                if (!res.ok) throw new Error('Translate failed');
                return res.json();
            })
            .then(function (data) {
                renderResult(data);
                positionNear(popover, rect);
            })
            .catch(function () {
                popover.querySelector('.quick-trans-body').innerHTML =
                    '<p class="quick-trans-result">Không dịch được lúc này, thử lại sau.</p>';
            });
    });

    function renderResult(data) {
        var dictHtml = '';
        if (data.dict && data.dict.length > 0) {
            dictHtml = '<div class="quick-trans-dict">' + data.dict.map(function (d) {
                return '<div class="quick-trans-dict-row"><span class="dict-pos">' + escapeHtml(d.pos) + '</span>' +
                    '<span class="dict-terms">' + d.terms.map(escapeHtml).join(', ') + '</span></div>';
            }).join('') + '</div>';
        }

        popover.querySelector('.quick-trans-body').innerHTML =
            '<p class="quick-trans-result">' + escapeHtml(data.translatedText) + '</p>' + dictHtml;

        var footer = document.createElement('div');
        footer.className = 'quick-trans-footer';

        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'quick-trans-save-btn';
        saveBtn.textContent = 'Lưu vào sổ từ vựng';
        saveBtn.addEventListener('click', function () {
            saveToVocabulary(data, saveBtn);
        });

        footer.appendChild(saveBtn);
        popover.appendChild(footer);
    }

    function saveToVocabulary(data, saveBtn) {
        if (saveBtn.classList.contains('saved')) return;

        var bookTitleEl = document.getElementById('reader-book-title');
        var chapterTitleEl = document.querySelector('.chapter-list-item.active');

        fetch('/api/vocabulary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookId: bootstrap.bookId,
                bookTitle: bookTitleEl ? bookTitleEl.textContent : null,
                chapterId: currentChapterId,
                chapterTitle: chapterTitleEl ? chapterTitleEl.textContent.trim() : null,
                originalText: currentSelectionText,
                translatedText: data.translatedText,
                contextText: null
            })
        })
            .then(function (res) {
                if (!res.ok) throw new Error('Save failed');
                return res.json();
            })
            .then(function (saved) {
                lastSavedId = saved.id;
                saveBtn.textContent = 'Đã lưu';
                saveBtn.classList.add('saved');
            })
            .catch(function () {
                alert('Không lưu được vào sổ từ vựng, thử lại sau.');
            });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    document.addEventListener('mousedown', function (e) {
        if (popover.contains(e.target) || bubble.contains(e.target)) return;
        hideAll();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') hideAll();
    });
});
