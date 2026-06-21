import os
# pyrefly: ignore [missing-import]
from langchain_community.document_loaders import TextLoader
# pyrefly: ignore [missing-import]
from langchain_text_splitters import RecursiveCharacterTextSplitter
# pyrefly: ignore [missing-import]
from langchain_community.embeddings import HuggingFaceEmbeddings
# pyrefly: ignore [missing-import]
from langchain_community.vectorstores import Chroma

# Sample text data (Complex KFintech SLA policies and mutual fund rules)
SAMPLE_DATA = """
1. KFintech Mutual Fund Redemption Policy: All redemption requests submitted before 3:00 PM IST on a business day will be processed at that day's Net Asset Value (NAV). Requests submitted after 3:00 PM will be processed at the next business day's NAV.
2. Dividend Reinvestment SLA: Dividend reinvestment instructions must be submitted at least 5 business days prior to the record date to be effective for the upcoming payout.
3. KYC Updation SLA: Modification of KYC details (address, bank account, phone number) will reflect in the mutual fund folio within 2 working days after the submission of valid documentary proofs.
4. Systematic Investment Plan (SIP) Cancellation: SIP cancellation requests require a strict 30-day notice period prior to the next scheduled deduction date.
5. Account Freezing Rule: An account may be frozen for all incoming and outgoing transactions if the Pan-Aadhaar linkage is not completed by the regulatory deadline set by the government.
"""

def main():
    print("Writing sample policies to disk...")
    os.makedirs("data", exist_ok=True)
    with open("data/policies.txt", "w") as f:
        f.write(SAMPLE_DATA.strip())
        
    print("Loading document...")
    loader = TextLoader("data/policies.txt")
    documents = loader.load()
    
    print("Splitting text into chunks using LangChain text chunker...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", " "]
    )
    docs = text_splitter.split_documents(documents)
    
    print("Initializing embedding model (all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    print("Embedding into persistent ChromaDB vector store...")
    persist_directory = "chroma_db"
    
    # Create the vector store
    vectordb = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    
    print(f"Successfully ingested {len(docs)} chunks into ChromaDB at '{persist_directory}'!")

if __name__ == "__main__":
    main()
