def calculate_risk_score(trade, ledger_entries, documents):
    score = 0
    reasons = []

    # 1️⃣ Document risk
    if len(documents) < 2:
        score += 30
        reasons.append("Insufficient documents uploaded")

    # 2️⃣ Integrity risk
    for entry in ledger_entries:
        if entry.action == "INTEGRITY_FAILED":
            score += 40
            reasons.append("Document integrity failed")
            break

    # 3️⃣ Trade status risk
    if trade.status not in ["completed"]:
        score += 20
        reasons.append("Trade not completed")

    # Cap score
    score = min(score, 100)

    if score < 30:
        level = "LOW"
    elif score < 70:
        level = "MEDIUM"
    else:
        level = "HIGH"

    return score, level, reasons
