package com.jmetrix.tests;

import com.jmetrix.core.JtlMetricsCalculator;
import com.jmetrix.core.JtlMetricsCalculator.MetricsResult;
import com.jmetrix.core.JtlMetricsCalculator.Sample;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes da Calculadora de Métricas JTL & APDEX (JUnit 5)")
public class JtlMetricsCalculatorTest {

    @Test
    @DisplayName("Deve calcular tempo médio, mínimo e máximo corretamente")
    void deveCalcularTempoMedioMinimoEMaximoCorretamente() {
        List<Sample> samples = Arrays.asList(
                new Sample(100, true, 200, "GET /home"),
                new Sample(200, true, 200, "GET /home"),
                new Sample(300, true, 200, "GET /home"),
                new Sample(400, true, 200, "GET /home")
        );

        MetricsResult result = JtlMetricsCalculator.calculate(samples, 10.0, 500.0);

        assertEquals(4, result.totalRequests);
        assertEquals(4, result.successRequests);
        assertEquals(0, result.errorRequests);
        assertEquals(0.0, result.errorRate);
        assertEquals(100, result.minTime);
        assertEquals(400, result.maxTime);
        assertEquals(250.0, result.avgTime, 0.01);
    }

    @Test
    @DisplayName("Deve calcular percentis P50, P90, P95 e P99 com precisão em amostras heterogêneas")
    void deveCalcularPercentisP50P90P95P99ComPrecisao() {
        List<Sample> samples = new ArrayList<>();
        // 100 amostras de 1ms até 100ms
        for (int i = 1; i <= 100; i++) {
            samples.add(new Sample(i * 10L, true, 200, "GET /api"));
        }

        MetricsResult result = JtlMetricsCalculator.calculate(samples, 5.0, 500.0);

        assertEquals(500, result.p50, "P50 da série 10..1000 deve ser 500");
        assertEquals(900, result.p90, "P90 da série deve ser 900");
        assertEquals(950, result.p95, "P95 da série deve ser 950");
        assertEquals(990, result.p99, "P99 da série deve ser 990");
    }

    @Test
    @DisplayName("Deve calcular índice APDEX 1.0 (Excelente) quando todas respostas estiverem abaixo de T")
    void deveCalcularApdexPerfeitoQuandoTodasRespostasAbaixoDeT() {
        double apdexT = 500.0;
        List<Sample> samples = Arrays.asList(
                new Sample(120, true, 200, "GET /"),
                new Sample(240, true, 200, "GET /"),
                new Sample(350, true, 200, "GET /"),
                new Sample(490, true, 200, "GET /")
        );

        MetricsResult result = JtlMetricsCalculator.calculate(samples, 4.0, apdexT);

        assertEquals(1.0, result.apdexScore);
        assertEquals("Excelente", result.apdexRating);
    }

    @Test
    @DisplayName("Deve calcular APDEX ponderado com amostras satisfeitas, tolerantes e frustradas")
    void deveCalcularApdexComAmostrasTolerantesEFrustradas() {
        double apdexT = 500.0; // Satisfeito <= 500ms, Tolerante <= 2000ms, Frustrado > 2000ms
        List<Sample> samples = Arrays.asList(
                new Sample(200, true, 200, "GET /"),   // Satisfeito (1.0)
                new Sample(300, true, 200, "GET /"),   // Satisfeito (1.0)
                new Sample(1000, true, 200, "GET /"),  // Tolerante (0.5)
                new Sample(3500, true, 200, "GET /")   // Frustrado (0.0)
        );

        // APDEX = (2 + 0.5 * 1) / 4 = 2.5 / 4 = 0.625 -> round 0.63 (Faixa 0.50 a 0.69: Ruim)
        MetricsResult result = JtlMetricsCalculator.calculate(samples, 4.0, apdexT);

        assertEquals(0.63, result.apdexScore, 0.01);
        assertEquals("Ruim", result.apdexRating);
    }

    @Test
    @DisplayName("Deve penalizar APDEX como frustrado quando requisição falhar mesmo sendo rápida")
    void devePenalizarApdexQuandoRequisicaoFalhaMesmoSendoRapida() {
        double apdexT = 500.0;
        List<Sample> samples = Arrays.asList(
                new Sample(50, false, 500, "GET /fail"), // Falhou com HTTP 500 -> Frustrado mesmo em 50ms!
                new Sample(60, false, 502, "GET /fail"), // Falhou com HTTP 502 -> Frustrado
                new Sample(200, true, 200, "GET /ok"),   // Satisfeito
                new Sample(200, true, 200, "GET /ok")    // Satisfeito
        );

        // APDEX = (2 + 0) / 4 = 0.50
        MetricsResult result = JtlMetricsCalculator.calculate(samples, 2.0, apdexT);

        assertEquals(0.50, result.apdexScore);
        assertEquals(50.0, result.errorRate);
        assertEquals(2, result.errorRequests);
    }

    @Test
    @DisplayName("Deve retornar valores padrão sem erros quando lista de amostras for vazia")
    void deveRetornarValoresPadraoQuandoListaVazia() {
        MetricsResult result = JtlMetricsCalculator.calculate(new ArrayList<>(), 10.0, 500.0);

        assertEquals(0, result.totalRequests);
        assertEquals(0.0, result.avgTime);
        assertEquals(0.0, result.errorRate);
        assertEquals(1.0, result.apdexScore);
    }
}
