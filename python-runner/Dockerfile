# Dockerfile para el contenedor python-runner
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY runner.py mutador.py sandbox.py piloto_harness.py ./
COPY misiones/ ./misiones/

# Usuario sin privilegios: el código de los alumnos nunca corre como root
RUN useradd --create-home --uid 10001 runner
USER runner

EXPOSE 5000

# Healthcheck sin curl (no viene en la imagen slim)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health', timeout=3)"

# gunicorn: varias peticiones a la vez (varios alumnos ejecutando código)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "90", "runner:app"]
