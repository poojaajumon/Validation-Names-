
import frappe

def before_save(doc, method):
    # Check if custom_automate is disabled (0 or None)
    if not doc.get("custom_automate"):
        # Fetch dictionary corrections from the Dictionary DocType
        corrections = {d.found_word: d.actual_word for d in frappe.get_all(
            "Dictionary", fields=["found_word", "actual_word"]
        )}

       
        if corrections:
            if doc.get("address_line1"):
                text = doc.get("address_line1")
                for incorrect, corrected in corrections.items():
                    text = text.replace(incorrect, corrected)
                doc.set("address_line1", text)  
