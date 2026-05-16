# Stage 1: build
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && sed -i 's/\r$//' mvnw && ./mvnw dependency:go-offline -q
COPY src src
RUN ./mvnw package -Dmaven.test.skip=true -Pfast -q

# Stage 2: runtime
FROM eclipse-temurin:21-jre
RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# Install LibreOffice for headless DOCX→PDF conversion (~180 MB layer)
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-core \
      libreoffice-writer \
      fonts-dejavu \
      fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

ENV LIBREOFFICE_BIN=/usr/bin/soffice

RUN mkdir -p /app/templates /app/lo-profiles /app/generated/invoices \
    && chown -R app:app /app/templates /app/lo-profiles /app/generated

USER app
ENTRYPOINT ["java", "-jar", "app.jar"]
