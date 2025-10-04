const axios = require('axios');

class StreamHGAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://streamhgapi.com/api';
  }

  async uploadByURL(url, options = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/upload/url`, {
        params: {
          key: this.apiKey,
          url: url,
          ...options
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`StreamHG Upload Failed: ${error.message}`);
    }
  }

  async getFileInfo(filecode) {
    try {
      const response = await axios.get(`${this.baseURL}/file/info`, {
        params: {
          key: this.apiKey,
          file_code: filecode
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`StreamHG File Info Failed: ${error.message}`);
    }
  }

  async getDirectLink(filecode, ip = '127.0.0.1') {
    try {
      const response = await axios.get(`${this.baseURL}/file/direct_link`, {
        params: {
          key: this.apiKey,
          file_code: filecode,
          ip: ip
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`StreamHG Direct Link Failed: ${error.message}`);
    }
  }
}

module.exports = StreamHGAPI;
