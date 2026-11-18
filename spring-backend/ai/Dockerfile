FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN mvn -q -pl ai -am package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/ai/target/ai-*.jar app.jar
ENV PORT=10000
EXPOSE 10000
ENTRYPOINT ["java","-jar","app.jar"]