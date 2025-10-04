const axios = require('axios');

class FileMoonAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://filemoonapi.com/api';
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

      // Check for HTML error pages
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        throw new Error('API returned HTML error page - invalid API key or server issue');
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`FileMoon API Error: ${error.response.status} - ${error.response.statusText}`);
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

  async checkRemoteStatus(filecode) {
    return await this.makeRequest('/remote/status', { file_code: filecode });
  }

  async getAccountInfo() {
    return await this.makeRequest('/account/info');
  }
}

module.exports = FileMoonAPI;
