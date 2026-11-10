package com.jmetrix.tests;

import com.jmetrix.core.DiagnosticEvaluator;
import com.jmetrix.core.DiagnosticEvaluator.DiagnosticResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes do Motor de Diagnóstico Técnico (JUnit 5)")
public class DiagnosticEvaluatorTest {

    @Test
    @DisplayName("Deve conceder Score 100 e Excelente Estabilidade para latência baixa e 0% de erro")
    void deveConcederScoreExcelenteParaCenarioIdeal() {
        // errorRate=0%, p95=120ms, apdex=1.0, throughput=50 req/s
        DiagnosticResult result = DiagnosticEvaluator.evaluate(0.0, 120, 1.0, 50.0);

        assertEquals(100, result.technicalScore);
        assertEquals("Excelente Estabilidade", result.status);
        assertFalse(result.positives.isEmpty());
        assertTrue(result.problems.isEmpty());
    }

    @Test
    @DisplayName("Deve penalizar severamente o Score e marcar Degradação Crítica quando erros > 15%")
    void deveReduzirScoreParaErrosElevados() {
        // errorRate=25%, p95=2500ms, apdex=0.45
        DiagnosticResult result = DiagnosticEvaluator.evaluate(25.0, 2500, 0.45, 10.0);

        assertTrue(result.technicalScore < 50, "Score deve ser menor que 50 devido à alta taxa de erros e alta latência");
        assertEquals("Degradação Crítica", result.status);
        assertFalse(result.problems.isEmpty());
        assertFalse(result.recommendations.isEmpty());
    }

    @Test
    @DisplayName("Deve gerar avisos e recomendações de otimização quando P95 ultrapassar 1000ms")
    void deveGerarAlertasParaLatenciaElevada() {
        // errorRate=0%, p95=1400ms, apdex=0.75
        DiagnosticResult result = DiagnosticEvaluator.evaluate(0.0, 1400, 0.75, 20.0);

        assertTrue(result.technicalScore < 90);
        assertFalse(result.warnings.isEmpty());
        assertTrue(result.recommendations.stream().anyMatch(r -> r.toLowerCase().contains("cache") || r.toLowerCase().contains("banco")));
    }
}

