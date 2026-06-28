import pandas as pd
import requests
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import time

# Configuration
API_URL = "http://127.0.0.1:8000/sentiment/analyze"

# Sample Financial Complaint Dataset (Ground Truth)
# Testing complex financial language that generic models fail at
sample_data = [
    # Negative / Critical / Fraud
    {"text": "My SIP auto-debit failed and my portfolio NAV is showing a 20% drop.", "true_sentiment": "NEGATIVE"},
    {"text": "My account is locked and I cannot access my funds. This is a terrible issue!", "true_sentiment": "NEGATIVE"},
    {"text": "I was charged hidden brokerage fees on my last transaction and I want a refund immediately.", "true_sentiment": "NEGATIVE"},
    {"text": "Help! Someone hacked into my account and transferred out my mutual funds. I think my identity was stolen.", "true_sentiment": "NEGATIVE"},
    {"text": "This is completely unacceptable! I have been waiting for weeks and if you don't fix this today I am going to contact a lawyer.", "true_sentiment": "NEGATIVE"},
    {"text": "I suspect fraud on my account. There are unauthorized transactions that I did not approve.", "true_sentiment": "NEGATIVE"},
    {"text": "Your system is stealing my money. You have charged me twice for the management fee. Unacceptable!", "true_sentiment": "NEGATIVE"},
    {"text": "If this issue is not resolved by tomorrow, I am going to court. Your service is disgusting.", "true_sentiment": "NEGATIVE"},
    {"text": "I am filing a complaint with the ombudsman. My withdrawal request has been pending for a month.", "true_sentiment": "NEGATIVE"},
    {"text": "Please block my account immediately! My phone was stolen and someone is trying to access my investments.", "true_sentiment": "NEGATIVE"},
    {"text": "The customer service representative hung up on me when I asked about the hidden fees.", "true_sentiment": "NEGATIVE"},
    {"text": "I lost a lot of money because your trading platform was down during market hours.", "true_sentiment": "NEGATIVE"},
    {"text": "This is a scam! The returns promised were 15% but my portfolio is down 5%.", "true_sentiment": "NEGATIVE"},
    {"text": "Your app is completely broken and crashes every time I try to view my portfolio.", "true_sentiment": "NEGATIVE"},
    
    # Neutral / Queries
    {"text": "I just want to update my residential address on the portal.", "true_sentiment": "NEUTRAL"},
    {"text": "The mutual fund performed exactly as expected this month.", "true_sentiment": "NEUTRAL"},
    {"text": "How do I download my annual tax statement for the previous fiscal year?", "true_sentiment": "NEUTRAL"},
    {"text": "Can someone please explain how the dividend reinvestment plan works for the growth fund?", "true_sentiment": "NEUTRAL"},
    {"text": "What is the procedure to add a nominee to my existing mutual fund folio?", "true_sentiment": "NEUTRAL"},
    {"text": "I would like to know the current NAV for the Bluechip Growth Direct Plan.", "true_sentiment": "NEUTRAL"},
    {"text": "Please provide the details of the exit load for the index fund.", "true_sentiment": "NEUTRAL"},
    {"text": "Is it possible to pause my SIP for the next three months?", "true_sentiment": "NEUTRAL"},
    {"text": "Where can I find the tax certificate for the last financial year?", "true_sentiment": "NEUTRAL"},
    {"text": "I have submitted my KYC documents. What is the standard processing time?", "true_sentiment": "NEUTRAL"},
    {"text": "Could you send me a statement of account for the period between Jan and March?", "true_sentiment": "NEUTRAL"},
    {"text": "I want to change my registered email ID and mobile number.", "true_sentiment": "NEUTRAL"},
    {"text": "How do I switch my units from the regular plan to the direct plan?", "true_sentiment": "NEUTRAL"},
    {"text": "What are the market timings for placing a lump sum order?", "true_sentiment": "NEUTRAL"},

    # Positive / Compliments
    {"text": "The company's quarterly earnings exceeded expectations with a 15% dividend yield.", "true_sentiment": "POSITIVE"},
    {"text": "Great service, the support team resolved my margin call query quickly.", "true_sentiment": "POSITIVE"},
    {"text": "The new dashboard update is really nice. It's much easier to see my daily returns now. Thanks for the good work.", "true_sentiment": "POSITIVE"},
    {"text": "I am very happy with the performance of my portfolio this year.", "true_sentiment": "POSITIVE"},
    {"text": "Thank you for the quick resolution regarding my KYC update.", "true_sentiment": "POSITIVE"},
    {"text": "The app is very user-friendly and makes investing so simple.", "true_sentiment": "POSITIVE"},
    {"text": "I appreciate the detailed market insights provided in the weekly newsletter.", "true_sentiment": "POSITIVE"},
    {"text": "Excellent customer support! The agent was very polite and helpful.", "true_sentiment": "POSITIVE"},
    {"text": "The withdrawal process was incredibly fast. I received the funds in my bank account within a day.", "true_sentiment": "POSITIVE"},
    {"text": "I love the new SIP calculator feature. It helps me plan my finances better.", "true_sentiment": "POSITIVE"}
]

def evaluate_models():
    print("Starting AI Model Evaluation Pipeline...")
    df = pd.DataFrame(sample_data)
    
    y_true = []
    y_pred = []
    
    print("\nEvaluating Sentiment Analysis API...")
    for index, row in df.iterrows():
        text = row['text']
        true_label = row['true_sentiment']
        
        try:
            response = requests.post(API_URL, json={"text": text})
            if response.status_code == 200:
                pred_label = response.json().get("sentiment")
                y_true.append(true_label)
                y_pred.append(pred_label)
                print(f"[{true_label} -> {pred_label}] Score: {response.json().get('score')} | Text: {text[:30]}...")
            else:
                print(f"Error {response.status_code} for text: {text}")
        except Exception as e:
            print(f"Failed to connect to API: {e}")
            return
            
        time.sleep(0.5) # Prevent rate limiting
        
    # Calculate Metrics
    if len(y_true) > 0:
        accuracy = accuracy_score(y_true, y_pred)
        f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
        precision = precision_score(y_true, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_true, y_pred, average="weighted", zero_division=0)
        
        print("\n" + "="*40)
        print("MODEL ACCURACY REPORT")
        print("="*40)
        print(f"Total Samples Tested: {len(y_true)}")
        print(f"Accuracy:  {accuracy:.2%}")
        print(f"Precision: {precision:.2%} (Negative Class)")
        print(f"Recall:    {recall:.2%} (Negative Class)")
        print(f"F1-Score:  {f1:.2%} (Negative Class)")
        print("="*40)
    else:
        print("No data was evaluated successfully.")

if __name__ == "__main__":
    evaluate_models()
