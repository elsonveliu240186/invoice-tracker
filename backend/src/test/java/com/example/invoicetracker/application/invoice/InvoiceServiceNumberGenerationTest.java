package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.domain.client.ClientRepository;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.time.Year;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceNumberGenerationTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private InvoicePdfRenderer pdfRenderer;
    @Mock
    private InvoiceMailer mailer;
    private InvoiceService service;

    @BeforeEach
    void setUp() {
        CompanyProperties company = InvoiceFixtures.company();
        service = new InvoiceService(
            invoiceRepository, clientRepository, pdfRenderer, mailer, company);
    }

    @Test
    void first_invoice_of_year_is_0001() {
        int year = Year.now().getValue();
        when(invoiceRepository.findMaxNumberForYear(year)).thenReturn(null);

        String number = service.nextInvoiceNumber();

        assertThat(number).isEqualTo("INV-" + year + "-0001");
    }

    @Test
    void increments_correctly_for_existing_year() {
        int year = Year.now().getValue();
        when(invoiceRepository.findMaxNumberForYear(year))
            .thenReturn("INV-" + year + "-0001");

        String number = service.nextInvoiceNumber();

        assertThat(number).isEqualTo("INV-" + year + "-0002");
    }

    @Test
    void increments_to_four_digits_with_padding() {
        int year = Year.now().getValue();
        when(invoiceRepository.findMaxNumberForYear(year))
            .thenReturn("INV-" + year + "-0009");

        String number = service.nextInvoiceNumber();

        assertThat(number).isEqualTo("INV-" + year + "-0010");
    }

    @Test
    void handles_year_rollover_by_returning_0001() {
        // For a "future" year where no invoices exist yet: findMaxNumberForYear returns null
        int year = Year.now().getValue();
        when(invoiceRepository.findMaxNumberForYear(year)).thenReturn(null);

        String number = service.nextInvoiceNumber();

        assertThat(number).startsWith("INV-" + year + "-");
        assertThat(number).endsWith("-0001");
    }

    @Test
    void create_with_null_number_auto_generates() {
        UUID clientId = UUID.randomUUID();
        int year = Year.now().getValue();

        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(InvoiceFixtures.client(clientId, "Acme", "a@b.com")));
        when(invoiceRepository.findMaxNumberForYear(year)).thenReturn(null);
        when(invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull(any()))
            .thenReturn(false);
        when(invoiceRepository.save(any(Invoice.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        Invoice created = service.create(null, clientId,
            java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(30),
            java.util.List.of(InvoiceFixtures.line("Item", 1, "50.00")),
            java.math.BigDecimal.ZERO);

        assertThat(created.number()).isEqualTo("INV-" + year + "-0001");
    }

    @Test
    void create_with_blank_number_auto_generates() {
        UUID clientId = UUID.randomUUID();
        int year = Year.now().getValue();

        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(InvoiceFixtures.client(clientId, "Acme", "a@b.com")));
        when(invoiceRepository.findMaxNumberForYear(year)).thenReturn(null);
        when(invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull(any()))
            .thenReturn(false);
        when(invoiceRepository.save(any(Invoice.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        Invoice created = service.create("  ", clientId,
            java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(30),
            java.util.List.of(InvoiceFixtures.line("Item", 1, "50.00")),
            java.math.BigDecimal.ZERO);

        assertThat(created.number()).isEqualTo("INV-" + year + "-0001");
    }
}
