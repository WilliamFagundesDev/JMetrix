# JMETRIX — Plataforma Inteligente de Testes de Performance

> **Test. Measure. Dominate.**

O **JMETRIX** é uma plataforma moderna de análise e testes de desempenho para aplicações web que utiliza o **Apache JMeter** como motor principal de execução. O sistema transforma a complexidade técnica do JMeter em uma experiência visual intuitiva, automatizada e com design no padrão SaaS premium de observabilidade.

Disponível como **Aplicação Desktop Nativa (Electron)** e como **Aplicação Web (Vue 3 + Node.js)**.

---

## ⚡ Como Rodar o Executável Desktop (Backend + Frontend Juntos)

Você pode iniciar o JMETRIX em modo desktop com um único clique de três formas:

### Opção 1: Executável Compilado Direto (.exe)
Execute o arquivo executável gerado:
```
dist-electron\JMETRIX-win32-x64\JMETRIX.exe
```
*(Ou dê um duplo clique no atalho **`JMETRIX.lnk`** na raiz do projeto)*

### Opção 2: Launcher Rápido (.bat)
Dê um duplo clique no arquivo:
```
JMETRIX.bat
```
Ele detecta o executável compilado ou sobe a aplicação via Electron automaticamente.

### Opção 3: Via Terminal (Electron)
Na raiz do projeto:
```bash
npm start
```
*(O Electron gerencia o ciclo de vida do backend Node.js e da interface gráfica Vue 3 automaticamente, encerrando ambos ao fechar a janela).*

---

## 🚀 Principais Funcionalidades

1. **Dashboard Geral (Overview):**
   - Indicadores consolidados: volume total de testes, sites analisados, total de requisições disparadas, tempo médio de resposta e taxa média de falhas.
   - Gráficos interativos com **Apache ECharts** (evolução temporal de latência média e P95, vazão e requisições).
   - Acompanhamento em tempo real de testes em execução.
   - Ranking de aplicações com melhor desempenho e alertas para aplicações problemáticas.

2. **Tema Claro (Principal) e Tema Escuro (Secundário):**
   - Seletor interativo Sol e Lua (☀️ / 🌙) no cabeçalho com transição suave.
   - Gráficos ECharts e modais que reagem dinamicamente à troca de tema.

3. **Internacionalização Completa (i18n):**
   - Suporte a 🇧🇷 **Português** (principal), 🇺🇸 **English** e 🇪🇸 **Español**.
   - Seletor de idioma instantâneo no navbar sem recarregar a tela.

4. **Fluxo de Nova Análise (Wizard Guiado):**
   - **Etapa 1 — Alvo & Validação:** Validação rigorosa de URL, pré-teste de latência inicial e **proteção ativa contra SSRF** (bloqueio de localhost, IPs privados RFC 1918, loopback e metadados de nuvem).
   - **Etapa 2 — Descoberta Inteligente:** Crawler respeitoso que analisa `robots.txt`, `sitemap.xml` e links internos HTML, permitindo selecionar os endpoints específicos para teste.
   - **Etapa 3 — Configuração de Cenários:**
     - 5 modalidades de teste: **Smoke Test**, **Load Test**, **Stress Test**, **Spike Test** e **Endurance Test**.
     - Perfis pré-definidos (**Leve**, **Moderado**, **Avançado**) e personalização de VUs, duração e ramp-up.
     - Confirmação obrigatória de autorização para teste de domínio.
   - **Etapa 4 — Monitoramento em Tempo Real:** Visualizador do motor do JMeter com telemetria via WebSocket (VUs ativos, req/s, latência, erros, progresso percentual e cancelamento sob demanda).

5. **Dashboard de Performance & Resultados:**
   - Métricas calculadas reais: Throughput (req/s), Tempo Médio, Percentis **P50, P90, P95, P99**, Mínimo e Máximo.
   - Índice **APDEX** com cálculo preciso ($T=500\text{ms}$) e classificação qualitativa.
   - Gráficos interativos: Tempo de Resposta ao longo do tempo, Throughput & Threads ativas, Taxa de Erro e Comparativo de rotas.
   - Tabela detalhada por endpoint com inspeção de códigos HTTP (2xx, 3xx, 4xx, 5xx).

6. **Diagnóstico Automatizado da Aplicação:**
   - Interpretação técnica rule-based dividida em **Pontos Positivos**, **Alertas**, **Problemas Identificados** e **Recomendações Técnicas**.
   - Pontuação global de estabilidade e Score Técnico redesenhado.

7. **Histórico e Comparação de Testes:**
   - Filtros por modalidade, status e busca textual.
   - **Comparador Lado a Lado:** Seleção de 2 execuções com cálculo de deltas percentuais coloridos (verde para melhoria, vermelho para regressão).

8. **Relatórios e Exportação:**
   - Exportação para planilha **CSV**.
   - Relatório **HTML** autônomo.
   - Layout otimizado para impressão e geração de **PDF**.
   - Acesso direto ao Dashboard Nativo HTML gerado pelo Apache JMeter.

---

## 🛠️ Tecnologias Utilizadas

- **Desktop Shell:** Electron (`electron`, `@electron/packager`).
- **Frontend:** Vue.js 3 (Composition API, JavaScript puro, sem TypeScript), Vite, CSS3/SCSS Moderno, Lucide Icons.
- **Gráficos:** Apache ECharts (`echarts`).
- **Backend:** Node.js, Express.js (JavaScript puro ESM).
- **Comunicação:** API REST + WebSocket (`ws`) para telemetria em tempo real.
- **Banco de Dados:** SQLite nativo via `node:sqlite` (com WAL mode e persistência contínua).
- **Motor de Execução:** Apache JMeter 5.6.3 (modo CLI não-gráfico).

---

## 📦 Scripts Disponíveis no `package.json`

| Comando | Descrição |
| :--- | :--- |
| `npm start` / `npm run electron` | Inicia o executável desktop Electron conectando backend e frontend |
| `npm run test:junit` | Executa a suíte completa de 26 testes automatizados com JUnit 5 (Java) |
| `npm run build:app` | Compila o frontend e empacota o executável `JMETRIX.exe` para Windows x64 |
| `npm run start:backend` | Inicia somente o servidor backend na porta 3001 |
| `npm run start:frontend` | Inicia o frontend em modo de desenvolvimento Vite |
| `npm run build:frontend` | Compila os arquivos de produção do Vue 3 em `frontend/dist` |

---

## ☕ Suíte de Testes com JUnit 5 (Java)

O projeto conta com uma suíte de testes de unidade e integração escrita em **Java** com **JUnit 5 (Jupiter)** localizada no diretório `tests-junit/`.

### Como Executar os Testes JUnit:

1. **Via Script de 1 Clique (.bat):**
   Dê um duplo clique em `run-junit.bat` na raiz do projeto.
2. **Via Terminal:**
   ```bash
   npm run test:junit
   ```
3. **Pela Interface Web/Desktop:**
   Acesse a tela de **Configurações** no JMETRIX e clique no botão **"Executar Testes JUnit 5"** para visualizar a árvore de testes em tempo real.
4. **Pela sua IDE Java Favorita (IntelliJ IDEA / VS Code / Eclipse):**
   Abra a pasta `tests-junit/` como projeto Maven através do arquivo `pom.xml`.

### Cobertura da Suíte JUnit:
- **Segurança Anti-SSRF:** Bloqueio de localhost, loopback, redes privadas RFC 1918 e metadados de nuvem.
- **Cálculo Estatístico & APDEX:** Validação matemática dos percentis (P50, P90, P95, P99), média, vazão e fórmula de satisfação do usuário APDEX ($T=500\text{ms}$).
- **Validação de Planos JMX:** Inspeção estrutural da árvore XML do Apache JMeter e tetos operacionais de VUs e tempo.
- **Motor de Diagnóstico:** Testes de pontuação técnica (Score 0-100) e geração de recomendações.
- **Integração com a API REST:** Chamadas HTTP automáticas contra a API Node.js validando endpoints e respostas.

---

## 🔒 Segurança

- **Proteção contra SSRF:** O resolvedor de DNS bloqueia intervalos `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, endereços de loopback IPv6 e metadados de provedores de nuvem (`169.254.169.254`).
- **Prevenção de Command Injection:** O processo do JMeter é invocado através de `child_process.spawn` utilizando arrays de argumentos delimitados, sem concatenação de strings de shell.
- **Controle de Recursos:** Tetos máximos configuráveis para VUs e duração garantem que o sistema opere dentro de limites operacionais seguros.
