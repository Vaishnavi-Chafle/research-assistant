
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

app = FastAPI()

model = ChatGoogleGenerativeAI(model="gemini-3.8-flash")


class ChatRequest(BaseModel):
    message: str



@app.post("/chat")
def chat(request: ChatRequest):
    try:
        result = model.invoke(request.message)
        print("Model response:", result)
        return {"reply": result.text}

    except Exception as e:
        print("ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))



app.mount("/", StaticFiles(directory="static", html=True), name="static")

