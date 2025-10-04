let videoData = null;
let currentHost = 'streamhg';

// Initialize player
async function initPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
        document.getElementById('videoTitle').textContent = 'Invalid video link';
        return;
    }

    try {
        const response = await fetch(`/api/pages?slug=${slug}`);
        const data = await response.json();

        if (data.success && data.video) {
            videoData = data.video;
            displayVideoInfo();
            setupHostSelector();
        } else {
            document.getElementById('videoTitle').textContent = 'Video not found';
        }
    } catch (error) {
        console.error('Error loading video:', error);
        document.getElementById('videoTitle').textContent = 'Error loading video';
    }
}

function displayVideoInfo() {
    document.getElementById('videoTitle').textContent = videoData.fileName;
    document.getElementById('videoInfo').textContent = 
        `Uploaded on ${formatDate(videoData.createdAt)}`;
    
    displayHostAvailability();
}

function displayHostAvailability() {
    const container = document.getElementById('hostAvailability');
    const hosts = videoData.hosts;
    
    const availableHosts = Object.keys(hosts).filter(host => 
        hosts[host] && hosts[host].status === 'completed'
    );
    
    if (availableHosts.length === 0) {
        container.innerHTML = '<div class="text-warning">Video is still processing...</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="text-success">
            <i class="fas fa-check-circle"></i> 
            Available on ${availableHosts.length} host(s): ${availableHosts.join(', ')}
        </div>
    `;
}

function setupHostSelector() {
    const buttons = document.querySelectorAll('.host-selector button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Switch host
            currentHost = this.dataset.host;
            if (document.getElementById('videoContainer').classList.contains('d-none') === false) {
                loadVideoPlayer();
            }
        });
    });
}

function playVideo() {
    if (!videoData) {
        showAlert('Video data not loaded', 'warning');
        return;
    }

    const availableHosts = Object.keys(videoData.hosts).filter(host => 
        videoData.hosts[host] && videoData.hosts[host].status === 'completed'
    );

    if (availableHosts.length === 0) {
        showAlert('Video is still processing on all hosts', 'warning');
        return;
    }

    // Set current host to first available if current is not available
    if (!availableHosts.includes(currentHost)) {
        currentHost = availableHosts[0];
        document.querySelectorAll('.host-selector button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.host === currentHost) {
                btn.classList.add('active');
            }
        });
    }

    // Show popup ad (simulated)
    showPopupAd();

    // Load video player
    loadVideoPlayer();
}

function loadVideoPlayer() {
    const hostData = videoData.hosts[currentHost];
    if (!hostData) return;

    let playerUrl = '';
    
    // Construct player URL based on host
    switch(currentHost) {
        case 'streamhg':
            playerUrl = `https://streamhg.com/e/${hostData.filecode}`;
            break;
        case 'earnvids':
            playerUrl = `https://earnvids.com/e/${hostData.filecode}`;
            break;
        case 'filemoon':
            playerUrl = `https://filemoon.com/e/${hostData.filecode}`;
            break;
    }

    document.getElementById('videoPlayer').src = playerUrl;
    document.getElementById('videoContainer').classList.remove('d-none');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closePlayer() {
    document.getElementById('videoContainer').classList.add('d-none');
    document.getElementById('videoPlayer').src = '';
    document.body.style.overflow = 'auto';
}

function showPopupAd() {
    // Simulate popup ad - in real implementation, this would be your ad code
    const popup = window.open('', 'popup', 'width=500,height=400');
    if (popup) {
        popup.document.write(`
            <html>
                <head><title>Advertisement</title></head>
                <body style="margin:0;padding:20px;font-family:Arial,sans-serif;">
                    <h3>Advertisement</h3>
                    <p>This is a pop-up ad space.</p>
                    <p>In production, this would show real ads.</p>
                    <button onclick="window.close()">Close</button>
                </body>
            </html>
        `);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initPlayer);

// Close player with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePlayer();
    }
});
