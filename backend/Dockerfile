FROM python:3.10-slim

# Install system dependencies required by OpenCV/EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user (required/recommended by Hugging Face Spaces)
RUN useradd -m -u 1000 user

# Switch to the non-root user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    HF_HOME=/home/user/.cache/huggingface \
    TRANSFORMERS_CACHE=/home/user/.cache/huggingface

# Set the working directory to the user's home folder
WORKDIR $HOME/app

# Install PyTorch CPU ONLY first to prevent downloading heavy CUDA drivers
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=user . .

# Set PYTHONPATH to ensure absolute imports from app.* work
ENV PYTHONPATH=$HOME/app

# Run the FastAPI server on port 7860 (Hugging Face default) with single worker
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
