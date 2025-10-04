const axios = require('axios');

class EarnVidsAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://earnvidsapi.com/api';
  }

  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔍 EarnVids API Call: ${endpoint}`);
    
    try {
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          ...params
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const responseData = response.data;
      
      // Check for HTML errors
      if (typeof responseData === 'string') {
        if (responseData.includes('<!DOCTYPE') || 
            responseData.includes('<html') || 
            responseData.includes('The page') ||
            responseData.trim().startsWith('<')) {
          
          console.error('❌ EarnVids returned HTML error:', responseData.substring(0, 200));
          throw new Error(`EarnVids API Error: Received HTML page. Possible issues:
          1. Invalid API key
          2. Service unavailable
          3. Account suspended
          Check your EarnVids account and API key.`);
        }
        
        try {
          return JSON.parse(responseData);
        } catch (parseError) {
          throw new Error(`EarnVids API: Invalid JSON: ${responseData.substring(0, 100)}`);
        }
      }

      if (responseData && responseData.status !== 200 && responseData.msg) {
        throw new Error(`EarnVids API Error: ${responseData.msg}`);
      }

      console.log(`✅ EarnVids Success: ${endpoint}`);
      return responseData;

    } catch (error) {
      console.error(`💥 EarnVids API Error for ${endpoint}:`, error.message);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
          throw new Error('EarnVids API: Unauthorized - invalid API key');
        }
        throw new Error(`EarnVids API: Server error ${status}`);
      } else if (error.request) {
        throw new Error('EarnVids API: No response - service may be down');
      } else {
        throw new Error(`EarnVids API: ${error.message}`);
      }
    }
  }

  async uploadByURL(url, options = {}) {
    return await this.makeRequest('/upload/url', { url, ...options });
  }

  async getFileInfo(filecode) {
    return await this.makeRequest('/file/info', { file_code: filecode });
  }

  async getAccountInfo() {
    return await this.makeRequest('/account/info');
  }

  async testConnection() {
    try {
      const result = await this.getAccountInfo();
      return {
        valid: true,
        account: result.result,
        message: 'EarnVids API is working correctly'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'EarnVids API connection failed'
      };
    }
  }
}

module.exports = EarnVidsAPI;
