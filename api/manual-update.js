const { getVideoBySlug, updateVideoHost } = require('../utils/database');

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
    let body;
    try {
      body = JSON.parse(req.body);
    } catch (e) {
      body = req.body;
    }

    const { slug, host, filecode, adminPassword } = body;

    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      const response = JSON.stringify({
        success: false,
        error: 'Unauthorized'
      });
      res.status(401).send(response);
      return;
    }

    if (!slug || !host || !filecode) {
      const response = JSON.stringify({
        success: false,
        error: 'Missing required fields',
        required: ['slug', 'host', 'filecode']
      });
      res.status(400).send(response);
      return;
    }

    // Validate host
    const validHosts = ['streamhg', 'earnvids', 'filemoon'];
    if (!validHosts.includes(host)) {
      const response = JSON.stringify({
        success: false,
        error: 'Invalid host',
        valid_hosts: validHosts
      });
      res.status(400).send(response);
      return;
    }

    // Check if video exists
    const video = await getVideoBySlug(slug);
    if (!video) {
      const response = JSON.stringify({
        success: false,
        error: 'Video not found'
      });
      res.status(404).send(response);
      return;
    }

    // Generate player link
    const baseUrls = {
      streamhg: 'https://streamhg.com/e',
      earnvids: 'https://earnvids.com/e', 
      filemoon: 'https://filemoon.com/e'
    };
    const playerLink = `${baseUrls[host]}/${filecode}`;

    // Update host information
    await updateVideoHost(slug, host, {
      filecode: filecode,
      status: 'completed',
      playerLink: playerLink
    });

    const responseData = {
      success: true,
      message: `✅ ${host} link updated successfully`,
      slug: slug,
      host: host,
      filecode: filecode,
      playerLink: playerLink
    };

    const response = JSON.stringify(responseData);
    res.status(200).send(response);

  } catch (error) {
    console.error('Manual update error:', error);
    const errorResponse = JSON.stringify({
      success: false,
      error: 'Failed to update host',
      details: error.message
    });
    res.status(500).send(errorResponse);
  }
};
