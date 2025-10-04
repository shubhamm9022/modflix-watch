const { saveVideo } = require('../utils/database');
const { generateSlug } = require('../utils/slug-generator');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    const response = JSON.stringify({
      success: false,
      error: 'Method not allowed'
    });
    res.status(405).send(response);
    return;
  }

  try {
    let body;
    try {
      body = JSON.parse(req.body);
    } catch (e) {
      body = req.body;
    }

    const { driveLink, fileName, adminPassword } = body;

    // Admin check
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      const response = JSON.stringify({
        success: false,
        error: 'Unauthorized'
      });
      res.status(401).send(response);
      return;
    }

    if (!driveLink) {
      const response = JSON.stringify({
        success: false,
        error: 'Drive link is required'
      });
      res.status(400).send(response);
      return;
    }

    // Generate slug
    const slug = generateSlug();
    
    // Create video record
    const videoData = {
      slug,
      originalLink: driveLink,
      fileName: fileName || 'Video File',
      hosts: {
        streamhg: { status: 'manual_upload_required' },
        earnvids: { status: 'manual_upload_required' },
        filemoon: { status: 'manual_upload_required' }
      },
      status: 'manual_upload_required',
      isGoogleDrive: driveLink.includes('drive.google.com')
    };

    await saveVideo(videoData);

    const pageUrl = `${req.headers.origin || 'https://your-domain.vercel.app'}/player.html?slug=${slug}`;
    
    const responseData = {
      success: true,
      slug: slug,
      pageUrl: pageUrl,
      message: '🎉 Video page created successfully!',
      next_steps: [
        '1. MANUALLY upload your video to these services:',
        '   - StreamHG: https://streamhg.com',
        '   - EarnVids: https://earnvids.com', 
        '   - FileMoon: https://filemoon.com',
        '2. Get the file codes from each upload',
        '3. Use the admin panel to update the filecodes',
        '4. Your video will be available immediately!'
      ]
    };

    const response = JSON.stringify(responseData);
    res.status(200).send(response);

  } catch (error) {
    console.error('WORKING UPLOAD ERROR:', error);
    const errorResponse = JSON.stringify({
      success: false,
      error: 'Failed to create video record',
      details: error.message
    });
    res.status(500).send(errorResponse);
  }
};
