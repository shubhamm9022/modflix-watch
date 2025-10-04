const { saveVideo, updateVideoHost } = require('../utils/database');
const { generateSlug } = require('../utils/slug-generator');
const StreamHGAPI = require('./streamhg');
const EarnVidsAPI = require('./earnvids');
const FileMoonAPI = require('./filemoon');

// Google Drive Link Converter
function convertGoogleDriveLink(driveLink) {
  try {
    const fileIdMatch1 = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const fileIdMatch2 = driveLink.match(/[&?]id=([a-zA-Z0-9_-]+)/);
    const fileIdMatch3 = driveLink.match(/^([a-zA-Z0-9_-]+)$/);
    
    let fileId = fileIdMatch1?.[1] || fileIdMatch2?.[1] || fileIdMatch3?.[1];
    
    if (!fileId) {
      throw new Error('Invalid Google Drive link format');
    }
    
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  } catch (error) {
    throw new Error(`Google Drive link conversion failed: ${error.message}`);
  }
}

function isGoogleDriveLink(link) {
  return link.includes('drive.google.com') || 
         link.includes('google.com/file/d/') ||
         /^[a-zA-Z0-9_-]+$/.test(link);
}

module.exports = async (req, res) => {
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

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!driveLink) {
      return res.status(400).json({ error: 'Drive link is required' });
    }

    // Convert Google Drive link
    let finalDownloadLink = driveLink;
    let isDriveLink = false;

    if (isGoogleDriveLink(driveLink)) {
      try {
        finalDownloadLink = convertGoogleDriveLink(driveLink);
        isDriveLink = true;
        console.log('Converted Google Drive link to:', finalDownloadLink);
      } catch (conversionError) {
        return res.status(400).json({ 
          error: 'Invalid Google Drive link',
          details: conversionError.message 
        });
      }
    }

    // Generate slug
    const slug = generateSlug();
    
    // Initialize APIs
    const streamhg = new StreamHGAPI(process.env.STREAMHG_API_KEY);
    const earnvids = new EarnVidsAPI(process.env.EARNVIDS_API_KEY);
    const filemoon = new FileMoonAPI(process.env.FILEMOON_API_KEY);

    // Save initial record
    const videoData = {
      slug,
      originalLink: driveLink,
      downloadLink: finalDownloadLink,
      fileName: fileName || 'Unknown File',
      hosts: {},
      createdAt: new Date(),
      status: 'processing',
      isGoogleDrive: isDriveLink
    };

    await saveVideo(videoData);

    console.log('🚀 Starting upload to all hosts...');

    // Test API connections first
    const connectionTests = await Promise.allSettled([
      streamhg.testConnection(),
      earnvids.testConnection(),
      filemoon.testConnection()
    ]);

    const connectionResults = connectionTests.map((result, index) => ({
      host: ['streamhg', 'earnvids', 'filemoon'][index],
      ...result.value || { error: result.reason?.message }
    }));

    console.log('Connection test results:', connectionResults);

    // Check if any APIs are working
    const workingAPIs = connectionResults.filter(result => result.valid);
    if (workingAPIs.length === 0) {
      return res.status(500).json({ 
        error: 'All video host APIs are failing',
        details: connectionResults.map(r => `${r.host}: ${r.error || 'Unknown error'}`).join('; '),
        suggestion: 'Please check your API keys and try again later'
      });
    }

    // Upload only to working APIs
    const uploadPromises = connectionResults
      .filter(result => result.valid)
      .map(result => {
        const api = result.host === 'streamhg' ? streamhg : 
                   result.host === 'earnvids' ? earnvids : filemoon;
        
        return api.uploadByURL(finalDownloadLink)
          .then(uploadResult => ({
            host: result.host,
            success: true,
            data: uploadResult,
            message: `Upload started to ${result.host}`
          }))
          .catch(uploadError => ({
            host: result.host,
            success: false,
            error: uploadError.message,
            message: `Upload failed to ${result.host}`
          }));
      });

    const uploadResults = await Promise.allSettled(uploadPromises);

    // Process results
    let successfulUploads = 0;
    const uploadDetails = [];

    for (const result of uploadResults) {
      if (result.status === 'fulfilled') {
        const { host, success, data, error } = result.value;
        
        uploadDetails.push({ host, success, error });
        
        if (success && data && data.result) {
          const filecode = data.result.filecode || data.result.file_code;
          
          await updateVideoHost(slug, host, {
            filecode,
            status: 'uploading',
            uploadResponse: data,
            lastUpdated: new Date()
          });
          successfulUploads++;
          console.log(`✅ Upload started to ${host}: ${filecode}`);
        } else {
          await updateVideoHost(slug, host, {
            status: 'failed',
            error: error || 'Unknown upload error',
            lastUpdated: new Date()
          });
          console.log(`❌ Upload failed to ${host}: ${error}`);
        }
      }
    }

    const pageUrl = `${req.headers.origin || 'https://your-domain.vercel.app'}/player.html?slug=${slug}`;
    
    res.status(200).json({
      success: true,
      slug,
      pageUrl,
      successfulUploads,
      totalHosts: uploadPromises.length,
      connectionResults,
      uploadDetails,
      message: successfulUploads > 0 
        ? `Upload started to ${successfulUploads} host(s). Video will be available shortly.` 
        : 'Upload failed to all hosts. Please try again later.'
    });

  } catch (error) {
    console.error('💥 Upload process error:', error);
    res.status(500).json({ 
      error: 'Upload process failed',
      details: error.message,
      suggestion: 'Please check your API keys and try again'
    });
  }
};
