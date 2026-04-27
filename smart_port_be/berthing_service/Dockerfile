FROM golang:alpine AS builder

WORKDIR /app

# Install git (sometimes needed for private go modules)
RUN apk add --no-cache git

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the code
COPY . .

# Build the application
# ADJUSTMENT: If main.go is in the root, remove './cmd/'
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go

# --- Stage 2: Final Runtime Image ---
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

EXPOSE 5003

CMD ["./main"]