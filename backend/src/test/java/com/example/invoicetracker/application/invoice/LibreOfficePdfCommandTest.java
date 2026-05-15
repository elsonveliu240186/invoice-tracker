package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link LibreOfficePdfCommand}.
 * Verifies that the command list contains all required LibreOffice flags.
 */
class LibreOfficePdfCommandTest {

    @Test
    void command_contains_required_flags() {
        Path loProfile = Path.of("/tmp/lo-profile-test");
        Path outDir = Path.of("/tmp/out");
        Path inputFile = Path.of("/tmp/in.docx");

        LibreOfficePdfCommand cmd = new LibreOfficePdfCommand(
            "soffice", loProfile, outDir, inputFile);
        List<String> command = cmd.toList();

        assertThat(command).contains("soffice");
        assertThat(command).contains("--headless");
        assertThat(command).contains("--norestore");
        assertThat(command).contains("--nofirststartwizard");
        assertThat(command).contains("--nolockcheck");
        assertThat(command).contains("--convert-to");
        assertThat(command).contains("pdf");
        assertThat(command).contains("--outdir");
        assertThat(command).anyMatch(s -> s.contains("UserInstallation"));
        assertThat(command).anyMatch(s -> s.contains("lo-profile-test"));
    }

    @Test
    void command_uses_custom_binary() {
        Path loProfile = Path.of("/tmp/lo-profile");
        Path outDir = Path.of("/tmp/out");
        Path inputFile = Path.of("/tmp/input.docx");

        LibreOfficePdfCommand cmd = new LibreOfficePdfCommand(
            "/usr/bin/soffice", loProfile, outDir, inputFile);
        List<String> command = cmd.toList();

        assertThat(command.get(0)).isEqualTo("/usr/bin/soffice");
    }

    @Test
    void command_uses_absolute_paths() {
        Path loProfile = Path.of("relative/profile");
        Path outDir = Path.of("relative/out");
        Path inputFile = Path.of("relative/input.docx");

        LibreOfficePdfCommand cmd = new LibreOfficePdfCommand(
            "soffice", loProfile, outDir, inputFile);
        List<String> command = cmd.toList();

        // outdir and inputFile args should be absolute (OS-agnostic check)
        int outDirIndex = command.indexOf("--outdir");
        assertThat(Path.of(command.get(outDirIndex + 1)).isAbsolute()).isTrue();
        // Last element is the input file
        assertThat(Path.of(command.get(command.size() - 1)).isAbsolute()).isTrue();
    }
}
