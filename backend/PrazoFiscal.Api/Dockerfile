FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY PrazoFiscal.Api/PrazoFiscal.Api.csproj PrazoFiscal.Api/
RUN dotnet restore PrazoFiscal.Api/PrazoFiscal.Api.csproj

COPY PrazoFiscal.Api/. PrazoFiscal.Api/
RUN dotnet publish PrazoFiscal.Api/PrazoFiscal.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:5000
EXPOSE 5000

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "PrazoFiscal.Api.dll"]
