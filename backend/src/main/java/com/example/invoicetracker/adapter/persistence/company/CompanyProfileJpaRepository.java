package com.example.invoicetracker.adapter.persistence.company;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for {@link CompanyProfileEntity}.
 */
public interface CompanyProfileJpaRepository extends JpaRepository<CompanyProfileEntity, Short> {
}
