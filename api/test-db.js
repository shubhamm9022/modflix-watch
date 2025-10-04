const { connectToDatabase, saveVideo, getVideoBySlug } = require('../utils/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    const response = JSON.stringify({
      success: false,
      error: 'Method not allowed'
    });
    res.status(405).send(response);
    return;
  }

  try {
    // Test connection
    const db = await connectToDatabase();
    
    // Test insert
    const testVideo = {
      slug: 'test-' + Date.now(),
      originalLink: 'https://drive.google.com/test',
      fileName: 'Test Video',
      hosts: {
        streamhg: { status: 'manual_upload_required' },
        earnvids: { status: 'manual_upload_required' },
        filemoon: { status: 'manual_upload_required' }
      },
      status: 'manual_upload_required',
      isGoogleDrive: true
    };

    await saveVideo(testVideo);
    
    // Test read
    const retrieved = await getVideoBySlug(testVideo.slug);

    const responseData = {
      success: true,
      message: 'Database connection successful!',
      testInsert: testVideo,
      testRetrieve: retrieved,
      database: db.databaseName
    };

    const response = JSON.stringify(responseData);
    res.status(200).send(response);

  } catch (error) {
    console.error('Database test error:', error);
    const errorResponse = JSON.stringify({
      success: false,
      error: 'Database connection failed',
      details: error.message
    });
    res.status(500).send(errorResponse);
  }
};
