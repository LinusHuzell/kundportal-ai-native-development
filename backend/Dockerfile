# Development image for the backend (dotnet watch, hot reload).
FROM mcr.microsoft.com/dotnet/sdk:10.0

WORKDIR /app/src/CustomerService.Api

# Restore in its own layer so it is cached until the csproj changes.
COPY src/CustomerService.Api/CustomerService.Api.csproj ./
RUN dotnet restore

COPY src/CustomerService.Api/ ./

EXPOSE 7289
# --non-interactive: no prompts in a container. Polling: file events are unreliable on bind mounts (macOS/Windows).
ENV ASPNETCORE_URLS=https://+:7289 \
    ASPNETCORE_Kestrel__Certificates__Default__Path=/certs/localhost.pem \
    ASPNETCORE_Kestrel__Certificates__Default__KeyPath=/certs/localhost.key \
    ASPNETCORE_ENVIRONMENT=Development \
    DOTNET_USE_POLLING_FILE_WATCHER=true
CMD ["dotnet", "watch", "run", "--non-interactive", "--no-launch-profile"]
