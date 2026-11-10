package com.jmetrix.core;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

/**
 * Validador sintático e semântico de planos de teste XML (.jmx) gerados para o Apache JMeter.
 */
public class JmxPlanValidator {

    public static class JmxValidationResult {
        public final boolean valid;
        public final String message;
        public final int vus;
        public final int duration;
        public final int endpointCount;

        public JmxValidationResult(boolean valid, String message, int vus, int duration, int endpointCount) {
            this.valid = valid;
            this.message = message;
            this.vus = vus;
            this.duration = duration;
            this.endpointCount = endpointCount;
        }
    }

    public static JmxValidationResult validate(String jmxContent, int maxAllowedVus, int maxAllowedDuration) {
        if (jmxContent == null || jmxContent.trim().isEmpty()) {
            return new JmxValidationResult(false, "Conteúdo JMX está vazio.", 0, 0, 0);
        }

        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            // Desativar DTD externo para segurança (prevenção contra XXE)
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", false);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);

            DocumentBuilder builder = factory.newDocumentBuilder();
            builder.setErrorHandler(new org.xml.sax.ErrorHandler() {
                public void warning(org.xml.sax.SAXParseException e) {}
                public void error(org.xml.sax.SAXParseException e) {}
                public void fatalError(org.xml.sax.SAXParseException e) throws org.xml.sax.SAXException {
                    throw e;
                }
            });
            Document doc = builder.parse(new ByteArrayInputStream(jmxContent.getBytes(StandardCharsets.UTF_8)));

            // 1. Validar elemento raiz
            Element root = doc.getDocumentElement();
            if (!"jmeterTestPlan".equalsIgnoreCase(root.getNodeName())) {
                return new JmxValidationResult(false, "Elemento raiz deve ser <jmeterTestPlan>.", 0, 0, 0);
            }

            // 2. Validar TestPlan
            NodeList testPlans = doc.getElementsByTagName("TestPlan");
            if (testPlans.getLength() == 0) {
                return new JmxValidationResult(false, "Nenhum elemento <TestPlan> encontrado no plano JMX.", 0, 0, 0);
            }

            // 3. Validar ThreadGroup
            NodeList threadGroups = doc.getElementsByTagName("ThreadGroup");
            if (threadGroups.getLength() == 0) {
                return new JmxValidationResult(false, "Nenhum <ThreadGroup> configurado no plano JMX.", 0, 0, 0);
            }

            // Extrair VUs (num_threads) e Duration
            int vus = extractIntProp(doc, "ThreadGroup.num_threads", 0);
            int duration = extractIntProp(doc, "ThreadGroup.duration", 0);

            if (vus <= 0) {
                return new JmxValidationResult(false, "Quantidade de threads (VUs) deve ser maior que 0.", vus, duration, 0);
            }

            if (maxAllowedVus > 0 && vus > maxAllowedVus) {
                return new JmxValidationResult(false, "VUs (" + vus + ") excede o limite de segurança configurado (" + maxAllowedVus + ").", vus, duration, 0);
            }

            if (duration < 0) {
                return new JmxValidationResult(false, "Duração do teste não pode ser negativa.", vus, duration, 0);
            }

            if (maxAllowedDuration > 0 && duration > maxAllowedDuration) {
                return new JmxValidationResult(false, "Duração (" + duration + "s) excede o limite permitido (" + maxAllowedDuration + "s).", vus, duration, 0);
            }

            // 4. Validar Samplers HTTP
            NodeList samplers = doc.getElementsByTagName("HTTPSamplerProxy");
            if (samplers.getLength() == 0) {
                return new JmxValidationResult(false, "Nenhum <HTTPSamplerProxy> encontrado. O plano precisa testar ao menos um endpoint.", vus, duration, 0);
            }

            return new JmxValidationResult(true, "Plano JMX válido e aprovado.", vus, duration, samplers.getLength());

        } catch (Exception e) {
            return new JmxValidationResult(false, "Erro ao parsear XML do plano JMX: " + e.getMessage(), 0, 0, 0);
        }
    }

    private static int extractIntProp(Document doc, String propName, int defaultValue) {
        NodeList stringProps = doc.getElementsByTagName("stringProp");
        for (int i = 0; i < stringProps.getLength(); i++) {
            Element elem = (Element) stringProps.item(i);
            if (propName.equals(elem.getAttribute("name"))) {
                try {
                    return Integer.parseInt(elem.getTextContent().trim());
                } catch (NumberFormatException ignored) {}
            }
        }
        return defaultValue;
    }
}
