FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
COPY --from=frontend /app/dist/ ./src/main/resources/static/
COPY backend/render-maven-settings.xml /tmp/render-maven-settings.xml
RUN mvn -B -s /tmp/render-maven-settings.xml -Dmaven.test.skip=true package || mvn -B -U -Dmaven.test.skip=true package
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV SPRING_PROFILES_ACTIVE=render
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=55 -XX:+UseSerialGC -XX:ReservedCodeCacheSize=48m -Xss512k"
EXPOSE 10000
ENTRYPOINT ["java","-jar","app.jar"]
