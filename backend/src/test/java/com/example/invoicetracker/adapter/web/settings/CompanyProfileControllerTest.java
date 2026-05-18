package com.example.invoicetracker.adapter.web.settings;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.application.company.CompanyProfileService;
import com.example.invoicetracker.domain.company.CompanyProfile;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Controller tests for {@link CompanyProfileController}.
 */
@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
@Testcontainers
class CompanyProfileControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    CompanyProfileService companyProfileService;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    }

    private CompanyProfile sampleProfile() {
        return new CompanyProfile(
            "Test Corp", "123 Test St", "+1 555-0000", "test@example.com",
            "VAT001", "GB12BARC00001234567890", "BARCGB22", "Barclays",
            Instant.now()
        );
    }

    @Test
    @WithMockUser
    void get_returns_200_with_payload() throws Exception {
        when(companyProfileService.get()).thenReturn(sampleProfile());

        mvc.perform(get("/api/v1/settings/company"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test Corp"))
            .andExpect(jsonPath("$.address").value("123 Test St"))
            .andExpect(jsonPath("$.phone").value("+1 555-0000"))
            .andExpect(jsonPath("$.email").value("test@example.com"))
            .andExpect(jsonPath("$.vatNumber").value("VAT001"))
            .andExpect(jsonPath("$.iban").value("GB12BARC00001234567890"))
            .andExpect(jsonPath("$.swiftBic").value("BARCGB22"))
            .andExpect(jsonPath("$.bankName").value("Barclays"));
    }

    @Test
    @WithMockUser
    void put_returns_200_with_updated_payload() throws Exception {
        when(companyProfileService.update(any(CompanyProfile.class))).thenReturn(sampleProfile());

        mvc.perform(put("/api/v1/settings/company")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Test Corp",
                      "address": "123 Test St",
                      "phone": "+1 555-0000",
                      "email": "test@example.com",
                      "vatNumber": "VAT001",
                      "iban": "GB12BARC00001234567890",
                      "swiftBic": "BARCGB22",
                      "bankName": "Barclays"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test Corp"));
    }

    @Test
    @WithMockUser
    void put_400_when_name_blank() throws Exception {
        mvc.perform(put("/api/v1/settings/company")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "",
                      "email": "test@example.com"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void put_400_when_email_invalid() throws Exception {
        mvc.perform(put("/api/v1/settings/company")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Valid Corp",
                      "email": "not-an-email"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void put_200_when_email_empty() throws Exception {
        when(companyProfileService.update(any(CompanyProfile.class))).thenReturn(sampleProfile());

        mvc.perform(put("/api/v1/settings/company")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Valid Corp",
                      "email": ""
                    }
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void put_401_when_anonymous() throws Exception {
        mvc.perform(put("/api/v1/settings/company")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "Corp"}
                    """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void get_401_when_anonymous() throws Exception {
        mvc.perform(get("/api/v1/settings/company"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void put_415_when_not_json() throws Exception {
        mvc.perform(put("/api/v1/settings/company")
                .contentType(MediaType.TEXT_PLAIN)
                .content("name=Corp"))
            .andExpect(status().isUnsupportedMediaType());
    }
}
