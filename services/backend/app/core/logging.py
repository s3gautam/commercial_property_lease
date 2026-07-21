import logging

import structlog


def configure_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    # PrintLoggerFactory writes with a raw print() - a completely separate
    # pipeline from uvicorn's own request logs, which go through Python's
    # standard `logging` module and are the only output that has reliably
    # shown up in Railway's Deploy Logs. Routing through
    # structlog.stdlib.LoggerFactory() instead means our own logger.info/
    # error calls go through that same, proven-working `logging` pipeline
    # rather than a second, evidently-unreliable one.
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
