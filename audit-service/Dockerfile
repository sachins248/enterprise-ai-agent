# Stage 1: Build
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

COPY pom.xml /build/pom.xml
COPY gateway-service/pom.xml   /build/gateway-service/pom.xml
COPY auth-service/pom.xml      /build/auth-service/pom.xml
COPY agent-service/pom.xml     /build/agent-service/pom.xml
COPY audit-service/pom.xml     /build/audit-service/pom.xml
COPY analytics-service/pom.xml /build/analytics-service/pom.xml

RUN mvn -f /build/pom.xml dependency:go-offline -pl audit-service -am -q

COPY audit-service/src /build/audit-service/src
RUN mvn -f /build/pom.xml package -pl audit-service -am -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

COPY --from=builder /build/audit-service/target/audit-service-*.jar app.jar

EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
