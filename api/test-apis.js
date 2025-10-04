const StreamHGAPI = require('./streamhg');
const EarnVidsAPI = require('./earnvids');
const FileMoonAPI = require('./filemoon');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing APIs with keys:', {
      streamhg: process.env.STREAMHG_API_KEY ? 'Set' : 'Missing',
      earnvids: process.env.EARNVIDS_API_KEY ? 'Set' : 'Missing',
      filemoon: process.env.FILEMOON_API_KEY ? 'Set' : 'Missing'
    });

    const results = {
      streamhg: await testStreamHG(),
      earnvids: await testEarnVids(),
      filemoon: await testFileMoon()
    };

    res.status(200).json({
      success: true,
      results,
      environment: {
        streamhg_key_set: !!process.env.STREAMHG_API_KEY,
        earnvids_key_set: !!process.env.EARNVIDS_API_KEY,
        filemoon_key_set: !!process.env.FILEMOON_API_KEY
      }
    });

  } catch (error) {
    console.error('API Test Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

async function testStreamHG() {
  try {
    if (!process.env.STREAMHG_API_KEY) {
      return { success: false, error: 'API key not set' };
    }

    const api = new StreamHGAPI(process.env.STREAMHG_API_KEY);
    const accountInfo = await api.getAccountInfo();
    
    return {
      success: true,
      data: accountInfo,
      message: 'StreamHG API is working'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: 'Check if API key is valid and service is available'
    };
  }
}

async function testEarnVids() {
  try {
    if (!process.env.EARNVIDS_API_KEY) {
      return { success: false, error: 'API key not set' };
    }

    const api = new EarnVidsAPI(process.env.EARNVIDS_API_KEY);
    const accountInfo = await api.getAccountInfo();
    
    return {
      success: true,
      data: accountInfo,
      message: 'EarnVids API is working'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: 'Check if API key is valid and service is available'
    };
  }
}

async function testFileMoon() {
  try {
    if (!process.env.FILEMOON_API_KEY) {
      return { success: false, error: 'API key not set' };
    }

    const api = new FileMoonAPI(process.env.FILEMOON_API_KEY);
    const accountInfo = await api.getAccountInfo();
    
    return {
      success: true,
      data: accountInfo,
      message: 'FileMoon API is working'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: 'Check if API key is valid and service is available'
    };
  }
}
