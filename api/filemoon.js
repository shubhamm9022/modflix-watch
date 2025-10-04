const axios = require('axios');

class FileMoonAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://filemoonapi.com/api';
  }

  async uploadByURL(url) {
    try {
      const response = await axios.get(`${this.baseURL}/remote/add`, {
        params: {
          key: this.apiKey,
          url: url
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`FileMoon Upload Failed: ${error.message}`);
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
      throw new Error(`FileMoon File Info Failed: ${error.message}`);
    }
  }

  async checkRemoteStatus(filecode) {
    try {
      const response = await axios.get(`${this.baseURL}/remote/status`, {
        params: {
          key: this.apiKey,
          file_code: filecode
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`FileMoon Status Check Failed: ${error.message}`);
    }
  }
}

module.exports = FileMoonAPI;
