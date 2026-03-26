# ── Stage 1: Build ────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY api-gateway/pom.xml         ./api-gateway/pom.xml
COPY auth-service/pom.xml        ./auth-service/pom.xml
COPY study-service/pom.xml       ./study-service/pom.xml
COPY flashcard-service/pom.xml   ./flashcard-service/pom.xml
COPY notification-service/pom.xml ./notification-service/pom.xml

RUN mvn dependency:go-offline -pl api-gateway -am -B

COPY api-gateway/src ./api-gateway/src
RUN mvn package -pl api-gateway -DskipTests -B

# ── Stage 2: Runtime ──────────────────────────────────
FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
COPY --from=build /app/api-gateway/target/*.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
