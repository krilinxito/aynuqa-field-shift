FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend /app/backend
COPY contracts /app/contracts
COPY ml /app/ml

RUN mkdir -p /app/backend/data

WORKDIR /app/backend
ENV CONTRACTS_DIR=/app/contracts \
    ML_OUTPUTS_DIR=/app/ml/outputs \
    DATABASE_PATH=/app/backend/data/app.db

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
