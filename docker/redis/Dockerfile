# Use official Redis image as base
FROM redis:7.2-alpine

# Expose Redis default port
EXPOSE 6379

# Run Redis server
CMD ["redis-server", "--appendonly", "yes"]