import axios from "axios";
import { Buffer } from 'buffer';
import './App.css';
import React, { useState, useEffect } from "react";
import { FileUploader } from "react-drag-drop-files";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import api from './api';

const ffmpeg = new FFmpeg();

function App() {
    const [firstDown, setFirstDown] = useState<string | undefined>(undefined);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileURL, setFileURL] = useState<string | undefined>(undefined);
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [isImage, setIsImage] = useState<boolean>(false);
    const [base64, setBase64] = useState();

    useEffect(() => {
        console.log(fileURL);
    }, [fileURL]);

    const handleFileChange = async (file: File) => {
        if (file) {
            setSelectedFile(file);
            const temp = URL.createObjectURL(file);
            setFileURL(temp);

            // Convert file to MP4
            if (!(file.type.startsWith("video"))) {
                setIsImage(true);
                setIsConverting(true);
                await convertToMP4(file);
                setIsConverting(false);
            } else {
                setIsImage(false);
            }
        }
    };

    const convertToMP4 = async (file: File) => {
        if (!ffmpeg.loaded) {
            await ffmpeg.load();
        }
        await ffmpeg.writeFile('input', await fetchFile(file));
        await ffmpeg.exec(['-i', 'input', 'output.mp4']);
        const data = await ffmpeg.readFile('output.mp4');

        const mp4Blob = new Blob([data], { type: 'video/mp4' });
        const mp4File = new File([mp4Blob], 'output.mp4', { type: 'video/mp4' });

        setSelectedFile(mp4File);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                responseType: "arraybuffer",
            }).then(function (response) {
                console.log(response.data);
                setFirstDown(Buffer.from(response.data, "binary").toString("base64"))
            })
            // console.log('File uploaded successfully', response.data);
        } catch (error) {
            console.error('Error uploading file', error);
            //console.log(error.response);
        }
    };

    const fileTypes = ["MP4", "MOV", "PNG", "JPEG"];

    return (
        <div>
            <h1>First Down Detector</h1>
            <p>Have you ever wondered whether a play was <i>really</i> a first down?
                Were the referees being completely fair? Fear no more. With <b>First Down Detector </b>
                you can now determine whether a specific play was a first down or not. Just submit a clip below of the play
                and our algorithm will determine if it was a first down.</p>
            {isConverting && <p>Converting file, please wait...</p>}
            {selectedFile && !isConverting && !isImage && (
                <div className="media-container">
                    <video className="file-url-video" key={fileURL} controls>
                        <source src={fileURL} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}
            {selectedFile && !isConverting && isImage && (
                <img src={fileURL} className="media-container" alt="Display not working" />
            )}
            <FileUploader handleChange={handleFileChange} name="files" types={fileTypes} />
            {selectedFile && (
                <div className="media-container">
                    <button className="green-button" onClick={handleUpload} disabled={isConverting}>Detect</button>
                </div>
            )}
            {firstDown && (<img src={`data:image/jpeg;charset=utf-8;base64,${firstDown}`} className="first-down-image" alt="First Down" />
            )}
        </div>
    );
}

export default App;
