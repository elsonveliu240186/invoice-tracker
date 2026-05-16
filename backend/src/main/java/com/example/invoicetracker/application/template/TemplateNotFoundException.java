package com.example.invoicetracker.application.template;

public class TemplateNotFoundException extends RuntimeException {
    public TemplateNotFoundException() {
        super("No invoice template is available. Please upload one via Settings → Invoice Template.");
    }
}
