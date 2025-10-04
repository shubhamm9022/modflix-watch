const axios = require('axios');

class StreamHGAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://streamhgapi.com/api';
  }

  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`StreamHG API Call: ${url}`, { params: { ...params, key: '***' } });
    
    try {
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          ...params
        },
        timeout: 30000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      console.log(`StreamHG Response Status: ${response.status}`);
      console.log(`StreamHG Response Data:`, response.data);

      // Check if response is HTML (error page)
      if (typeof response.data === 'string') {
        if (response.data.includes('<!DOCTYPE') || response.data.includes('<html')) {
          throw new Error('API returned HTML page instead of JSON. Possible issues: Invalid API key, Server down, or IP blocked.');
        }
        // Try to parse as JSON if it's string but not HTML
        try {
          const parsedData = JSON.parse(response.data);
          return parsedData;
        } catch (parseError) {
          throw new Error(`API returned non-JSON response: ${response.data.substring(0, 100)}`);
        }
      }

      return response.data;
    } catch (error) {
      console.error(`StreamHG API Error for ${endpoint}:`, error.message);
      
      if (error.response) {
        throw new Error(`StreamHG API Error ${error.response.status}: ${error.response.statusText}. Data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('StreamHG API: No response received - server may be down or network issue');
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
