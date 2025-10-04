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
    const responseData = {
      success: false,
      message: '🚨 Automatic upload is temporarily unavailable',
      instruction: 'Please use the manual upload system instead',
      working_endpoint: '/api/working-upload',
      manual_guide: [
        '1. Use POST /api/working-upload to create video record',
        '2. Manually upload video to StreamHG, EarnVids, FileMoon',
        '3. Use admin panel to update file codes',
        '4. Video page will work immediately'
      ]
    };

    const response = JSON.stringify(responseData);
    res.status(200).send(response);
    
  } catch (error) {
    const errorResponse = JSON.stringify({
      success: false,
      error: 'Server error',
      details: error.message
    });
    res.status(500).send(errorResponse);
  }
};
