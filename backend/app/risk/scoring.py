def calculate_risk_score(trade, ledger_entries, documents):
    score = 0
    reasons = []

    # -------------------------
    # Trade status risk
    # -------------------------
    if trade.status != "completed":
        score += 10
        reasons.append("Trade not completed")

    # -------------------------
    # Document risk
    # -------------------------
    if not documents or len(documents) == 0:
        score += 30
        reasons.append("No documents uploaded")
    else:
        score += max(0, 10 - len(documents))
        reasons.append(f"{len(documents)} documents uploaded")

    # -------------------------
    # Ledger activity risk
    # -------------------------
    if not ledger_entries or len(ledger_entries) == 0:
        score += 20
        reasons.append("No ledger activity found")
    else:
        reasons.append(f"{len(ledger_entries)} ledger entries found")

    # -------------------------
    # Amount-based risk
    # -------------------------
    if trade.amount:
        if trade.amount > 1_000_000:
            score += 25
            reasons.append("High value trade")
        elif trade.amount > 100_000:
            score += 10
            reasons.append("Medium value trade")
    else:
        score += 10
        reasons.append("Trade amount missing")

    # -------------------------
    # Clamp score
    # -------------------------
    score = min(score, 100)

    return score, reasons
