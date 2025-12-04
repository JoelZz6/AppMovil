# ai-assistant/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import ollama
import httpx
import json

app = FastAPI(title="Luna IA - Con catálogo real")

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

# TU IP DEL BACKEND NESTJS
NESTJS_URL = "http://192.168.0.8:3000"

SYSTEM_PROMPT = """
Eres Luna, la asistente virtual de MiApp, una app de tiendas locales.
Tienes acceso al catálogo completo de productos de todos los negocios.

REGLAS:
- Usa siempre la información real del catálogo.
- Si el usuario pregunta por un producto, di: nombre, precio, stock y tienda.
- Si hay stock, ofrece contactar por WhatsApp.
- Sé amable, breve y útil.
- Usa emojis naturales.
- Responde solo en español.

Ejemplo:
Usuario: ¿Tienen camisas azules?
Tú: ¡Sí! En "Udud" hay 3 camisas azules a $55.000 c/u. ¿Te contacto con el vendedor por WhatsApp?
"""

# Cache del catálogo (actualizar cada 5 minutos)
catalog_cache = None
last_update = None

async def get_catalog():
    global catalog_cache, last_update
    import time
    now = time.time()
    
    # Refrescar cada 5 minutos
    if catalog_cache is None or (last_update and now - last_update > 300):
        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(f"{NESTJS_URL}/products/ai/catalog")
                catalog_cache = res.json()
                last_update = now
                print(f"Catálogo actualizado: {len(catalog_cache)} productos")
            except:
                print("Error actualizando catálogo")
    
    return catalog_cache or []

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Obtener catálogo
        catalog = await get_catalog()
        catalog_text = json.dumps(catalog, ensure_ascii=False, indent=2)
        
        # Prompt con contexto real
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"Catálogo actual:\n{catalog_text}"},
        ]
        
        if request.history:
            messages.extend(request.history)
        
        messages.append({"role": "user", "content": request.message})

        response = ollama.chat(
            model="gpt-oss:20b-cloud",  # o mistral, gemma2, phi3
            messages=messages,
            options={
                "temperature": 0.7,
                "num_predict": 400,
            }
        )

        return {"reply": response['message']['content']}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health():
    return {"status": "Luna IA con catálogo real activa"}