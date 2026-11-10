package com.jmetrix.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Calculadora matemática de métricas de desempenho para arquivos JTL do Apache JMeter.
 * Calcula média, percentis (P50, P90, P95, P99), vazão (throughput) e índice APDEX.
 */
public class JtlMetricsCalculator {

    public static class Sample {
        private final long elapsed;
        private final boolean success;
        private final int responseCode;
        private final String label;

        public Sample(long elapsed, boolean success, int responseCode, String label) {
            this.elapsed = elapsed;
            this.success = success;
            this.responseCode = responseCode;
            this.label = label;
        }

        public long getElapsed() {
            return elapsed;
        }

        public boolean isSuccess() {
            return success;
        }

        public int getResponseCode() {
            return responseCode;
        }

        public String getLabel() {
            return label;
        }
    }

    public static class MetricsResult {
        public final int totalRequests;
        public final int successRequests;
        public final int errorRequests;
        public final double errorRate;
        public final double throughput;
        public final long minTime;
        public final long maxTime;
        public final double avgTime;
        public final long p50;
        public final long p90;
        public final long p95;
        public final long p99;
        public final double apdexScore;
        public final String apdexRating;

        public MetricsResult(int totalRequests, int successRequests, int errorRequests,
                             double errorRate, double throughput, long minTime, long maxTime,
                             double avgTime, long p50, long p90, long p95, long p99,
                             double apdexScore, String apdexRating) {
            this.totalRequests = totalRequests;
            this.successRequests = successRequests;
            this.errorRequests = errorRequests;
            this.errorRate = errorRate;
            this.throughput = throughput;
            this.minTime = minTime;
            this.maxTime = maxTime;
            this.avgTime = avgTime;
            this.p50 = p50;
            this.p90 = p90;
            this.p95 = p95;
            this.p99 = p99;
            this.apdexScore = apdexScore;
            this.apdexRating = apdexRating;
        }
    }

    /**
     * Calcula métricas agregadas a partir de uma lista de amostras.
     */
    public static MetricsResult calculate(List<Sample> samples, double durationSeconds, double apdexThresholdMs) {
        if (samples == null || samples.isEmpty()) {
            return new MetricsResult(0, 0, 0, 0.0, 0.0, 0, 0, 0.0, 0, 0, 0, 0, 1.0, "Excelente");
        }

        int total = samples.size();
        int successes = 0;
        int errors = 0;
        long totalElapsed = 0;
        long min = Long.MAX_VALUE;
        long max = Long.MIN_VALUE;

        List<Long> latencies = new ArrayList<>(total);

        int apdexSatisfied = 0;
        int apdexTolerating = 0;
        double apdexToleratingLimit = apdexThresholdMs * 4.0;

        for (Sample s : samples) {
            long e = s.getElapsed();
            latencies.add(e);
            totalElapsed += e;

            if (e < min) min = e;
            if (e > max) max = e;

            if (s.isSuccess()) {
                successes++;
                if (e <= apdexThresholdMs) {
                    apdexSatisfied++;
                } else if (e <= apdexToleratingLimit) {
                    apdexTolerating++;
                }
            } else {
                errors++;
            }
        }

        Collections.sort(latencies);

        double avg = (double) totalElapsed / total;
        double errorRate = ((double) errors / total) * 100.0;
        double throughput = durationSeconds > 0 ? (double) total / durationSeconds : 0.0;

        long p50 = getPercentile(latencies, 50);
        long p90 = getPercentile(latencies, 90);
        long p95 = getPercentile(latencies, 95);
        long p99 = getPercentile(latencies, 99);

        double apdexScore = (apdexSatisfied + (apdexTolerating / 2.0)) / total;
        // Arredondar para 2 casas decimais
        apdexScore = Math.round(apdexScore * 100.0) / 100.0;

        String rating;
        if (apdexScore >= 0.94) rating = "Excelente";
        else if (apdexScore >= 0.85) rating = "Bom";
        else if (apdexScore >= 0.70) rating = "Razoável";
        else if (apdexScore >= 0.50) rating = "Ruim";
        else rating = "Inaceitável";

        return new MetricsResult(
                total,
                successes,
                errors,
                Math.round(errorRate * 100.0) / 100.0,
                Math.round(throughput * 100.0) / 100.0,
                min,
                max,
                Math.round(avg * 100.0) / 100.0,
                p50,
                p90,
                p95,
                p99,
                apdexScore,
                rating
        );
    }

    /**
     * Calcula o percentil exato a partir de uma lista ordenada.
     */
    public static long getPercentile(List<Long> sortedList, double percentile) {
        if (sortedList == null || sortedList.isEmpty()) return 0;
        if (percentile <= 0) return sortedList.get(0);
        if (percentile >= 100) return sortedList.get(sortedList.size() - 1);

        int index = (int) Math.ceil((percentile / 100.0) * sortedList.size()) - 1;
        index = Math.max(0, Math.min(index, sortedList.size() - 1));
        return sortedList.get(index);
    }
}

