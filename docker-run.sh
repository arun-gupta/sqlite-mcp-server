#!/bin/bash

# SQLite MCP Server Docker Run Script
# This script provides easy Docker container management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CONTAINER_NAME="sqlite-mcp"
IMAGE_NAME="sqlite-mcp-server"
DATA_DIR="./data"
DB_PATH="/data/database.db"
HTTP_PORT="4000"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to show usage
show_usage() {
    echo "SQLite MCP Server Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  build                    Build the Docker image"
    echo "  run                      Run MCP server container (stdio only)"
    echo "  run-http                 Run container with HTTP wrapper on port 4000"
    echo "  run-custom [PORT]        Run container with HTTP wrapper on custom port"
    echo "  stop                     Stop running containers"
    echo "  clean                    Remove containers"
    echo "  restart                  Stop, clean, and restart containers"
    echo "  logs                     Show container logs"
    echo "  status                   Show container status"
    echo "  shell                    Open shell in running container"
    echo "  help                     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build                 # Build the image"
    echo "  $0 run                   # Run MCP server"
    echo "  $0 run-http              # Run with HTTP on port 4000"
    echo "  $0 run-custom 8080       # Run with HTTP on port 8080"
    echo "  $0 restart               # Restart containers"
    echo ""
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to build image
build_image() {
    print_header "Building Docker Image"
    print_status "Building image: $IMAGE_NAME"
    docker build -t $IMAGE_NAME .
    print_status "Image built successfully!"
}

# Function to create data directory
create_data_dir() {
    if [ ! -d "$DATA_DIR" ]; then
        print_status "Creating data directory: $DATA_DIR"
        mkdir -p "$DATA_DIR"
    fi
}

# Function to run MCP server (stdio only)
run_mcp() {
    print_header "Running MCP Server Container"
    create_data_dir
    
    # Stop existing container if running
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    
    print_status "Starting MCP server container..."
    docker run -d \
        --name $CONTAINER_NAME \
        -v "$(pwd)/$DATA_DIR:/data" \
        -e SQLITE_DB_PATH=$DB_PATH \
        $IMAGE_NAME
    
    print_status "Container started successfully!"
    print_status "Container name: $CONTAINER_NAME"
    print_status "Data directory: $(pwd)/$DATA_DIR"
    print_status "Database path: $DB_PATH"
    echo ""
    print_status "To view logs: $0 logs"
    print_status "To stop container: $0 stop"
}

# Function to run with HTTP wrapper
run_http() {
    local port=${1:-$HTTP_PORT}
    local container_name="${CONTAINER_NAME}-http"
    
    print_header "Running MCP Server with HTTP Wrapper"
    print_status "Port: $port"
    create_data_dir
    
    # Stop existing container if running
    docker stop $container_name 2>/dev/null || true
    docker rm $container_name 2>/dev/null || true
    
    print_status "Starting container with HTTP wrapper..."
    docker run -d \
        --name $container_name \
        -p $port:4000 \
        -v "$(pwd)/$DATA_DIR:/data" \
        -e SQLITE_DB_PATH=$DB_PATH \
        -e HTTP_PORT=4000 \
        $IMAGE_NAME
    
    print_status "Container started successfully!"
    print_status "Container name: $container_name"
    print_status "HTTP endpoint: http://localhost:$port"
    print_status "Data directory: $(pwd)/$DATA_DIR"
    echo ""
    print_status "Test the server:"
    print_status "  curl http://localhost:$port/health"
    print_status "  curl http://localhost:$port/tables"
    echo ""
    print_status "To view logs: $0 logs"
    print_status "To stop container: $0 stop"
}

# Function to stop containers
stop_containers() {
    print_header "Stopping Containers"
    print_status "Stopping containers..."
    docker stop $CONTAINER_NAME "${CONTAINER_NAME}-http" 2>/dev/null || true
    print_status "Containers stopped!"
}

# Function to clean containers
clean_containers() {
    print_header "Cleaning Containers"
    print_status "Removing containers..."
    docker rm $CONTAINER_NAME "${CONTAINER_NAME}-http" 2>/dev/null || true
    print_status "Containers removed!"
}

# Function to restart containers
restart_containers() {
    print_header "Restarting Containers"
    stop_containers
    clean_containers
    print_status "Containers restarted!"
}

# Function to show logs
show_logs() {
    print_header "Container Logs"
    print_status "Showing logs for containers..."
    echo ""
    docker logs $CONTAINER_NAME 2>/dev/null || print_warning "Container $CONTAINER_NAME not found"
    echo ""
    docker logs "${CONTAINER_NAME}-http" 2>/dev/null || print_warning "Container ${CONTAINER_NAME}-http not found"
}

# Function to show status
show_status() {
    print_header "Container Status"
    print_status "Docker containers:"
    docker ps -a --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Function to open shell
open_shell() {
    local container_name="${CONTAINER_NAME}-http"
    if docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        print_status "Opening shell in $container_name..."
        docker exec -it $container_name /bin/sh
    elif docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        print_status "Opening shell in $CONTAINER_NAME..."
        docker exec -it $CONTAINER_NAME /bin/sh
    else
        print_error "No running containers found. Start a container first with: $0 run or $0 run-http"
        exit 1
    fi
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        "build")
            build_image
            ;;
        "run")
            run_mcp
            ;;
        "run-http")
            run_http
            ;;
        "run-custom")
            if [ -z "$2" ]; then
                print_error "Port number required for run-custom"
                echo "Usage: $0 run-custom [PORT]"
                exit 1
            fi
            run_http "$2"
            ;;
        "stop")
            stop_containers
            ;;
        "clean")
            clean_containers
            ;;
        "restart")
            restart_containers
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "shell")
            open_shell
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
