from fastapi import FastAPI, UploadFile, File
import os

os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"

from paddleocr import PaddleOCR
import shutil
import os

app = FastAPI()

ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en',
    use_gpu=False,
    det_model_dir=None,
    rec_model_dir=None
)

@app.post("/ocr")
async def run_ocr(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = ocr.ocr(file_path)

    os.remove(file_path)

    return {"result": result}