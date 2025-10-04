const { getVideoBySlug, updateVideoHost } = require('../utils/database');

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
    const { slug, host, filecode, adminPassword } = req.body;

    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!slug || !host || !filecode) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['slug', 'host', 'filecode']
      });
    }

    // Validate host
    const validHosts = ['streamhg', 'earnvids', 'filemoon'];
    if (!validHosts.includes(host)) {
      return res.status(400).json({
        error: 'Invalid host',
        valid_hosts: validHosts
      });
    }

    // Check if video exists
    const video = await getVideoBySlug(slug);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Update host information
    await updateVideoHost(slug, host, {
      filecode: filecode,
      status: 'completed',
      playerLink: getPlayerLink(host, filecode),
      lastUpdated: new Date()
    });

    res.status(200).json({
      success: true,
      message: `✅ ${host} link updated successfully`,
      slug: slug,
      host: host,
      filecode: filecode,
      playerLink: getPlayerLink(host, filecode)
    });

  } catch (error) {
    console.error('Manual update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update host',
      details: error.message
    });
  }
};

function getPlayerLink(host, filecode) {
  const baseUrls = {
    streamhg: 'https://streamhg.com/e',
    earnvids: 'https://earnvids.com/e', 
    filemoon: 'https://filemoon.com/e'
  };
  
  return `${baseUrls[host]}/${filecode}`;
}
