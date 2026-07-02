import os
import chromadb
from chromadb.utils import embedding_functions

import threading

_collection = None
_collection_lock = threading.Lock()
_initialized = False

def get_collection():
    global _collection, _initialized
    if not _initialized:
        with _collection_lock:
            if not _initialized:
                try:
                    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_db")
                    chroma_client = chromadb.PersistentClient(path=db_path)
                    emb_fn = embedding_functions.DefaultEmbeddingFunction()
                    _collection = chroma_client.get_collection(name="kfintech_faqs", embedding_function=emb_fn)
                except Exception as e:
                    print(f"Warning: Could not connect to ChromaDB or collection not found. Error: {e}")
                    _collection = None
                _initialized = True
    return _collection

def query_context(question: str):
    LOW_MEMORY = os.getenv("RENDER") == "true" or os.getenv("LOW_MEMORY_MODE", "false").lower() == "true"
    sources = []
    context_str = ""
    
    collection = get_collection()
    if collection:
        try:
            results = collection.query(
                query_texts=[question],
                n_results=2,
                include=["documents", "metadatas", "distances"]
            )
            
            docs = results['documents'][0]
            metas = results['metadatas'][0]
            distances = results['distances'][0]
            
            valid_docs = []
            for i in range(len(docs)):
                # L2 distance > 1.1 means it's totally unrelated (like a basic greeting)
                if distances[i] < 1.1:
                    valid_docs.append(docs[i])
                    sources.append(metas[i].get("question", "FAQ Database"))
                    
            context_str = "\n\n".join(valid_docs)
        except Exception as e:
            print(f"Chroma query failed: {e}")
            
    return context_str, sources
