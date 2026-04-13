# ═══════════════════════════════════════════════════════════
# Enjaz Backend — Multi-stage Dockerfile
# Phase: Core-A M1
# ═══════════════════════════════════════════════════════════

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy project and restore (layer caching)
COPY backend/backend.csproj ./backend/
RUN dotnet restore backend/backend.csproj

# Copy source and publish
COPY backend/ ./backend/
RUN dotnet publish backend/backend.csproj -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

# Security: non-root user
RUN addgroup -S enjaz && adduser -S enjaz -G enjaz
USER enjaz

COPY --from=build /app/publish .

# Health check
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:5144/health || exit 1

EXPOSE 5144
ENV ASPNETCORE_URLS=http://+:5144

ENTRYPOINT ["dotnet", "backend.dll"]
