export function useApi() {
  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMsg = `Erro na requisição: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch {}
      throw new Error(errorMsg);
    }

    // If downloading raw files or text
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }

  return {
    get: (endpoint, headers) => request(endpoint, { method: 'GET', headers }),
    post: (endpoint, body, headers) => request(endpoint, { method: 'POST', body, headers }),
    delete: (endpoint, headers) => request(endpoint, { method: 'DELETE', headers })
  };
}

