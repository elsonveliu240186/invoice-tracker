package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.application.invoice.LibreOfficePdfConverter.ProcessRunner;
import com.example.invoicetracker.domain.invoice.PdfConversionFailedException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Unit tests for {@link LibreOfficePdfConverter} that do NOT invoke a real
 * {@code soffice} binary. Uses a {@link ProcessRunner} seam for testability.
 */
class LibreOfficePdfConverterUnitTest {

    @TempDir
    Path tempDir;

    @Test
    void semaphore_blocks_excess_calls() {
        // Semaphore with 0 permits — every acquire fails immediately
        Semaphore zeroPermits = new Semaphore(0);
        LibreOfficePdfConverter converter = new LibreOfficePdfConverter(
            zeroPermits,
            cmd -> { throw new AssertionError("Should not reach ProcessRunner"); }
        );

        assertThatThrownBy(() -> converter.convert(new byte[]{1, 2, 3}))
            .isInstanceOf(PdfConversionFailedException.class)
            .satisfies(ex -> assertThat(((PdfConversionFailedException) ex).isBusy()).isTrue());
    }

    @Test
    void tempdir_deleted_on_success() throws Exception {
        AtomicReference<Path> capturedTmpDir = new AtomicReference<>();
        byte[] fakePdfBytes = "%PDF-1.4 fake".getBytes();

        ProcessRunner runner = cmd -> {
            Process process = mock(Process.class);
            // Extract the input file path from the command (last element)
            String inputArg = cmd.toList().get(cmd.toList().size() - 1);
            Path inputPath = Path.of(inputArg);
            capturedTmpDir.set(inputPath.getParent());

            // Write a fake PDF output file
            Path fakeOutput = inputPath.getParent().resolve("in.pdf");
            Files.write(fakeOutput, fakePdfBytes);

            try {
                when(process.waitFor(20, TimeUnit.SECONDS)).thenReturn(true);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("interrupted", e);
            }
            when(process.exitValue()).thenReturn(0);
            when(process.getInputStream()).thenReturn(
                new ByteArrayInputStream(new byte[0]));
            return process;
        };

        Semaphore semaphore = new Semaphore(1);
        LibreOfficePdfConverter converter = new LibreOfficePdfConverter(semaphore, runner);
        byte[] result = converter.convert("fake-docx-bytes".getBytes());

        assertThat(result).isEqualTo(fakePdfBytes);
        // Temp dir should be deleted after success
        assertThat(capturedTmpDir.get()).doesNotExist();
    }

    @Test
    void tempdir_deleted_on_exception() throws Exception {
        AtomicReference<Path> capturedTmpDir = new AtomicReference<>();

        ProcessRunner runner = cmd -> {
            Process process = mock(Process.class);
            String inputArg = cmd.toList().get(cmd.toList().size() - 1);
            Path inputPath = Path.of(inputArg);
            capturedTmpDir.set(inputPath.getParent());

            try {
                when(process.waitFor(20, TimeUnit.SECONDS)).thenReturn(true);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("interrupted", e);
            }
            when(process.exitValue()).thenReturn(1); // non-zero exit
            when(process.getInputStream()).thenReturn(
                new ByteArrayInputStream("error output".getBytes()));
            return process;
        };

        Semaphore semaphore = new Semaphore(1);
        LibreOfficePdfConverter converter = new LibreOfficePdfConverter(semaphore, runner);

        assertThatThrownBy(() -> converter.convert("fake-docx-bytes".getBytes()))
            .isInstanceOf(PdfConversionFailedException.class);

        // Temp dir should be deleted even after exception
        assertThat(capturedTmpDir.get()).doesNotExist();
    }

    @Test
    void timeout_kills_process_and_throws() throws Exception {
        AtomicReference<Process> capturedProcess = new AtomicReference<>();

        ProcessRunner runner = cmd -> {
            Process process = mock(Process.class);
            capturedProcess.set(process);
            try {
                when(process.waitFor(20, TimeUnit.SECONDS)).thenReturn(false);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("interrupted", e);
            }
            when(process.getInputStream()).thenReturn(
                new ByteArrayInputStream(new byte[0]));
            return process;
        };

        Semaphore semaphore = new Semaphore(1);
        LibreOfficePdfConverter converter = new LibreOfficePdfConverter(semaphore, runner);

        assertThatThrownBy(() -> converter.convert("fake-docx-bytes".getBytes()))
            .isInstanceOf(PdfConversionFailedException.class)
            .hasMessageContaining("timed out");

        // destroyForcibly should be called
        verify(capturedProcess.get()).destroyForcibly();
    }

    @Test
    void non_zero_exit_throws_conversion_failed() throws Exception {
        ProcessRunner runner = cmd -> {
            Process process = mock(Process.class);
            try {
                when(process.waitFor(20, TimeUnit.SECONDS)).thenReturn(true);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("interrupted", e);
            }
            when(process.exitValue()).thenReturn(2);
            when(process.getInputStream()).thenReturn(
                new ByteArrayInputStream("soffice error".getBytes()));
            return process;
        };

        Semaphore semaphore = new Semaphore(1);
        LibreOfficePdfConverter converter = new LibreOfficePdfConverter(semaphore, runner);

        assertThatThrownBy(() -> converter.convert("fake-docx-bytes".getBytes()))
            .isInstanceOf(PdfConversionFailedException.class)
            .hasMessageContaining("exit code 2");
    }

    @Test
    void io_exception_from_process_runner_wraps_as_conversion_failed() {
        // Cover: IOException catch → PdfConversionFailedException("IO error during PDF conversion")
        // Also cover: tmpDir != null → false path in finally block (tmpDir not assigned before throw)
        ProcessRunner runner = cmd -> {
            throw new IOException("process start failed");
        };

        Semaphore semaphore = new Semaphore(1);
        LibreOfficePdfConverter converter = new LibreOfficePdfConverter(semaphore, runner);

        assertThatThrownBy(() -> converter.convert("fake-docx-bytes".getBytes()))
            .isInstanceOf(PdfConversionFailedException.class)
            .hasMessageContaining("IO error");
    }

    @Test
    void pdf_output_missing_throws_conversion_failed() throws Exception {
        // Cover: !Files.exists(outputPdf) → true branch
        ProcessRunner runner = cmd -> {
            Process process = mock(Process.class);
            try {
                when(process.waitFor(20, TimeUnit.SECONDS)).thenReturn(true);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("interrupted", e);
            }
            when(process.exitValue()).thenReturn(0);
            when(process.getInputStream()).thenReturn(
                new ByteArrayInputStream(new byte[0]));
            // Note: we do NOT write an in.pdf file, so the output check fails
            return process;
        };

        Semaphore semaphore = new Semaphore(1);
        LibreOfficePdfConverter converter = new LibreOfficePdfConverter(semaphore, runner);

        assertThatThrownBy(() -> converter.convert("fake-docx-bytes".getBytes()))
            .isInstanceOf(PdfConversionFailedException.class)
            .hasMessageContaining("did not produce a PDF output file");
    }
}
