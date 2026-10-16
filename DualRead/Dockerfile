FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY DualRead.csproj ./
RUN dotnet restore "DualRead.csproj"
COPY . .
RUN dotnet publish "DualRead.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/Uploads
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_USE_POLLING_FILE_WATCHER=true
EXPOSE 8080
ENTRYPOINT ["dotnet", "DualRead.dll"]
