FROM python:3.12-slim

WORKDIR /app

COPY . .
RUN pip install --no-cache-dir . \
    && chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
