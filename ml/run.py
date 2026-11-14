"""
ml/run.py — Entry point del pipeline ML.
Uso: python -m ml.run predict --input ml/data/fake
     python -m ml.run predict --input ml/data/interim
"""
import argparse
import os
import sys


def _output_dir(input_dir: str) -> str:
    if "fake" in input_dir:
        return "ml/outputs_fake"
    return "ml/outputs"


def cmd_predict(input_dir: str):
    output_dir = _output_dir(input_dir)
    os.makedirs(output_dir, exist_ok=True)

    print(f"\n=== PIPELINE ML: input={input_dir} → output={output_dir} ===\n")

    # Paso 1: Generar datos fake si es necesario
    if "fake" in input_dir:
        print("[1/5] Generando datos fake ...")
        from ml.models.fake_data import main as fake_main
        sys.argv = ["fake_data", "--output-dir", input_dir]
        fake_main()
    else:
        print(f"[1/5] Usando datos de {input_dir} (skipping fake_data)")

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
    print("\n[4b/5] Análogos ...")
    from ml.models import analogs
    analogs.run(input_dir, output_dir)

    # Paso 6: Export
    print("\n[5/5] Exportando JSON ...")
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
    predict_parser.add_argument("--input", required=True, help="Directorio de entrada con features.csv, monthly.csv, sectors.geojson")

    args = parser.parse_args()

    if args.command == "predict":
        cmd_predict(args.input)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
