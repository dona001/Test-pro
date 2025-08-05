FROM openjdk:17-jre-slim

# Set working directory
WORKDIR /app

# Copy the JAR file
COPY target/api-wrapper-1.0.0.jar app.jar

# Expose port
EXPOSE 3001

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=production
ENV SERVER_PORT=3001

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"] 