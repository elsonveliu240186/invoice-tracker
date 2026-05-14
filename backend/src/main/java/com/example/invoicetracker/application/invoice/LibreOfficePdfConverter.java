package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.domain.invoice.PdfConversionFailedException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Default {@link InvoicePdfConverter} that delegates to LibreOffice headless.
 *
 * <p>Each conversion runs in an isolated temporary directory; the per-call
 * {@code UserInstallation} profile is deleted in a {@code finally} block.
 * A {@link Semaphore} caps concurrent conversions to
 * {@code app.libreoffice.concurrency} (default 2).
 */
@Component
public class LibreOfficePdfConverter implements InvoicePdfConverter {

    private static final Logger log = LoggerFactory.getLogger(LibreOfficePdfConverter.class);

    /**
     * Functional interface for running an OS command and returning the resulting process.
     * Extracted from the production code to allow injection of a test double.
     */
    @FunctionalInterface
    interface ProcessRunner {
        /**
         * Runs the given command list and returns the started {@link Process}.
         *
         * @param command the command and its arguments
         * @return the started process
         * @throws IOException if the process cannot be started
         */
        Process run(LibreOfficePdfCommand command) throws IOException;
    }

    @Value("${app.libreoffice.binary:soffice}")
    private String soBinary = "soffice";

    @Value("${app.libreoffice.timeout-seconds:20}")
    private int timeoutSeconds = 20;

    private final Semaphore semaphore;
    private final ProcessRunner processRunner;

    /**
     * Production constructor: uses a real {@link ProcessBuilder}.
     *
     * @param concurrency maximum concurrent LibreOffice processes (from
     *                    {@code app.libreoffice.concurrency}, default 2)
     */
    @Autowired
    public LibreOfficePdfConverter(
        @Value("${app.libreoffice.concurrency:2}") int concurrency
    ) {
        this.semaphore = new Semaphore(concurrency);
        this.processRunner = cmd -> {
            // nosemgrep: java.lang.security.audit.command-injection-process-builder
            // False positive: all args are server-controlled (soBinary from @Value config;
            // loProfileDir/outDir/inputFile are JVM-generated temp Paths). List-form
            // ProcessBuilder never invokes a shell, so metacharacter injection is impossible.
            ProcessBuilder pb = new ProcessBuilder(cmd.toList());
            pb.redirectErrorStream(true);
            return pb.start();
        };
    }

    /**
     * Test constructor that accepts a custom process runner and semaphore.
     * Uses a default binary name "soffice" and 20-second timeout for testing.
     *
     * @param semaphore     custom semaphore (allows saturation testing)
     * @param processRunner factory for test processes
     */
    LibreOfficePdfConverter(Semaphore semaphore, ProcessRunner processRunner) {
        this.semaphore = semaphore;
        this.processRunner = processRunner;
        this.soBinary = "soffice";
        this.timeoutSeconds = 20;
    }

    @Override
    public byte[] convert(byte[] docxBytes) {
        if (!semaphore.tryAcquire()) {
            throw new PdfConversionFailedException(
                "PDF converter pool is at capacity — please retry shortly", true);
        }
        Path tmpDir = null;
        try {
            tmpDir = Files.createTempDirectory("lo-convert-");
            Path loProfile = tmpDir.resolve("lo-profile-" + UUID.randomUUID());
            Files.createDirectories(loProfile);

            Path inputFile = tmpDir.resolve("in.docx");
            Files.write(inputFile, docxBytes);

            LibreOfficePdfCommand cmd = new LibreOfficePdfCommand(
                soBinary, loProfile, tmpDir, inputFile);

            long start = System.currentTimeMillis();
            Process process = processRunner.run(cmd);

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new PdfConversionFailedException(
                    "LibreOffice conversion timed out after " + timeoutSeconds + "s");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                try (InputStream is = process.getInputStream()) {
                    String stderr = new String(is.readAllBytes());
                    log.warn("LibreOffice exited with code {} stderr={}", exitCode, stderr);
                }
                throw new PdfConversionFailedException(
                    "LibreOffice conversion failed with exit code " + exitCode);
            }

            // LibreOffice writes <basename>.pdf in the output dir
            Path outputPdf = tmpDir.resolve("in.pdf");
            if (!Files.exists(outputPdf)) {
                throw new PdfConversionFailedException(
                    "LibreOffice did not produce a PDF output file");
            }

            byte[] pdfBytes = Files.readAllBytes(outputPdf);
            long elapsed = System.currentTimeMillis() - start;
            log.info("LibreOffice conversion complete in {}ms, output {} bytes", elapsed,
                pdfBytes.length);
            return pdfBytes;

        } catch (IOException e) {
            throw new PdfConversionFailedException("IO error during PDF conversion", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new PdfConversionFailedException("PDF conversion interrupted", e);
        } finally {
            semaphore.release();
            if (tmpDir != null) {
                deleteQuietly(tmpDir);
            }
        }
    }

    private void deleteQuietly(Path dir) {
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder())
                .forEach(p -> {
                    try {
                        Files.delete(p);
                    } catch (IOException ex) {
                        log.debug("Could not delete temp path {}: {}", p, ex.getMessage());
                    }
                });
        } catch (IOException ex) {
            log.debug("Could not walk temp dir {}: {}", dir, ex.getMessage());
        }
    }
}
