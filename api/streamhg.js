const axios = require('axios');

class StreamHGAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://streamhgapi.com/api';
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
          return status < 500; // Resolve only if status code < 500
        }
      });

      // Check if response is HTML (error page)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        throw new Error('API returned HTML error page');
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        throw new Error(`StreamHG API Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // No response received
        throw new Error('StreamHG API: No response received - server may be down');
      } else {
        // Other errors
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

module.exports = StreamHGAPI;
