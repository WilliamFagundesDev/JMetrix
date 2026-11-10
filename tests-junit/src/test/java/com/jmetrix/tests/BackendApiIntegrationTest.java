package com.jmetrix.tests;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes de Integração com a API Backend do JMETRIX (JUnit 5)")
public class BackendApiIntegrationTest {

    private static final String BASE_URL = "http://127.0.0.1:3001";
    private static HttpClient client;
    private static boolean serverAvailable = false;

    @BeforeAll
    static void setup() {
        client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(3))
                .build();

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/api/dashboard/overview"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            serverAvailable = (resp.statusCode() == 200);
        } catch (Exception e) {
            serverAvailable = false;
        }
    }

    @Test
    @DisplayName("Deve responder status HTTP 200 no endpoint de Overview (/api/dashboard/overview)")
    void deveResponderStatus200NoOverview() throws Exception {
        Assumptions.assumeTrue(serverAvailable, "Servidor JMETRIX deve estar ativo em " + BASE_URL);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/dashboard/overview"))
                .GET()
                .build();

        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, resp.statusCode());
        assertTrue(resp.body().contains("totalTests"));
    }

    @Test
    @DisplayName("Deve verificar ambiente JMeter e runtime Java no endpoint (/api/settings/environment)")
    void deveVerificarAmbienteJmeterNoEndpointSettings() throws Exception {
        Assumptions.assumeTrue(serverAvailable, "Servidor JMETRIX deve estar ativo em " + BASE_URL);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/settings/environment"))
                .GET()
                .build();

        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, resp.statusCode());
        assertTrue(resp.body().contains("jmeter"));
        assertTrue(resp.body().contains("java"));
    }

    @Test
    @DisplayName("Deve bloquear requisição com alvo localhost via API (/api/discovery/validate)")
    void deveBloquearAlvoLocalhostNaApi() throws Exception {
        Assumptions.assumeTrue(serverAvailable, "Servidor JMETRIX deve estar ativo em " + BASE_URL);

        String jsonPayload = "{\"url\":\"http://127.0.0.1:8080\"}";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/discovery/validate"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertTrue(resp.statusCode() >= 400 || resp.body().contains("bloqueado") || resp.body().contains("false"));
    }
}
