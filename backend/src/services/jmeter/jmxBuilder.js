import fs from 'fs';
import path from 'path';

export class JMXBuilder {
  /**
   * Escape XML special characters
   */
  static escapeXml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Build complete JMX XML test plan
   */
  static generateJmx({
    testId,
    testName,
    testType, // 'smoke' | 'load' | 'stress' | 'spike' | 'endurance'
    targetUrl,
    vus,
    duration,
    rampUp,
    endpoints = [],
    delayMs = 1000,
    jtlFilePath
  }) {
    const urlObj = new URL(targetUrl);
    const domain = urlObj.hostname;
    const protocol = urlObj.protocol.replace(':', '');
    const port = urlObj.port || (protocol === 'https' ? '443' : '80');

    // Ensure we have at least 1 endpoint
    const targetEndpoints = endpoints.length > 0 ? endpoints : [
      { path: urlObj.pathname || '/', method: 'GET', name: 'Home' }
    ];

    // Calculate timing parameters based on test type
    let numThreads = vus || 10;
    let rampTime = rampUp || 10;
    let durationSeconds = duration || 60;
    let timerDelay = delayMs || 1000;
    let timerRange = Math.round(timerDelay * 0.5);

    if (testType === 'smoke') {
      numThreads = Math.min(numThreads, 2);
      rampTime = Math.min(rampTime, 5);
      durationSeconds = Math.min(durationSeconds, 30);
      timerDelay = 500;
      timerRange = 200;
    } else if (testType === 'spike') {
      rampTime = Math.max(1, Math.min(rampTime, 5)); // rapid ramp up
    } else if (testType === 'endurance') {
      timerDelay = Math.max(timerDelay, 1500); // realistic user pacing over prolonged time
    }

    // Generate HTTP Samplers for each endpoint
    const samplersXml = targetEndpoints.map((ep, idx) => {
      const epPath = ep.path || '/';
      const epMethod = (ep.method || 'GET').toUpperCase();
      const rawName = ep.name || `Endpoint_${idx + 1}_${epPath}`;
      let safeName = String(rawName)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/["\\]/g, '')
        .replace(/,/g, ' - ')
        .replace(/\s+/g, ' ')
        .trim();
      if (safeName.length > 70) {
        safeName = safeName.substring(0, 67).trim() + '...';
      }
      const samplerName = this.escapeXml(safeName);
      const cleanPath = this.escapeXml(epPath);

      return `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${samplerName}" enabled="true">
          <stringProp name="HTTPSampler.domain">${this.escapeXml(domain)}</stringProp>
          <stringProp name="HTTPSampler.port">${this.escapeXml(port)}</stringProp>
          <stringProp name="HTTPSampler.protocol">${this.escapeXml(protocol)}</stringProp>
          <stringProp name="HTTPSampler.contentEncoding">UTF-8</stringProp>
          <stringProp name="HTTPSampler.path">${cleanPath}</stringProp>
          <stringProp name="HTTPSampler.method">${epMethod}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
        </HTTPSamplerProxy>
        <hashTree>
          <!-- Response Assertion for HTTP status codes 200..399 -->
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Assert HTTP 2xx/3xx" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="49586">[2-3][0-9][0-9]</stringProp>
            </collectionProp>
            <stringProp name="Assertion.custom_message">Código HTTP inesperado retornado pelo servidor</stringProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">false</boolProp>
            <intProp name="Assertion.test_type">1</intProp>
          </ResponseAssertion>
          <hashTree/>
        </hashTree>
      `;
    }).join('\n');

    const escapedJtlPath = this.escapeXml(jtlFilePath);

    const jmxTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="JMETRIX_${this.escapeXml(testId)}" enabled="true">
      <stringProp name="TestPlan.comments">Plano de Teste gerado automaticamente pelo JMETRIX</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="Variaveis de Usuario" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
    </TestPlan>
    <hashTree>
      <!-- Thread Group principal -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="JMETRIX Virtual Users" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <intProp name="LoopController.loops">-1</intProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${numThreads}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${rampTime}</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">${durationSeconds}</stringProp>
        <stringProp name="ThreadGroup.delay">0</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
        <!-- Header Manager para simular navegadores modernos -->
        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="JMETRIX Headers" enabled="true">
          <collectionProp name="HeaderManager.headers">
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">User-Agent</stringProp>
              <stringProp name="Header.value">Mozilla/5.0 (Windows NT 10.0; Win64; x64) JMETRIX-Performance-Agent/1.0</stringProp>
            </elementProp>
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">Accept</stringProp>
              <stringProp name="Header.value">text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8</stringProp>
            </elementProp>
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">Accept-Language</stringProp>
              <stringProp name="Header.value">pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7</stringProp>
            </elementProp>
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">X-Performance-Tester</stringProp>
              <stringProp name="Header.value">JMETRIX</stringProp>
            </elementProp>
          </collectionProp>
        </HeaderManager>
        <hashTree/>

        <!-- Cookie Manager para simulação de sessão realista -->
        <CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="JMETRIX Cookies" enabled="true">
          <collectionProp name="CookieManager.cookies"/>
          <boolProp name="CookieManager.clearEachIteration">false</boolProp>
          <boolProp name="CookieManager.controlledByThreadGroup">false</boolProp>
        </CookieManager>
        <hashTree/>

        <!-- Timer uniforme para pacing humano realista -->
        <UniformRandomTimer guiclass="UniformRandomTimerGui" testclass="UniformRandomTimer" testname="Pacing Timer" enabled="true">
          <stringProp name="ConstantTimer.delay">${timerDelay}</stringProp>
          <stringProp name="RandomTimer.range">${timerRange}</stringProp>
        </UniformRandomTimer>
        <hashTree/>

        ${samplersXml}

        <!-- Result Collector para salvar resultados em formato CSV no arquivo JTL -->
        <ResultCollector guiclass="SimpleDataWriter" testclass="ResultCollector" testname="JMETRIX Data Writer" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>false</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename">${escapedJtlPath}</stringProp>
        </ResultCollector>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;

    return jmxTemplate;
  }
}

