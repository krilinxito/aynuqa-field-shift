# Servicio PowerSync con su configuración dentro de la imagen.
FROM journeyapps/powersync-service:1.28.3
COPY powersync /config
ENV POWERSYNC_CONFIG_PATH=/config/service.yaml
CMD ["start", "-r", "unified"]
