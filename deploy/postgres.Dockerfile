# Postgres con la publicación que necesita PowerSync, sin montar archivos del repo.
FROM postgres:18
COPY backend/sql/001-powersync.sql /docker-entrypoint-initdb.d/001-powersync.sql
CMD ["postgres", "-c", "wal_level=logical"]
