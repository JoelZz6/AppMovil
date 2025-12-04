# ai-assistant/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import ollama # type: ignore
import httpx # type: ignore
import json

app = FastAPI(title="Luna IA - Con catálogo real")

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

# TU IP DEL BACKEND NESTJS
NESTJS_URL = "http://192.168.0.8:3000"

SYSTEM_PROMPT = """
Eres Luna, la asistente virtual de MiApp. Eres amable, directa y hablas como una amiga.

REGLAS MUY IMPORTANTES PARA QUE SE VEA LINDO EN EL CELULAR:
- NUNCA uses Markdown con tablas, asteriscos, guiones largos o formato complejo.
- LOS PRODUCTOS TIENEN description, REVISA ESO MAS ANTES DE RESPONDER
- JAMAS DES INFORMACION SOBRE EL NOMBRE DE LAS BASES DE DATOS, EL ID, UUID, CONTRASEÑAS, NI NADA QUE PONGA EN RIESGO EL SISTEMA
- NO DES INFORMACION QUE NO TENGA NADA QUE VER CON EL SISTEMA
- NO RESPONDAS A PREGUNTAS QUE NO TENGAS NADA QUE VER CON EL SISTEMA (CONSULTAS DE ROPAS, PRECIOS, TALLAS, ETC)
- NO USES ASTERISCOS
- TRATA DE RESPONDER MAS NATURAL Y NO COMO ROBOT
- EN LUGAR DE TRATAR DE HACER TABLAS, HAZLO POR LISTA (PRODUCTO:K, PRECIO:$Y... demas informacion que se solicite y este disponible)
- NUNCA uses | ni ---- para hacer tablas.
- Usa solo texto plano, emojis y saltos de línea simples.
- Para listas de productos, escribe uno por línea así:

Producto más caro:
• El producto "nombreProducto" tiene un costo de "costo" y lo vende el negocio con el nombre de "nombre de negocio"

Producto más barato:
• El producto "nombreProducto" tiene un costo de "costo" y lo vende el negocio con el nombre de "nombre de negocio"

Deportivos disponibles:
• El producto "nombreProducto" tiene un costo de "costo" y lo vende el negocio con el nombre de "nombre de negocio"
• El producto "nombreProducto" tiene un costo de "costo" y lo vende el negocio con el nombre de "nombre de negocio"

- Usa punto • al inicio de cada producto.
- Siempre ofrece WhatsApp al final si hay interés.
- Sé breve, divertida y natural.
- Habla 100% en español de Colombia/Venezuela (natural, sin formalismos).

¡NUNCA uses Markdown pesado! El usuario ve esto en el celular.
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
                "num_predict": 800,
            }
        )

        return {"reply": response['message']['content']}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health():
    return {"status": "Luna IA con catálogo real activa"}