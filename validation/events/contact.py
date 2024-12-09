
import frappe

def before_save(doc, method):
    # Check if custom_automate is disabled (0 or None)
    if not doc.get("custom_automate"):
        # Fetch dictionary corrections from the Dictionary DocType
        corrections = {d.found_word: d.actual_word for d in frappe.get_all(
            "Dictionary", fields=["found_word", "actual_word"]
        )}

       
        if corrections:
            if doc.get("first_name"):
                text = doc.get("first_name")
                for incorrect, corrected in corrections.items():
                    text = text.replace(incorrect, corrected)
                doc.set("first_name", text)  
