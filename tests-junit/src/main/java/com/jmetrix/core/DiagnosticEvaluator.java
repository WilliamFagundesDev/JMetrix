package com.jmetrix.core;

import java.util.ArrayList;
import java.util.List;

/**
 * Motor de diagnóstico e avaliação de estabilidade técnica do JMETRIX.
 * Gera pontuação técnica (Score 0-100), alertas, problemas e recomendações.
 */
public class DiagnosticEvaluator {

    public static class DiagnosticResult {
        public final int technicalScore;
        public final String status;
        public final List<String> positives;
        public final List<String> warnings;
        public final List<String> problems;
        public final List<String> recommendations;

        public DiagnosticResult(int technicalScore, String status, List<String> positives,
                                List<String> warnings, List<String> problems, List<String> recommendations) {
            this.technicalScore = technicalScore;
            this.status = status;
            this.positives = positives;
            this.warnings = warnings;
            this.problems = problems;
            this.recommendations = recommendations;
        }
    }

    public static DiagnosticResult evaluate(double errorRate, long p95, double apdexScore, double throughput) {
        int score = 100;
        List<String> positives = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> problems = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        // 1. Análise de taxa de erros
        if (errorRate == 0.0) {
            positives.add("Taxa de erro zero (0%): 100% das requisições foram processadas com sucesso.");
        } else if (errorRate <= 2.0) {
            warnings.add("Taxa de erro baixa (" + errorRate + "%), porém requer observação.");
            score -= (int) Math.round(errorRate * 5);
        } else {
            problems.add("Taxa de erro elevada (" + errorRate + "%): falhas de rede ou respostas HTTP 5xx frequentes.");
            score -= (int) Math.round(errorRate * 4);
            recommendations.add("Inspecione logs do servidor web para verificar pool de conexões e timeouts.");
        }

        // 2. Análise de Percentil 95 (P95)
        if (p95 <= 300) {
            positives.add("Percentil 95 excelente (" + p95 + " ms): respostas ágeis e cauda de latência reduzida.");
        } else if (p95 <= 800) {
            positives.add("Latência aceitável com P95 em " + p95 + " ms sob a carga testada.");
        } else if (p95 <= 2000) {
            warnings.add("Percentil 95 elevado (" + p95 + " ms): lentidão perceptível para os usuários finais.");
            score -= 15;
            recommendations.add("Avalie a implementação de cache HTTP e otimização de consultas ao banco.");
        } else {
            problems.add("Latência crítica: 5% das requisições demoraram mais de " + p95 + " ms.");
            score -= 28;
            recommendations.add("Revise a arquitetura de escala da aplicação (CPU/RAM e concorrência).");
        }

        // 3. Análise de APDEX
        if (apdexScore >= 0.94) {
            positives.add("Índice APDEX excelente (" + apdexScore + "): alto grau de satisfação dos usuários.");
        } else if (apdexScore >= 0.85) {
            positives.add("Índice APDEX satisfatório (" + apdexScore + ").");
        } else if (apdexScore >= 0.70) {
            warnings.add("Índice APDEX tolerável (" + apdexScore + "). Muitas requisições na faixa tolerante.");
            score -= 10;
        } else {
            problems.add("Índice APDEX insatisfatório (" + apdexScore + "): maioria das requisições frustradas.");
            score -= 20;
            recommendations.add("Reduza o tempo de processamento de rotas pesadas identificadas no comparativo.");
        }

        score = Math.max(0, Math.min(100, score));

        String status;
        if (score >= 90) status = "Excelente Estabilidade";
        else if (score >= 75) status = "Desempenho Adequado";
        else if (score >= 50) status = "Requer Atenção";
        else status = "Degradação Crítica";

        return new DiagnosticResult(score, status, positives, warnings, problems, recommendations);
    }
}

