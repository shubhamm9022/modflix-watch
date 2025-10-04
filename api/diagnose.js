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

  console.log('🔍 Starting API Diagnosis...');

  const diagnosis = {
    environment: {
      streamhg_key: process.env.STREAMHG_API_KEY ? 'SET' : 'MISSING',
      earnvids_key: process.env.EARNVIDS_API_KEY ? 'SET' : 'MISSING',
      filemoon_key: process.env.FILEMOON_API_KEY ? 'SET' : 'MISSING',
      node_env: process.env.NODE_ENV || 'not set'
    },
    results: {}
  };

  // Test StreamHG with detailed logging
  diagnosis.results.streamhg = await testAPI('StreamHG', process.env.STREAMHG_API_KEY, 'https://streamhgapi.com/api/account/info');
  
  // Test EarnVids with detailed logging
  diagnosis.results.earnvids = await testAPI('EarnVids', process.env.EARNVIDS_API_KEY, 'https://earnvidsapi.com/api/account/info');
  
  // Test FileMoon with detailed logging
  diagnosis.results.filemoon = await testAPI('FileMoon', process.env.FILEMOON_API_KEY, 'https://filemoonapi.com/api/account/info');

  // Summary
  diagnosis.summary = {
    working: Object.values(diagnosis.results).filter(r => r.working).length,
    total: Object.keys(diagnosis.results).length,
    recommendations: generateRecommendations(diagnosis.results)
  };

  console.log('📊 Diagnosis Complete:', diagnosis.summary);
  res.status(200).json(diagnosis);
};

async function testAPI(name, apiKey, testUrl) {
  console.log(`\n🧪 Testing ${name}...`);
  
  if (!apiKey) {
    return {
      working: false,
      error: 'API_KEY_MISSING',
      message: `❌ ${name}: API key not set in environment variables`,
      recommendation: `Add ${name}_API_KEY to your Vercel environment variables`
    };
  }

  try {
    console.log(`   Testing ${name} with key: ${apiKey.substring(0, 10)}...`);
    console.log(`   URL: ${testUrl}?key=***`);
    
    // Test with direct fetch to see raw response
    const axios = require('axios');
    const response = await axios.get(testUrl, {
      params: { key: apiKey },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`   ${name} Response Status:`, response.status);
    console.log(`   ${name} Response Type:`, typeof response.data);
    
    // Check if response is HTML
    if (typeof response.data === 'string') {
      const first100 = response.data.substring(0, 100);
      console.log(`   ${name} Response Preview:`, first100);
      
      if (response.data.includes('<!DOCTYPE') || 
          response.data.includes('<html') || 
          response.data.includes('The page') ||
          response.data.trim().startsWith('<')) {
        
        return {
          working: false,
          error: 'HTML_RESPONSE',
          message: `❌ ${name}: API returned HTML page instead of JSON`,
          responsePreview: first100,
          recommendation: `The ${name} API key appears to be invalid or the service is down. Please check your ${name} account and regenerate the API key.`
        };
      }
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(response.data);
        return {
          working: true,
          message: `✅ ${name}: API is working correctly`,
          data: parsed
        };
      } catch (parseError) {
        return {
          working: false,
          error: 'INVALID_JSON',
          message: `❌ ${name}: Response is not valid JSON`,
          responsePreview: first100,
          recommendation: `The ${name} API may be experiencing issues. Try again later or contact their support.`
        };
      }
    }

    // If we get proper JSON object
    if (response.data && response.data.status === 200) {
      return {
        working: true,
        message: `✅ ${name}: API is working correctly`,
        data: response.data
      };
    } else {
      return {
        working: false,
        error: 'API_ERROR',
        message: `❌ ${name}: API returned error: ${response.data?.msg || 'Unknown error'}`,
        recommendation: `Check your ${name} account status and API key permissions`
      };
    }

  } catch (error) {
    console.log(`   ${name} Error:`, error.message);
    
    let errorType = 'UNKNOWN_ERROR';
    let recommendation = `Check your ${name} API key and account status`;
    
    if (error.code === 'ECONNABORTED') {
      errorType = 'TIMEOUT';
      recommendation = `${name} server is not responding. Service may be down.`;
    } else if (error.response) {
      errorType = `HTTP_${error.response.status}`;
      if (error.response.status === 401 || error.response.status === 403) {
        recommendation = `${name} API key is invalid or expired. Generate a new one from your account.`;
      } else if (error.response.status === 404) {
        recommendation = `${name} API endpoint not found. Service may have changed.`;
      }
    } else if (error.request) {
      errorType = 'NO_RESPONSE';
      recommendation = `Cannot connect to ${name} servers. Check your internet connection or try again later.`;
    }

    return {
      working: false,
      error: errorType,
      message: `❌ ${name}: ${error.message}`,
      recommendation: recommendation
    };
  }
}

function generateRecommendations(results) {
  const recommendations = [];
  
  if (!results.streamhg.working) {
    recommendations.push({
      service: 'StreamHG',
      issue: results.streamhg.error,
      action: results.streamhg.recommendation
    });
  }
  
  if (!results.earnvids.working) {
    recommendations.push({
      service: 'EarnVids', 
      issue: results.earnvids.error,
      action: results.earnvids.recommendation
    });
  }
  
  if (!results.filemoon.working) {
    recommendations.push({
      service: 'FileMoon',
      issue: results.filemoon.error,
      action: results.filemoon.recommendation
    });
  }

  if (recommendations.length === 3) {
    recommendations.push({
      service: 'ALL',
      issue: 'All APIs failing',
      action: 'Check your internet connection and verify all API keys are correct in Vercel environment variables'
    });
  }

  return recommendations;
}
