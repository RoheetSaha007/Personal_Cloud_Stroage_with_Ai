from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, Response 
from fastapi.middleware.cors import CORSMiddleware
import uuid, os, datetime, json
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Text
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func
from sqlalchemy.ext.declarative import declarative_base
import random 
import mimetypes 


# === CONFIG ===
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
mimetypes.add_type("image/jpeg", ".jpg") 

app = FastAPI(title="AI Cloud Storage API")

# === CORS MIDDLEWARE ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === DATABASE SETUP ===
Base = declarative_base()
engine = create_engine("sqlite:///files.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

class FileModel(Base):
    __tablename__ = "files"
    id = Column(String, primary_key=True)
    original_name = Column(String)
    filepath = Column(String)
    uploaded_at = Column(DateTime)
    size_bytes = Column(Integer)
    content_type = Column(String)
    summary = Column(Text)
    tags = Column(Text)

Base.metadata.create_all(bind=engine)

# === IMPROVED AI FUNCTION ===
def call_ai_for_metadata(filename, file_bytes=None):
    """Generate AI metadata for files with fallback to mock data"""
    try:
        # Try to use OpenAI if available
        try:
            import openai
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{
                    "role": "user",
                    "content": f"Generate a brief summary and 3 relevant tags for a file named: {filename}"
                }]
            )
            data = json.loads(response.choices[0].message.content.strip())
            return data
        except (ImportError, Exception):
            pass
    except Exception as e:
        print(f"AI processing error: {e}")
    
    print(f"Using intelligent fallback for: {filename}")
    
    # Determine file type from extension
    ext = os.path.splitext(filename)[1].lower()
    
    # Generate context-aware tags based on file type
    tag_map = {
        '.pdf': ['document', 'report', 'important'],
        '.jpg': ['image', 'photo', 'media'],
        '.png': ['image', 'graphic', 'media'],
        '.doc': ['document', 'text', 'work'],
        '.docx': ['document', 'text', 'work'],
        '.xlsx': ['spreadsheet', 'data', 'finance'],
        '.csv': ['data', 'analytics', 'report'],
        '.zip': ['archive', 'backup', 'compressed'],
        '.mp4': ['video', 'media', 'content'],
        '.mp3': ['audio', 'music', 'media'],
    }
    
    tags = tag_map.get(ext, ['file', 'document', 'data'])
    
    return {
        "summary": f"File: {filename} - Uploaded to CloudVault storage system",
        "tags": tags
    }

# === API Routes ===
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    out_name = f"{file_id}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, out_name)
    
    content = await file.read()
    
    with open(path, "wb") as f:
        f.write(content)

    # Get content type
    content_type = file.content_type
    if content_type == "application/octet-stream":
        content_type, _ = mimetypes.guess_type(file.filename) or ("application/octet-stream", None)

    metadata = call_ai_for_metadata(file.filename, content)
    
    db = SessionLocal()
    new_file = FileModel(
        id=file_id,
        original_name=file.filename,
        filepath=path,
        uploaded_at=datetime.datetime.utcnow(),
        size_bytes=len(content),
        content_type=content_type,
        summary=metadata["summary"],
        tags=",".join(metadata["tags"]),
    )
    db.add(new_file)
    db.commit()
    db.close()

    return {"id": file_id, "summary": metadata["summary"], "tags": metadata["tags"]}

@app.get("/files")
def list_files():
    db = SessionLocal()
    files = db.query(FileModel).all()
    result = []
    for f in files:
        result.append({
            "id": f.id,
            "name": f.original_name,
            "summary": f.summary,
            "tags": f.tags.split(",") if f.tags else [],
            "content_type": f.content_type,
            "size_bytes": f.size_bytes,
            "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None
        })
    db.close()
    return result

@app.get("/search")
def search_files(q: str):
    db = SessionLocal()
    q_lower = f"%{q.lower()}%"
    
    files = db.query(FileModel).filter(
        FileModel.original_name.ilike(q_lower) |
        FileModel.summary.ilike(q_lower) |
        FileModel.tags.ilike(q_lower)
    ).all()
    
    result = []
    for f in files:
        result.append({
            "id": f.id, 
            "name": f.original_name, 
            "summary": f.summary, 
            "tags": f.tags.split(",") if f.tags else [],
            "content_type": f.content_type,
            "size_bytes": f.size_bytes
        })
    db.close()
    return result

@app.get("/files/{file_id}")
def get_file_details(file_id: str):
    db = SessionLocal()
    f = db.query(FileModel).filter(FileModel.id == file_id).first()
    db.close()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    return {
        "id": f.id,
        "name": f.original_name,
        "path": f.filepath,
        "summary": f.summary,
        "tags": f.tags.split(",") if f.tags else [],
        "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None,
        "content_type": f.content_type,
        "size_bytes": f.size_bytes
    }

@app.get("/download/{file_id}")
def download_file(file_id: str):
    db = SessionLocal()
    f = db.query(FileModel).filter(FileModel.id == file_id).first()
    db.close()
    if not f:
        raise HTTPException(status_code=404, detail="File not found in DB")
    
    if not os.path.exists(f.filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(path=f.filepath, media_type=f.content_type, filename=f.original_name)

@app.delete("/files/{file_id}")
def delete_file(file_id: str):
    db = SessionLocal()
    f = db.query(FileModel).filter(FileModel.id == file_id).first()
    
    if not f:
        db.close()
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        if os.path.exists(f.filepath):
            os.remove(f.filepath)
    except Exception as e:
        print(f"Error deleting file from disk: {e}")
    
    db.delete(f)
    db.commit()
    db.close()
    
    return {"status": "success", "message": f"File '{f.original_name}' deleted"}

@app.get("/preview/{file_id}")
def preview_file(file_id: str):
    db = SessionLocal()
    f = db.query(FileModel).filter(FileModel.id == file_id).first()
    db.close()
    if not f:
        raise HTTPException(status_code=404, detail="File not found in DB")
    
    if not os.path.exists(f.filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    if not f.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File is not an image.")
    
    with open(f.filepath, "rb") as file:
        content = file.read()
    
    return Response(content=content, media_type=f.content_type)

@app.get("/stats")
def get_stats():
    db = SessionLocal()
    
    file_count = db.query(FileModel).count()
    total_bytes = db.query(func.sum(FileModel.size_bytes)).scalar() or 0
    total_mb = round(total_bytes / (1024 * 1024), 2)
    
    type_query = db.query(
        FileModel.content_type, 
        func.count(FileModel.id)
    ).group_by(FileModel.content_type).all()
    
    file_types = {}
    for content_type, count in type_query:
        if not content_type:
            simple_type = "unknown"
        else:
            simple_type = content_type.split('/')[0]
            
        if simple_type in file_types:
            file_types[simple_type] += count
        else:
            file_types[simple_type] = count
            
    db.close()
    
    return {
        "total_files": file_count,
        "total_mb_used": total_mb,
        "file_type_counts": file_types 
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
