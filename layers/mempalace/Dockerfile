FROM python:3.11-slim

WORKDIR /app

# Install MemPalace with all dependencies
RUN pip install mempalace

# Create data directory
RUN mkdir -p /root/.mempalace

# Expose the MCP server port
EXPOSE 8080

# Run the MCP server
CMD ["python", "-m", "mempalace.mcp_server", "--port", "8080", "--host", "0.0.0.0"]