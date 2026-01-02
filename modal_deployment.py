import os
import modal

# Create Modal app
app = modal.App("swdnn-ecommerce")

# Define the function that processes product data
@app.function(secrets=[modal.Secret.from_name("swdnn")])
def process_product(product_data):
    """
    Process product data with Modal serverless function
    This function has access to the SWDNN secret
    """
    import json
    
    # Access the secret value
    secret_value = os.environ["swdnn"]
    print(f"Processing product with secret: {secret_value[:8]}...")
    
    # Log product data
    print("Product data received:")
    print(json.dumps(product_data, indent=2))
    
    # Simulate product processing
    processed_data = {
        "success": True,
        "productId": product_data.get("productId"),
        "name": product_data.get("name"),
        "category": product_data.get("category"),
        "price": product_data.get("price"),
        "processedAt": "2025-07-18T21:15:00Z",
        "status": "processed",
        "modal_secret_verified": True
    }
    
    return processed_data

@app.function(secrets=[modal.Secret.from_name("swdnn")])
def validate_product(product_id):
    """
    Validate product data
    """
    import random
    
    secret_value = os.environ["swdnn"]
    print(f"Validating product {product_id} with secret: {secret_value[:8]}...")
    
    # Simulate validation logic
    is_valid = len(product_id) > 10  # Simple validation
    
    return {
        "productId": product_id,
        "valid": is_valid,
        "validatedAt": "2025-07-18T21:15:00Z",
        "secret_verified": True
    }

@app.function(secrets=[modal.Secret.from_name("swdnn")])
def sync_ecommerce_data(data):
    """
    Sync e-commerce data with external systems
    """
    secret_value = os.environ["swdnn"]
    print(f"Syncing e-commerce data with secret: {secret_value[:8]}...")
    
    return {
        "success": True,
        "syncedAt": "2025-07-18T21:15:00Z",
        "dataSize": len(str(data)),
        "secret_verified": True
    }

# Local entrypoint for testing
@app.local_entrypoint()
def test_functions():
    """
    Test the Modal functions locally
    """
    # Test product processing
    test_product = {
        "productId": "683ef07157676097d20bc1bb",
        "name": "She Wit Da Nupes Now Unisex Tee",
        "category": "swdnn",
        "price": "22.65"
    }
    
    result = process_product.remote(test_product)
    print("Process product result:", result)
    
    # Test validation
    validation_result = validate_product.remote("683ef07157676097d20bc1bb")
    print("Validation result:", validation_result)
    
    # Test data sync
    sync_result = sync_ecommerce_data.remote({"test": "data"})
    print("Sync result:", sync_result)

if __name__ == "__main__":
    # For direct execution
    test_functions()