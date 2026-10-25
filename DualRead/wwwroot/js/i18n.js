(function () {
    var dictionary = {
        en: {
            'lib.title': 'Library',
            'lib.allBooks': 'All books ({n})',
            'lib.keyTitle': 'Click to copy your Recovery Key',
            'lib.keyLabel': 'Recovery Key:',
            'lib.keyCopied': 'Copied!',
            'lib.vocab': 'Vocabulary',
            'lib.upload': '+ Upload',
            'lib.tabBooks': 'All books',
            'lib.tabAlbums': 'Albums',
            'lib.empty': 'No books yet. Upload your first EPUB, PDF or DOCX to get started.',
            'lib.read': 'Read',
            'lib.rename': 'Rename',
            'lib.renameTitle': 'Rename book',
            'lib.delete': 'Delete',
            'lib.deleteTitle': 'Delete book',
            'lib.deleteConfirm': 'Delete this book from your library?',
            'lib.addAlbum': 'Album',
            'lib.addAlbumTitle': 'Add to album',
            'lib.langAria': 'Language',
            'lib.searchPlaceholder': 'Search title or author...',
            'lib.searchClear': 'Clear search',
            'lib.sortAria': 'Sort books',
            'lib.sortNewest': 'Newest',
            'lib.sortOldest': 'Oldest',
            'lib.sortTitle': 'Title A-Z',
            'lib.sortTitleDesc': 'Title Z-A',
            'lib.sortAuthor': 'Author A-Z',
            'lib.viewAria': 'View mode',
            'lib.viewGrid': 'Grid view',
            'lib.viewList': 'List view',
            'lib.noResults': 'No matching books.',
            'lib.group.epub': 'EPUB books',
            'lib.group.pdf': 'PDF books',
            'lib.group.docx': 'DOCX books',
            'lib.statusReading': 'Reading',
            'lib.statusUnread': 'Not started',
            'modal.cancel': 'Cancel',
            'modal.save': 'Save',
            'modal.close': 'Close',
            'rename.title': 'Rename book',
            'rename.titleLabel': 'Title *',
            'rename.authorLabel': 'Author (optional)',
            'vocab.title': 'Vocabulary',
            'vocab.filter': 'Filter by book',
            'vocab.all': 'All books',
            'vocab.unknownBook': '(Unknown book)',
            'vocab.empty': 'Nothing saved yet. While reading, select a word and press "Save to vocabulary" in the quick translate popup.',
            'vocab.emptyBook': 'No saved words for this book yet.',
            'vocab.deleteAria': 'Delete vocabulary item',
            'album.create': '+ New album',
            'album.emptyTitle': 'No albums yet',
            'album.emptyText': 'Create an album to group your books.',
            'album.formCreateTitle': 'New album',
            'album.formRenameTitle': 'Rename album',
            'album.nameLabel': 'Name *',
            'album.descLabel': 'Description (optional)',
            'album.books': '{n} book(s)',
            'album.rename': 'Rename',
            'album.addBooks': '+ Add books',
            'album.addBooksTitle': 'Add books to album',
            'album.addBooksNone': 'All your books are already in this album.',
            'album.addBooksConfirm': 'Add',
            'album.delete': 'Delete',
            'album.deleteConfirm': 'Delete this album? The books inside will not be deleted.',
            'album.removeBook': 'Remove',
            'album.removeBookTitle': 'Remove from this album',
            'album.slideEmpty': 'This album is empty. Use the Album button on a book to add it here.',
            'album.pickerTitle': 'Add to albums',
            'album.pickerNone': 'You have no albums yet. Create one below.',
            'album.quickPlaceholder': 'New album name...',
            'album.quickCreate': 'Create',
            'album.error': 'Something went wrong. Please try again.',
            'reader.back': '\u2190 Library',
            'reader.chapters': 'Chapters',
            'reader.prev': 'Previous',
            'reader.next': 'Next',
            'reader.prevTitle': 'Previous chapter',
            'reader.nextTitle': 'Next chapter',
            'reader.bookmarks': 'Bookmarks',
            'reader.bookmarkEmpty': 'No bookmarks yet. Press B or tap the star to save this page.',
            'reader.bookmarkTitle': 'Bookmark this page (B)',
            'reader.positionLabel': 'Position {n}%',
            'reader.menu': 'Menu',
            'reader.settings': 'Settings',
            'reader.close': 'Close',
            'reader.emptyContent': 'This file could not be read - it may be damaged or in an unsupported format.',
            'reader.translate': 'Translate',
            'reader.translateTitle': 'Translate (T)',
            'reader.export': 'Export translation',
            'reader.exportTitle': 'Export translation (.docx)',
            'setting.darkMode': 'Dark Mode',
            'setting.language': 'Language',
            'setting.font': 'Font',
            'setting.fontSize': 'Font Size',
            'setting.lineHeight': 'Line Height',
            'setting.letterSpacing': 'Letter Spacing',
            'setting.ttsVoice': 'TTS Voice',
            'tr.placeholder': 'Type your translation...',
            'tr.loading': 'Loading translations...',
            'tr.loadError': 'Could not load translations. Reopen your library with your Recovery Key.',
            'tr.noParagraphs': 'This chapter has no text paragraphs to translate.',
            'tr.prevChapter': '\u2039 Previous chapter',
            'tr.nextChapter': 'Next chapter \u203a',
            'tr.saving': 'Saving...',
            'tr.saved': 'Saved',
            'tr.saveError': 'Save failed, retrying on next edit',
            'tts.toggle': 'Audio',
            'tts.toggleTitle': 'Read aloud (A)',
            'tts.playPause': 'Play / Pause',
            'tts.prev': 'Previous paragraph',
            'tts.next': 'Next paragraph',
            'tts.speed': 'Speech speed',
            'tts.stop': 'Close player',
            'tts.voiceAuto': 'Auto (recommended)',
            'qt.title': 'Quick translate',
            'qt.save': 'Save to vocabulary',
            'qt.saved': 'Saved',
            'qt.error': 'Could not translate right now. Please try again later.',
            'qt.saveError': 'Could not save to vocabulary. Please try again later.',
            'err.chapter': 'Could not load this chapter. Please try again.',
            'err.bookmarkAdd': 'Could not add the bookmark. Please try again.',
            'err.bookmarkDelete': 'Could not delete the bookmark. Please try again.'
        },
        vi: {
            'lib.title': 'Th\u01b0 vi\u1ec7n',
            'lib.allBooks': 'T\u1ea5t c\u1ea3 s\u00e1ch ({n} s\u00e1ch)',
            'lib.keyTitle': 'B\u1ea5m \u0111\u1ec3 copy Recovery Key',
            'lib.keyLabel': 'Recovery Key:',
            'lib.keyCopied': '\u0110\u00e3 copy!',
            'lib.vocab': 'S\u1ed5 t\u1eeb v\u1ef1ng',
            'lib.upload': '+ T\u1ea3i s\u00e1ch m\u1edbi',
            'lib.tabBooks': 'T\u1ea5t c\u1ea3 s\u00e1ch',
            'lib.tabAlbums': 'Album',
            'lib.empty': 'Ch\u01b0a c\u00f3 s\u00e1ch n\u00e0o. T\u1ea3i l\u00ean EPUB, PDF ho\u1eb7c DOCX \u0111\u1ea7u ti\u00ean \u0111\u1ec3 b\u1eaft \u0111\u1ea7u.',
            'lib.read': '\u0110\u1ecdc',
            'lib.rename': '\u0110\u1ed5i t\u00ean',
            'lib.renameTitle': '\u0110\u1ed5i t\u00ean s\u00e1ch',
            'lib.delete': 'X\u00f3a',
            'lib.deleteTitle': 'X\u00f3a s\u00e1ch',
            'lib.deleteConfirm': 'B\u1ea1n c\u00f3 ch\u1eafc ch\u1eafn mu\u1ed1n x\u00f3a s\u00e1ch n\u00e0y kh\u1ecfi th\u01b0 vi\u1ec7n?',
            'lib.addAlbum': 'Album',
            'lib.addAlbumTitle': 'Th\u00eam v\u00e0o album',
            'lib.langAria': 'Ng\u00f4n ng\u1eef',
            'lib.searchPlaceholder': 'T\u00ecm theo t\u00ean s\u00e1ch ho\u1eb7c t\u00e1c gi\u1ea3...',
            'lib.searchClear': 'X\u00f3a t\u00ecm ki\u1ebfm',
            'lib.sortAria': 'S\u1eafp x\u1ebfp s\u00e1ch',
            'lib.sortNewest': 'M\u1edbi nh\u1ea5t',
            'lib.sortOldest': 'C\u0169 nh\u1ea5t',
            'lib.sortTitle': 'T\u00ean A-Z',
            'lib.sortTitleDesc': 'T\u00ean Z-A',
            'lib.sortAuthor': 'T\u00e1c gi\u1ea3 A-Z',
            'lib.viewAria': 'Ki\u1ec3u hi\u1ec3n th\u1ecb',
            'lib.viewGrid': 'D\u1ea1ng l\u01b0\u1edbi',
            'lib.viewList': 'D\u1ea1ng danh s\u00e1ch',
            'lib.noResults': 'Kh\u00f4ng t\u00ecm th\u1ea5y s\u00e1ch ph\u00f9 h\u1ee3p.',
            'lib.group.epub': 'S\u00e1ch EPUB',
            'lib.group.pdf': 'S\u00e1ch PDF',
            'lib.group.docx': 'S\u00e1ch DOCX',
            'lib.statusReading': '\u0110ang \u0111\u1ecdc',
            'lib.statusUnread': 'Ch\u01b0a \u0111\u1ecdc',
            'modal.cancel': 'H\u1ee7y',
            'modal.save': 'L\u01b0u',
            'modal.close': '\u0110\u00f3ng',
            'rename.title': '\u0110\u1ed5i t\u00ean s\u00e1ch',
            'rename.titleLabel': 'T\u00ean s\u00e1ch *',
            'rename.authorLabel': 'T\u00e1c gi\u1ea3 (t\u00f9y ch\u1ecdn)',
            'vocab.title': 'S\u1ed5 t\u1eeb v\u1ef1ng',
            'vocab.filter': 'L\u1ecdc theo s\u00e1ch',
            'vocab.all': 'T\u1ea5t c\u1ea3 c\u00e1c s\u00e1ch',
            'vocab.unknownBook': '(Kh\u00f4ng r\u00f5 s\u00e1ch)',
            'vocab.empty': 'Ch\u01b0a l\u01b0u t\u1eeb n\u00e0o. Khi \u0111\u1ecdc s\u00e1ch, b\u00f4i \u0111en m\u1ed9t t\u1eeb r\u1ed3i b\u1ea5m "L\u01b0u v\u00e0o s\u1ed5 t\u1eeb v\u1ef1ng" \u1edf popup d\u1ecbch nhanh.',
            'vocab.emptyBook': 'Ch\u01b0a c\u00f3 t\u1eeb n\u00e0o \u0111\u00e3 l\u01b0u cho s\u00e1ch n\u00e0y.',
            'vocab.deleteAria': 'X\u00f3a t\u1eeb v\u1ef1ng',
            'album.create': '+ T\u1ea1o album',
            'album.emptyTitle': 'Ch\u01b0a c\u00f3 album n\u00e0o',
            'album.emptyText': 'T\u1ea1o album \u0111\u1ec3 nh\u00f3m c\u00e1c s\u00e1ch c\u1ee7a b\u1ea1n.',
            'album.formCreateTitle': 'Album m\u1edbi',
            'album.formRenameTitle': '\u0110\u1ed5i t\u00ean album',
            'album.nameLabel': 'T\u00ean album *',
            'album.descLabel': 'M\u00f4 t\u1ea3 (t\u00f9y ch\u1ecdn)',
            'album.books': '{n} s\u00e1ch',
            'album.rename': '\u0110\u1ed5i t\u00ean',
            'album.addBooks': '+ Th\u00eam s\u00e1ch',
            'album.addBooksTitle': 'Th\u00eam s\u00e1ch v\u00e0o album',
            'album.addBooksNone': 'T\u1ea5t c\u1ea3 s\u00e1ch c\u1ee7a b\u1ea1n \u0111\u00e3 c\u00f3 trong album n\u00e0y.',
            'album.addBooksConfirm': 'Th\u00eam',
            'album.delete': 'X\u00f3a',
            'album.deleteConfirm': 'X\u00f3a album n\u00e0y? C\u00e1c s\u00e1ch b\u00ean trong s\u1ebd kh\u00f4ng b\u1ecb x\u00f3a.',
            'album.removeBook': 'G\u1ee1',
            'album.removeBookTitle': 'G\u1ee1 kh\u1ecfi album n\u00e0y',
            'album.slideEmpty': 'Album tr\u1ed1ng. D\u00f9ng n\u00fat Album tr\u00ean m\u1ed9t cu\u1ed1n s\u00e1ch \u0111\u1ec3 th\u00eam v\u00e0o \u0111\u00e2y.',
            'album.pickerTitle': 'Th\u00eam v\u00e0o album',
            'album.pickerNone': 'B\u1ea1n ch\u01b0a c\u00f3 album n\u00e0o. T\u1ea1o m\u1ed9t album b\u00ean d\u01b0\u1edbi.',
            'album.quickPlaceholder': 'T\u00ean album m\u1edbi...',
            'album.quickCreate': 'T\u1ea1o',
            'album.error': 'C\u00f3 l\u1ed7i x\u1ea3y ra. Vui l\u00f2ng th\u1eed l\u1ea1i.',
            'reader.back': '\u2190 Th\u01b0 vi\u1ec7n',
            'reader.chapters': 'Ch\u01b0\u01a1ng',
            'reader.prev': 'Tr\u01b0\u1edbc',
            'reader.next': 'Sau',
            'reader.prevTitle': 'Ch\u01b0\u01a1ng tr\u01b0\u1edbc',
            'reader.nextTitle': 'Ch\u01b0\u01a1ng sau',
            'reader.bookmarks': '\u0110\u00e1nh d\u1ea5u',
            'reader.bookmarkEmpty': 'Ch\u01b0a c\u00f3 bookmark n\u00e0o. Nh\u1ea5n ph\u00edm B ho\u1eb7c b\u1ea5m n\u00fat \u0111\u00e1nh d\u1ea5u \u0111\u1ec3 l\u01b0u trang n\u00e0y.',
            'reader.bookmarkTitle': '\u0110\u00e1nh d\u1ea5u trang n\u00e0y (B)',
            'reader.positionLabel': 'V\u1ecb tr\u00ed {n}%',
            'reader.menu': 'Menu',
            'reader.settings': 'C\u00e0i \u0111\u1eb7t',
            'reader.close': '\u0110\u00f3ng',
            'reader.emptyContent': 'Kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c n\u1ed9i dung file n\u00e0y - file c\u00f3 th\u1ec3 b\u1ecb h\u1ecfng ho\u1eb7c kh\u00f4ng \u0111\u00fang \u0111\u1ecbnh d\u1ea1ng.',
            'reader.translate': 'D\u1ecbch',
            'reader.translateTitle': 'D\u1ecbch (T)',
            'reader.export': 'Xu\u1ea5t b\u1ea3n d\u1ecbch',
            'reader.exportTitle': 'Xu\u1ea5t b\u1ea3n d\u1ecbch (.docx)',
            'setting.darkMode': 'Ch\u1ebf \u0111\u1ed9 t\u1ed1i',
            'setting.language': 'Ng\u00f4n ng\u1eef',
            'setting.font': 'Ph\u00f4ng ch\u1eef',
            'setting.fontSize': 'C\u1ee1 ch\u1eef',
            'setting.lineHeight': 'Gi\u00e3n d\u00f2ng',
            'setting.letterSpacing': 'Kho\u1ea3ng c\u00e1ch ch\u1eef',
            'setting.ttsVoice': 'Gi\u1ecdng \u0111\u1ecdc',
            'tr.placeholder': 'Nh\u1eadp b\u1ea3n d\u1ecbch...',
            'tr.loading': '\u0110ang t\u1ea3i b\u1ea3n d\u1ecbch...',
            'tr.loadError': 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c b\u1ea3n d\u1ecbch. H\u00e3y m\u1edf l\u1ea1i th\u01b0 vi\u1ec7n b\u1eb1ng Recovery Key c\u1ee7a b\u1ea1n.',
            'tr.noParagraphs': 'Ch\u01b0\u01a1ng n\u00e0y kh\u00f4ng c\u00f3 \u0111o\u1ea1n v\u0103n b\u1ea3n n\u00e0o \u0111\u1ec3 d\u1ecbch.',
            'tr.prevChapter': '\u2039 Ch\u01b0\u01a1ng tr\u01b0\u1edbc',
            'tr.nextChapter': 'Ch\u01b0\u01a1ng sau \u203a',
            'tr.saving': '\u0110ang l\u01b0u...',
            'tr.saved': '\u0110\u00e3 l\u01b0u',
            'tr.saveError': 'L\u1ed7i l\u01b0u, s\u1ebd th\u1eed l\u1ea1i khi s\u1eeda ti\u1ebfp',
            'tts.toggle': '\u00c2m thanh',
            'tts.toggleTitle': '\u0110\u1ecdc to (A)',
            'tts.playPause': 'Ph\u00e1t / T\u1ea1m d\u1eebng',
            'tts.prev': '\u0110o\u1ea1n tr\u01b0\u1edbc',
            'tts.next': '\u0110o\u1ea1n sau',
            'tts.speed': 'T\u1ed1c \u0111\u1ed9 \u0111\u1ecdc',
            'tts.stop': '\u0110\u00f3ng tr\u00ecnh ph\u00e1t',
            'tts.voiceAuto': 'T\u1ef1 \u0111\u1ed9ng (khuy\u00ean d\u00f9ng)',
            'qt.title': 'D\u1ecbch nhanh',
            'qt.save': 'L\u01b0u v\u00e0o s\u1ed5 t\u1eeb v\u1ef1ng',
            'qt.saved': '\u0110\u00e3 l\u01b0u',
            'qt.error': 'Kh\u00f4ng d\u1ecbch \u0111\u01b0\u1ee3c l\u00fac n\u00e0y, th\u1eed l\u1ea1i sau.',
            'qt.saveError': 'Kh\u00f4ng l\u01b0u \u0111\u01b0\u1ee3c v\u00e0o s\u1ed5 t\u1eeb v\u1ef1ng, th\u1eed l\u1ea1i sau.',
            'err.chapter': 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c ch\u01b0\u01a1ng n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i.',
            'err.bookmarkAdd': 'Kh\u00f4ng th\u00eam \u0111\u01b0\u1ee3c bookmark. Vui l\u00f2ng th\u1eed l\u1ea1i.',
            'err.bookmarkDelete': 'Kh\u00f4ng x\u00f3a \u0111\u01b0\u1ee3c bookmark. Vui l\u00f2ng th\u1eed l\u1ea1i.'
        }
    };

    var current = 'en';

    function readInitialLanguage() {
        var el = document.getElementById('app-settings');
        if (el) {
            try {
                var parsed = JSON.parse(el.textContent);
                if (parsed && dictionary[parsed.language]) return parsed.language;
            } catch (e) {
            }
        }
        return 'en';
    }

    function t(key, params) {
        var table = dictionary[current] || dictionary.en;
        var text = table[key];
        if (text === undefined) text = dictionary.en[key];
        if (text === undefined) return key;

        if (params) {
            text = text.replace(/\{(\w+)\}/g, function (match, name) {
                return params[name] !== undefined ? params[name] : match;
            });
        }
        return text;
    }

    function readParams(el) {
        var raw = el.getAttribute('data-i18n-params');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function apply(root) {
        var scope = root || document;

        scope.querySelectorAll('[data-i18n]').forEach(function (el) {
            el.textContent = t(el.getAttribute('data-i18n'), readParams(el));
        });
        scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
        });
        scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
        });
        scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
        });

        if (!root) {
            document.documentElement.setAttribute('lang', current);
        }
    }

    function setLanguage(language) {
        current = dictionary[language] ? language : 'en';
        apply();
        document.dispatchEvent(new CustomEvent('dualread:languagechange', { detail: { language: current } }));
    }

    window.DualReadI18n = {
        t: t,
        apply: apply,
        setLanguage: setLanguage,
        getLanguage: function () { return current; }
    };

    current = readInitialLanguage();
    apply();
})();