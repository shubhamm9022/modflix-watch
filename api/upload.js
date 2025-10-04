const { saveVideo, updateVideoHost } = require('../utils/database');
const { generateSlug } = require('../utils/slug-generator');
const StreamHGAPI = require('./streamhg');
const EarnVidsAPI = require('./earnvids');
const FileMoonAPI = require('./filemoon');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
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

    // Admin authentication
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!driveLink) {
      return res.status(400).json({ error: 'Drive link is required' });
    }

    // Generate unique slug
    const slug = generateSlug();
    
    // Initialize API clients
    const streamhg = new StreamHGAPI(process.env.STREAMHG_API_KEY);
    const earnvids = new EarnVidsAPI(process.env.EARNVIDS_API_KEY);
    const filemoon = new FileMoonAPI(process.env.FILEMOON_API_KEY);

    // Save initial video record
    const videoData = {
      slug,
      originalLink: driveLink,
      fileName: fileName || 'Unknown File',
      hosts: {}
    };

    await saveVideo(videoData);

    // Start parallel uploads
    const uploadPromises = [
      streamhg.uploadByURL(driveLink).then(result => ({
        host: 'streamhg',
        data: result
      })).catch(error => ({
        host: 'streamhg',
        error: error.message
      })),

      earnvids.uploadByURL(driveLink).then(result => ({
        host: 'earnvids', 
        data: result
      })).catch(error => ({
        host: 'earnvids',
        error: error.message
      })),

      filemoon.uploadByURL(driveLink).then(result => ({
        host: 'filemoon',
        data: result
      })).catch(error => ({
        host: 'filemoon',
        error: error.message
      }))
    ];

    const results = await Promise.allSettled(uploadPromises);

    // Process results and update database
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { host, data, error } = result.value;
        
        if (!error && data && data.result) {
          const filecode = data.result.filecode || data.result.file_code;
          
          await updateVideoHost(slug, host, {
            filecode,
            status: 'uploading',
            uploadResponse: data
          });
        } else {
          await updateVideoHost(slug, host, {
            status: 'failed',
            error: error
          });
        }
      }
    }

    // Return success with page URL
    const pageUrl = `${req.headers.origin || 'https://your-domain.vercel.app'}/player.html?slug=${slug}`;
    
    res.status(200).json({
      success: true,
      slug,
      pageUrl,
      message: 'Upload started to all hosts. Video will be available shortly.'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};
