package com.example.invoicetracker.application.invoice;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Pure value object that builds the {@link ProcessBuilder} argument list for
 * a LibreOffice headless DOCX-to-PDF conversion.
 *
 * <p>Extracted from {@link LibreOfficePdfConverter} so the argument list can be
 * verified in unit tests without actually invoking {@code soffice}.
 */
public final class LibreOfficePdfCommand {

    private final List<String> command;

    /**
     * Constructs the command list.
     *
     * @param soBinary     path to the {@code soffice} binary
     * @param loProfileDir per-call temporary directory used as {@code UserInstallation}
     * @param outDir       directory where the converted PDF will be written
     * @param inputFile    the DOCX file to convert
     */
    public LibreOfficePdfCommand(
        String soBinary,
        Path loProfileDir,
        Path outDir,
        Path inputFile
    ) {
        List<String> cmd = new ArrayList<>();
        cmd.add(soBinary);
        cmd.add("--headless");
        cmd.add("--norestore");
        cmd.add("--nofirststartwizard");
        cmd.add("--nolockcheck");
        cmd.add("-env:UserInstallation=file://" + loProfileDir.toAbsolutePath());
        cmd.add("--convert-to");
        cmd.add("pdf");
        cmd.add("--outdir");
        cmd.add(outDir.toAbsolutePath().toString());
        cmd.add(inputFile.toAbsolutePath().toString());
        this.command = Collections.unmodifiableList(cmd);
    }

    /**
     * Returns the immutable command list ready to be passed to {@link ProcessBuilder}.
     *
     * @return the command arguments
     */
    public List<String> toList() {
        return command;
    }
}
