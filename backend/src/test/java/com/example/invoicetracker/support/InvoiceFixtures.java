package com.example.invoicetracker.support;

import com.example.invoicetracker.application.invoice.CompanyProperties;
import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Fixture builders for tests involving invoices, lines, and clients.
 */
public final class InvoiceFixtures {

    private InvoiceFixtures() {}

    /**
     * Builds a sample client with the given ID, name, and email.
     */
    public static Client client(UUID id, String name, String email) {
        Instant now = Instant.now();
        return new Client(id, name, email, null, null, now, now, null);
    }

    /**
     * Builds a sample client with a generated ID.
     */
    public static Client client() {
        return client(UUID.randomUUID(), "Acme Corp", "acme@example.com");
    }

    /**
     * Builds a sample invoice line.
     */
    public static InvoiceLine line(String description, int qty, String unitPrice) {
        return new InvoiceLine(UUID.randomUUID(), description, qty,
            new BigDecimal(unitPrice), 0);
    }

    /**
     * Builds a sample invoice with two lines and 21% tax.
     */
    public static Invoice invoice(UUID id, UUID clientId) {
        Instant now = Instant.now();
        List<InvoiceLine> lines = List.of(
            line("Consulting services", 2, "100.00"),
            line("Support plan", 1, "50.00")
        );
        return new Invoice(
            id,
            "INV-2026-0001",
            clientId,
            LocalDate.of(2026, 5, 1),
            LocalDate.of(2026, 6, 1),
            lines,
            new BigDecimal("0.21"),
            null,
            now,
            now,
            null,
            null
        );
    }

    /**
     * Builds a sample invoice with a generated ID.
     */
    public static Invoice invoice(UUID clientId) {
        return invoice(UUID.randomUUID(), clientId);
    }

    /**
     * Builds a sample company properties object.
     */
    public static CompanyProperties company() {
        return new CompanyProperties(
            "Acme Corp",
            "123 Business St, New York NY",
            "billing@acme.com",
            "US-12345"
        );
    }
}
