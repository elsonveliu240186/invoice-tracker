package com.example.invoicetracker.adapter.persistence.invoice;

import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.example.invoicetracker.domain.invoice.InvoiceStatus;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Pure field-copy mapper between {@link InvoiceEntity} and {@link Invoice} domain record.
 */
@Component
public class InvoiceEntityMapper {

    /**
     * Maps a JPA entity to the domain record (including lines).
     *
     * @param entity the JPA entity
     * @return the domain record
     */
    public Invoice toDomain(InvoiceEntity entity) {
        List<InvoiceLine> lines = entity.getLines().stream()
            .map(this::lineToDomain)
            .toList();
        return new Invoice(
            entity.getId(),
            entity.getNumber(),
            entity.getClientId(),
            entity.getIssueDate(),
            entity.getDueDate(),
            lines,
            entity.getTaxRate(),
            entity.getStatus() != null ? entity.getStatus() : InvoiceStatus.DRAFT,
            entity.getLastSentAt(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getDeletedAt(),
            entity.getClientEmail(),
            nvl(entity.getClientNameSnapshot()),
            nvl(entity.getClientAddressSnapshot()),
            nvl(entity.getCompanyNameSnapshot()),
            nvl(entity.getCompanyAddressSnapshot()),
            nvl(entity.getCompanyVatSnapshot()),
            nvl(entity.getCompanyIbanSnapshot()),
            nvl(entity.getCompanySwiftSnapshot()),
            nvl(entity.getCompanyBankNameSnapshot())
        );
    }

    /**
     * Maps a domain record to a new JPA entity (with lines).
     *
     * @param invoice the domain record
     * @return the JPA entity
     */
    public InvoiceEntity toEntity(Invoice invoice) {
        InvoiceEntity entity = new InvoiceEntity();
        entity.setId(invoice.id());
        entity.setNumber(invoice.number());
        entity.setClientId(invoice.clientId());
        entity.setIssueDate(invoice.issueDate());
        entity.setDueDate(invoice.dueDate());
        entity.setTaxRate(invoice.taxRate());
        entity.setStatus(invoice.status() != null ? invoice.status() : InvoiceStatus.DRAFT);
        entity.setLastSentAt(invoice.lastSentAt());
        entity.setCreatedAt(invoice.createdAt());
        entity.setUpdatedAt(invoice.updatedAt());
        entity.setDeletedAt(invoice.deletedAt());
        entity.setClientEmail(invoice.clientEmail());
        entity.setClientNameSnapshot(nvl(invoice.clientNameSnapshot()));
        entity.setClientAddressSnapshot(nvl(invoice.clientAddressSnapshot()));
        entity.setCompanyNameSnapshot(nvl(invoice.companyNameSnapshot()));
        entity.setCompanyAddressSnapshot(nvl(invoice.companyAddressSnapshot()));
        entity.setCompanyVatSnapshot(nvl(invoice.companyVatSnapshot()));
        entity.setCompanyIbanSnapshot(nvl(invoice.companyIbanSnapshot()));
        entity.setCompanySwiftSnapshot(nvl(invoice.companySwiftSnapshot()));
        entity.setCompanyBankNameSnapshot(nvl(invoice.companyBankNameSnapshot()));

        for (int i = 0; i < invoice.lines().size(); i++) {
            InvoiceLine domainLine = invoice.lines().get(i);
            InvoiceLineEntity lineEntity = lineToEntity(domainLine, entity, i);
            entity.getLines().add(lineEntity);
        }
        return entity;
    }

    /**
     * Updates an existing managed entity in-place (replaces all lines).
     *
     * @param entity  the managed entity
     * @param invoice the domain record with new values
     */
    public void updateEntity(InvoiceEntity entity, Invoice invoice) {
        entity.setNumber(invoice.number());
        entity.setClientId(invoice.clientId());
        entity.setIssueDate(invoice.issueDate());
        entity.setDueDate(invoice.dueDate());
        entity.setTaxRate(invoice.taxRate());
        entity.setStatus(invoice.status() != null ? invoice.status() : InvoiceStatus.DRAFT);
        entity.setLastSentAt(invoice.lastSentAt());
        entity.setDeletedAt(invoice.deletedAt());
        entity.setClientEmail(invoice.clientEmail());
        entity.setClientNameSnapshot(nvl(invoice.clientNameSnapshot()));
        entity.setClientAddressSnapshot(nvl(invoice.clientAddressSnapshot()));
        entity.setCompanyNameSnapshot(nvl(invoice.companyNameSnapshot()));
        entity.setCompanyAddressSnapshot(nvl(invoice.companyAddressSnapshot()));
        entity.setCompanyVatSnapshot(nvl(invoice.companyVatSnapshot()));
        entity.setCompanyIbanSnapshot(nvl(invoice.companyIbanSnapshot()));
        entity.setCompanySwiftSnapshot(nvl(invoice.companySwiftSnapshot()));
        entity.setCompanyBankNameSnapshot(nvl(invoice.companyBankNameSnapshot()));

        // Merge lines in-place to avoid NonUniqueObjectException:
        // updating existing managed entities rather than clear-then-add.
        Map<UUID, InvoiceLineEntity> existingById = entity.getLines().stream()
            .collect(Collectors.toMap(InvoiceLineEntity::getId, l -> l));

        Set<UUID> newDomainIds = invoice.lines().stream()
            .map(InvoiceLine::id)
            .collect(Collectors.toSet());

        // Remove lines no longer present in the domain record
        entity.getLines().removeIf(l -> !newDomainIds.contains(l.getId()));

        // Update existing lines or add new ones
        for (int i = 0; i < invoice.lines().size(); i++) {
            InvoiceLine dl = invoice.lines().get(i);
            InvoiceLineEntity existing = existingById.get(dl.id());
            if (existing != null) {
                existing.setDescription(dl.description());
                existing.setQuantity(dl.quantity());
                existing.setUnitPrice(dl.unitPrice());
                existing.setPosition(i);
            } else {
                entity.getLines().add(lineToEntity(dl, entity, i));
            }
        }
    }

    private InvoiceLine lineToDomain(InvoiceLineEntity e) {
        return new InvoiceLine(e.getId(), e.getDescription(), e.getQuantity(),
            e.getUnitPrice(), e.getPosition());
    }

    private InvoiceLineEntity lineToEntity(InvoiceLine line, InvoiceEntity parent, int pos) {
        InvoiceLineEntity e = new InvoiceLineEntity();
        e.setId(line.id());
        e.setInvoice(parent);
        e.setDescription(line.description());
        e.setQuantity(line.quantity());
        e.setUnitPrice(line.unitPrice());
        e.setPosition(pos);
        return e;
    }

    private static String nvl(String value) {
        return value != null ? value : "";
    }
}
