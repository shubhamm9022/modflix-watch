const StreamHGAPI = require('./streamhg');
const EarnVidsAPI = require('./earnvids');
const FileMoonAPI = require('./filemoon');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = {};
    
    // Test StreamHG
    try {
      const streamhg = new StreamHGAPI(process.env.STREAMHG_API_KEY);
      const streamhgInfo = await streamhg.getAccountInfo();
      results.streamhg = { success: true, data: streamhgInfo };
    } catch (error) {
      results.streamhg = { success: false, error: error.message };
    }

    // Test EarnVids
    try {
      const earnvids = new EarnVidsAPI(process.env.EARNVIDS_API_KEY);
      const earnvidsInfo = await earnvids.getAccountInfo();
      results.earnvids = { success: true, data: earnvidsInfo };
    } catch (error) {
      results.earnvids = { success: false, error: error.message };
    }

    // Test FileMoon
    try {
      const filemoon = new FileMoonAPI(process.env.FILEMOON_API_KEY);
      const filemoonInfo = await filemoon.getAccountInfo();
      results.filemoon = { success: true, data: filemoonInfo };
    } catch (error) {
      results.filemoon = { success: false, error: error.message };
    }

    res.status(200).json({
      success: true,
      results,
      message: 'API key test completed'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
