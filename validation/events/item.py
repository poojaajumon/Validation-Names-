# your_custom_app/your_custom_app/patches/before_save_item.py
import frappe

def before_save(doc, method):
    # Check if custom_automate is disabled (0 or None)
    if not doc.get("custom_automate"):
        # Fetch dictionary corrections from the Dictionary DocType
        corrections = {d.found_word: d.actual_word for d in frappe.get_all(
            "Dictionary", fields=["found_word", "actual_word"]
        )}

        # If corrections are found, apply them to the item_name field
        if corrections:
            if doc.get("item_name"):
                text = doc.get("item_name")
                for incorrect, corrected in corrections.items():
                    text = text.replace(incorrect, corrected)
                doc.set("item_name", text)  # Update the item_name with the corrected text
