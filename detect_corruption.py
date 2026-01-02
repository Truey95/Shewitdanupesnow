import os

print("Scanning for corrupted files in client/src...")
corrupted_count = 0
for root, dirs, files in os.walk("client/src"):
    for file in files:
        path = os.path.join(root, file)
        try:
            size_stat = os.stat(path).st_size
            try:
                with open(path, 'rb') as f:
                    content = f.read()
                if size_stat > 0 and len(content) == 0:
                    print(f"CORRUPTED: {path} (StatSize: {size_stat}, ReadSize: 0)")
                    corrupted_count += 1
            except Exception as e:
                pass 
        except Exception as e:
            pass

print(f"Scan complete. Found {corrupted_count} corrupted files.")
