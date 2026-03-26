FROM python:3.12-slim AS base

WORKDIR /app

# Install dependencies in a separate layer for caching
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY apps/__init__.py /app/apps/__init__.py
COPY apps/api/ /app/apps/api/

EXPOSE 8000

CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
