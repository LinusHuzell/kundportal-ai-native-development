# Development image for the backend (dotnet watch, hot reload).
FROM mcr.microsoft.com/dotnet/sdk:10.0

WORKDIR /app/src/CustomerService.Api

# Restore in its own layer so it is cached until the csproj changes.
COPY src/CustomerService.Api/CustomerService.Api.csproj ./
RUN dotnet restore

COPY src/CustomerService.Api/ ./

EXPOSE 8080
# --non-interactive: no prompts in a container. Polling: file events are unreliable on bind mounts (macOS/Windows).
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Development \
    DOTNET_USE_POLLING_FILE_WATCHER=true
CMD ["dotnet", "watch", "run", "--non-interactive", "--no-launch-profile"]
