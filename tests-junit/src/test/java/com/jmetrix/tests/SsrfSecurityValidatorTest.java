package com.jmetrix.tests;

import com.jmetrix.core.SsrfSecurityValidator;
import com.jmetrix.core.SsrfSecurityValidator.ValidationResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes de Segurança & Proteção contra SSRF (JUnit 5)")
public class SsrfSecurityValidatorTest {

    @Test
    @DisplayName("Deve aprovar URL pública HTTPS válida")
    void deveAprovarUrlPublicaHttpsValida() {
        ValidationResult result = SsrfSecurityValidator.validate("https://example.com");
        assertTrue(result.isValid(), "Deveria aprovar URL pública padrão HTTPS");
        assertEquals("example.com", result.getHost());
    }

    @Test
    @DisplayName("Deve aprovar URL pública HTTP válida com caminho e porta pública")
    void deveAprovarUrlPublicaHttpComPorta() {
        ValidationResult result = SsrfSecurityValidator.validate("http://site.com.br:8080/api/v1");
        assertTrue(result.isValid(), "Deveria aprovar URL com porta pública e subdiretório");
        assertEquals("site.com.br", result.getHost());
    }

    @Test
    @DisplayName("Deve bloquear terminantemente acesso a 'localhost'")
    void deveBloquearAcessoAoLocalhost() {
        ValidationResult res1 = SsrfSecurityValidator.validate("http://localhost:3000");
        assertFalse(res1.isValid(), "Não deve permitir acesso a localhost");
        assertTrue(res1.getMessage().contains("localhost"));

        ValidationResult res2 = SsrfSecurityValidator.validate("https://app.localhost");
        assertFalse(res2.isValid(), "Não deve permitir subdomínios de localhost");
    }

    @Test
    @DisplayName("Deve bloquear endereço IPv4 de loopback 127.0.0.1")
    void deveBloquearEnderecoLoopback127001() {
        ValidationResult result = SsrfSecurityValidator.validate("http://127.0.0.1:8080");
        assertFalse(result.isValid(), "Deve bloquear 127.0.0.1");
        assertTrue(result.getMessage().contains("privadas") || result.getMessage().contains("localhost"));
    }

    @Test
    @DisplayName("Deve bloquear redes privadas RFC 1918 (10.x, 192.168.x, 172.16-31.x)")
    void deveBloquearRedesPrivadasRfc1918() {
        // Faixa 10.0.0.0/8
        ValidationResult r10 = SsrfSecurityValidator.validate("http://10.0.0.1/admin");
        assertFalse(r10.isValid(), "Deve bloquear rede 10.0.0.0/8");

        // Faixa 192.168.0.0/16
        ValidationResult r192 = SsrfSecurityValidator.validate("http://192.168.1.1:8080");
        assertFalse(r192.isValid(), "Deve bloquear rede 192.168.0.0/16");

        // Faixa 172.16.0.0/12
        ValidationResult r172 = SsrfSecurityValidator.validate("http://172.20.0.15/status");
        assertFalse(r172.isValid(), "Deve bloquear rede 172.16-172.31");
    }

    @Test
    @DisplayName("Deve bloquear endereço de metadados de nuvem (169.254.169.254)")
    void deveBloquearEndpointDeMetadadosDeNuvem() {
        ValidationResult result = SsrfSecurityValidator.validate("http://169.254.169.254/latest/meta-data/");
        assertFalse(result.isValid(), "Deve bloquear acesso a IP de metadados AWS/GCP/Azure");
    }

    @Test
    @DisplayName("Deve rejeitar protocolos perigosos que não sejam HTTP ou HTTPS")
    void deveRejeitarProtocolosNaoHttp() {
        ValidationResult ftp = SsrfSecurityValidator.validate("ftp://ftp.example.com");
        assertFalse(ftp.isValid(), "FTP deve ser rejeitado");

        ValidationResult file = SsrfSecurityValidator.validate("file:///etc/passwd");
        assertFalse(file.isValid(), "FILE deve ser rejeitado");

        ValidationResult js = SsrfSecurityValidator.validate("javascript:alert(1)");
        assertFalse(js.isValid(), "JAVASCRIPT deve ser rejeitado");
    }

    @Test
    @DisplayName("Deve rejeitar URLs nulas ou vazias")
    void deveRejeitarUrlsVaziasOuNulas() {
        assertFalse(SsrfSecurityValidator.validate(null).isValid());
        assertFalse(SsrfSecurityValidator.validate("").isValid());
        assertFalse(SsrfSecurityValidator.validate("   ").isValid());
    }
}

