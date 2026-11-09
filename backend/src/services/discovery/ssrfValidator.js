import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

export class SSRFValidator {
  /**
   * Prohibited hostname patterns
   */
  static BLOCKED_HOSTNAMES = [
    'localhost',
    'localhost.localdomain',
    'metadata.google.internal',
    'metadata.internal',
    'instance-data',
    '169.254.169.254'
  ];

  /**
   * Validate a target URL against SSRF threats
   */
  static async validateUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') {
      throw new Error('URL inválida ou não fornecida.');
    }

    let parsed;
    try {
      parsed = new URL(urlString.trim());
    } catch {
      throw new Error('Formato de URL inválido. Certifique-se de incluir http:// ou https://');
    }

    // Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Protocolo "${parsed.protocol}" não permitido. Apenas HTTP e HTTPS são suportados.`);
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check prohibited hostnames
    if (this.BLOCKED_HOSTNAMES.includes(hostname) ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.lan')) {
      throw new Error(`Acesso ao host "${hostname}" bloqueado por políticas de segurança SSRF.`);
    }

    // Resolve DNS to verify destination IP addresses
    let addresses;
    try {
      addresses = await dns.lookup(hostname, { all: true });
    } catch (err) {
      throw new Error(`Falha na resolução de DNS para o domínio "${hostname}": ${err.message}`);
    }

    if (!addresses || addresses.length === 0) {
      throw new Error(`Nenhum endereço IP resolvido para o domínio "${hostname}".`);
    }

    for (const record of addresses) {
      const ip = record.address;
      this.validateIpAddress(ip);
    }

    return {
      valid: true,
      sanitizedUrl: parsed.toString(),
      origin: parsed.origin,
      hostname: parsed.hostname,
      protocol: parsed.protocol,
      port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
      resolvedIps: addresses.map(a => a.address)
    };
  }

  /**
   * Check if an IP address is within forbidden ranges
   */
  static validateIpAddress(ipString) {
    let addr;
    try {
      addr = ipaddr.parse(ipString);
    } catch {
      throw new Error(`Endereço IP inválido detectado: ${ipString}`);
    }

    const range = addr.range();

    // Prohibited IP ranges
    const prohibitedRanges = [
      'loopback',         // 127.0.0.0/8, ::1
      'private',          // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7
      'linkLocal',        // 169.254.0.0/16, fe80::/10
      'carrierGradeNat',  // 100.64.0.0/10
      'unspecified',      // 0.0.0.0, ::
      'broadcast',
      'multicast'
    ];

    if (prohibitedRanges.includes(range)) {
      throw new Error(`Acesso ao IP privado/restrito (${ipString} - ${range}) bloqueado por proteção SSRF.`);
    }

    // Explicit check for AWS/GCP/Azure link-local metadata IP
    if (ipString === '169.254.169.254') {
      throw new Error('Acesso a serviços de metadados de nuvem é estritamente proibido.');
    }

    return true;
  }
}

