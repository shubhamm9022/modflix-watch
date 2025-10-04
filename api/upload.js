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

    // Validate drive link format
    if (!driveLink.includes('drive.google.com')) {
      return res.status(400).json({ error: 'Please provide a valid Google Drive link' });
    }

    // Generate unique slug
    const slug = generateSlug();
    
    // Initialize API clients with error handling
    let streamhg, earnvids, filemoon;
    
    try {
      streamhg = new StreamHGAPI(process.env.STREAMHG_API_KEY);
      earnvids = new EarnVidsAPI(process.env.EARNVIDS_API_KEY);
      filemoon = new FileMoonAPI(process.env.FILEMOON_API_KEY);
    } catch (apiError) {
      return res.status(500).json({ 
        error: 'API initialization failed',
        details: apiError.message 
      });
    }

    // Save initial video record
    const videoData = {
      slug,
      originalLink: driveLink,
      fileName: fileName || 'Unknown File',
      hosts: {},
      createdAt: new Date(),
      status: 'processing'
    };

    await saveVideo(videoData);

    // Test API keys first
    const testResults = await Promise.allSettled([
      streamhg.getAccountInfo().catch(e => ({ host: 'streamhg', error: e.message })),
      earnvids.getAccountInfo().catch(e => ({ host: 'earnvids', error: e.message })),
      filemoon.getAccountInfo().catch(e => ({ host: 'filemoon', error: e.message }))
    ]);

    const failedAPIs = testResults.filter(result => 
      result.status === 'rejected' || (result.value && result.value.error)
    );

    if (failedAPIs.length === 3) {
      return res.status(500).json({ 
        error: 'All API keys are invalid or services are down',
        details: failedAPIs.map(f => f.reason?.message || f.value?.error).join('; ')
      });
    }

    // Start parallel uploads with better error handling
    const uploadPromises = [
      streamhg.uploadByURL(driveLink).then(result => ({
        host: 'streamhg',
        data: result,
        success: true
      })).catch(error => ({
        host: 'streamhg',
        error: error.message,
        success: false
      })),

      earnvids.uploadByURL(driveLink).then(result => ({
        host: 'earnvids', 
        data: result,
        success: true
      })).catch(error => ({
        host: 'earnvids',
        error: error.message,
        success: false
      })),

      filemoon.uploadByURL(driveLink).then(result => ({
        host: 'filemoon',
        data: result,
        success: true
      })).catch(error => ({
        host: 'filemoon',
        error: error.message,
        success: false
      }))
    ];

    const results = await Promise.allSettled(uploadPromises);

    // Process results and update database
    let successfulUploads = 0;
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { host, data, error, success } = result.value;
        
        if (success && data && data.result) {
          const filecode = data.result.filecode || data.result.file_code;
          
          await updateVideoHost(slug, host, {
            filecode,
            status: 'uploading',
            uploadResponse: data,
            lastUpdated: new Date()
          });
          successfulUploads++;
        } else {
          await updateVideoHost(slug, host, {
            status: 'failed',
            error: error || 'Unknown upload error',
            lastUpdated: new Date()
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
      successfulUploads,
      totalHosts: 3,
      message: `Upload started to ${successfulUploads} out of 3 hosts. Video will be available shortly.`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};
