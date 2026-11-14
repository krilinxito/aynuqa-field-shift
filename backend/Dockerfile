FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY backend/pytest.ini ./pytest.ini
COPY contracts /contracts

RUN mkdir -p /app/data

ENV CONTRACTS_DIR=/contracts \
    ML_OUTPUTS_DIR=/ml/outputs \
    DATABASE_PATH=/app/data/app.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
