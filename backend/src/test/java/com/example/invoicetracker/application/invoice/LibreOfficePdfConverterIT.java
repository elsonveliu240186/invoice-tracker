package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.application.invoice.LibreOfficePdfConverter.ProcessRunner;
import com.example.invoicetracker.support.TemplateFixtures;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Semaphore;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/**
 * Integration test for {@link LibreOfficePdfConverter} that runs a real {@code soffice} binary.
 *
 * <p>Gated on {@code LIBREOFFICE_BIN_TEST} environment variable — skipped on developer
 * machines without LibreOffice installed; enabled in CI by exporting the variable.
 */
@EnabledIfEnvironmentVariable(named = "LIBREOFFICE_BIN_TEST", matches = ".+")
class LibreOfficePdfConverterIT {

    @Test
    void real_soffice_converts_to_pdf() throws IOException {
        String binary = System.getenv("LIBREOFFICE_BIN_TEST");
        Semaphore semaphore = new Semaphore(2);

        ProcessRunner runner = cmd -> {
            // Replace the binary with the test env var value
            List<String> args = new ArrayList<>(cmd.toList());
            args.set(0, binary);
            ProcessBuilder pb = new ProcessBuilder(args);
            pb.redirectErrorStream(true);
            return pb.start();
        };

        LibreOfficePdfConverter converter = new LibreOfficePdfConverter(semaphore, runner);

        byte[] docxBytes = TemplateFixtures.minimalDocx();
        byte[] pdfBytes = converter.convert(docxBytes);

        assertThat(pdfBytes).isNotEmpty();
        assertThat(new String(pdfBytes, 0, 4)).isEqualTo("%PDF");

        // Extract text and verify it's a parseable PDF
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            assertThat(text).isNotBlank();
        }
    }
}
