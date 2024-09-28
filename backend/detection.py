import sys
import math
import cv2 as cv
import numpy as np
from PIL import Image
import requests
from io import BytesIO
from ultralytics import YOLO
from flask import Flask, request, send_file
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app, resources={r"/upload": {"origins": "http://localhost:3000"}})

def detector(frame, result):
    # Loads an image
    src = frame
    down = frame
    gray = cv.cvtColor(src, cv.COLOR_BGR2GRAY)
    # Check if image is loaded fine
    if src is None:
        print ('Error opening image!')

    dst = cv.Canny(gray, 10, 30, None, 3)

    cdst = cv.cvtColor(dst, cv.COLOR_GRAY2BGR)
    cdstP = np.copy(cdst)

    down_lines = []

    linesP = cv.HoughLinesP(dst, 1, np.pi / 200, 50, None, 100, 10)

    if linesP is not None:
        for i in range(0, len(linesP)):
            l = linesP[i][0]
            if ((src[l[1], l[0]][1] >= 120 and src[l[1], l[0]][2] >= 120) and src[l[1], l[0]][0] < 60):
                cv.line(cdstP, (l[0], l[1]), (l[2], l[3]), (6,155,155), 3, cv.LINE_AA)
                down_lines.append(l)
            elif ((src[l[3], l[2]][1] >= 120 and src[l[3], l[2]][2] >= 120) and src[l[3], l[2]][0] < 60):
                cv.line(cdstP, (l[0], l[1]), (l[2], l[3]), (6,155,155), 3, cv.LINE_AA)
                down_lines.append(l)
    if len(down_lines) != 0:
        # for line in down_lines:
        #     print(src[line[1], line[0]])
        #     print(src[line[3], line[2]])
        #     print ("\n")
        first_down = down_lines[0]
        for box in result.boxes:
            class_id = result.names[box.cls[0].item()]
            if class_id == 'football':
                coords = box.xyxy[0].tolist()
                print(coords)
                x = coords[2]
                y = coords[3]
                m = (first_down[3] - first_down[1]) / (first_down[2] - first_down[0])
                if m == 0: continue
                b = first_down[1] - m * first_down[0]
                y_line = m * x + b
                if y > y_line:
                    pt1 = (int(x + 500), int(y + 500 * m))
                    pt2 = (int(x - 500), int(y - 500 * m))
                    cv.line(down, pt1, pt2, (255,0,0), 3, cv.LINE_AA)
                    print("First down!")
                    print(x, y, first_down[0], first_down[1], first_down[2], first_down[3])
                    cv.imwrite("down.png", down)
                    cv.imwrite("footballdetectedP.png", cdstP)
                    return (True, send_file("down.png", mimetype='image/png'))
    cv.imwrite("edges.png", dst)
    #cv.imwrite("footballdetected.png", cdst)
    #return last frame and False
    return (False, None)

def detect_frames(filename, results):
    cap = cv.VideoCapture(filename)
    for i in range(len(results)):
        result = results[i]
        frame = result.plot()[:,:,::-1]
        ret, frame = cap.read()
        down = detector(frame, result)
        if down[0] == True: return down

@app.route('/upload', methods=['GET', 'POST'])
@cross_origin(supports_credentials=True)
def upload():
    print("Hello")
    file = request.files['file']
    name = file.filename
    destination = "Uploads/" + name
    file.save(destination)
    model = YOLO("football.pt")
    results = model.predict(destination, conf = 0.05)
    is_first_down, frame = detect_frames(destination, results)
    if is_first_down: return (is_first_down, frame)
