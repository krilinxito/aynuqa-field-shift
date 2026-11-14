"""Construye las tres tablas de ml/TABLAS.md en data/interim/, en orden.

Uso, desde ml/:  python prep/build.py
Antes: python ingest/roni.py, python ingest/power.py y python ingest/appeears.py download.
Se puede repetir cuando llegue mas NDVI: las zonas sin NDVI quedan con esas columnas vacias.
"""
import features
import monthly
import sectors

if __name__ == "__main__":
    for step in (sectors, monthly, features):
        print(f"== {step.__name__}")
        step.main()
