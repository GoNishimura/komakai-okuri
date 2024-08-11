# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import os

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)
    return jsonify({'file_path': file_path}), 200

if __name__ == '__main__':
    app.run(debug=True)

# backend/app.py (続き)
@app.route('/split_frames', methods=['POST'])
def split_frames():
    data = request.get_json()
    file_path = data.get('file_path')
    video = cv2.VideoCapture(file_path)
    fps = video.get(cv2.CAP_PROP_FPS)
    frame_count = int(video.get(cv2.CAP_PROP_FRAME_COUNT))

    frames = []
    for i in range(frame_count):
        ret, frame = video.read()
        if not ret:
            break
        if i % (fps // 24) == 0:  # 24FPS単位でフレームを取得
            frame_file = f'static/frames/frame_{i}.jpg'
            cv2.imwrite(frame_file, frame)
            frames.append(frame_file)

    return jsonify({'frames': frames}), 200
