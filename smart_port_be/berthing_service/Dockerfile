# --- Stage 1: Build the Go Binary ---
FROM golang:1.21-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the dependency files first
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application code
COPY . .

# Build the application into a static binary named 'main'
# We point to cmd/main.go where your entry point is
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go

# --- Stage 2: Final Runtime Image ---
FROM alpine:latest

# Install CA certificates (needed for secure connections)
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy only the compiled binary from the builder stage
COPY --from=builder /app/main .

# Expose the port your Go app uses
EXPOSE 5003

# Run the binary
CMD ["./main"]