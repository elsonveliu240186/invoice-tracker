package com.example.invoicetracker.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import org.junit.jupiter.api.Test;

/**
 * Smoke tests verifying that {@link TemplateFixtures} produces valid byte arrays.
 */
class TemplateFixturesTest {

    @Test
    void minimalDocx_is_not_empty_and_starts_with_zip_magic() throws IOException {
        byte[] docx = TemplateFixtures.minimalDocx();
        assertThat(docx).isNotEmpty();
        assertThat(docx[0] & 0xFF).isEqualTo(0x50); // P
        assertThat(docx[1] & 0xFF).isEqualTo(0x4B); // K
    }

    @Test
    void notADocx_is_not_zip() {
        byte[] notDocx = TemplateFixtures.notADocx();
        assertThat(notDocx).isNotEmpty();
        assertThat(notDocx[0] & 0xFF).isNotEqualTo(0x50);
    }

    @Test
    void invalidDocxMissingWordDocument_starts_with_zip_magic() throws IOException {
        byte[] invalid = TemplateFixtures.invalidDocxMissingWordDocument();
        assertThat(invalid).isNotEmpty();
        assertThat(invalid[0] & 0xFF).isEqualTo(0x50);
        assertThat(invalid[1] & 0xFF).isEqualTo(0x4B);
    }

    @Test
    void docxWithExternalRelationship_starts_with_zip_magic() throws IOException {
        byte[] evil = TemplateFixtures.docxWithExternalRelationship();
        assertThat(evil).isNotEmpty();
        assertThat(evil[0] & 0xFF).isEqualTo(0x50);
        assertThat(evil[1] & 0xFF).isEqualTo(0x4B);
    }
}
