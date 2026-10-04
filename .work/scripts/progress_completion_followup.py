from pathlib import Path
path = Path(r"C:\Users\yasha\OneDrive\Desktop\FreelanceDBMS\server\src\controllers\progressController.js")
text = path.read_text(encoding="utf-8")
old = "const isComplete = stage === 'COMPLETED' || roundedPercentage === 100"
new = "const isComplete = stage === 'COMPLETED' || status === 'COMPLETED' || roundedPercentage === 100"
if old not in text:
    raise RuntimeError("Completion condition not found")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("Progress status COMPLETED now forces the enum-safe completion transition.")
