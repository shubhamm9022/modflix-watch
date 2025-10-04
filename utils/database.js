const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('video-aggregator');
  cachedDb = db;
  return db;
}

// Database schema functions
async function saveVideo(data) {
  const db = await connectToDatabase();
  const result = await db.collection('videos').insertOne({
    ...data,
    createdAt: new Date(),
    status: 'processing'
  });
  return result;
}

async function getVideoBySlug(slug) {
  const db = await connectToDatabase();
  return await db.collection('videos').findOne({ slug });
}

async function getAllVideos(page = 1, limit = 10) {
  const db = await connectToDatabase();
  const skip = (page - 1) * limit;
  
  const videos = await db.collection('videos')
    .find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const total = await db.collection('videos').countDocuments();
  
  return {
    videos,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  };
}

async function updateVideoHost(slug, hostName, hostData) {
  const db = await connectToDatabase();
  return await db.collection('videos').updateOne(
    { slug },
    { 
      $set: { 
        [`hosts.${hostName}`]: hostData,
        status: 'completed'
      } 
    }
  );
}

module.exports = {
  saveVideo,
  getVideoBySlug,
  getAllVideos,
  updateVideoHost
};
