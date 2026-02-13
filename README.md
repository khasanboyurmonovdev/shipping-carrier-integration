# Shipping Carrier Integration Service (UPS Rating)

This project implements a production-style shipping carrier integration service in TypeScript, wrapping the UPS Rating API.

The architecture is designed to be extensible, testable, and maintainable — allowing additional carriers (FedEx, USPS, DHL) and additional operations (label purchase, tracking, address validation) to be added without modifying existing code.

---

## ✨ Features

- UPS Rate Shopping (normalized response format)
- OAuth 2.0 Client Credentials authentication
- Token caching and automatic refresh
- Strong TypeScript domain models
- Runtime validation of requests
- Structured error handling
- Fully stubbed integration tests (no live API required)
- Extensible carrier/operation architecture

---

## 🏗 Architecture Overview

The system follows a clean abstraction pattern:
ICarrier
├── UPSCarrier
│ └── UPSRatingOperation
│ └── UPSOAuthClient
│ └── IHttpClient

### Key Design Decisions

### 1️⃣ Dependency Inversion
All operations depend on `IHttpClient`, not a concrete HTTP implementation.  
This allows:
- Full testability
- Stubbed HTTP layer
- Future HTTP client replacement

### 2️⃣ Operation-Based Design
Carriers expose operations via `OperationType`.  
Adding a new operation does not require modifying existing code.

### 3️⃣ Normalized Domain Models
Consumers never see raw UPS request/response payloads.  
All inputs and outputs are mapped to internal domain models.

### 4️⃣ Token Lifecycle Management
The OAuth client:
- Acquires token via client credentials flow
- Caches token in memory
- Automatically refreshes when expired

### 5️⃣ Structured Error Handling
Errors are normalized into structured domain errors:
- Validation errors
- Rate limiting (429)
- Network timeouts
- Auth failures
- Malformed responses

---

## 🧪 Integration Testing

The integration tests:

- Stub the HTTP layer
- Validate request payload construction
- Verify response normalization
- Test token acquisition and refresh logic
- Simulate 4xx, 5xx, timeout, and malformed responses

Run tests:

```bash
npm install
npm test

Type check: 
npx tsc --noEmit

🔧 Configuration

Environment variables are required
cp .env.example .env

➕ Adding a New Carrier

Implement ICarrier

Implement required operations (e.g., IRatingOperation)

Register in factory (if implemented)

No existing code needs to be modified.

➕ Adding a New Operation

Extend OperationType

Create new operation class

Add to carrier's getOperation method

🚀 Future Improvements

If more time were available:

Add retry strategy with exponential backoff for 5xx errors

Add distributed token caching (Redis) for multi-instance deployments

Add structured logging abstraction

Add request correlation IDs

Add circuit breaker for external API resilience

Add metrics/observability hooks

Add contract tests against UPS OpenAPI spec

📌 Notes

No live UPS credentials were used.

HTTP layer is stubbed for testing.

Architecture is designed for production extensibility.



