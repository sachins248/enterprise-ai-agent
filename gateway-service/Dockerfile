# Stage 1: Build — JDK + Maven to compile the fat JAR
# Start from an image that has the Java tools (JDK) so we can build the code
FROM eclipse-temurin:17-jdk-jammy AS builder
# Work inside the /build folder
WORKDIR /build

# Install Maven
# Then delete the download lists to keep the image small
RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

# Copy parent POM first so Maven can resolve the multi-module structure
COPY pom.xml /build/pom.xml
# Copy the gateway pom
COPY gateway-service/pom.xml   /build/gateway-service/pom.xml
# Copy the auth pom (the parent pom lists every module)
COPY auth-service/pom.xml      /build/auth-service/pom.xml
# Copy the agent pom
COPY agent-service/pom.xml     /build/agent-service/pom.xml
# Copy the audit pom
COPY audit-service/pom.xml     /build/audit-service/pom.xml
# Copy the analytics pom
COPY analytics-service/pom.xml /build/analytics-service/pom.xml

# Download dependencies in a separate layer (cached unless POMs change)
# This makes later builds faster when only the code changes
RUN mvn -f /build/pom.xml dependency:go-offline -pl gateway-service -am -q

# Copy source and build
# Now copy the real source code
COPY gateway-service/src /build/gateway-service/src
# Build the jar file and skip tests to make the build faster
RUN mvn -f /build/pom.xml package -pl gateway-service -am -DskipTests -q

# Stage 2: Runtime — JRE only (smaller image, no compiler)
# Start fresh from a small image that only has Java to run the app
FROM eclipse-temurin:17-jre-jammy AS runtime
# Work inside the /app folder
WORKDIR /app

# Run as non-root for security
# Make a normal user so the app does not run as root
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
# Switch to that normal user
USER appuser

# Copy only the finished jar from the build stage
COPY --from=builder /build/gateway-service/target/gateway-service-*.jar app.jar

# Say which port the gateway listens on
EXPOSE 8080
# The command that starts the gateway
ENTRYPOINT ["java", "-jar", "app.jar"]
