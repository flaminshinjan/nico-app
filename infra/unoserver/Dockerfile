FROM python:3.12-slim

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      libreoffice \
      libreoffice-writer \
      fonts-dejavu \
      ca-certificates \
    && pip install --no-cache-dir unoserver==3.6 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 2003

CMD ["unoserver", "--interface", "0.0.0.0", "--port", "2003"]
