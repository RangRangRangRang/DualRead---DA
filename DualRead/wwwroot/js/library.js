document.addEventListener('DOMContentLoaded', function () {
    var UNKNOWN_BOOK = '__unknown__';

    function t(key, params) {
        return window.DualReadI18n ? window.DualReadI18n.t(key, params) : key;
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function escapeHtml(value) {
        var div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML.replace(/"/g, '&quot;');
    }

    function openModal(id) {
        var el = byId(id);
        if (el) el.style.display = 'flex';
    }

    function closeModal(id) {
        var el = byId(id);
        if (el) el.style.display = 'none';
    }

    function sendJson(url, method, body) {
        return fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    }

    document.addEventListener('click', function (e) {
        var closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) {
            closeModal(closeBtn.getAttribute('data-close-modal'));
            return;
        }

        if (e.target.classList && e.target.classList.contains('lib-modal-backdrop')) {
            e.target.style.display = 'none';
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.lib-modal-backdrop').forEach(function (backdrop) {
            backdrop.style.display = 'none';
        });
    });

    document.querySelectorAll('.lang-seg-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var lang = btn.getAttribute('data-lang');
            if (window.DualReadI18n) window.DualReadI18n.setLanguage(lang);

            document.querySelectorAll('.lang-seg-btn').forEach(function (other) {
                other.classList.toggle('active', other === btn);
            });

            sendJson('/api/settings', 'PUT', { language: lang }).catch(function (err) {
                console.error('Language save error:', err);
            });
        });
    });

    document.querySelectorAll('.lib-tab-btn').forEach(function (tab) {
        tab.addEventListener('click', function () {
            var target = tab.getAttribute('data-tab');
            document.querySelectorAll('.lib-tab-btn').forEach(function (other) {
                other.classList.toggle('active', other === tab);
            });
            byId('panel-books').hidden = target !== 'books';
            byId('panel-albums').hidden = target !== 'albums';
        });
    });

    document.querySelectorAll('.book-delete-form').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            if (!window.confirm(t('lib.deleteConfirm'))) {
                e.preventDefault();
            }
        });
    });

    var recoveryKeyBtn = byId('btn-recovery-key');
    if (recoveryKeyBtn) {
        recoveryKeyBtn.addEventListener('click', function () {
            var code = recoveryKeyBtn.getAttribute('data-key-code') || '';
            if (!code) return;

            navigator.clipboard.writeText(code).then(function () {
                var textEl = byId('recovery-key-text');
                if (!textEl) return;
                var original = textEl.textContent;
                textEl.textContent = t('lib.keyCopied');
                setTimeout(function () { textEl.textContent = original; }, 1200);
            }).catch(function (err) {
                console.error('Copy error:', err);
            });
        });
    }

    var vocabListEl = byId('vocabulary-list');
    var vocabEmptyHint = byId('vocabulary-empty-hint');
    var vocabCountBadge = byId('vocab-count-badge');
    var vocabBookFilter = byId('vocabulary-book-filter');
    var allVocabItems = [];

    function populateBookFilter(items) {
        if (!vocabBookFilter) return;

        var currentValue = vocabBookFilter.value;
        var seen = {};
        var options = ['<option value="">' + escapeHtml(t('vocab.all')) + '</option>'];

        items.forEach(function (item) {
            var key = item.bookTitle || UNKNOWN_BOOK;
            if (seen[key]) return;
            seen[key] = true;
            var label = item.bookTitle || t('vocab.unknownBook');
            options.push('<option value="' + escapeHtml(key) + '">' + escapeHtml(label) + '</option>');
        });

        vocabBookFilter.innerHTML = options.join('');
        if (seen[currentValue]) vocabBookFilter.value = currentValue;
    }

    function renderVocabularyList(items) {
        if (!vocabListEl) return;

        var filterValue = vocabBookFilter ? vocabBookFilter.value : '';
        var filtered = filterValue
            ? items.filter(function (item) { return (item.bookTitle || UNKNOWN_BOOK) === filterValue; })
            : items;

        vocabListEl.innerHTML = '';
        if (vocabCountBadge) vocabCountBadge.textContent = items.length;

        if (filtered.length === 0) {
            if (vocabEmptyHint) {
                vocabEmptyHint.hidden = false;
                vocabEmptyHint.textContent = filterValue ? t('vocab.emptyBook') : t('vocab.empty');
            }
            return;
        }
        if (vocabEmptyHint) vocabEmptyHint.hidden = true;

        filtered.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'sidebar-list-item vocab-list-item';

            var text = document.createElement('span');
            text.className = 'vocab-pair-text';
            text.textContent = item.originalText + ' \u2192 ' + item.translatedText;

            var del = document.createElement('button');
            del.type = 'button';
            del.className = 'bookmark-delete';
            del.setAttribute('aria-label', t('vocab.deleteAria'));
            del.innerHTML = '&times;';
            del.addEventListener('click', function () {
                sendJson('/api/vocabulary/' + item.id, 'DELETE')
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

    if (vocabBookFilter) {
        vocabBookFilter.addEventListener('change', function () {
            renderVocabularyList(allVocabItems);
        });
    }

    var vocabBtn = byId('btn-vocabulary');
    if (vocabBtn) {
        vocabBtn.addEventListener('click', function () {
            openModal('vocabulary-modal-backdrop');
            loadVocabulary();
        });
    }

    var albumsData = [];
    var albumStack = byId('albums-banner-stack');
    var albumsEmptyState = byId('albums-empty-state');
    var albumsCountBadge = byId('albums-count-badge');

    function albumBookCardHtml(album, book) {
        var cover = book.coverImagePath
            ? '<img src="' + escapeHtml(book.coverImagePath) + '" alt="' + escapeHtml(book.title) + '" loading="lazy" />'
            : '<div class="book-cover-placeholder"></div>';

        return '' +
            '<div class="album-book-card" data-book-id="' + book.id + '">' +
            '<a class="album-book-cover-link" href="/Reader/' + book.id + '">' +
            '<div class="album-book-cover">' + cover + '</div>' +
            '<div class="album-book-title" title="' + escapeHtml(book.title) + '">' + escapeHtml(book.title) + '</div>' +
            '<div class="album-book-author" title="' + escapeHtml(book.author || '') + '">' + (escapeHtml(book.author || '') || '&nbsp;') + '</div>' +
            '</a>' +
            '<div class="album-book-actions">' +
            '<button type="button" class="album-action-btn album-book-remove-btn" data-album-id="' + album.id + '" data-book-id="' + book.id + '" title="' + escapeHtml(t('album.removeBookTitle')) + '">' +
            '<span class="btn-text">' + escapeHtml(t('album.removeBook')) + '</span>' +
            '</button>' +
            '</div>' +
            '</div>';
    }

    function albumBannerHtml(album) {
        var slides = (album.books && album.books.length > 0)
            ? album.books.map(function (book) { return albumBookCardHtml(album, book); }).join('')
            : '<div class="album-slide-empty">' + escapeHtml(t('album.slideEmpty')) + '</div>';

        return '' +
            '<div class="album-banner-container" data-album-id="' + album.id + '">' +
            '<div class="album-banner-header">' +
            '<div class="album-banner-title-group">' +
            '<h2 class="album-banner-title" title="' + escapeHtml(album.name) + '">' + escapeHtml(album.name) + '</h2>' +
            '<span class="album-banner-count-badge">' + escapeHtml(t('album.books', { n: album.bookCount || 0 })) + '</span>' +
            '</div>' +
            '<div class="album-banner-controls">' +
            '<button type="button" class="lib-btn lib-btn-sm lib-btn-secondary album-rename-btn" data-album-id="' + album.id + '">' + escapeHtml(t('album.rename')) + '</button>' +
            '<button type="button" class="lib-btn lib-btn-sm lib-btn-danger album-delete-btn" data-album-id="' + album.id + '">' + escapeHtml(t('album.delete')) + '</button>' +
            '</div>' +
            '</div>' +
            '<div class="album-carousel-wrapper">' +
            '<button type="button" class="album-carousel-arrow arrow-left" data-slide-dir="-1" aria-label="Previous">&lsaquo;</button>' +
            '<div class="album-carousel-track">' + slides + '</div>' +
            '<button type="button" class="album-carousel-arrow arrow-right" data-slide-dir="1" aria-label="Next">&rsaquo;</button>' +
            '</div>' +
            '</div>';
    }

    function renderAlbums() {
        if (albumsCountBadge) albumsCountBadge.textContent = albumsData.length;
        if (!albumStack || !albumsEmptyState) return;

        if (albumsData.length === 0) {
            albumStack.innerHTML = '';
            albumsEmptyState.hidden = false;
            return;
        }

        albumsEmptyState.hidden = true;
        albumStack.innerHTML = albumsData.map(albumBannerHtml).join('');
    }

    function loadAlbums() {
        return fetch('/api/albums')
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(function (list) {
                albumsData = list;
                renderAlbums();
                return list;
            })
            .catch(function (err) {
                console.error('Albums load error:', err);
                return albumsData;
            });
    }

    function findAlbum(id) {
        for (var i = 0; i < albumsData.length; i++) {
            if (albumsData[i].id === id) return albumsData[i];
        }
        return null;
    }

    function openAlbumForm(album) {
        byId('album-form-id').value = album ? album.id : '';
        byId('album-form-name').value = album ? album.name : '';
        byId('album-form-description').value = album && album.description ? album.description : '';
        byId('album-form-error').hidden = true;

        var title = byId('album-form-modal-title');
        var key = album ? 'album.formRenameTitle' : 'album.formCreateTitle';
        title.setAttribute('data-i18n', key);
        title.textContent = t(key);

        openModal('album-form-modal-backdrop');
        byId('album-form-name').focus();
    }

    var createAlbumBtn = byId('btn-create-album');
    if (createAlbumBtn) {
        createAlbumBtn.addEventListener('click', function () { openAlbumForm(null); });
    }

    var albumForm = byId('album-form');
    if (albumForm) {
        albumForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var id = byId('album-form-id').value;
            var name = byId('album-form-name').value.trim();
            var description = byId('album-form-description').value.trim();
            if (!name) return;

            var saveBtn = byId('album-form-save-btn');
            saveBtn.disabled = true;

            var request = id
                ? sendJson('/api/albums/' + id, 'PUT', { name: name, description: description })
                : sendJson('/api/albums', 'POST', { name: name, description: description });

            request
                .then(function (res) {
                    if (!res.ok) throw new Error('Album save failed');
                    closeModal('album-form-modal-backdrop');
                    return loadAlbums();
                })
                .catch(function (err) {
                    console.error('Album save error:', err);
                    var errorEl = byId('album-form-error');
                    errorEl.textContent = t('album.error');
                    errorEl.hidden = false;
                })
                .finally(function () {
                    saveBtn.disabled = false;
                });
        });
    }

    if (albumStack) {
        albumStack.addEventListener('click', function (e) {
            var arrow = e.target.closest('.album-carousel-arrow');
            if (arrow) {
                var track = arrow.closest('.album-carousel-wrapper').querySelector('.album-carousel-track');
                var direction = parseInt(arrow.getAttribute('data-slide-dir'), 10) || 1;
                track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
                return;
            }

            var renameBtn = e.target.closest('.album-rename-btn');
            if (renameBtn) {
                openAlbumForm(findAlbum(renameBtn.getAttribute('data-album-id')));
                return;
            }

            var deleteBtn = e.target.closest('.album-delete-btn');
            if (deleteBtn) {
                if (!window.confirm(t('album.deleteConfirm'))) return;
                sendJson('/api/albums/' + deleteBtn.getAttribute('data-album-id'), 'DELETE')
                    .then(function (res) {
                        if (!res.ok) throw new Error('Album delete failed');
                        return loadAlbums();
                    })
                    .catch(function (err) {
                        console.error('Album delete error:', err);
                        window.alert(t('album.error'));
                    });
                return;
            }

            var removeBtn = e.target.closest('.album-book-remove-btn');
            if (removeBtn) {
                sendJson('/api/albums/' + removeBtn.getAttribute('data-album-id') + '/books/' + removeBtn.getAttribute('data-book-id'), 'DELETE')
                    .then(function (res) {
                        if (!res.ok) throw new Error('Remove failed');
                        return loadAlbums();
                    })
                    .catch(function (err) {
                        console.error('Album remove error:', err);
                        window.alert(t('album.error'));
                    });
            }
        });
    }

    var pickerList = byId('book-albums-checkbox-list');
    var pickerNone = byId('book-albums-none');

    function collectCheckedAlbumIds() {
        var ids = [];
        pickerList.querySelectorAll('.album-check-input:checked').forEach(function (input) {
            ids.push(input.value);
        });
        return ids;
    }

    function renderPicker(selectedIds) {
        var selected = {};
        selectedIds.forEach(function (id) { selected[id] = true; });

        if (albumsData.length === 0) {
            pickerList.innerHTML = '';
            pickerNone.hidden = false;
            return;
        }

        pickerNone.hidden = true;
        pickerList.innerHTML = albumsData.map(function (album) {
            return '' +
                '<label class="lib-checkbox-item">' +
                '<input type="checkbox" value="' + album.id + '"' + (selected[album.id] ? ' checked' : '') + ' class="album-check-input" />' +
                '<span class="lib-checkbox-custom"></span>' +
                '<div class="lib-checkbox-text">' +
                '<span class="lib-checkbox-title">' + escapeHtml(album.name) + '</span>' +
                '<span class="lib-checkbox-badge">' + (album.bookCount || 0) + '</span>' +
                '</div>' +
                '</label>';
        }).join('');
    }

    function openBookAlbums(bookId) {
        byId('book-albums-book-id').value = bookId;
        byId('quick-album-name').value = '';

        Promise.all([
            loadAlbums(),
            fetch('/api/albums/book/' + bookId).then(function (res) { return res.ok ? res.json() : []; })
        ]).then(function (results) {
            renderPicker(results[1]);
            openModal('book-albums-modal-backdrop');
        }).catch(function (err) {
            console.error('Book albums load error:', err);
            window.alert(t('album.error'));
        });
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.book-albums-btn');
        if (btn) openBookAlbums(btn.getAttribute('data-book-id'));
    });

    var quickCreateBtn = byId('quick-album-create-btn');
    if (quickCreateBtn) {
        quickCreateBtn.addEventListener('click', function () {
            var input = byId('quick-album-name');
            var name = input.value.trim();
            if (!name) return;

            var checked = collectCheckedAlbumIds();
            quickCreateBtn.disabled = true;

            sendJson('/api/albums', 'POST', { name: name })
                .then(function (res) {
                    if (!res.ok) throw new Error('Create failed');
                    return res.json();
                })
                .then(function (created) {
                    checked.push(created.id);
                    input.value = '';
                    return loadAlbums().then(function () { renderPicker(checked); });
                })
                .catch(function (err) {
                    console.error('Quick album create error:', err);
                    window.alert(t('album.error'));
                })
                .finally(function () {
                    quickCreateBtn.disabled = false;
                });
        });
    }

    var booksAlbumsSaveBtn = byId('book-albums-save-btn');
    if (booksAlbumsSaveBtn) {
        booksAlbumsSaveBtn.addEventListener('click', function () {
            var bookId = byId('book-albums-book-id').value;
            if (!bookId) return;

            booksAlbumsSaveBtn.disabled = true;

            sendJson('/api/albums/book/' + bookId, 'POST', { albumIds: collectCheckedAlbumIds() })
                .then(function (res) {
                    if (!res.ok) throw new Error('Save failed');
                    closeModal('book-albums-modal-backdrop');
                    return loadAlbums();
                })
                .catch(function (err) {
                    console.error('Book albums save error:', err);
                    window.alert(t('album.error'));
                })
                .finally(function () {
                    booksAlbumsSaveBtn.disabled = false;
                });
        });
    }

    var renameForm = byId('book-rename-form');
    var renameBookIdInput = byId('rename-book-id');
    var renameTitleInput = byId('rename-book-title-input');
    var renameAuthorInput = byId('rename-book-author-input');
    var renameSaveBtn = byId('rename-book-save-btn');

    document.addEventListener('click', function (e) {
        var renameBtn = e.target.closest('.book-rename-btn');
        if (!renameBtn || !renameForm) return;

        renameBookIdInput.value = renameBtn.getAttribute('data-book-id') || '';
        renameTitleInput.value = renameBtn.getAttribute('data-book-title') || '';
        renameAuthorInput.value = renameBtn.getAttribute('data-book-author') || '';
        openModal('book-rename-modal-backdrop');
        renameTitleInput.focus();
    });

    if (renameForm) {
        renameForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var bookId = renameBookIdInput.value;
            var newTitle = (renameTitleInput.value || '').trim();
            var newAuthor = (renameAuthorInput.value || '').trim();
            if (!bookId || !newTitle) return;

            renameSaveBtn.disabled = true;

            sendJson('/api/books/' + bookId + '/rename', 'PUT', { title: newTitle, author: newAuthor })
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

                    closeModal('book-rename-modal-backdrop');
                    return loadAlbums();
                })
                .catch(function (err) {
                    console.error('Rename error:', err);
                    window.alert(t('album.error'));
                })
                .finally(function () {
                    renameSaveBtn.disabled = false;
                });
        });
    }

    document.addEventListener('dualread:languagechange', function () {
        renderAlbums();
        populateBookFilter(allVocabItems);
        renderVocabularyList(allVocabItems);
    });

    loadVocabulary();
    loadAlbums();
});
