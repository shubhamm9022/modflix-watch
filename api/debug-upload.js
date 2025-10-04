const { saveVideo, updateVideoHost } = require('../utils/database');
const { generateSlug } = require('../utils/slug-generator');
const StreamHGAPI = require('./streamhg');
const EarnVidsAPI = require('./earnvids');
const FileMoonAPI = require('./filemoon');

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

    // Simple admin check for debugging
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!driveLink) {
      return res.status(400).json({ error: 'Drive link is required' });
    }

    console.log('DEBUG: Starting upload process for:', driveLink);

    // Test each API individually with detailed logging
    const debugResults = {
      streamhg: await debugStreamHGUpload(driveLink),
      earnvids: await debugEarnVidsUpload(driveLink),
      filemoon: await debugFileMoonUpload(driveLink)
    };

    res.status(200).json({
      success: true,
      debug: debugResults,
      message: 'Debug upload completed - check results for each host'
    });

  } catch (error) {
    console.error('Debug upload error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error.message 
    });
  }
};

async function debugStreamHGUpload(url) {
  try {
    console.log('DEBUG StreamHG: Testing with key:', process.env.STREAMHG_API_KEY?.substring(0, 10) + '...');
    
    const api = new StreamHGAPI(process.env.STREAMHG_API_KEY);
    
    // Test account info first
    const accountInfo = await api.getAccountInfo();
    console.log('DEBUG StreamHG: Account info success');
    
    // Test upload
    const uploadResult = await api.uploadByURL(url);
    console.log('DEBUG StreamHG: Upload result:', uploadResult);
    
    return {
      success: true,
      accountInfo: accountInfo,
      uploadResult: uploadResult,
      message: 'StreamHG upload successful'
    };
  } catch (error) {
    console.error('DEBUG StreamHG Error:', error.message);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

async function debugEarnVidsUpload(url) {
  try {
    console.log('DEBUG EarnVids: Testing with key:', process.env.EARNVIDS_API_KEY?.substring(0, 10) + '...');
    
    const api = new EarnVidsAPI(process.env.EARNVIDS_API_KEY);
    
    // Test account info first
    const accountInfo = await api.getAccountInfo();
    console.log('DEBUG EarnVids: Account info success');
    
    // Test upload
    const uploadResult = await api.uploadByURL(url);
    console.log('DEBUG EarnVids: Upload result:', uploadResult);
    
    return {
      success: true,
      accountInfo: accountInfo,
      uploadResult: uploadResult,
      message: 'EarnVids upload successful'
    };
  } catch (error) {
    console.error('DEBUG EarnVids Error:', error.message);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

async function debugFileMoonUpload(url) {
  try {
    console.log('DEBUG FileMoon: Testing with key:', process.env.FILEMOON_API_KEY?.substring(0, 10) + '...');
    
    const api = new FileMoonAPI(process.env.FILEMOON_API_KEY);
    
    // Test account info first
    const accountInfo = await api.getAccountInfo();
    console.log('DEBUG FileMoon: Account info success');
    
    // Test upload
    const uploadResult = await api.uploadByURL(url);
    console.log('DEBUG FileMoon: Upload result:', uploadResult);
    
    return {
      success: true,
      accountInfo: accountInfo,
      uploadResult: uploadResult,
      message: 'FileMoon upload successful'
    };
  } catch (error) {
    console.error('DEBUG FileMoon Error:', error.message);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}
