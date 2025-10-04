const axios = require('axios');

class StreamHGAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://streamhgapi.com/api';
  }

  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔍 StreamHG API Call: ${endpoint}`);
    
    try {
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          ...params
        },
        timeout: 15000, // 15 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // CRITICAL: Check if response is HTML instead of JSON
      const responseData = response.data;
      
      if (typeof responseData === 'string') {
        // Check for common HTML error patterns
        if (responseData.includes('<!DOCTYPE') || 
            responseData.includes('<html') || 
            responseData.includes('The page') ||
            responseData.includes('error') ||
            responseData.trim().startsWith('<')) {
          
          console.error('❌ StreamHG returned HTML error:', responseData.substring(0, 200));
          throw new Error(`StreamHG API Error: Received HTML page instead of JSON. This usually means: 
          1. Invalid API key: ${this.apiKey ? 'Key is set but may be wrong' : 'Key not set'}
          2. Service is temporarily down
          3. IP address blocked
          Please check your StreamHG API key and account status.`);
        }
        
        // Try to parse as JSON if it's a string
        try {
          return JSON.parse(responseData);
        } catch (parseError) {
          throw new Error(`StreamHG API: Invalid JSON response: ${responseData.substring(0, 100)}`);
        }
      }

      // If we get proper JSON, check for API errors in the response
      if (responseData && responseData.status !== 200 && responseData.msg) {
        throw new Error(`StreamHG API Error: ${responseData.msg}`);
      }

      console.log(`✅ StreamHG Success: ${endpoint}`);
      return responseData;

    } catch (error) {
      console.error(`💥 StreamHG API Error for ${endpoint}:`, error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('StreamHG API: Request timeout - service may be slow or down');
      }
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        if (status === 401 || status === 403) {
          throw new Error('StreamHG API: Unauthorized - check your API key');
        } else if (status === 404) {
          throw new Error('StreamHG API: Endpoint not found');
        } else {
          throw new Error(`StreamHG API: Server error ${status}`);
        }
      } else if (error.request) {
        throw new Error('StreamHG API: No response received - service may be down');
      } else {
        throw new Error(`StreamHG API: ${error.message}`);
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

  // Test if API key is valid
  async testConnection() {
    try {
      const result = await this.getAccountInfo();
      return {
        valid: true,
        account: result.result,
        message: 'StreamHG API is working correctly'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'StreamHG API connection failed'
      };
    }
  }
}

module.exports = StreamHGAPI;
