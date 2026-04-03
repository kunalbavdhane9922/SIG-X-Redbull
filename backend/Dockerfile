# Build stage
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app
COPY gradle/ gradle/
COPY gradlew build.gradle settings.gradle ./
COPY src/ src/
RUN chmod +x gradlew
# Optimized for Render Free 512MB RAM
RUN ./gradlew bootJar -x test --no-daemon --max-workers=1 -Dorg.gradle.jvmargs="-Xmx384m"

# Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
# Limit runtime memory too
ENTRYPOINT ["java", "-Xmx384m", "-jar", "app.jar"]
