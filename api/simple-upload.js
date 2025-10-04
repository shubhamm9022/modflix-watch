const { saveVideo, updateVideoHost } = require('../utils/database');
const { generateSlug } = require('../utils/slug-generator');

// Simple Google Drive converter
function convertGoogleDriveLink(driveLink) {
  const fileIdMatch = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                     driveLink.match(/[&?]id=([a-zA-Z0-9_-]+)/) ||
                     driveLink.match(/^([a-zA-Z0-9_-]+)$/);
  
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
  }
  return driveLink;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { driveLink, fileName, adminPassword } = req.body;

    // Simple admin check
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized - check admin password' });
    }

    if (!driveLink) {
      return res.status(400).json({ error: 'Drive link is required' });
    }

    console.log('🚀 SIMPLE UPLOAD: Starting with link:', driveLink);

    // Generate slug and save record
    const slug = generateSlug();
    const downloadLink = convertGoogleDriveLink(driveLink);
    
    const videoData = {
      slug,
      originalLink: driveLink,
      downloadLink: downloadLink,
      fileName: fileName || 'Video File',
      hosts: {},
      createdAt: new Date(),
      status: 'manual_upload_needed',
      isGoogleDrive: driveLink.includes('drive.google.com')
    };

    await saveVideo(videoData);

    console.log('✅ SIMPLE UPLOAD: Record saved with slug:', slug);

    // Return instructions for manual upload
    const pageUrl = `${req.headers.origin || 'https://your-domain.vercel.app'}/player.html?slug=${slug}`;
    
    res.status(200).json({
      success: true,
      slug: slug,
      pageUrl: pageUrl,
      message: 'Video record created successfully!',
      instructions: {
        step1: 'The video hosts APIs are currently experiencing issues',
        step2: 'You can manually upload your video to any video host',
        step3: `Then update the hosts in your database for slug: ${slug}`,
        step4: `Your video page will be available at: ${pageUrl}`
      },
      next_steps: [
        '1. Manually upload your video to StreamHG, EarnVids, or FileMoon',
        '2. Get the file code from the upload',
        '3. Use the database update tool to add the host links',
        '4. Your video page will automatically show the available players'
      ]
    });

  } catch (error) {
    console.error('💥 SIMPLE UPLOAD ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create video record',
      details: error.message
    });
  }
};
