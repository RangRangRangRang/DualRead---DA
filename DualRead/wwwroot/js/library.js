document.addEventListener('DOMContentLoaded', function () {
    var recoveryKeyBtn = document.getElementById('btn-recovery-key');
    if (recoveryKeyBtn) {
        recoveryKeyBtn.addEventListener('click', function () {
            var code = recoveryKeyBtn.getAttribute('data-key-code') || '';
            if (!code) return;

            navigator.clipboard.writeText(code).then(function () {
                var textEl = document.getElementById('recovery-key-text');
                if (!textEl) return;
                var original = textEl.textContent;
                textEl.textContent = 'Copied!';
                setTimeout(function () { textEl.textContent = original; }, 1200);
            }).catch(function (err) {
                console.error('Copy error:', err);
            });
        });
    }

    var vocabModalBackdrop = document.getElementById('vocabulary-modal-backdrop');
    var vocabListEl = document.getElementById('vocabulary-list');
    var vocabEmptyHint = document.getElementById('vocabulary-empty-hint');
    var vocabCountBadge = document.getElementById('vocab-count-badge');
    var vocabBtn = document.getElementById('btn-vocabulary');
    var vocabBookFilter = document.getElementById('vocabulary-book-filter');
    var allVocabItems = [];

    function populateBookFilter(items) {
        if (!vocabBookFilter) return;

        var currentValue = vocabBookFilter.value;
        var titles = [];
        items.forEach(function (item) {
            var title = item.bookTitle || '(Không rõ sách)';
            if (titles.indexOf(title) === -1) titles.push(title);
        });

        vocabBookFilter.innerHTML = '<option value="">Tất cả các sách</option>';
        titles.forEach(function (title) {
            var opt = document.createElement('option');
            opt.value = title;
            opt.textContent = title;
            vocabBookFilter.appendChild(opt);
        });

        if (titles.indexOf(currentValue) !== -1) {
            vocabBookFilter.value = currentValue;
        }
    }

    function renderVocabularyList(items) {
        if (!vocabListEl) return;

        var filterValue = vocabBookFilter ? vocabBookFilter.value : '';
        var filteredItems = filterValue
            ? items.filter(function (item) { return (item.bookTitle || '(Không rõ sách)') === filterValue; })
            : items;

        vocabListEl.innerHTML = '';
        if (vocabCountBadge) vocabCountBadge.textContent = items.length;

        if (filteredItems.length === 0) {
            if (vocabEmptyHint) {
                vocabEmptyHint.hidden = false;
                vocabEmptyHint.textContent = filterValue
                    ? 'Chưa có từ nào đã lưu cho sách này.'
                    : 'Chưa lưu từ nào. Khi đọc sách, bôi đen một từ rồi bấm "Lưu vào sổ từ vựng" ở popup dịch nhanh.';
            }
            return;
        }
        if (vocabEmptyHint) vocabEmptyHint.hidden = true;

        filteredItems.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'sidebar-list-item vocab-list-item';
            li.setAttribute('data-vocab-id', item.id);

            var text = document.createElement('span');
            text.className = 'vocab-pair-text';
            text.textContent = item.originalText + ' \u2192 ' + item.translatedText;

            var del = document.createElement('button');
            del.type = 'button';
            del.className = 'bookmark-delete';
            del.setAttribute('aria-label', 'Delete vocabulary item');
            del.innerHTML = '&times;';
            del.addEventListener('click', function () {
                fetch('/api/vocabulary/' + item.id, { method: 'DELETE' })
                    .then(function (res) {
                        if (!res.ok) throw new Error('Failed to delete');
                        allVocabItems = allVocabItems.filter(function (v) { return v.id !== item.id; });
                        populateBookFilter(allVocabItems);
                        renderVocabularyList(allVocabItems);
                    })
                    .catch(function (err) { console.error('Vocabulary delete error:', err); });
            });

            li.appendChild(text);
            li.appendChild(del);
            vocabListEl.appendChild(li);
        });
    }

    if (vocabBookFilter) {
        vocabBookFilter.addEventListener('change', function () {
            renderVocabularyList(allVocabItems);
        });
    }

    function loadVocabulary() {
        fetch('/api/vocabulary')
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(function (items) {
                allVocabItems = items;
                populateBookFilter(items);
                renderVocabularyList(items);
            })
            .catch(function (err) { console.error('Vocabulary load error:', err); });
    }

    if (vocabBtn && vocabModalBackdrop) {
        vocabBtn.addEventListener('click', function () {
            vocabModalBackdrop.style.display = 'flex';
            loadVocabulary();
        });

        vocabModalBackdrop.addEventListener('click', function (e) {
            if (e.target === vocabModalBackdrop) {
                vocabModalBackdrop.style.display = 'none';
            }
        });
    }

    loadVocabulary();

    var renameModalBackdrop = document.getElementById('book-rename-modal-backdrop');
    var renameForm = document.getElementById('book-rename-form');
    var renameBookIdInput = document.getElementById('rename-book-id');
    var renameTitleInput = document.getElementById('rename-book-title-input');
    var renameAuthorInput = document.getElementById('rename-book-author-input');
    var renameSaveBtn = document.getElementById('rename-book-save-btn');

    if (!renameModalBackdrop || !renameForm) {
        return;
    }

    function openModal(backdrop) {
        backdrop.style.display = 'flex';
    }

    function closeModal(backdrop) {
        backdrop.style.display = 'none';
    }

    function getAntiForgeryToken() {
        var tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
        return tokenInput ? tokenInput.value : '';
    }

    function openRenameModal(bookId, currentTitle, currentAuthor) {
        renameBookIdInput.value = bookId || '';
        renameTitleInput.value = currentTitle || '';
        renameAuthorInput.value = currentAuthor || '';
        openModal(renameModalBackdrop);
        renameTitleInput.focus();
    }

    document.addEventListener('click', function (e) {
        var renameBtn = e.target.closest('.book-rename-btn');
        if (renameBtn) {
            openRenameModal(
                renameBtn.getAttribute('data-book-id'),
                renameBtn.getAttribute('data-book-title'),
                renameBtn.getAttribute('data-book-author')
            );
            return;
        }

        var closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) {
            var targetBackdrop = document.getElementById(closeBtn.getAttribute('data-close-modal'));
            if (targetBackdrop) {
                closeModal(targetBackdrop);
            }
        }
    });

    renameModalBackdrop.addEventListener('click', function (e) {
        if (e.target === renameModalBackdrop) {
            closeModal(renameModalBackdrop);
        }
    });

    renameForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var bookId = renameBookIdInput.value;
        var newTitle = (renameTitleInput.value || '').trim();
        var newAuthor = (renameAuthorInput.value || '').trim();

        if (!bookId || !newTitle) {
            return;
        }

        renameSaveBtn.disabled = true;

        fetch('/api/books/' + bookId + '/rename', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getAntiForgeryToken()
            },
            body: JSON.stringify({ title: newTitle, author: newAuthor })
        })
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to rename book');
                return res.json();
            })
            .then(function (updated) {
                var card = document.querySelector('.book-card[data-book-id="' + bookId + '"]');
                if (card) {
                    var titleEl = card.querySelector('.book-title');
                    var authorEl = card.querySelector('.book-author');
                    var renameBtn = card.querySelector('.book-rename-btn');

                    if (titleEl) {
                        titleEl.textContent = updated.title;
                        titleEl.title = updated.title;
                    }
                    if (authorEl) {
                        authorEl.textContent = updated.author || '\u00A0';
                    }
                    if (renameBtn) {
                        renameBtn.setAttribute('data-book-title', updated.title);
                        renameBtn.setAttribute('data-book-author', updated.author || '');
                    }
                }

                closeModal(renameModalBackdrop);
            })
            .catch(function (err) {
                console.error('Rename error:', err);
                alert('Could not rename book. Please try again.');
            })
            .finally(function () {
                renameSaveBtn.disabled = false;
            });
    });
});
