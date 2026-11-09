export class ExportService {
  /**
   * Generate CSV format export for a test
   */
  static generateCsv(test, metrics = {}) {
    const lines = [];

    // Header info
    lines.push(['# JMETRIX - Relatório de Desempenho'].join(','));
    lines.push(['ID do Teste', test.id].join(','));
    lines.push(['Nome do Teste', `"${(test.name || '').replace(/"/g, '""')}"`].join(','));
    lines.push(['URL Alvo', test.target_url].join(','));
    lines.push(['Modalidade', test.test_type].join(','));
    lines.push(['Usuários Virtuais (VUs)', test.vus].join(','));
    lines.push(['Duração Planejada (s)', test.duration].join(','));
    lines.push(['Início', test.started_at || ''].join(','));
    lines.push(['Conclusão', test.completed_at || ''].join(','));
    lines.push([]);

    // Summary Metrics
    lines.push(['# Indicadores Consolidados'].join(','));
    lines.push(['Métrica', 'Valor', 'Unidade'].join(','));
    lines.push(['Total de Requisições', test.total_requests, 'reqs'].join(','));
    lines.push(['Requisições com Sucesso', test.success_requests, 'reqs'].join(','));
    lines.push(['Requisições com Falha', test.error_requests, 'reqs'].join(','));
    lines.push(['Taxa de Erros', `${test.error_rate}%`, '%'].join(','));
    lines.push(['Throughput Médio', test.throughput, 'req/s'].join(','));
    lines.push(['Tempo Médio de Resposta', test.avg_time, 'ms'].join(','));
    lines.push(['Mediana (P50)', test.p50, 'ms'].join(','));
    lines.push(['Percentil 90 (P90)', test.p90, 'ms'].join(','));
    lines.push(['Percentil 95 (P95)', test.p95, 'ms'].join(','));
    lines.push(['Percentil 99 (P99)', test.p99, 'ms'].join(','));
    lines.push(['Tempo Mínimo', test.min_time, 'ms'].join(','));
    lines.push(['Tempo Máximo', test.max_time, 'ms'].join(','));
    lines.push(['Índice APDEX', test.apdex_score, 'score'].join(','));
    lines.push([]);

    // Endpoint breakdown
    let endpoints = [];
    try {
      endpoints = JSON.parse(test.endpoints_metrics_json || '[]');
    } catch {}

    if (endpoints.length > 0) {
      lines.push(['# Análise por Endpoint'].join(','));
      lines.push(['Endpoint', 'Requisições', 'Sucessos', 'Falhas', 'Taxa de Erro (%)', 'Tempo Médio (ms)', 'P95 (ms)', 'Throughput (req/s)', 'Status Predominante'].join(','));
      endpoints.forEach(ep => {
        lines.push([
          `"${(ep.endpoint || '').replace(/"/g, '""')}"`,
          ep.totalRequests,
          ep.successRequests,
          ep.errorRequests,
          `${ep.errorRate}%`,
          ep.avgTime,
          ep.p95,
          ep.throughput,
          ep.predominantStatus
        ].join(','));
      });
      lines.push([]);
    }

    // Time-series breakdown
    let timeseries = [];
    try {
      timeseries = JSON.parse(test.timeseries_json || '[]');
    } catch {}

    if (timeseries.length > 0) {
      lines.push(['# Série Temporal (Por Segundo)'].join(','));
      lines.push(['Segundo', 'Volume Requisições', 'Tempo Médio (ms)', 'P95 (ms)', 'Usuários Ativos', 'Erros'].join(','));
      timeseries.forEach(t => {
        lines.push([
          t.second,
          t.requestsCount,
          t.avgResponseTime,
          t.p95ResponseTime,
          t.activeThreads,
          t.errors
        ].join(','));
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate standalone HTML report
   */
  static generateHtmlReport(test) {
    let endpoints = [];
    let diagnostics = { positives: [], warnings: [], problems: [], recommendations: [] };
    try {
      endpoints = JSON.parse(test.endpoints_metrics_json || '[]');
      diagnostics = JSON.parse(test.diagnostics_json || '{}');
    } catch {}

    const endpointsHtml = endpoints.map(ep => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; font-weight: 500;">${ep.endpoint}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; text-align: right;">${ep.totalRequests.toLocaleString('pt-BR')}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; text-align: right; color: ${ep.errorRate > 0 ? '#ef4444' : '#10b981'};">${ep.errorRate}%</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; text-align: right;">${ep.avgTime} ms</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; text-align: right; font-weight: 600; color: #00d2ff;">${ep.p95} ms</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; text-align: right;">${ep.throughput} req/s</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; text-align: center;"><span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${ep.predominantStatus}</span></td>
      </tr>
    `).join('');

    const positivesHtml = (diagnostics.positives || []).map(p => `
      <div style="background: rgba(16,185,129,0.06); border-left: 3px solid #10b981; padding: 12px 16px; margin-bottom: 8px; border-radius: 0 6px 6px 0;">
        <strong style="color: #10b981; font-size: 14px;">✓ ${p.title}</strong>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">${p.description}</p>
      </div>
    `).join('');

    const warningsHtml = (diagnostics.warnings || []).map(w => `
      <div style="background: rgba(245,158,11,0.06); border-left: 3px solid #f59e0b; padding: 12px 16px; margin-bottom: 8px; border-radius: 0 6px 6px 0;">
        <strong style="color: #f59e0b; font-size: 14px;">⚠ ${w.title}</strong>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">${w.description}</p>
      </div>
    `).join('');

    const problemsHtml = (diagnostics.problems || []).map(pr => `
      <div style="background: rgba(239,68,68,0.06); border-left: 3px solid #ef4444; padding: 12px 16px; margin-bottom: 8px; border-radius: 0 6px 6px 0;">
        <strong style="color: #ef4444; font-size: 14px;">✕ ${pr.title}</strong>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">${pr.description}</p>
      </div>
    `).join('');

    const recommendationsHtml = (diagnostics.recommendations || []).map(r => `
      <div style="background: rgba(0,210,255,0.06); border-left: 3px solid #00d2ff; padding: 12px 16px; margin-bottom: 8px; border-radius: 0 6px 6px 0;">
        <strong style="color: #00d2ff; font-size: 14px;">➜ ${r.title}</strong>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">${r.description}</p>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>JMETRIX - Relatório de Performance: ${test.name}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0b0f19;
      color: #f1f5f9;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.5;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      background: linear-gradient(135deg, #00d2ff, #0055ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }
    .grid-kpi {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .kpi-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 18px 20px;
    }
    .kpi-label {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .kpi-value {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin: 32px 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #111827;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #1e293b;
    }
    th {
      background: #1a2234;
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      padding: 12px 14px;
      letter-spacing: 0.5px;
    }
    @media print {
      body { background: #ffffff; color: #000000; padding: 0; }
      .kpi-card { border: 1px solid #cccccc; background: #f8fafc; }
      .kpi-value { color: #000000; }
      table { border: 1px solid #cccccc; }
      th { background: #f1f5f9; color: #333333; }
      td { border-bottom: 1px solid #e2e8f0; color: #000000; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <svg width="40" height="40" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="jmxHGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00f0ff" />
              <stop offset="45%" stop-color="#2563eb" />
              <stop offset="100%" stop-color="#7c3aed" />
            </linearGradient>
          </defs>
          <path d="M60 6 L108 26 L108 80 L60 114 L12 80 L12 26 Z" fill="url(#jmxHGrad)" fill-opacity="0.18" stroke="url(#jmxHGrad)" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M18 64 L36 64 L44 48 L54 82 L64 36 L74 68 L84 64 L102 64" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
          <path d="M32 40 L40 40 L40 68 C40 76 34 80 26 80 C21 80 18 78 18 78 L20 71 C20 71 23 73 26 73 C29 73 31 71 31 67 L31 40 Z" fill="#ffffff"/>
          <path d="M44 40 L53 40 L60 58 L67 40 L76 40 L76 80 L68 80 L68 53 L62 67 L58 67 L52 53 L52 80 L44 80 Z" fill="#ffffff"/>
          <path d="M80 40 L88 40 L95 56 L102 40 L110 40 L99 60 L110 80 L102 80 L95 64 L88 80 L80 80 L91 60 Z" fill="#ffffff"/>
          <circle cx="60" cy="114" r="3.5" fill="#00f0ff"/>
        </svg>
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="brand-title">JMETRIX</span>
            <span style="font-size: 11px; font-weight: 800; color: #00f0ff; background: rgba(0,240,255,0.12); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(0,240,255,0.35); font-family: monospace;">JMX</span>
          </div>
          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">Plataforma de Testes Apache JMeter &bull; Relat&oacute;rio Oficial</div>
        </div>
      </div>
      <div>
        <button class="no-print" onclick="window.print()" style="background: #0055ff; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600;">Imprimir / Salvar PDF</button>
      </div>
    </div>

    <div style="background: #111827; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 10px 0; font-size: 20px;">${test.name}</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 24px; color: #94a3b8; font-size: 14px;">
        <div><strong>Alvo:</strong> <a href="${test.target_url}" target="_blank" style="color: #00d2ff; text-decoration: none;">${test.target_url}</a></div>
        <div><strong>Modalidade:</strong> <span style="text-transform: uppercase; color: #f1f5f9;">${test.test_type}</span></div>
        <div><strong>VUs:</strong> <span style="color: #f1f5f9;">${test.vus}</span></div>
        <div><strong>Data:</strong> <span style="color: #f1f5f9;">${new Date(test.started_at || test.created_at).toLocaleString('pt-BR')}</span></div>
      </div>
    </div>

    <div class="grid-kpi">
      <div class="kpi-card">
        <div class="kpi-label">Throughput Médio</div>
        <div class="kpi-value" style="color: #00d2ff;">${test.throughput} <span style="font-size: 14px; font-weight: 400; color: #94a3b8;">req/s</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Tempo Médio</div>
        <div class="kpi-value">${test.avg_time} <span style="font-size: 14px; font-weight: 400; color: #94a3b8;">ms</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Percentil 95 (P95)</div>
        <div class="kpi-value" style="color: #f59e0b;">${test.p95} <span style="font-size: 14px; font-weight: 400; color: #94a3b8;">ms</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Taxa de Erros</div>
        <div class="kpi-value" style="color: ${test.error_rate > 0 ? '#ef4444' : '#10b981'};">${test.error_rate}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Índice APDEX</div>
        <div class="kpi-value" style="color: #10b981;">${test.apdex_score}</div>
      </div>
    </div>

    <div class="section-title">Análise por Endpoint</div>
    <table>
      <thead>
        <tr>
          <th style="text-align: left;">Endpoint</th>
          <th style="text-align: right;">Requisições</th>
          <th style="text-align: right;">Taxa de Erro</th>
          <th style="text-align: right;">Média</th>
          <th style="text-align: right;">P95</th>
          <th style="text-align: right;">Throughput</th>
          <th style="text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${endpointsHtml || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">Nenhum endpoint detalhado.</td></tr>'}
      </tbody>
    </table>

    <div class="section-title">Diagnóstico Técnico Automatizado</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h4 style="color: #10b981; margin: 0 0 12px 0;">Pontos Positivos</h4>
        ${positivesHtml || '<p style="color: #64748b;">Nenhum ponto positivo registrado.</p>'}

        <h4 style="color: #f59e0b; margin: 20px 0 12px 0;">Alertas de Desempenho</h4>
        ${warningsHtml || '<p style="color: #64748b;">Nenhum alerta registrado.</p>'}
      </div>
      <div>
        <h4 style="color: #ef4444; margin: 0 0 12px 0;">Problemas Identificados</h4>
        ${problemsHtml || '<p style="color: #64748b;">Nenhum problema crítico detectado.</p>'}

        <h4 style="color: #00d2ff; margin: 20px 0 12px 0;">Recomendações Técnicas</h4>
        ${recommendationsHtml || '<p style="color: #64748b;">Sem recomendações adicionais.</p>'}
      </div>
    </div>

    <div style="margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; color: #64748b; font-size: 13px;">
      Relatório gerado automaticamente por <strong>JMETRIX</strong> utilizando o motor oficial Apache JMeter.
    </div>
  </div>
</body>
</html>`;
  }
}

