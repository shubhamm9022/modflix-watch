const axios = require('axios');

class EarnVidsAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://earnvidsapi.com/api';
  }

  async makeRequest(endpoint, params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params: {
          key: this.apiKey,
          ...params
        },
        timeout: 30000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      // Check if response is HTML instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        throw new Error('API returned HTML error page - check API key');
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`EarnVids API Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('EarnVids API: No response received - check API key and connectivity');
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

  async getDirectLink(filecode, ip = '127.0.0.1') {
    return await this.makeRequest('/file/direct_link', { 
      file_code: filecode, 
      ip: ip 
    });
  }

  async getAccountInfo() {
    return await this.makeRequest('/account/info');
  }
}

module.exports = EarnVidsAPI;
