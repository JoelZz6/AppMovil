# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import ollama
import asyncio

app = FastAPI(title="Asistente IA - MiApp")

# Modelo de mensaje
class Message(BaseModel):
    role: str  # "user" o "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = None
    business_db: Optional[str] = None  # futuro: contexto del negocio

# Sistema prompt inteligente (puedes mejorar esto después)
SYSTEM_PROMPT = """
Eres un asistente virtual de una app de tiendas locales llamada MiApp.
Tu nombre es Luna.
Ayudas a los usuarios con:
- Precios de productos
- Disponibilidad (stock)
- Horarios de atención
- Formas de pago y envío
- Información de tiendas

Sé amable, breve y útil. Usa emojis cuando sea natural.
Si no sabes algo, di: "Déjame consultarlo con el vendedor".
"""

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Preparar historial
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        if request.history:
            for msg in request.history:
                messages.append({"role": msg.role, "content": msg.content})
        
        messages.append({"role": "user", "content": request.message})

        # Llama a Ollama (modelo que tengas instalado)
        response = ollama.chat(
            model="llama3.2:3b",  # Cambia por: mistral, gemma2, phi3, etc.
            messages=messages,
            options={
                "temperature": 0.7,
                "num_predict": 256,
            }
        )

        assistant_reply = response['message']['content']

        return {
            "reply": assistant_reply,
            "model": "llama3.2:3b"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health():
    return {"status": "IA Assistant corriendo con Ollama"}