let currentPage = 1;
const itemsPerPage = 10;

// Admin authentication
function login() {
    const password = document.getElementById('adminPassword').value;
    if (!password) {
        showAlert('Please enter password', 'warning');
        return;
    }

    // In a real app, this would be verified server-side
    localStorage.setItem('adminAuthenticated', 'true');
    localStorage.setItem('adminPassword', password);
    
    document.getElementById('loginSection').classList.add('d-none');
    document.getElementById('adminPanel').classList.remove('d-none');
    
    loadVideos();
}

function logout() {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminPassword');
    location.reload();
}

// Check if already logged in
if (localStorage.getItem('adminAuthenticated')) {
    document.getElementById('loginSection').classList.add('d-none');
    document.getElementById('adminPanel').classList.remove('d-none');
    loadVideos();
}

// Upload functionality
async function uploadLink() {
    const driveLink = document.getElementById('driveLink').value;
    const fileName = document.getElementById('fileName').value;
    const adminPassword = localStorage.getItem('adminPassword');

    if (!driveLink) {
        showAlert('Please enter a drive link', 'warning');
        return;
    }

    if (!driveLink.includes('drive.google.com')) {
        showAlert('Please enter a valid Google Drive link', 'warning');
        return;
    }

    // Show progress
    const progressSection = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const hostStatus = document.getElementById('hostStatus');
    
    progressSection.classList.remove('d-none');
    progressBar.style.width = '0%';
    progressBar.textContent = 'Starting upload...';
    hostStatus.innerHTML = 'Initializing upload to all hosts...';

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                driveLink,
                fileName,
                adminPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Upload started successfully!', 'success');
            
            // Update progress
            progressBar.style.width = '100%';
            progressBar.textContent = 'Upload initiated';
            hostStatus.innerHTML = `
                <div class="text-success">
                    <i class="fas fa-check-circle"></i> Upload started to all hosts
                </div>
                <div class="mt-2">
                    <strong>Page URL:</strong> 
                    <a href="${result.pageUrl}" target="_blank">${result.pageUrl}</a>
                    <button onclick="copyToClipboard('${result.pageUrl}')" class="btn btn-sm btn-outline-secondary ms-2">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            `;

            // Clear form
            document.getElementById('driveLink').value = '';
            document.getElementById('fileName').value = '';
            
            // Reload videos list
            setTimeout(loadVideos, 2000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('Upload failed: ' + error.message, 'danger');
        progressBar.style.width = '0%';
        progressBar.textContent = 'Upload failed';
        hostStatus.innerHTML = `<div class="text-danger"><i class="fas fa-exclamation-circle"></i> Upload failed</div>`;
    }
}

// Load videos list
async function loadVideos(page = 1) {
    try {
        const response = await fetch(`/api/pages?page=${page}&limit=${itemsPerPage}`);
        const data = await response.json();

        if (data.success) {
            displayVideos(data.videos);
            setupPagination(data.totalPages, page);
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        showAlert('Failed to load videos', 'danger');
    }
}

function displayVideos(videos) {
    const container = document.getElementById('videosList');
    
    if (videos.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">No videos uploaded yet</div>';
        return;
    }

    container.innerHTML = videos.map(video => `
        <div class="video-item card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h6 class="mb-1">${video.fileName}</h6>
                        <small class="text-muted">Slug: ${video.slug}</small>
                        <div class="mt-2">
                            ${getHostStatusBadges(video.hosts)}
                        </div>
                    </div>
                    <div class="col-md-4">
                        <small class="text-muted">Created: ${formatDate(video.createdAt)}</small>
                    </div>
                    <div class="col-md-2 text-end">
                        <button onclick="copyToClipboard('${getBaseUrl()}/player.html?slug=${video.slug}')" 
                                class="btn btn-sm btn-outline-primary copy-btn" title="Copy Page Link">
                            <i class="fas fa-copy"></i>
                        </button>
                        <a href="/player.html?slug=${video.slug}" target="_blank" 
                           class="btn btn-sm btn-outline-success" title="Open Page">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getHostStatusBadges(hosts) {
    const hostNames = ['streamhg', 'earnvids', 'filemoon'];
    return hostNames.map(host => {
        const hostData = hosts[host];
        const status = hostData?.status || 'pending';
        const statusClass = `status-${status}`;
        
        return `<span class="host-status ${statusClass} me-1">${host}: ${status}</span>`;
    }).join('');
}

function setupPagination(totalPages, currentPage) {
    const container = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<ul class="pagination justify-content-center">';
    
    // Previous button
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
    </li>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>`;
    }
    
    // Next button
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
    </li>`;
    
    html += '</ul>';
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    loadVideos(page);
}
