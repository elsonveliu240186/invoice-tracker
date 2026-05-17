package com.example.invoicetracker.adapter.web.expense;

import com.example.invoicetracker.adapter.web.client.dto.PageResponse;
import com.example.invoicetracker.adapter.web.expense.dto.CategorySummaryResponse;
import com.example.invoicetracker.adapter.web.expense.dto.CreateExpenseRequest;
import com.example.invoicetracker.adapter.web.expense.dto.ExpenseResponse;
import com.example.invoicetracker.adapter.web.expense.dto.ExpenseSummaryResponse;
import com.example.invoicetracker.adapter.web.expense.dto.UpdateExpenseRequest;
import com.example.invoicetracker.application.expense.ExpenseFilter;
import com.example.invoicetracker.application.expense.ExpenseService;
import com.example.invoicetracker.application.expense.MonthlySummary;
import com.example.invoicetracker.domain.expense.Expense;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * REST controller for expense management endpoints at /api/v1/expenses.
 */
@RestController
@RequestMapping("/api/v1/expenses")
@Tag(name = "Expenses", description = "Expense management CRUD and summary")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    /**
     * Creates a new expense.
     *
     * @param request the create request body
     * @return 201 Created with the expense response and Location header
     */
    @PostMapping
    @Operation(summary = "Create a new expense")
    public ResponseEntity<ExpenseResponse> create(
        @Valid @RequestBody CreateExpenseRequest request
    ) {
        Expense expense = expenseService.create(
            request.amount(),
            request.category(),
            request.description(),
            request.expenseDate()
        );
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(expense.id())
            .toUri();
        return ResponseEntity.created(location).body(toResponse(expense));
    }

    /**
     * Retrieves a single expense by ID.
     *
     * @param id the expense UUID
     * @return 200 with the expense, or 404 if not found
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get an expense by ID")
    public ResponseEntity<ExpenseResponse> get(@PathVariable UUID id) {
        Expense expense = expenseService.get(id);
        return ResponseEntity.ok(toResponse(expense));
    }

    /**
     * Lists expenses with optional filters and pagination.
     *
     * @param category optional category filter
     * @param dateFrom optional start date filter (inclusive)
     * @param dateTo   optional end date filter (inclusive)
     * @param pageable pagination and sort parameters
     * @return 200 with paginated expense list
     */
    @GetMapping
    @Operation(summary = "List expenses with optional filters and pagination")
    public ResponseEntity<PageResponse<ExpenseResponse>> list(
        @RequestParam(required = false) ExpenseCategory category,
        @RequestParam(required = false) LocalDate dateFrom,
        @RequestParam(required = false) LocalDate dateTo,
        @PageableDefault(size = 20, sort = "expenseDate") Pageable pageable
    ) {
        ExpenseFilter filter = new ExpenseFilter(category, dateFrom, dateTo);
        Page<Expense> page = expenseService.list(filter, pageable);
        List<ExpenseResponse> content = page.getContent().stream()
            .map(this::toResponse)
            .toList();
        PageResponse<ExpenseResponse> response = new PageResponse<>(
            content,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Updates an existing expense (full replacement).
     *
     * @param id      the expense UUID
     * @param request the update request body
     * @return 200 with the updated expense
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update an expense")
    public ResponseEntity<ExpenseResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateExpenseRequest request
    ) {
        Expense expense = expenseService.update(
            id,
            request.amount(),
            request.category(),
            request.description(),
            request.expenseDate()
        );
        return ResponseEntity.ok(toResponse(expense));
    }

    /**
     * Soft-deletes an expense.
     *
     * @param id the expense UUID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete an expense")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        expenseService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns a summary of expenses for the specified month.
     *
     * @param month optional YYYY-MM string; defaults to current month if omitted
     * @return 200 with the monthly summary
     */
    @GetMapping("/summary")
    @Operation(summary = "Get monthly expense summary")
    public ResponseEntity<ExpenseSummaryResponse> summary(
        @RequestParam(required = false) String month
    ) {
        YearMonth yearMonth;
        if (month != null) {
            try {
                yearMonth = YearMonth.parse(month);
            } catch (DateTimeParseException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
        } else {
            yearMonth = null;
        }
        MonthlySummary result = expenseService.summary(yearMonth);

        List<CategorySummaryResponse> byCategoryDto = result.byCategory().stream()
            .map(cs -> new CategorySummaryResponse(cs.category(), cs.total(), cs.count()))
            .toList();

        ExpenseSummaryResponse response = new ExpenseSummaryResponse(
            result.month().toString(),
            result.grandTotal(),
            result.totalCount(),
            byCategoryDto
        );
        return ResponseEntity.ok(response);
    }

    private ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
            expense.id(),
            expense.amount(),
            expense.category(),
            expense.description(),
            expense.expenseDate(),
            expense.createdAt(),
            expense.updatedAt()
        );
    }
}
