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

.PHONY: down
down:
	@echo "Stopping containers..."
	docker-compose down
	@echo "Done."