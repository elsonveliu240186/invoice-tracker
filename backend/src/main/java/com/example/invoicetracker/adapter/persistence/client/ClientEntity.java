package com.example.invoicetracker.adapter.persistence.client;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * JPA entity for the clients table.
 */
@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
public class ClientEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(length = 32)
    private String phone;

    @Column(length = 500)
    private String address;

    @Column(name = "company_name", length = 200, nullable = false)
    private String companyName = "";

    @Column(name = "company_address", length = 500, nullable = false)
    private String companyAddress = "";

    @Column(name = "company_vat_number", length = 50, nullable = false)
    private String companyVatNumber = "";

    @Column(name = "company_iban", length = 100, nullable = false)
    private String companyIban = "";

    @Column(name = "company_swift_bic", length = 20, nullable = false)
    private String companySwiftBic = "";

    @Column(name = "company_bank_name", length = 200, nullable = false)
    private String companyBankName = "";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
