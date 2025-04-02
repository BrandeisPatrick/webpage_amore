import os
import sys

# --- Configuration ---
folder_path = r"C:\Users\lpy97\Documents\GitHub\webpage_amore\images"
new_extension = ".jpg" # Include the dot
# --- End Configuration ---

def rename_files_sequentially(target_folder, forced_extension):
    """
    Renames files in the target folder to a sequential number format
    (1.ext, 2.ext, etc.), forcing the specified extension.
    """
    print("=" * 40)
    print(" WARNING: This script will rename ALL files")
    print(f" in the folder: {target_folder}")
    print(" sequentially, forcing the extension to:", forced_extension)
    print("=" * 40)
    print("\nMAKE SURE YOU HAVE A BACKUP OF THE FOLDER!")

    try:
        # Get user confirmation
        confirm = input("Press Enter to continue, or type 'N' and Enter to cancel: ")
        if confirm.strip().upper() == 'N':
            print("Operation cancelled by user.")
            sys.exit(0)
    except EOFError: # Handle environments where input might not be available
        print("\nCould not get confirmation. Assuming non-interactive mode.")
        print("Proceeding with rename... (Ensure you have a backup!)")
        # Add a small delay to allow reading the message in non-interactive mode
        import time
        time.sleep(3)


    if not os.path.isdir(target_folder):
        print(f"\nError: Directory not found: {target_folder}")
        return

    print(f"\nScanning folder: {target_folder}")
    count = 1
    files_renamed = 0
    files_skipped = 0
    files_failed = 0

    try:
        # Get a list of actual files (not directories) and sort them by name
        filenames = sorted([
            f for f in os.listdir(target_folder)
            if os.path.isfile(os.path.join(target_folder, f))
        ])
    except OSError as e:
        print(f"Error accessing directory contents: {e}")
        return

    if not filenames:
        print("No files found in the directory to rename.")
        return

    print(f"Found {len(filenames)} files. Starting renaming...")

    for filename in filenames:
        old_path = os.path.join(target_folder, filename)

        # --- Modification point for keeping original extension ---
        # Uncomment the next line and comment out the line after it
        # to keep original extensions instead of forcing .jpg
        # original_name_part, original_extension = os.path.splitext(filename)
        # new_filename = f"{count}{original_extension}"
        # --- End modification point ---

        # Force the new extension as per the original request
        new_filename = f"{count}{forced_extension}"
        new_path = os.path.join(target_folder, new_filename)

        # Avoid renaming itself if it somehow matches
        if old_path.lower() == new_path.lower(): # Case-insensitive check for safety
            print(f"Skipping '{filename}' as it already has the target name.")
            files_skipped += 1
            count += 1 # Still increment count to avoid collision
            continue

        # Prevent overwriting existing sequentially named files
        if os.path.exists(new_path):
             print(f"Warning: Target file '{new_filename}' already exists. Skipping rename for '{filename}'.")
             files_skipped += 1
             # Increment count to avoid gaps/collisions on next attempt
             count += 1
             continue

        try:
            os.rename(old_path, new_path)
            print(f"Renamed '{filename}' to '{new_filename}'")
            files_renamed += 1
        except OSError as e:
            print(f"Error renaming '{filename}' to '{new_filename}': {e}")
            files_failed += 1
            # Increment count even on failure to avoid getting stuck? Debatable,
            # but often better to proceed and report errors.
            count += 1

        # Increment count only if rename was attempted (successful or failed, but not skipped)
        if not (old_path.lower() == new_path.lower() or os.path.exists(new_path)):
             count += 1 # This logic is slightly complex, simplifying by always incrementing after processing


    print("\n" + "=" * 40)
    print("Renaming process complete.")
    print(f"Successfully renamed: {files_renamed}")
    print(f"Skipped (already exists/matched): {files_skipped}")
    print(f"Failed (errors): {files_failed}")
    print("=" * 40)


# --- Run the function ---
if __name__ == "__main__":
    # Adjust the path and extension directly in the configuration section above
    rename_files_sequentially(folder_path, new_extension)
    # Keep console window open until user presses Enter (optional)
    # input("\nPress Enter to exit...") # uncomment this line if the window closes too fast
    