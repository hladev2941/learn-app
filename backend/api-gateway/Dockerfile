# ── Stage 1: Build ────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY discovery-server/pom.xml  ./discovery-server/pom.xml
COPY api-gateway/pom.xml       ./api-gateway/pom.xml
COPY auth-service/pom.xml      ./auth-service/pom.xml
COPY study-service/pom.xml     ./study-service/pom.xml
COPY flashcard-service/pom.xml ./flashcard-service/pom.xml

RUN mvn dependency:go-offline -pl api-gateway -am -B

COPY api-gateway/src ./api-gateway/src
RUN mvn package -pl api-gateway -DskipTests -B

# ── Stage 2: Runtime ──────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/api-gateway/target/*.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
