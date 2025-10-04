const { getVideoBySlug, getAllVideos } = require('../utils/database');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug, page = 1, limit = 10 } = req.query;

    if (slug) {
      // Get single video by slug
      const video = await getVideoBySlug(slug);
      if (video) {
        return res.status(200).json({
          success: true,
          video
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }
    } else {
      // Get paginated list of videos
      const result = await getAllVideos(parseInt(page), parseInt(limit));
      return res.status(200).json({
        success: true,
        ...result
      });
    }

  } catch (error) {
    console.error('Pages API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
};
