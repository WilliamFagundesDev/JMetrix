package com.jmetrix.tests;

import com.jmetrix.core.JmxPlanValidator;
import com.jmetrix.core.JmxPlanValidator.JmxValidationResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes do Validador de Planos JMX do Apache JMeter (JUnit 5)")
public class JmxPlanValidatorTest {

    private final String VALID_JMX =
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<jmeterTestPlan version=\"1.2\" properties=\"5.0\" jmeter=\"5.6.3\">\n" +
            "  <hashTree>\n" +
            "    <TestPlan guiclass=\"TestPlanGui\" testclass=\"TestPlan\" testname=\"JMETRIX Plan\">\n" +
            "      <elementProp name=\"TestPlan.user_defined_variables\" elementType=\"Arguments\"/>\n" +
            "    </TestPlan>\n" +
            "    <hashTree>\n" +
            "      <ThreadGroup guiclass=\"ThreadGroupGui\" testclass=\"ThreadGroup\" testname=\"Thread Group\">\n" +
            "        <stringProp name=\"ThreadGroup.num_threads\">25</stringProp>\n" +
            "        <stringProp name=\"ThreadGroup.ramp_time\">5</stringProp>\n" +
            "        <stringProp name=\"ThreadGroup.duration\">60</stringProp>\n" +
            "      </ThreadGroup>\n" +
            "      <hashTree>\n" +
            "        <HTTPSamplerProxy guiclass=\"HttpTestSampleGui\" testclass=\"HTTPSamplerProxy\" testname=\"GET /api/v1\">\n" +
            "          <stringProp name=\"HTTPSampler.domain\">example.com</stringProp>\n" +
            "          <stringProp name=\"HTTPSampler.path\">/api/v1</stringProp>\n" +
            "          <stringProp name=\"HTTPSampler.method\">GET</stringProp>\n" +
            "        </HTTPSamplerProxy>\n" +
            "      </hashTree>\n" +
            "    </hashTree>\n" +
            "  </hashTree>\n" +
            "</jmeterTestPlan>";

    @Test
    @DisplayName("Deve aprovar plano JMX sintática e estruturalmente válido")
    void deveAprovarPlanoJmxValido() {
        JmxValidationResult result = JmxPlanValidator.validate(VALID_JMX, 100, 1800);
        assertTrue(result.valid, "Plano com TestPlan, ThreadGroup e HTTPSamplerProxy deve ser válido");
        assertEquals(25, result.vus);
        assertEquals(60, result.duration);
        assertEquals(1, result.endpointCount);
    }

    @Test
    @DisplayName("Deve rejeitar plano JMX quando quantidade de VUs ultrapassar teto de segurança")
    void deveRejeitarPlanoComVusAcimaDoLimite() {
        // Limite configurado em 20 VUs, mas o plano tem 25 VUs
        JmxValidationResult result = JmxPlanValidator.validate(VALID_JMX, 20, 1800);
        assertFalse(result.valid, "Deve bloquear teste cujo número de VUs ultrapassa o limite de segurança");
        assertTrue(result.message.contains("excede o limite"));
    }

    @Test
    @DisplayName("Deve rejeitar plano JMX quando a duração ultrapassar o teto operacional")
    void deveRejeitarPlanoComDuracaoAcimaDoLimite() {
        // Limite configurado em 30 segundos, mas o plano tem 60s
        JmxValidationResult result = JmxPlanValidator.validate(VALID_JMX, 100, 30);
        assertFalse(result.valid, "Deve bloquear teste cuja duração ultrapassa o limite permitido");
        assertTrue(result.message.contains("Duração"));
    }

    @Test
    @DisplayName("Deve rejeitar XML que não possua ThreadGroup")
    void deveRejeitarPlanoSemThreadGroup() {
        String invalidJmx = VALID_JMX.replace("<ThreadGroup", "<NonThreadGroup").replace("</ThreadGroup>", "</NonThreadGroup>");
        JmxValidationResult result = JmxPlanValidator.validate(invalidJmx, 100, 1800);
        assertFalse(result.valid);
        assertTrue(result.message.contains("ThreadGroup"));
    }

    @Test
    @DisplayName("Deve rejeitar XML que não possua Sampler HTTP (sem endpoints)")
    void deveRejeitarPlanoSemHttpSampler() {
        String noSamplersJmx = VALID_JMX.replace("<HTTPSamplerProxy", "<Ignored").replace("</HTTPSamplerProxy>", "</Ignored>");
        JmxValidationResult result = JmxPlanValidator.validate(noSamplersJmx, 100, 1800);
        assertFalse(result.valid);
        assertTrue(result.message.contains("HTTPSamplerProxy"));
    }

    @Test
    @DisplayName("Deve lidar com XML mal formatado retornando erro sem lançar exceção não tratada")
    void deveLidarComXmlMalFormatado() {
        JmxValidationResult result = JmxPlanValidator.validate("<jmeterTestPlan><unclosed>", 100, 1800);
        assertFalse(result.valid);
        assertTrue(result.message.contains("XML"));
    }
}
