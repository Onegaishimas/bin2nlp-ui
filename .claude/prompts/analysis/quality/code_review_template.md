# Code Quality Review Template

**Review Date:** [DATE]
**Reviewer:** [YOUR NAME]
**Scope:** [Files/Components/Feature being reviewed]
**Review Type:** [PRE-COMMIT/POST-IMPLEMENTATION/REFACTORING/AUDIT]

## Code Standards Review

### Standards Compliance Assessment

- [ ] Variables use clear, descriptive names
- [ ] Functions/methods follow naming patterns
- [ ] Classes/modules named appropriately
- [ ] Code organization follows project patterns
- [ ] Import statements organized and minimal

**Standards Compliance Score:** \_\_\_/10

### Error Handling and Security

- [ ] All error conditions identified and handled
- [ ] User-facing error messages clear and helpful
- [ ] Input sanitization implemented
- [ ] Authentication/authorization correctly applied
- [ ] No hardcoded secrets or credentials

**Security Score:** \_\_\_/10

## Logic Correctness Assessment

### Business Rule Implementation

- [ ] Business rules correctly implemented in code
- [ ] Algorithm efficiency appropriate for data size
- [ ] Database queries optimized
- [ ] Performance acceptable for use case

**Logic Correctness Score:** \_\_\_/10

### Maintainability Assessment

- [ ] Code is self-documenting
- [ ] Complex logic has explanatory comments
- [ ] Function/method purposes clear
- [ ] Dependencies injected/mockable for testing

**Maintainability Score:** \_\_\_/10

## Quality Issues Classification

### Blocking Issues (Must Fix Before Deployment)

1. **Issue:** [description]
   **Location:** [file:line]
   **Risk:** [what could go wrong]
   **Fix:** [specific action needed]

### Critical Issues (Should Fix Before Deployment)

1. **Issue:** [description]
   **Impact:** [business/technical impact]
   **Fix:** [recommended approach]

### Quality Improvements (Enhance Maintainability/Performance)

1. **Improvement:** [what to enhance]
   **Benefit:** [why it helps]
   **Effort:** [implementation complexity]

## Overall Assessment

- **Standards Compliance:** \_\_\_/10
- **Security:** \_\_\_/10
- **Logic Correctness:** \_\_\_/10
- **Maintainability:** \_\_\_/10

**Overall Code Quality:** \_\_\_/40

**Deployment Recommendation:** [APPROVE/APPROVE WITH CONDITIONS/REJECT]

---

_Focus on preventing production issues while maintaining development velocity._
