package com.example.invoicetracker.application.expense;

import com.example.invoicetracker.domain.expense.CategorySummary;
import com.example.invoicetracker.domain.expense.Expense;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import com.example.invoicetracker.domain.expense.ExpenseNotFoundException;
import com.example.invoicetracker.domain.expense.ExpenseRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for expense use-cases.
 */
@Service
@Transactional
public class ExpenseService {

    private static final Logger log = LoggerFactory.getLogger(ExpenseService.class);

    private final ExpenseRepository expenseRepository;
    private final Clock clock;

    public ExpenseService(ExpenseRepository expenseRepository, Clock clock) {
        this.expenseRepository = expenseRepository;
        this.clock = clock;
    }

    /**
     * Creates a new expense.
     *
     * @param amount      the expense amount
     * @param category    the expense category
     * @param description optional description
     * @param date        the expense date
     * @return the created expense
     */
    public Expense create(BigDecimal amount, ExpenseCategory category,
        String description, LocalDate date) {
        Instant now = Instant.now(clock);
        Expense expense = new Expense(
            UUID.randomUUID(),
            amount,
            category,
            description,
            date,
            now,
            now,
            null
        );
        Expense saved = expenseRepository.save(expense);
        log.info("Expense created: {}", saved.id());
        return saved;
    }

    /**
     * Retrieves an expense by ID.
     *
     * @param id the expense UUID
     * @return the expense
     * @throws ExpenseNotFoundException if not found or soft-deleted
     */
    @Transactional(readOnly = true)
    public Expense get(UUID id) {
        return expenseRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ExpenseNotFoundException(id));
    }

    /**
     * Updates an existing expense (full replacement, PUT semantics).
     *
     * @param id          the expense UUID
     * @param amount      the new amount
     * @param category    the new category
     * @param description the new description
     * @param date        the new date
     * @return the updated expense
     */
    public Expense update(UUID id, BigDecimal amount, ExpenseCategory category,
        String description, LocalDate date) {
        Expense existing = expenseRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ExpenseNotFoundException(id));

        Expense updated = new Expense(
            existing.id(),
            amount,
            category,
            description,
            date,
            existing.createdAt(),
            Instant.now(clock),
            null
        );
        Expense saved = expenseRepository.save(updated);
        log.info("Expense updated: {}", saved.id());
        return saved;
    }

    /**
     * Soft-deletes an expense by setting deletedAt.
     *
     * @param id the expense UUID
     * @throws ExpenseNotFoundException if not found or already soft-deleted
     */
    public void delete(UUID id) {
        Expense existing = expenseRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ExpenseNotFoundException(id));

        Expense deleted = new Expense(
            existing.id(),
            existing.amount(),
            existing.category(),
            existing.description(),
            existing.expenseDate(),
            existing.createdAt(),
            existing.updatedAt(),
            Instant.now(clock)
        );
        expenseRepository.save(deleted);
        log.info("Expense soft-deleted: {}", id);
    }

    /**
     * Lists expenses with optional filters, with pagination.
     * Size is clamped to [1, 100].
     *
     * @param filter   the optional filter (category, dateFrom, dateTo)
     * @param pageable the pageable (size will be clamped)
     * @return a page of expenses
     */
    @Transactional(readOnly = true)
    public Page<Expense> list(ExpenseFilter filter, Pageable pageable) {
        int clampedSize = Math.max(1, Math.min(100, pageable.getPageSize()));
        Pageable clamped = PageRequest.of(
            pageable.getPageNumber(),
            clampedSize,
            pageable.getSortOr(Sort.by(Sort.Direction.DESC, "expenseDate"))
        );
        ExpenseCategory category = filter != null ? filter.category() : null;
        LocalDate dateFrom = filter != null ? filter.dateFrom() : null;
        LocalDate dateTo = filter != null ? filter.dateTo() : null;
        return expenseRepository.findAllByDeletedAtIsNull(category, dateFrom, dateTo, clamped);
    }

    /**
     * Returns the monthly expense summary for the given month.
     * If month is null, defaults to the current month according to the injected clock.
     *
     * @param month the year-month to summarise, or null for current month
     * @return the monthly summary
     */
    @Transactional(readOnly = true)
    public MonthlySummary summary(YearMonth month) {
        YearMonth resolved = month != null ? month : YearMonth.now(clock);
        List<CategorySummary> rawItems = expenseRepository.summaryForMonth(resolved);

        List<CategorySummary> sorted = rawItems.stream()
            .sorted(Comparator.comparing(CategorySummary::total).reversed()
                .thenComparing(cs -> cs.category().name()))
            .toList();

        BigDecimal grandTotal = sorted.stream()
            .map(CategorySummary::total)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalCount = sorted.stream()
            .mapToLong(CategorySummary::count)
            .sum();

        return new MonthlySummary(resolved, grandTotal, totalCount, sorted);
    }
}
