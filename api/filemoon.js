const axios = require('axios');

class FileMoonAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://filemoonapi.com/api';
  }

  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔍 FileMoon API Call: ${endpoint}`);
    
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
      
      if (typeof responseData === 'string') {
        if (responseData.includes('<!DOCTYPE') || 
            responseData.includes('<html') || 
            responseData.includes('The page') ||
            responseData.trim().startsWith('<')) {
          
          console.error('❌ FileMoon returned HTML error:', responseData.substring(0, 200));
          throw new Error(`FileMoon API Error: Received HTML page. Check:
          1. API key validity
          2. Service status
          3. Account balance/limits`);
        }
        
        try {
          return JSON.parse(responseData);
        } catch (parseError) {
          throw new Error(`FileMoon API: Invalid JSON: ${responseData.substring(0, 100)}`);
        }
      }

      if (responseData && responseData.status !== 200 && responseData.msg) {
        throw new Error(`FileMoon API Error: ${responseData.msg}`);
      }

      console.log(`✅ FileMoon Success: ${endpoint}`);
      return responseData;

    } catch (error) {
      console.error(`💥 FileMoon API Error for ${endpoint}:`, error.message);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
          throw new Error('FileMoon API: Unauthorized - check API key');
        }
        throw new Error(`FileMoon API: Server error ${status}`);
      } else if (error.request) {
        throw new Error('FileMoon API: No response received');
      } else {
        throw new Error(`FileMoon API: ${error.message}`);
      }
    }
  }

  async uploadByURL(url) {
    return await this.makeRequest('/remote/add', { url });
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
        message: 'FileMoon API is working correctly'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'FileMoon API connection failed'
      };
    }
  }
}

module.exports = FileMoonAPI;
