import frappe

def before_save(doc, method):
    """
    This function will handle the before_save logic for the Project doctype.
    """
    # Check if custom_automate is disabled (0 or None)
    if not doc.get("custom_automate"):
        # Fetch dictionary corrections
        corrections = {d.found_word: d.actual_word for d in frappe.get_all(
            "Dictionary", fields=["found_word", "actual_word"]
        )}

        if corrections:
            # Update the project_name if it contains a found_word
            if doc.get("subject"):
                original_name = doc.get("subject")
                for incorrect, corrected in corrections.items():
                    original_name = original_name.replace(incorrect, corrected)
                doc.set("subject", original_name)

                # Log a message for debugging or user feedback
                frappe.msgprint(f"Subject updated to: {original_name}")
