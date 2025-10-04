// In the uploadLink function, update the fetch call:
async function uploadLink() {
  const driveLink = document.getElementById('driveLink').value;
  const fileName = document.getElementById('fileName').value;
  const adminPassword = localStorage.getItem('adminPassword');

  if (!driveLink) {
    showAlert('Please enter a drive link', 'warning');
    return;
  }

  try {
    const response = await fetch('/api/working-upload', {
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
      showAlert('Video page created successfully!', 'success');
      // ... rest of success handling
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Upload error:', error);
    showAlert('Upload failed: ' + error.message, 'danger');
  }
}

// In the updateHost function, update the fetch call:
async function updateHost(host) {
  const filecode = document.getElementById(host + 'Code').value.trim();
  if (!filecode) {
    alert(`Please enter a file code for ${host}`);
    return;
  }

  const adminPassword = prompt('Enter admin password:');
  if (!adminPassword) return;

  try {
    const response = await fetch('/api/manual-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug: currentSlug,
        host: host,
        filecode: filecode,
        adminPassword: adminPassword
      })
    });

    const result = await response.json();

    if (result.success) {
      alert(`✅ ${host} updated successfully!`);
      updateVideoPageLink();
    } else {
      alert(`❌ Failed to update ${host}: ${result.error}`);
    }
  } catch (error) {
    console.error('Error updating host:', error);
    alert('Error updating host: ' + error.message);
  }
}
