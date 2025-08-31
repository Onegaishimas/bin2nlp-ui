# Integration Review Template

**Review Date:** [DATE]
**Reviewer:** [YOUR NAME]
**Integration Scope:** [System/Service/Component integrations being reviewed]

## Cross-Component Integration Analysis

### Component Communication Patterns

- [ ] Communication patterns consistent across similar integrations
- [ ] Data serialization/deserialization efficient
- [ ] Protocol selection justified and documented
- [ ] Message schemas versioned and backward compatible

**Communication Quality Score:** \_\_\_/10

### Data Flow and Transformation

- [ ] Data transformations preserve semantic meaning
- [ ] Data validation comprehensive at integration boundaries
- [ ] Data consistency maintained across integrations
- [ ] Data lineage traceable for auditing

**Data Flow Score:** \_\_\_/10

## External System Integration

### Third-Party Service Integration

**External Dependencies:**

1. **Service:** [external service name]
   **Purpose:** [why integrated]
   **Reliability:** [SLA/uptime expectations]
   **Fallback Strategy:** [backup plan]
   **Security:** [authentication/data protection]

**External Integration Score:** \_\_\_/10

### Integration Resilience

- [ ] Circuit breaker patterns implemented
- [ ] Timeout and retry logic configured
- [ ] Rate limiting respected and handled
- [ ] Graceful degradation when services unavailable

**Resilience Score:** \_\_\_/10

## End-to-End Workflow Validation

### User Journey Implementation

**Primary Workflows:**

1. **Workflow:** [end-to-end user journey]
   **Systems Involved:** [list of systems]
   **Integration Points:** [where systems connect]
   **Error Handling:** [how failures handled]

**Workflow Integration Score:** \_\_\_/10

## Integration Quality Gates

### System-Breaking Issues

1. **Issue:** [critical integration failure]
   **Systems Affected:** [what stops working]
   **Fix:** [immediate resolution needed]

### User-Impacting Issues

1. **Issue:** [integration problem affecting users]
   **Impact:** [how UX degraded]
   **Fix:** [proper resolution]

### Performance Issues

1. **Bottleneck:** [performance issue]
   **Current Performance:** [baseline]
   **Target:** [required performance]
   **Optimization:** [how to improve]

## Overall Assessment

- **Communication Patterns:** \_\_\_/10
- **Data Flow:** \_\_\_/10
- **External Integration:** \_\_\_/10
- **Resilience:** \_\_\_/10
- **Workflow Integration:** \_\_\_/10

**Overall Integration Health:** \_\_\_/50
**Integration Maturity:** [SEAMLESS/SOLID/FUNCTIONAL/FRAGILE/BROKEN]

---

_Focus on seamless system integration that delivers reliable user experiences and operational excellence._
