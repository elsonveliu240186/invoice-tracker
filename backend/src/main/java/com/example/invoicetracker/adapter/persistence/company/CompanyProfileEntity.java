package com.example.invoicetracker.adapter.persistence.company;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * JPA entity for the company_profile singleton table.
 * The PK is always {@code 1} (enforced by a DB CHECK constraint).
 */
@Entity
@Table(name = "company_profile")
@Getter
@Setter
@NoArgsConstructor
public class CompanyProfileEntity {

    @Id
    @Column(columnDefinition = "smallint")
    private Short id = 1;

    @Column(nullable = false, length = 200)
    private String name = "";

    @Column(nullable = false, length = 500)
    private String address = "";

    @Column(nullable = false, length = 32)
    private String phone = "";

    @Column(nullable = false, length = 254)
    private String email = "";

    @Column(name = "vat_number", nullable = false, length = 50)
    private String vatNumber = "";

    @Column(nullable = false, length = 100)
    private String iban = "";

    @Column(name = "swift_bic", nullable = false, length = 20)
    private String swiftBic = "";

    @Column(name = "bank_name", nullable = false, length = 200)
    private String bankName = "";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Version
    @Column(nullable = false)
    private Long version;

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
