import os
from openai import OpenAI

def list_models():
    api_key = os.getenv("ARK_API_KEY")
    if not api_key:
        print("Error: ARK_API_KEY not set")
        return

    client = OpenAI(
        base_url="https://ark.cn-beijing.volces.com/api/v3",
        api_key=api_key,
    )

    print("Listing models from Ark...")
    try:
        models = client.models.list()
        for m in models.data:
            print(f"- {m.id}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    list_models()
