const { getVideoBySlug, getAllVideos } = require('../utils/database');

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
    const { slug, page = 1, limit = 10 } = req.query;

    if (slug) {
      // Get single video by slug
      const video = await getVideoBySlug(slug);
      if (video) {
        const responseData = {
          success: true,
          video: video
        };
        const response = JSON.stringify(responseData);
        res.status(200).send(response);
        return;
      } else {
        const response = JSON.stringify({
          success: false,
          error: 'Video not found'
        });
        res.status(404).send(response);
        return;
      }
    } else {
      // Get paginated list of videos
      const result = await getAllVideos(parseInt(page), parseInt(limit));
      const responseData = {
        success: true,
        videos: result.videos,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        total: result.total
      };
      const response = JSON.stringify(responseData);
      res.status(200).send(response);
      return;
    }

  } catch (error) {
    console.error('Pages API error:', error);
    const errorResponse = JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
    res.status(500).send(errorResponse);
  }
};
