package com.example.invoicetracker.adapter.persistence.expense;

import com.example.invoicetracker.domain.expense.CategorySummary;
import com.example.invoicetracker.domain.expense.Expense;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import com.example.invoicetracker.domain.expense.ExpenseRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adapter that implements the domain {@link ExpenseRepository} port using JPA.
 */
@Component
public class ExpenseRepositoryAdapter implements ExpenseRepository {

    private final ExpenseJpaRepository jpaRepository;
    private final ExpenseEntityMapper mapper;
    private final EntityManager entityManager;

    public ExpenseRepositoryAdapter(
        ExpenseJpaRepository jpaRepository,
        ExpenseEntityMapper mapper,
        EntityManager entityManager
    ) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public Expense save(Expense expense) {
        ExpenseEntity managed = entityManager.find(ExpenseEntity.class, expense.id());
        if (managed != null) {
            mapper.updateEntity(managed, expense);
            return mapper.toDomain(managed);
        }
        ExpenseEntity entity = mapper.toEntity(expense);
        ExpenseEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Expense> findByIdAndDeletedAtIsNull(UUID id) {
        return jpaRepository.findByIdAndDeletedAtIsNull(id).map(mapper::toDomain);
    }

    @Override
    public Page<Expense> findAllByDeletedAtIsNull(
        ExpenseCategory category,
        LocalDate dateFrom,
        LocalDate dateTo,
        Pageable pageable
    ) {
        boolean hasCategory = category != null;
        boolean hasDateRange = dateFrom != null && dateTo != null;
        String categoryStr = hasCategory ? category.name() : null;
        Page<ExpenseEntity> result;
        if (hasCategory && hasDateRange) {
            result = jpaRepository.findAllActiveByCategoryAndDateRange(
                categoryStr, dateFrom, dateTo, pageable);
        } else if (hasCategory) {
            result = jpaRepository.findAllActiveByCategory(categoryStr, pageable);
        } else if (hasDateRange) {
            result = jpaRepository.findAllActiveByDateRange(dateFrom, dateTo, pageable);
        } else {
            result = jpaRepository.findAllActive(pageable);
        }
        return result.map(mapper::toDomain);
    }

    @Override
    public List<CategorySummary> summaryForMonth(YearMonth month) {
        LocalDate fromDate = month.atDay(1);
        LocalDate toDate = month.atEndOfMonth();
        return jpaRepository.findMonthlySummary(fromDate, toDate).stream()
            .map(row -> new CategorySummary(
                ExpenseCategory.valueOf(row.getCategory()),
                row.getTotal(),
                row.getCount()
            ))
            .toList();
    }

    @Override
    public boolean existsByIdAndDeletedAtIsNull(UUID id) {
        return jpaRepository.existsByIdAndDeletedAtIsNull(id);
    }
}
