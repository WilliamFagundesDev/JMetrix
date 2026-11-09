export class DiagnosticEngine {
  /**
   * Analyze real test metrics and generate technical observations
   */
  static analyze(metrics, config = {}) {
    const positives = [];
    const warnings = [];
    const problems = [];
    const recommendations = [];

    const {
      totalRequests = 0,
      errorRate = 0,
      avgTime = 0,
      p50 = 0,
      p90 = 0,
      p95 = 0,
      p99 = 0,
      throughput = 0,
      apdexScore = 0,
      timeseries = [],
      endpointsMetrics = []
    } = metrics;

    if (totalRequests === 0) {
      return {
        overallStatus: 'indeterminado',
        overallScore: 0,
        positives: [],
        warnings: [{ title: 'Sem requisições', description: 'Nenhuma amostra foi coletada durante a janela do teste.' }],
        problems: [],
        recommendations: []
      };
    }

    // 1. APDEX Evaluation
    if (apdexScore >= 0.94) {
      positives.push({
        title: 'Excelente Índice de Satisfação (APDEX)',
        description: `Índice APDEX de ${apdexScore.toFixed(2)} indica que a imensa maioria dos usuários obteve respostas dentro do tempo ideal satisfatório (limiar T=${metrics.apdexT || 500}ms).`
      });
    } else if (apdexScore >= 0.85) {
      positives.push({
        title: 'Bom Desempenho Global (APDEX)',
        description: `Índice APDEX de ${apdexScore.toFixed(2)} demonstra boa experiência geral com pequena margem de tolerância.`
      });
    } else if (apdexScore >= 0.70) {
      warnings.push({
        title: 'Índice de Satisfação Regular (APDEX)',
        description: `Índice APDEX de ${apdexScore.toFixed(2)} aponta que uma parcela sensível de usuários experimentou tempos na faixa de tolerância ou frustração.`
      });
    } else {
      problems.push({
        title: 'Baixo Índice de Satisfação (APDEX)',
        description: `Índice APDEX de ${apdexScore.toFixed(2)} reflete experiência de usuário degradada ou frustrante para a maior parte das requisições.`
      });
      recommendations.push({
        title: 'Revisão de SLAs e Gargalos de Tempo de Resposta',
        description: 'Investigar se o limiar T de 500ms é adequado ao tipo de operação ou se os endpoints testados possuem sobrecarga no processamento de requisições.'
      });
    }

    // 2. Error Rate Evaluation
    if (errorRate === 0) {
      positives.push({
        title: 'Zero Falhas de Requisição',
        description: `Todas as ${totalRequests.toLocaleString('pt-BR')} requisições foram concluídas com sucesso (100% de taxa de acerto).`
      });
    } else if (errorRate < 1.0) {
      warnings.push({
        title: `Taxa Baixa de Erros (${errorRate}%)`,
        description: `Foram registradas falhas ocasionais (${metrics.errorRequests} requisições). Embora baixa, deve ser investigada para ambientes de missão crítica.`
      });
    } else if (errorRate < 5.0) {
      warnings.push({
        title: `Taxa Moderada de Erros (${errorRate}%)`,
        description: `${metrics.errorRequests} requisições falharam. Isso sugere instabilidade pontual em conexões concorrentes ou rejeição de tráfego.`
      });
      recommendations.push({
        title: 'Auditoria de Códigos de Status HTTP',
        description: 'Analisar se os erros são provenientes de limites de taxa (HTTP 429), timeouts (HTTP 504) ou recusa de sockets TCP.'
      });
    } else {
      problems.push({
        title: `Alta Taxa de Falhas (${errorRate}%)`,
        description: `Percentual elevado de erros identificado: ${metrics.errorRequests} de ${totalRequests} requisições falharam.`
      });
      recommendations.push({
        title: 'Investigação Imediata de Resiliência',
        description: 'Verificar logs do servidor web, reverse proxy e balanceador de carga para diagnosticar falhas de conexão ou timeouts sob concorrência.'
      });
    }

    // 3. HTTP 5xx Server Errors
    let total5xx = 0;
    endpointsMetrics.forEach(ep => {
      if (ep.statusCodes) {
        Object.keys(ep.statusCodes).forEach(code => {
          if (code.startsWith('5')) {
            total5xx += ep.statusCodes[code];
          }
        });
      }
    });

    if (total5xx > 0) {
      problems.push({
        title: `Respostas de Erro Interno (HTTP 5xx) Detectadas`,
        description: `Foram registradas ${total5xx} respostas com erro interno da família 5xx. Isto evidencia que o backend não conseguiu processar requisições válidas.`
      });
      recommendations.push({
        title: 'Análise de Exceções Não Tratadas no Backend',
        description: 'Inspecionar logs de erro da aplicação correspondentes à janela do teste para rastrear exceções não tratadas, exaustão de pools ou falha em microsserviços.'
      });
    }

    // 4. Tail Latency & Percentile Divergence (P95 vs P50)
    if (p50 > 0 && p95 > 0) {
      const ratio = p95 / p50;
      if (ratio > 3.0 && p95 > 800) {
        warnings.push({
          title: `Grande Disparidade entre P50 (${p50}ms) e P95 (${p95}ms)`,
          description: `O percentil P95 é ${(ratio).toFixed(1)}x maior que a mediana (P50). Isso indica variabilidade considerável no tempo de resposta e presença de requisições retidas em filas de espera.`
        });
        recommendations.push({
          title: 'Otimização de Cauda de Latência (Tail Latency)',
          description: 'Investigar bloqueios de I/O, garbage collection periódico ou enfileiramento de threads no servidor web.'
        });
      } else if (p95 <= 350) {
        positives.push({
          title: `Excelente Consistência de Latência`,
          description: `Percentil P95 mantido em ${p95}ms, demonstrando estabilidade mesmo para as requisições mais lentas.`
        });
      }
    }

    // 5. Throughput & Concurrency Stability
    if (timeseries.length >= 6) {
      const firstQuarter = timeseries.slice(0, Math.floor(timeseries.length / 4));
      const lastQuarter = timeseries.slice(-Math.floor(timeseries.length / 4));

      const avgEarlyTime = firstQuarter.reduce((acc, t) => acc + t.avgResponseTime, 0) / firstQuarter.length;
      const avgLateTime = lastQuarter.reduce((acc, t) => acc + t.avgResponseTime, 0) / lastQuarter.length;

      if (avgLateTime > avgEarlyTime * 1.7 && avgLateTime > 500) {
        warnings.push({
          title: 'Degradação Progressiva de Latência ao Longo do Teste',
          description: `O tempo de resposta médio aumentou de ${Math.round(avgEarlyTime)}ms no início para ${Math.round(avgLateTime)}ms na reta final do teste.`
        });
        recommendations.push({
          title: 'Investigação de Vazamento ou Esgotamento de Recursos',
          description: 'Verificar consumo sustentado de memória, acúmulo de sessões abertas ou saturação de pools de conexões em testes contínuos.'
        });
      }
    }

    // 6. Endpoint Level Bottlenecks
    if (endpointsMetrics.length > 1) {
      const sortedByAvg = [...endpointsMetrics].sort((a, b) => b.avgTime - a.avgTime);
      const slowestEp = sortedByAvg[0];
      const fastestEp = sortedByAvg[sortedByAvg.length - 1];

      if (slowestEp.avgTime > fastestEp.avgTime * 2.5 && slowestEp.avgTime > 400) {
        warnings.push({
          title: `Gargalo Identificado no Endpoint: ${slowestEp.endpoint}`,
          description: `Este endpoint registrou média de ${slowestEp.avgTime}ms (P95: ${slowestEp.p95}ms), consideravelmente superior à média dos demais endpoints.`
        });
        recommendations.push({
          title: `Otimização Específica do Endpoint ${slowestEp.endpoint}`,
          description: 'Avaliar estratégias de caching (HTTP cache-control, CDN ou Redis), compressão gzip/brotli e redução de payload para esta rota.'
        });
      }
    }

    // General Best Practice Recommendations
    recommendations.push({
      title: 'Estratégia de Cache e Cabeçalhos HTTP',
      description: 'Garantir uso de Keep-Alive HTTP persistente e políticas eficientes de cache de assets estáticos para reduzir a carga bruta sobre a CPU dos servidores.'
    });

    // Compute Overall Health Score (0 to 100)
    let score = 100;
    score -= (errorRate * 4); // each 1% error takes 4 points
    if (apdexScore < 0.94) score -= (0.94 - apdexScore) * 60;
    if (p95 > 1000) score -= Math.min(20, (p95 - 1000) / 100);
    if (total5xx > 0) score -= Math.min(25, total5xx * 3);
    score = Math.max(10, Math.min(100, Math.round(score)));

    let overallStatus = 'excelente';
    if (score < 50) overallStatus = 'critico';
    else if (score < 75) overallStatus = 'alerta';
    else if (score < 90) overallStatus = 'estavel';

    return {
      overallStatus,
      overallScore: score,
      positives,
      warnings,
      problems,
      recommendations
    };
  }
}

