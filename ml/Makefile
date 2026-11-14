.PHONY: predict predict-fake install

predict:
	python -m ml.run predict --input ml/data/interim

predict-fake:
	python -m ml.run predict --input ml/data/fake

install:
	pip install -r ml/requirements.txt
