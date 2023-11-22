.PHONY: dl_circuits
dl_circuits:
	@echo "Downloading circuits..."
	./scripts/dl_circuits.sh
	@echo "Done."

.PHONY: up
up:
	@echo "Starting containers..."
	docker-compose up -d
	@echo "Done."

.PHONY: up_build
up_build:
	@echo "Starting containers..."
	docker-compose up -d --build
	@echo "Done."

.PHONY: down
down:
	@echo "Stopping containers..."
	docker-compose down
	@echo "Done."

.PHONY: clean
clean:
	@echo "Stopping containers and removing data..."
	docker-compose down -v
	@echo "Done."

.PHONY: build
build:
	@echo "Building issuer node image..."
	docker build -t issuer-node . -f ./build/Dockerfile