document.addEventListener('DOMContentLoaded', function () {
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

function alertReaderComingSoon() {
    alert('The reader view is coming in a later milestone - this book was uploaded successfully!');
}
