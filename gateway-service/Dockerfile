# Stage 1: Build — JDK + Maven to compile the fat JAR
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /build

# Install Maven
RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

# Copy parent POM first so Maven can resolve the multi-module structure
COPY pom.xml /build/pom.xml
COPY gateway-service/pom.xml   /build/gateway-service/pom.xml
COPY auth-service/pom.xml      /build/auth-service/pom.xml
COPY agent-service/pom.xml     /build/agent-service/pom.xml
COPY audit-service/pom.xml     /build/audit-service/pom.xml
COPY analytics-service/pom.xml /build/analytics-service/pom.xml

# Download dependencies in a separate layer (cached unless POMs change)
RUN mvn -f /build/pom.xml dependency:go-offline -pl gateway-service -am -q

# Copy source and build
COPY gateway-service/src /build/gateway-service/src
RUN mvn -f /build/pom.xml package -pl gateway-service -am -DskipTests -q

# Stage 2: Runtime — JRE only (smaller image, no compiler)
FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app

# Run as non-root for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

COPY --from=builder /build/gateway-service/target/gateway-service-*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
