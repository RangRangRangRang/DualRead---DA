
function initMultiFileUpload(options) {
    const dropzoneEl = options.dropzoneEl;
    const fileInput = options.fileInput;
    const dropzoneLabelEl = options.dropzoneLabelEl;
    const listEl = options.listEl;
    const uploadBtn = options.uploadBtn;
    const defaultLabelText = options.defaultLabelText || 'Drag & drop .epub, .pdf, .docx files here or click to choose (multiple allowed)';

    if (!dropzoneEl || !fileInput || !dropzoneLabelEl || !listEl || !uploadBtn) return;

    const ALLOWED_EXTENSIONS = ['.epub', '.pdf', '.docx'];

    let selectedFiles = [];     let errorResetTimer = null;

    function fileKey(file) {
        return file.name + '::' + file.size + '::' + file.lastModified;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function isSupportedFile(file) {
        const lower = file.name.toLowerCase();
        return ALLOWED_EXTENSIONS.some(ext => lower.endsWith(ext));
    }

    function showTransientMessage(message, isError) {
        clearTimeout(errorResetTimer);
        dropzoneLabelEl.textContent = message;
        dropzoneLabelEl.classList.toggle('dropzone-text-error', !!isError);
        errorResetTimer = setTimeout(updateDropzoneLabel, 2600);
    }

    function updateDropzoneLabel() {
        dropzoneLabelEl.classList.remove('dropzone-text-error');
        if (selectedFiles.length === 0) {
            dropzoneLabelEl.textContent = defaultLabelText;
        } else {
            dropzoneLabelEl.textContent = selectedFiles.length + ' file(s) selected - drop more or click to add';
        }
    }

    function syncNativeInput() {
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach(entry => dataTransfer.items.add(entry.file));
        fileInput.files = dataTransfer.files;
    }

    function renderList() {
        listEl.innerHTML = '';
        listEl.hidden = selectedFiles.length === 0;

        selectedFiles.forEach(entry => {
            const item = document.createElement('li');
            item.className = 'upload-file-item';
            item.dataset.key = entry.key;

            const info = document.createElement('div');
            info.className = 'upload-file-info';

            const name = document.createElement('span');
            name.className = 'upload-file-name';
            name.textContent = entry.file.name;
            name.title = entry.file.name;

            const size = document.createElement('span');
            size.className = 'upload-file-size';
            size.textContent = formatFileSize(entry.file.size);

            info.appendChild(name);
            info.appendChild(size);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'upload-file-remove';
            removeBtn.setAttribute('aria-label', 'Remove ' + entry.file.name);
            removeBtn.textContent = '\u00D7';
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                removeFile(entry.key);
            });

            item.appendChild(info);
            item.appendChild(removeBtn);
            listEl.appendChild(item);
        });
    }

    function updateUploadButtonState() {
        if (selectedFiles.length > 0) {
            uploadBtn.removeAttribute('disabled');
        } else {
            uploadBtn.setAttribute('disabled', 'disabled');
        }
    }

    function refresh() {
        syncNativeInput();
        renderList();
        updateUploadButtonState();
        updateDropzoneLabel();
    }

    function removeFile(key) {
        selectedFiles = selectedFiles.filter(entry => entry.key !== key);
        refresh();
    }

    function addFiles(fileList) {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        const rejectedInvalid = [];
        const rejectedDuplicate = [];

        files.forEach(file => {
            if (!isSupportedFile(file)) {
                rejectedInvalid.push(file.name);
                return;
            }
            const key = fileKey(file);
            if (selectedFiles.some(entry => entry.key === key)) {
                rejectedDuplicate.push(file.name);
                return;
            }
            selectedFiles.push({ key, file });
        });

        refresh();

        if (rejectedInvalid.length > 0) {
            showTransientMessage('Only .epub, .pdf, .docx files are supported - skipped: ' + rejectedInvalid.join(', '), true);
        } else if (rejectedDuplicate.length > 0) {
            showTransientMessage('Already added - skipped duplicate: ' + rejectedDuplicate.join(', '), true);
        }
    }

    fileInput.addEventListener('change', (e) => {
        addFiles(e.target.files);
                            });

    ['dragenter', 'dragover'].forEach(evt => {
        dropzoneEl.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzoneEl.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropzoneEl.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzoneEl.classList.remove('dragover');
        });
    });

    dropzoneEl.addEventListener('drop', (e) => {
        const dropped = e.dataTransfer && e.dataTransfer.files;
        if (dropped && dropped.length > 0) {
            addFiles(dropped);
        }
    });

    updateDropzoneLabel();
    updateUploadButtonState();
}
