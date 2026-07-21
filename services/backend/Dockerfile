FROM python:3.12-slim

# Without this, Python's stdout is block-buffered inside a container, so
# print()-based logs (structlog's PrintLoggerFactory - see
# app/core/logging.py) can sit in an internal buffer indefinitely instead
# of reaching Railway's log stream, even though uvicorn's own request
# logs show up fine (they flush per line through a different path).
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY . .
RUN pip install --no-cache-dir . \
    && chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
