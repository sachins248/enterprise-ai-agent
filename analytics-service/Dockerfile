# Stage 1: Build
# Start from an image that has the Java tools (JDK) so we can build the code
FROM eclipse-temurin:17-jdk-jammy AS builder
# Work inside the /build folder
WORKDIR /build

# Install Maven, then delete the download lists to keep the image small
RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

# Copy the pom files first so Docker can cache the downloaded libraries
COPY pom.xml /build/pom.xml
# Copy the gateway pom (the parent pom lists every module)
COPY gateway-service/pom.xml   /build/gateway-service/pom.xml
# Copy the auth pom
COPY auth-service/pom.xml      /build/auth-service/pom.xml
# Copy the agent pom
COPY agent-service/pom.xml     /build/agent-service/pom.xml
# Copy the audit pom
COPY audit-service/pom.xml     /build/audit-service/pom.xml
# Copy the analytics pom
COPY analytics-service/pom.xml /build/analytics-service/pom.xml

# Download all libraries now so this step is cached when only the code changes
RUN mvn -f /build/pom.xml dependency:go-offline -pl analytics-service -am -q

# Now copy the real source code
COPY analytics-service/src /build/analytics-service/src
# Build the jar file and skip tests to make the build faster
RUN mvn -f /build/pom.xml package -pl analytics-service -am -DskipTests -q

# Stage 2: Runtime
# Start fresh from a small image that only has Java to run the app (JRE)
FROM eclipse-temurin:17-jre-jammy AS runtime
# Work inside the /app folder
WORKDIR /app

# Make a normal user so the app does not run as root (safer)
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
# Switch to that normal user
USER appuser

# Copy only the finished jar from the build stage
COPY --from=builder /build/analytics-service/target/analytics-service-*.jar app.jar

# Say which port the service listens on
EXPOSE 8084
# The command that starts the service
ENTRYPOINT ["java", "-jar", "app.jar"]
