"""
ml/run.py — Entry point del pipeline ML.
Uso: python -m ml.run predict --input ml/data/fake
     python -m ml.run predict --input ml/data/interim
     python -m ml.run predict --input data/interim
"""
import argparse
import os
import sys
from pathlib import Path


def _resolve_input_dir(input_dir: str) -> str:
    """Permite pasar 'data/interim' o 'ml/data/interim' (y 'data/fake' o 'ml/data/fake')."""
    p = Path(input_dir)
    if p.exists():
        return str(p)
    ml_prefixed = Path("ml") / p
    if ml_prefixed.exists() or p.parts[0] == "data":
        return str(ml_prefixed)
    return str(p)


def _is_interim(input_dir: str) -> bool:
    parts = [part.lower() for part in Path(input_dir).parts]
    return ("interim" in parts) and ("fake" not in parts)


def _output_dir(input_dir: str) -> str:
    """ml/outputs/ es solo para datos reales (interim); todo lo demás va a ml/outputs_fake/."""
    if _is_interim(input_dir):
        return "ml/outputs"
    return "ml/outputs_fake"


def cmd_predict(raw_input_dir: str):
    input_dir = _resolve_input_dir(raw_input_dir)
    output_dir = _output_dir(input_dir)
    os.makedirs(output_dir, exist_ok=True)

    print(f"\n=== PIPELINE ML: input={input_dir} → output={output_dir} ===\n")

    # Paso 1: Generar datos fake si la entrada es fake
    parts = [part.lower() for part in Path(input_dir).parts]
    if "fake" in parts:
        print("[1/5] Generando datos fake ...")
        from ml.models.fake_data import (
            generate_features_csv,
            generate_monthly_csv,
            generate_sectors_geojson,
        )
        os.makedirs(input_dir, exist_ok=True)
        sp = generate_sectors_geojson(input_dir)
        mdf = generate_monthly_csv(sp, input_dir)
        generate_features_csv(mdf, sp, input_dir)
    else:
        print(f"[1/5] Usando datos de {input_dir} (sin generar datos fake)")

    # Paso 2: Modelo de sequía
    print("\n[2/5] Entrenando modelo de riesgo (LightGBM) ...")
    from ml.models import drought_model
    drought_model.run(input_dir, output_dir)

    # Paso 3: Validación y backtests
    print("\n[3/5] Validación y backtests ...")
    from ml.models import validation
    validation.run(input_dir, output_dir)

    # Paso 4: RESTREND
    print("\n[4/5] RESTREND (recuperación del suelo) ...")
    from ml.models import restrend
    restrend.run(input_dir, output_dir)

    # Paso 5: Análogos
    print("\n[4b/5] Análogos (tierras gemelas) ...")
    from ml.models import analogs
    analogs.run(input_dir, output_dir)

    # Paso 6: Export
    print("\n[5/5] Exportando y validando JSON ...")
    from ml.export import export
    export.run(input_dir, output_dir)

    print(f"\n✓ Pipeline completado. Resultados en {output_dir}/\n")
    _list_outputs(output_dir)


def _list_outputs(output_dir: str):
    if os.path.isdir(output_dir):
        files = os.listdir(output_dir)
        print("Archivos generados:")
        for f in sorted(files):
            fpath = os.path.join(output_dir, f)
            size = os.path.getsize(fpath)
            print(f"  {f}  ({size:,} bytes)")


def main():
    parser = argparse.ArgumentParser(prog="ml.run", description="Pipeline ML Aynuqa Field Shift")
    subparsers = parser.add_subparsers(dest="command")

    predict_parser = subparsers.add_parser("predict", help="Correr el pipeline completo")
    predict_parser.add_argument(
        "--input",
        required=True,
        help="Directorio de entrada con features.csv, monthly.csv, sectors.geojson",
    )

    args = parser.parse_args()

    if args.command == "predict":
        cmd_predict(args.input)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
