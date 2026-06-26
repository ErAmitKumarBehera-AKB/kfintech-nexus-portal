import os
import json
import chromadb
from chromadb.utils import embedding_functions

def main():
    # Paths relative to the script location
    base_dir = os.path.dirname(os.path.dirname(__file__))
    faqs_path = os.path.join(base_dir, "data", "faqs.json")
    db_path = os.path.join(base_dir, "chroma_db")

    print(f"Loading FAQs from {faqs_path}...")
    
    if not os.path.exists(faqs_path):
        print("Error: faqs.json not found!")
        return

    with open(faqs_path, "r") as f:
        faqs = json.load(f)

    print(f"Loaded {len(faqs)} FAQs.")
    
    print(f"Connecting to Persistent ChromaDB at {db_path}...")
    chroma_client = chromadb.PersistentClient(path=db_path)
    
    # We use the default embedding function (all-MiniLM-L6-v2 equivalent in chromadb)
    emb_fn = embedding_functions.DefaultEmbeddingFunction()
    
    collection_name = "kfintech_faqs"
    print(f"Getting or creating collection '{collection_name}'...")
    
    # Delete if exists to do a fresh ingestion
    try:
        chroma_client.delete_collection(collection_name)
        print("Deleted old collection.")
    except Exception:
        pass
        
    collection = chroma_client.create_collection(
        name=collection_name, 
        embedding_function=emb_fn
    )

    documents = []
    metadatas = []
    ids = []

    for faq in faqs:
        # We embed the question and answer together
        doc_text = f"Q: {faq['question']}\nA: {faq['answer']}"
        documents.append(doc_text)
        metadatas.append({"question": faq['question'], "id": faq['id']})
        ids.append(faq['id'])

    print(f"Embedding and storing {len(documents)} documents...")
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print("Successfully ingested FAQs into ChromaDB!")

if __name__ == "__main__":
    main()
