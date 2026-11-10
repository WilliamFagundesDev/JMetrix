package com.jmetrix.core;

import java.net.InetAddress;
import java.net.URI;
import java.net.URL;

/**
 * Validador de URLs e proteção contra Server-Side Request Forgery (SSRF).
 * Bloqueia acessos a localhost, loopback, redes privadas e metadados de nuvem.
 */
public class SsrfSecurityValidator {

    public static class ValidationResult {
        private final boolean valid;
        private final String message;
        private final String normalizedUrl;
        private final String host;

        public ValidationResult(boolean valid, String message, String normalizedUrl, String host) {
            this.valid = valid;
            this.message = message;
            this.normalizedUrl = normalizedUrl;
            this.host = host;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }

        public String getNormalizedUrl() {
            return normalizedUrl;
        }

        public String getHost() {
            return host;
        }
    }

    /**
     * Valida se uma URL é segura para execução de testes pelo motor JMeter.
     */
    public static ValidationResult validate(String urlString) {
        if (urlString == null || urlString.trim().isEmpty()) {
            return new ValidationResult(false, "URL não pode ser vazia.", null, null);
        }

        urlString = urlString.trim();

        // 1. Validação de protocolo
        String lowerUrl = urlString.toLowerCase();
        if (!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://")) {
            return new ValidationResult(false, "Protocolo inválido. Apenas HTTP e HTTPS são permitidos.", null, null);
        }

        try {
            URI uri = new URI(urlString);
            String host = uri.getHost();

            if (host == null || host.trim().isEmpty()) {
                return new ValidationResult(false, "Host inválido na URL.", null, null);
            }

            host = host.toLowerCase().trim();

            // 2. Bloqueio de localhost e nomes óbvios de loopback
            if (host.equals("localhost") || host.endsWith(".localhost") || host.endsWith(".local") || host.equals("::1")) {
                return new ValidationResult(false, "Acesso a endereços locais (localhost) é estritamente bloqueado por segurança.", null, host);
            }

            // 3. Verificação de endereços IPv4 privados e restritos
            if (isPrivateOrRestrictedIp(host)) {
                return new ValidationResult(false, "Acesso a redes privadas (RFC 1918) ou metadados de nuvem bloqueado.", null, host);
            }

            return new ValidationResult(true, "URL aprovada para testes.", urlString, host);
        } catch (Exception e) {
            return new ValidationResult(false, "Formato de URL inválido: " + e.getMessage(), null, null);
        }
    }

    /**
     * Identifica se um hostname ou IP corresponde a uma faixa privada, loopback ou link-local.
     */
    public static boolean isPrivateOrRestrictedIp(String host) {
        // Checagem direta de strings literais conhecidas
        if (host.startsWith("127.") || host.equals("0.0.0.0")) {
            return true;
        }

        // Metadados de nuvem (AWS, GCP, Azure, OpenStack)
        if (host.startsWith("169.254.")) {
            return true;
        }

        // Redes privadas RFC 1918
        if (host.startsWith("10.") || host.startsWith("192.168.")) {
            return true;
        }

        // Faixa 172.16.0.0 até 172.31.255.255
        if (host.startsWith("172.")) {
            String[] parts = host.split("\\.");
            if (parts.length >= 2) {
                try {
                    int secondOctet = Integer.parseInt(parts[1]);
                    if (secondOctet >= 16 && secondOctet <= 31) {
                        return true;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }

        // Tentar resolver via InetAddress se for um IP válido
        try {
            InetAddress address = InetAddress.getByName(host);
            if (address.isLoopbackAddress() || address.isSiteLocalAddress() || address.isLinkLocalAddress() || address.isAnyLocalAddress()) {
                return true;
            }
        } catch (Exception ignored) {
            // Se for um hostname de domínio público (ex: example.com), a resolução pode não ser IP local
        }

        return false;
    }
}

