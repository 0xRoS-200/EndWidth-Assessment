"""
Centralised logging configuration for the Employee AI Assistant backend.
Import get_logger(name) in any module to get a consistently formatted logger.
"""
import logging
import sys


def get_logger(name: str) -> logging.Logger:
    """Return a named logger with a consistent format.

    Uses stdout so logs are visible in the terminal when running with uvicorn.
    Log level is INFO by default; set LOG_LEVEL env var to override.
    """
    import os
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    logger = logging.getLogger(name)
    if logger.handlers:
        return logger  # already configured

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    logger.addHandler(handler)
    logger.setLevel(level)
    logger.propagate = False
    return logger
