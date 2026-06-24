// Nature's Crates - WhatsApp Community Member Manager

(function () {
    'use strict';

    // ==================== State Management ====================
    const STORAGE_KEYS = {
        MEMBERS: 'nc_members',
        INVITE_LINK: 'nc_invite_link',
        MESSAGE_TEMPLATE: 'nc_message_template'
    };

    const DEFAULT_MESSAGE = `Hello {{Name}},

🌿 Welcome to Nature's Crates Rewards Club!

Join our exclusive community to receive:
🎁 Member-only offers
🥜 Healthy living tips
⭐ Early access to new products
🎉 Giveaways and rewards

Join here:
{{CommunityInviteLink}}

Regards,
Nature's Crates Team`;

    let members = loadMembers();
    let pendingUpload = [];

    // ==================== Local Storage ====================
    function loadMembers() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading members:', e);
            return [];
        }
    }

    function saveMembers() {
        try {
            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
        } catch (e) {
            console.error('Error saving members:', e);
        }
    }

    function getInviteLink() {
        return localStorage.getItem(STORAGE_KEYS.INVITE_LINK) || '';
    }

    function setInviteLink(link) {
        localStorage.setItem(STORAGE_KEYS.INVITE_LINK, link);
    }

    function getMessageTemplate() {
        return localStorage.getItem(STORAGE_KEYS.MESSAGE_TEMPLATE) || DEFAULT_MESSAGE;
    }

    function setMessageTemplate(template) {
        localStorage.setItem(STORAGE_KEYS.MESSAGE_TEMPLATE, template);
    }

    // ==================== Navigation ====================
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');

            if (targetSection === 'dashboard') updateDashboard();
            if (targetSection === 'members') renderMembers();
        });
    });

    // ==================== Dashboard ====================
    function updateDashboard() {
        const total = members.length;
        const pending = members.filter(m => m.status === 'Pending').length;
        const invited = members.filter(m => m.status === 'Invited').length;
        const joined = members.filter(m => m.status === 'Joined').length;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-invited').textContent = invited;
        document.getElementById('stat-joined').textContent = joined;
    }

    // ==================== CSV Upload ====================
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('csv-file-input');
    const uploadResults = document.getElementById('upload-results');
    const confirmBtn = document.getElementById('confirm-upload');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            processCSV(file);
        } else {
            alert('Please upload a valid CSV file.');
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processCSV(file);
    });

    function processCSV(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            parseCSV(text);
        };
        reader.readAsText(file);
    }

    function parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
            alert('CSV file is empty or has no data rows.');
            return;
        }

        // Parse header
        const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const nameIdx = header.findIndex(h => h === 'name' || h === 'full name' || h === 'customer name');
        const mobileIdx = header.findIndex(h => h === 'mobile number' || h === 'mobile' || h === 'phone' || h === 'phone number' || h === 'phone no' || h === 'contact' || h === 'contact number');

        if (nameIdx === -1 || mobileIdx === -1) {
            alert('CSV must contain "Name" and "Mobile Number" columns.');
            return;
        }

        const valid = [];
        const invalid = [];
        const seen = new Set();
        let duplicates = 0;

        // Also check existing members for duplicates
        const existingNumbers = new Set(members.map(m => normalizeMobile(m.mobile)));

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length <= Math.max(nameIdx, mobileIdx)) {
                invalid.push({ row: i + 1, reason: 'Missing columns', name: cols[nameIdx] || '', mobile: cols[mobileIdx] || '' });
                continue;
            }

            const name = cols[nameIdx].trim();
            const mobile = cols[mobileIdx].trim();

            if (!name) {
                invalid.push({ row: i + 1, reason: 'Missing name', name, mobile });
                continue;
            }

            if (!isValidMobile(mobile)) {
                invalid.push({ row: i + 1, reason: 'Invalid mobile number', name, mobile });
                continue;
            }

            const normalized = normalizeMobile(mobile);

            if (seen.has(normalized) || existingNumbers.has(normalized)) {
                duplicates++;
                continue;
            }

            seen.add(normalized);
            valid.push({ name, mobile: normalized, status: 'Pending' });
        }

        pendingUpload = valid;
        showUploadResults(valid.length, invalid.length, duplicates, invalid);
    }

    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    function normalizeMobile(number) {
        // Remove all non-digit characters except leading +
        let cleaned = number.replace(/[^\d+]/g, '');
        // If starts with +, keep it; otherwise just digits
        if (!cleaned.startsWith('+')) {
            cleaned = cleaned.replace(/\D/g, '');
        }
        return cleaned;
    }

    function isValidMobile(number) {
        const cleaned = normalizeMobile(number);
        // Must be at least 7 digits and at most 15 (E.164 standard)
        const digitsOnly = cleaned.replace(/\D/g, '');
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }

    function showUploadResults(validCount, invalidCount, duplicateCount, invalidRecords) {
        uploadResults.classList.remove('hidden');
        document.getElementById('valid-count').textContent = validCount;
        document.getElementById('invalid-count').textContent = invalidCount;
        document.getElementById('duplicate-count').textContent = duplicateCount;

        const invalidDetails = document.getElementById('invalid-details');
        const invalidList = document.getElementById('invalid-list');

        if (invalidRecords.length > 0) {
            invalidDetails.classList.remove('hidden');
            invalidList.innerHTML = invalidRecords.map(r =>
                `<li>Row ${r.row}: ${r.name || '(no name)'} - ${r.mobile || '(no number)'} — ${r.reason}</li>`
            ).join('');
        } else {
            invalidDetails.classList.add('hidden');
        }

        confirmBtn.disabled = validCount === 0;
    }

    confirmBtn.addEventListener('click', () => {
        if (pendingUpload.length === 0) return;

        // Add unique IDs
        const maxId = members.reduce((max, m) => Math.max(max, m.id || 0), 0);
        pendingUpload.forEach((m, i) => {
            m.id = maxId + i + 1;
        });

        const addedCount = pendingUpload.length;
        members = [...members, ...pendingUpload];
        saveMembers();
        pendingUpload = [];

        uploadResults.classList.add('hidden');
        fileInput.value = '';
        alert(`Successfully added ${addedCount} members!`);
        updateDashboard();
    });

    // ==================== Members Table ====================
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const membersTableBody = document.getElementById('members-tbody');
    const noMembers = document.getElementById('no-members');
    const membersTable = document.getElementById('members-table');

    searchInput.addEventListener('input', renderMembers);
    filterStatus.addEventListener('change', renderMembers);

    function renderMembers() {
        const search = searchInput.value.toLowerCase().trim();
        const statusFilter = filterStatus.value;

        let filtered = members;

        if (search) {
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(search) ||
                m.mobile.includes(search)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(m => m.status === statusFilter);
        }

        if (filtered.length === 0) {
            membersTable.classList.add('hidden');
            noMembers.classList.remove('hidden');
            noMembers.querySelector('p').textContent = members.length === 0
                ? 'No members found. Upload a CSV to get started.'
                : 'No members match your search/filter criteria.';
        } else {
            membersTable.classList.remove('hidden');
            noMembers.classList.add('hidden');

            membersTableBody.innerHTML = filtered.map((m, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${escapeHtml(m.name)}</td>
                    <td>${escapeHtml(m.mobile)}</td>
                    <td><span class="status-badge ${m.status.toLowerCase()}">${m.status}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn invite" onclick="sendInvite(${m.id})" title="Open WhatsApp">💬 Invite</button>
                            ${m.status === 'Pending' ? `<button class="action-btn mark-invited" onclick="updateStatus(${m.id}, 'Invited')">Mark Invited</button>` : ''}
                            ${m.status !== 'Joined' ? `<button class="action-btn mark-joined" onclick="updateStatus(${m.id}, 'Joined')">Mark Joined</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Global functions for inline event handlers
    window.sendInvite = function (memberId) {
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        const inviteLink = getInviteLink();
        if (!inviteLink) {
            alert('Please set the WhatsApp Community Invite Link in Settings first.');
            return;
        }

        const template = getMessageTemplate();
        const message = template
            .replace(/\{\{Name\}\}/g, member.name)
            .replace(/\{\{CommunityInviteLink\}\}/g, inviteLink);

        // Format phone number for WhatsApp API
        let phone = member.mobile.replace(/[^\d]/g, '');

        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    window.updateStatus = function (memberId, newStatus) {
        const member = members.find(m => m.id === memberId);
        if (member) {
            member.status = newStatus;
            saveMembers();
            renderMembers();
            updateDashboard();
        }
    };

    // ==================== Bulk Invite ====================
    document.getElementById('bulk-invite-btn').addEventListener('click', () => {
        const inviteLink = getInviteLink();
        if (!inviteLink) {
            alert('Please set the WhatsApp Community Invite Link in Settings first.');
            return;
        }

        const pendingMembers = members.filter(m => m.status === 'Pending');
        if (pendingMembers.length === 0) {
            alert('No pending members to invite.');
            return;
        }

        const confirm = window.confirm(
            `This will open WhatsApp for ${pendingMembers.length} pending members. Continue?\n\n` +
            `Note: Due to browser limitations, links will open one at a time. ` +
            `Click OK to generate invite links.`
        );

        if (!confirm) return;

        // Open WhatsApp for each pending member with a small delay
        pendingMembers.forEach((member, index) => {
            setTimeout(() => {
                const template = getMessageTemplate();
                const message = template
                    .replace(/\{\{Name\}\}/g, member.name)
                    .replace(/\{\{CommunityInviteLink\}\}/g, inviteLink);

                let phone = member.mobile.replace(/[^\d]/g, '');
                const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                window.open(waUrl, '_blank');
            }, index * 500);
        });
    });

    // ==================== Export ====================
    document.getElementById('export-btn').addEventListener('click', () => {
        if (members.length === 0) {
            alert('No members to export.');
            return;
        }

        const headers = ['Name', 'Mobile Number', 'Status'];
        const rows = members.map(m => [
            `"${m.name.replace(/"/g, '""')}"`,
            `"${m.mobile}"`,
            `"${m.status}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `natures-crates-members-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // ==================== Settings ====================
    const inviteLinkInput = document.getElementById('invite-link');
    const messageTemplateInput = document.getElementById('message-template');
    const saveSettingsBtn = document.getElementById('save-settings');
    const settingsSaved = document.getElementById('settings-saved');

    // Load saved settings
    inviteLinkInput.value = getInviteLink();
    messageTemplateInput.value = getMessageTemplate();

    saveSettingsBtn.addEventListener('click', () => {
        setInviteLink(inviteLinkInput.value.trim());
        setMessageTemplate(messageTemplateInput.value);

        settingsSaved.classList.remove('hidden');
        setTimeout(() => settingsSaved.classList.add('hidden'), 3000);
    });

    // Clear all data
    document.getElementById('clear-data').addEventListener('click', () => {
        if (window.confirm('Are you sure you want to delete ALL members? This cannot be undone.')) {
            members = [];
            saveMembers();
            updateDashboard();
            renderMembers();
            alert('All members have been cleared.');
        }
    });

    // ==================== Initialize ====================
    updateDashboard();
    renderMembers();

})();
